// backend/apps/vehicles/controllers/admin/adminUserActivityController.js
//
// Admin user page, "Vehicles" tab: everything the user does in the vehicles
// service, as one simple list per kind.
//   GET /api/vehicles/admin/users/:userId/activity?kind=publications|alerts|saved|requests|portfolio
//   -> { items: [{ id, type, title, description, status, createdAt, link }] }

import Vehicle from "../../models/Vehicle.js";
import SparePart from "../../models/SparePart.js";
import VehicleAlert from "../../models/VehicleAlert.js";
import SavedVehicle from "../../models/SavedVehicle.js";
import SavedSparePart from "../../models/SavedSparePart.js";
import VehicleRequest from "../../models/VehicleRequest.js";
import VehiclePortfolioItem from "../../models/VehiclePortfolioItem.js";

import { getAdminUserOrRespond } from "../../../main/controllers/admin/adminUsersController.js";

const LIMIT = 100;
export const ACTIVITY_KINDS = ["publications", "alerts", "saved", "requests", "portfolio"];

const join = (...values) => values.flat().filter(Boolean).join(" · ");
const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

export const toVehicleItem = (vehicle) => ({
    id: String(vehicle._id),
    type: vehicle.category === "moto" ? "moto" : "vehicle",
    title: join(vehicle.make, vehicle.model, vehicle.year) || "Vehicle",
    description: join(vehicle.city, vehicle.listingType, vehicle.price ? `${vehicle.price} MAD` : ""),
    status: vehicle.status || "",
    createdAt: vehicle.createdAt,
    link: `/vehicles/${vehicle._id}`,
});

export const toPartItem = (part) => ({
    id: String(part._id),
    type: "part",
    title: part.title || "Spare part",
    description: join(part.city, part.compatibility?.make, part.compatibility?.model, part.price ? `${part.price} MAD` : ""),
    status: part.status || "",
    createdAt: part.createdAt,
    link: `/vehicles/parts/${part._id}`,
});

async function load(userId, kind) {
    switch (kind) {
        case "publications": {
            const [vehicles, parts] = await Promise.all([
                Vehicle.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
                SparePart.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
            ]);
            return [...vehicles.map(toVehicleItem), ...parts.map(toPartItem)];
        }
        case "alerts": {
            const alerts = await VehicleAlert.find({ user: userId }).sort({ createdAt: -1 }).limit(LIMIT).lean();
            return alerts.map((alert) => ({
                id: String(alert._id),
                type: "vehicleAlert",
                title: join(alert.makes) || alert.city || "Vehicle alert",
                description: join(alert.city, alert.categories, alert.listingTypes, alert.maxPrice ? `≤ ${alert.maxPrice} MAD` : ""),
                status: alert.isArchived ? "archived" : "active",
                createdAt: alert.createdAt,
            }));
        }
        case "saved": {
            const [vehicles, parts] = await Promise.all([
                SavedVehicle.find({ userId, isSaved: true }).populate("vehicleId").sort({ savedAt: -1 }).limit(LIMIT).lean(),
                SavedSparePart.find({ userId, isSaved: true }).populate("partId").sort({ savedAt: -1 }).limit(LIMIT).lean(),
            ]);
            return [
                ...vehicles
                    .filter((item) => item.vehicleId)
                    .map((item) => ({ ...toVehicleItem(item.vehicleId), id: String(item._id), createdAt: item.savedAt || item.createdAt })),
                ...parts
                    .filter((item) => item.partId)
                    .map((item) => ({ ...toPartItem(item.partId), id: String(item._id), createdAt: item.savedAt || item.createdAt })),
            ];
        }
        case "requests": {
            const requests = await VehicleRequest.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean();
            return requests.map((request) => ({
                id: String(request._id),
                type: "request",
                title: join(request.transaction, request.make, request.model, request.partName) || "Request",
                description: join(request.city, request.budgetMax ? `≤ ${request.budgetMax} MAD` : ""),
                status: request.status || "",
                createdAt: request.createdAt,
                link: `/vehicles/requests/${request._id}`,
            }));
        }
        case "portfolio": {
            const items = await VehiclePortfolioItem.find({ userId }).sort({ createdAt: -1 }).limit(LIMIT).lean();
            return items.map((item) => ({
                id: String(item._id),
                type: item.type,
                title: item.title,
                description: item.type === "video" ? `youtube.com/watch?v=${item.youtubeId}` : String(item.text || "").slice(0, 160),
                status: "",
                createdAt: item.createdAt,
                link: `/vehicles/profile/${userId}`,
            }));
        }
        default:
            return null;
    }
}

export const getAdminUserVehicleActivity = async (req, res) => {
    try {
        const kind = String(req.query.kind || "publications");
        if (!ACTIVITY_KINDS.includes(kind)) {
            return res.status(400).json({ success: false, message: "Invalid kind." });
        }

        const user = await getAdminUserOrRespond(req.params.userId, res);
        if (!user) return;

        const items = (await load(req.params.userId, kind)).sort(byNewest);
        return res.status(200).json({ success: true, kind, count: items.length, items });
    } catch (error) {
        console.error("Get admin user vehicle activity error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve the user's vehicle activity." });
    }
};
