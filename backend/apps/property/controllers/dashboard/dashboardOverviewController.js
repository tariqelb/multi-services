// backend/apps/property/controllers/dashboard/dashboardOverviewController.js
// NEW: one endpoint that summarizes the whole platform for the admin.

import User from "../../../main/models/User.js";
import Property from "../../models/Property.js";
import PropertyAlert from "../../models/PropertyAlert.js";
import PropertyContact from "../../models/PropertyContact.js";
import ListingContact from "../../models/ListingContact.js";
import VisitSession from "../../models/VisitSession.js";
import PropertyClickEvent from "../../models/PropertyClickEvent.js";
import ExternalListingClickEvent from "../../models/ExternalListingClickEvent.js";

import {
    getSaveEventStats,
    getSaveTrendRows,
} from "./savedPropertyDemandController.js";

import {
    bucketExpression,
    changeFor,
    currentMatch,
    fillSeries,
    getRangeWindow,
    previousMatch,
    rate,
    uniqueCountStages,
} from "../../../main/utils/analytics.js";

const countUnique = async (Model, match, field) => {
    const [row] = await Model.aggregate([
        { $match: match },
        ...uniqueCountStages(field),
    ]);

    return row?.count || 0;
};

const trendRows = (Model, match, dateField, unit, valueKey) =>
    Model.aggregate([
        { $match: match },
        {
            $group: {
                _id: bucketExpression(`$${dateField}`, unit),
                [valueKey]: { $sum: 1 },
            },
        },
        { $project: { _id: 0, date: "$_id", [valueKey]: 1 } },
    ]);

// GET /api/property/dashboard/overview?range=30d
export const getDashboardOverview = async (req, res) => {
    try {
        const window = getRangeWindow(req.query.range);

        const current = (field) => currentMatch(window, field);
        const previous = (field) => previousMatch(window, field);

        const countPair = async (Model, field) => {
            const [value, before] = await Promise.all([
                Model.countDocuments(current(field)),
                window.start
                    ? Model.countDocuments(previous(field))
                    : Promise.resolve(0),
            ]);

            return {
                value,
                previous: before,
                change: changeFor(window, value, before),
            };
        };

        const uniquePair = async (Model, field, keyField) => {
            const [value, before] = await Promise.all([
                countUnique(Model, current(field), keyField),
                window.start
                    ? countUnique(Model, previous(field), keyField)
                    : Promise.resolve(0),
            ]);

            return {
                value,
                previous: before,
                change: changeFor(window, value, before),
            };
        };

        const [
            newUsers,
            sessions,
            uniqueVisitors,
            propertyClicks,
            externalClicks,
            propertyContacts,
            newAlerts,
            newListings,
            savesCurrent,
            savesPrevious,
            propertyViewers,
            contactingClients,
            inventoryRows,
            sessionTrend,
            clickTrend,
            externalTrend,
            contactTrend,
            saveTrend,
        ] = await Promise.all([
            countPair(User, "createdAt"),
            countPair(VisitSession, "startedAt"),
            uniquePair(VisitSession, "startedAt", "$visitorId"),
            countPair(PropertyClickEvent, "createdAt"),
            countPair(ExternalListingClickEvent, "createdAt"),
            countPair(PropertyContact, "createdAt"),
            countPair(PropertyAlert, "createdAt"),
            countPair(Property, "createdAt"),
            getSaveEventStats(window.start, null),
            window.start
                ? getSaveEventStats(window.previousStart, window.previousEnd)
                : Promise.resolve({ saves: 0, uniqueUsers: 0 }),
            countUnique(PropertyClickEvent, current("createdAt"), "$visitorKey"),
            countUnique(PropertyContact, current("createdAt"), "$clientId"),

            Property.aggregate([
                {
                    $group: {
                        _id: { $ifNull: ["$status", "Unknown"] },
                        value: { $sum: 1 },
                    },
                },
                { $sort: { value: -1 } },
                { $project: { _id: 0, name: "$_id", value: 1 } },
            ]),

            trendRows(VisitSession, current("startedAt"), "startedAt", window.unit, "sessions"),
            trendRows(PropertyClickEvent, current("createdAt"), "createdAt", window.unit, "propertyClicks"),
            trendRows(ExternalListingClickEvent, current("createdAt"), "createdAt", window.unit, "externalClicks"),
            trendRows(PropertyContact, current("createdAt"), "createdAt", window.unit, "contacts"),
            getSaveTrendRows(window.start, window.unit),
        ]);

        // Roommate + establishment contacts (anonymous visitors included).
        const [
            listingContactRows,
            previousListingContactRows,
            listingContactTrend,
        ] = await Promise.all([
            ListingContact.aggregate([
                { $match: current("createdAt") },
                { $group: { _id: "$listingType", value: { $sum: 1 } } },
            ]),
            window.start
                ? ListingContact.countDocuments(previous("createdAt"))
                : Promise.resolve(0),
            trendRows(ListingContact, current("createdAt"), "createdAt", window.unit, "contacts"),
        ]);

        const listingContactsByType = Object.fromEntries(
            listingContactRows.map((row) => [row._id, row.value])
        );

        const listingContactsTotal = listingContactRows.reduce(
            (sum, row) => sum + row.value,
            0
        );

        const contacts = {
            value: propertyContacts.value + listingContactsTotal,
            previous: propertyContacts.previous + previousListingContactRows,
            change: changeFor(
                window,
                propertyContacts.value + listingContactsTotal,
                propertyContacts.previous + previousListingContactRows
            ),
        };

        const contactsByType = [
            { name: "properties", value: propertyContacts.value },
            { name: "roommates", value: listingContactsByType.roommate || 0 },
            { name: "establishments", value: listingContactsByType.establishment || 0 },
        ];

        const saves = {
            value: savesCurrent.saves,
            previous: savesPrevious.saves,
            change: changeFor(window, savesCurrent.saves, savesPrevious.saves),
        };

        // Merge every daily series into one row per date.
        const merged = new Map();

        for (const rows of [
            sessionTrend,
            clickTrend,
            externalTrend,
            contactTrend,
            listingContactTrend,
            saveTrend,
        ]) {
            for (const row of rows) {
                const entry = merged.get(row.date) || { date: row.date };

                for (const [key, value] of Object.entries(row)) {
                    if (key !== "date") entry[key] = (entry[key] || 0) + value;
                }

                merged.set(row.date, entry);
            }
        }

        const trend = fillSeries(Array.from(merged.values()), window, {
            sessions: 0,
            propertyClicks: 0,
            externalClicks: 0,
            contacts: 0,
            saves: 0,
        });

        // Visitor journey. Units differ by step (visitor → viewer → user),
        // so it shows engagement depth rather than a strict funnel.
        const funnelSteps = [
            { key: "visitors", value: uniqueVisitors.value },
            { key: "propertyViewers", value: propertyViewers },
            { key: "savers", value: savesCurrent.uniqueUsers },
            { key: "contactingClients", value: contactingClients },
        ];

        const funnel = funnelSteps.map((step, index) => ({
            ...step,
            rateFromTop: rate(step.value, funnelSteps[0].value),
            rateFromPrevious: index
                ? rate(step.value, funnelSteps[index - 1].value)
                : 100,
        }));

        const totalClicks = propertyClicks.value + externalClicks.value;

        return res.status(200).json({
            success: true,
            range: window.range,

            kpis: {
                uniqueVisitors,
                sessions,
                newUsers,
                newListings,
                propertyClicks,
                externalClicks,
                saves,
                contacts,
                newAlerts,
            },

            ratios: {
                contactRate: rate(propertyContacts.value, propertyClicks.value),
                saveRate: rate(saves.value, propertyClicks.value),
                clicksPerSession: sessions.value
                    ? Math.round((totalClicks / sessions.value) * 100) / 100
                    : 0,
                externalShare: rate(externalClicks.value, totalClicks),
                signupRate: rate(newUsers.value, uniqueVisitors.value),
            },

            contactsByType,
            funnel,
            trend,
            inventory: inventoryRows,
        });
    } catch (error) {
        console.error("Dashboard overview error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard overview.",
        });
    }
};
