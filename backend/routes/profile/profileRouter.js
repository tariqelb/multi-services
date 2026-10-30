//app/backend/routes/profile/profileRouter.js
import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { updateMyProfile } from "../../controllers/profile/profileController.js";
import { getMyProfile , updateMyPassword} from "../../controllers/profile/profileController.js";
import {    getMyNotificationPreferences, updateMyNotificationPreferences, } from "../../controllers/profile/profileController.js";

const router = Router();

router.put("/me", authMiddleware, updateMyProfile);
router.get("/me", authMiddleware, getMyProfile);
router.patch("/me/password", authMiddleware, updateMyPassword);


// Use the same authentication middleware as your other profile routes.
router.get( "/me/notification-preferences",
    authMiddleware, getMyNotificationPreferences
);

router.patch("/me/notification-preferences",
    authMiddleware,
    updateMyNotificationPreferences
);

export default router;