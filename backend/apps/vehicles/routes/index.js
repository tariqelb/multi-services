// backend/apps/vehicles/routes/index.js
//
// Vehicles service. Mounted at /api/vehicles.
//   GET    /api/vehicles                 list (category=car|moto, filters, sort, pages)
//   GET    /api/vehicles/search          one search: cars, motos & bikes, spare parts (map page)
//   GET    /api/vehicles/admin/publications          admin: review publications (?period, type=all|car|moto|part)
//   DELETE /api/vehicles/admin/publications/:kind/:id admin: delete a publication
//   GET    /api/vehicles/mine            my vehicles
//   GET    /api/vehicles/alerts          my alerts (POST create, DELETE /:id archive, PATCH /:id/restore)
//   GET    /api/vehicles/dealers/me      my business profile (agency / showroom)
//   GET    /api/vehicles/saved           my saved vehicles (GET /saved/ids: ids only)
//   POST   /api/vehicles/:id/save        save (DELETE: remove from saved)
//   GET    /api/vehicles/reviews/users   publishers ranked by their reviews (?q, page)
//   GET    /api/vehicles/profiles/:userId            public profile + statistics
//   GET    /api/vehicles/profiles/:userId/vehicles   publications (?category=car|moto)
//   /api/vehicles/parts/...      car and moto spare parts (see sparePartRouter.js)
//   GET    /api/vehicles/profiles/:userId/reviews    reviews (POST: leave a review)
//   GET    /api/vehicles/:id             details
//   GET    /api/vehicles/:id/similar     similar vehicles (same section, offer and type)
//   POST   /api/vehicles                 publish (multipart, "images")
//   PUT    /api/vehicles/:id             edit (multipart, "images" + removeImages)
//   PATCH  /api/vehicles/:id/status      status
//   DELETE /api/vehicles/:id             delete
//   GET    /api/vehicles/health          service check

import { Router } from "express";

import vehicleRouter from "./vehicleRouter.js";
import sparePartRouter from "./sparePartRouter.js";
import { searchVehicles } from "../controllers/vehicleSearchController.js";
import { searchLimiter } from "../../main/middleware/rateLimit.js";
import authMiddleware from "../../main/middleware/authMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";
import { deleteVehiclePublication, getVehiclePublications } from "../controllers/vehicleAdminController.js";

const router = Router();

router.get("/health", (req, res) => {
    res.status(200).json({ success: true, service: "vehicles" });
});

// Before the vehicle router: /search must not be read as a vehicle id.
router.get("/search", searchLimiter, searchVehicles);

// Admin panel (before the vehicle router: /admin is not a vehicle id).
router.get("/admin/publications", authMiddleware, adminAccess("vehiclePublications"), getVehiclePublications);
router.delete("/admin/publications/:kind/:id", authMiddleware, adminAccess("vehiclePublications"), deleteVehiclePublication);

// Last: has GET /:id.
// Spare parts first: /parts must not be read as a vehicle id.
router.use("/parts", sparePartRouter);
router.use("/", vehicleRouter);

export default router;
