// backend/apps/property/routes/index.js
//
// Property service. Mounted at /api/property.
// Sub-routers come first: the properties router ends with GET /:id.
//   /api/property/roommates/alerts     roommate alerts
//   /api/property/roommates            roommate announcements
//   /api/property/establishments       hotels and riads
//   /api/property/saved-listings       saved roommate announcements, hotels and riads
//   /api/property/external-listings    collected listings (+ /analytics, clicks)
//   /api/property/search               search page
//   /api/property/reviews              publishers ranked by reviews
//   /api/property/profiles/:userId     public profile + reviews
//   /api/property/feedback             feedback and reports
//   /api/property/knowledge            help center
//   /api/property/dashboard            analytics and admin tools
//   /api/property/requests             "I am looking for..." requests (see requestRouter.js)
//   /api/property/portfolio            articles and videos of profiles (see portfolioRouter.js)
//   /api/property/...                  properties (getlist, :id, saved, alerts, clicks...)

import { Router } from "express";

import roommateAlertRouter from "./roommateAlertRouter.js";
import roommateRouter from "./roommateRouter.js";
import establishmentRouter from "./establishmentRouter.js";
import externalListingAnalyticsRouter from "./externalListingAnalyticsRouter.js";
import externalListingClickRouter from "./externalListingClickRouter.js";
import externalListingRouter from "./externalListingRouter.js";
import searchRouter from "./searchRouter.js";
import reviewsRouter from "./reviewsRouter.js";
import profileRouter from "./profileRouter.js";
import feedbackRouter from "./feedbackRouter.js";
import knowledgeRouter from "./knowledgeRouter.js";
import dashboardRouter from "./dashboardRouter.js";
import propertyRouter from "./propertyRouter.js";
import savedListingRouter from "./savedListingRouter.js";
import requestRouter from "./requestRouter.js";
import portfolioRouter from "./portfolioRouter.js";

const router = Router();

router.use("/saved-listings", savedListingRouter);
router.use("/roommates/alerts", roommateAlertRouter);
router.use("/roommates", roommateRouter);
router.use("/establishments", establishmentRouter);

// Analytics before the dynamic listing routes.
router.use("/external-listings/analytics", externalListingAnalyticsRouter);
router.use("/external-listings", externalListingClickRouter);
router.use("/external-listings", externalListingRouter);

router.use("/search", searchRouter);
router.use("/reviews", reviewsRouter);
router.use("/profiles", profileRouter);
router.use("/feedback", feedbackRouter);
router.use("/knowledge", knowledgeRouter);
router.use("/dashboard", dashboardRouter);
router.use("/requests", requestRouter);
router.use("/portfolio", portfolioRouter);

// Last: properties (has GET /:id).
router.use("/", propertyRouter);

export default router;
