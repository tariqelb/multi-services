// backend/apps/workers/controllers/admin/workerAdminController.js
//
// Daily worker admin panel: review published worker profiles.
//   GET    /api/workers/admin/publications?period=today|week|month|year|all&q=
//   DELETE /api/workers/admin/publications/:id
// Admins, and members with the "workerPublications" section (read: list, write: delete).

import mongoose from "mongoose";

import WorkerProfile from "../../models/WorkerProfile.js";
import User from "../../../main/models/User.js";
import { portfolio } from "../portfolio/portfolioController.js";
import { deleteWorkplaceImages, toProfileView } from "../workerController.js";
import { escapeRegex, normalize } from "../../utils/workerValidation.js";

const PERIODS = ["today", "week", "month", "year", "all"];
const MAX_ITEMS = 300;
const OWNER_FIELDS = "firstName lastName email profileImage";

export function periodStart(period, now = new Date()) {
    const start = new Date(now);
    if (period === "today") start.setHours(0, 0, 0, 0);
    else if (period === "week") start.setDate(start.getDate() - 7);
    else if (period === "month") start.setMonth(start.getMonth() - 1);
    else if (period === "year") start.setFullYear(start.getFullYear() - 1);
    else return null;
    return start;
}

export async function getWorkerPublications(req, res) {
    try {
        const period = String(req.query.period || "all");
        if (!PERIODS.includes(period)) return res.status(400).json({ success: false, message: "Invalid period." });

        const filter = {};
        const start = periodStart(period);
        // A profile counts in a period when it was published or changed in it.
        if (start) filter.updatedAt = { $gte: start };
        const q = normalize(req.query.q || "").trim().slice(0, 80);
        if (q) filter.searchText = { $regex: escapeRegex(q) };

        const [profiles, total, hidden] = await Promise.all([
            WorkerProfile.find(filter).sort({ updatedAt: -1 }).limit(MAX_ITEMS).lean(),
            WorkerProfile.countDocuments(filter),
            WorkerProfile.countDocuments({ ...filter, status: "hidden" }),
        ]);

        const ids = [...new Set(profiles.map((profile) => String(profile.userId)))];
        const owners = ids.length ? await User.find({ _id: { $in: ids } }).select(OWNER_FIELDS).lean() : [];
        const byId = new Map(owners.map((owner) => [String(owner._id), owner]));

        return res.status(200).json({
            success: true,
            period,
            counts: { all: total, hidden, active: total - hidden },
            items: profiles.map((profile) => {
                const owner = byId.get(String(profile.userId)) || null;
                return {
                    ...toProfileView(profile, { owner }),
                    owner: owner && {
                        id: String(owner._id),
                        firstName: owner.firstName || "",
                        lastName: owner.lastName || "",
                        email: owner.email || "",
                    },
                };
            }),
        });
    } catch (error) {
        console.error("[Workers] Admin list error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve worker profiles." });
    }
}

export async function deleteWorkerPublication(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid profile ID." });

        const profile = await WorkerProfile.findByIdAndDelete(id);
        if (!profile) return res.status(404).json({ success: false, message: "Worker profile not found." });

        // The worker's portfolio and workplace photos go with the profile.
        await deleteWorkplaceImages(profile).catch((error) => console.error("[Workers] Admin workplace photos cleanup:", error));
        await portfolio.deleteUserItems(profile.userId).catch((error) => console.error("[Workers] Admin portfolio cleanup:", error));

        console.log(`[Workers] Admin ${req.user?.userId} deleted worker profile ${id} of user ${profile.userId}`);
        return res.status(200).json({ success: true, message: "Deleted.", id });
    } catch (error) {
        console.error("[Workers] Admin delete error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete this worker profile." });
    }
}
