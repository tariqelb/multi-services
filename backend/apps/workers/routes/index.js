// backend/apps/workers/routes/index.js
//
// Daily worker service. Mounted at /api/workers.
//   GET    /api/workers/options          trades, specialties and choices
//   GET    /api/workers                  list: one card per trade offer
//            ?q, trade, specialty, city, available, urgent, team, language,
//             priceType, maxPrice, minExperience, noDeposit, sort, page, limit
//   GET    /api/workers/me               my profile (+ prefill and contact check)
//   PUT    /api/workers/me               publish / update my profile
//   PATCH  /api/workers/me/availability  { status: available|busy, busyUntil }
//   PATCH  /api/workers/me/visibility    { status: active|hidden }
//   DELETE /api/workers/me               delete my profile and portfolio
//   /api/workers/portfolio/...           articles and videos (see portfolio routes below)
//   GET    /api/workers/admin/publications        admin review (DELETE /:id)
//   GET    /api/workers/admin/portfolio           admin portfolio review (DELETE /:id)
//   GET    /api/workers/user/:userId     { id } of a user's worker profile
//   GET    /api/workers/:id              public profile page
//   GET    /api/workers/health           service check

import { Router } from "express";

import authMiddleware from "../../main/middleware/authMiddleware.js";
import optionalAuthMiddleware from "../../main/middleware/optionalAuthMiddleware.js";
import adminAccess from "../../main/middleware/adminAccessMiddleware.js";
import { searchLimiter } from "../../main/middleware/rateLimit.js";
import {
    createDeleteMine,
    getMyWorkerProfile,
    getWorker,
    getWorkerIdByUser,
    getWorkerOptions,
    listWorkers,
    saveMyWorkerProfile,
    setMyAvailability,
    setMyVisibility,
    workplaceImages,
} from "../controllers/workerController.js";
import { deleteWorkerPublication, getWorkerPublications } from "../controllers/admin/workerAdminController.js";
import { portfolio, portfolioImages } from "../controllers/portfolio/portfolioController.js";

const router = Router();

router.get("/health", (req, res) => res.status(200).json({ success: true, service: "workers" }));

router.get("/options", getWorkerOptions);
router.get("/", searchLimiter, listWorkers);

// My profile
router.get("/me", authMiddleware, getMyWorkerProfile);
// multipart: "data" (the form as JSON) + up to 4 "workplaceImages"
const withWorkplaceImages = (req, res, next) =>
    workplaceImages.middleware(req, res, (error) =>
        error
            ? res.status(400).json({
                  success: false,
                  message:
                      error.code === "LIMIT_FILE_SIZE"
                          ? "Each photo can be up to 5 MB."
                          : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
                            ? "Add up to 4 photos of your place."
                            : error.message,
                  errors: { "workplace.images": error.message },
              })
            : next()
    );
router.put("/me", authMiddleware, withWorkplaceImages, saveMyWorkerProfile);
router.patch("/me/availability", authMiddleware, setMyAvailability);
router.patch("/me/visibility", authMiddleware, setMyVisibility);
router.delete("/me", authMiddleware, createDeleteMine({ deletePortfolio: portfolio.deleteUserItems }));

// Portfolio (same rules as property and vehicles)
const withImages = (req, res, next) =>
    portfolioImages.middleware(req, res, (error) =>
        error
            ? res.status(400).json({
                  success: false,
                  message:
                      error.code === "LIMIT_FILE_SIZE"
                          ? "Each photo can be up to 5 MB."
                          : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
                            ? "An article can have up to 4 photos."
                            : error.message,
              })
            : next()
    );
router.get("/portfolio/mine", authMiddleware, portfolio.getMine);
router.get("/portfolio/user/:userId", portfolio.getUserPortfolio);
router.post("/portfolio", authMiddleware, withImages, portfolio.create);
router.put("/portfolio/:id", authMiddleware, withImages, portfolio.update);
router.delete("/portfolio/:id", authMiddleware, portfolio.remove);

// Admin panel
const review = [authMiddleware, adminAccess("workerPublications")];
router.get("/admin/publications", ...review, getWorkerPublications);
router.delete("/admin/publications/:id", ...review, deleteWorkerPublication);
router.get("/admin/portfolio", ...review, portfolio.adminList);
router.delete("/admin/portfolio/:id", ...review, portfolio.adminDelete);

// Public profile of a user (portfolio review links), then /:id last.
router.get("/user/:userId", optionalAuthMiddleware, getWorkerIdByUser);
router.get("/:id", optionalAuthMiddleware, getWorker);

export default router;
