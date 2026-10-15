//app/backend/routes/profile/profileRouter.js
import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { updateMyProfile } from "../../controllers/profile/profileController.js";
import { getMyProfile , updateMyPassword} from "../../controllers/profile/profileController.js";
const router = Router();

router.put("/me", authMiddleware, updateMyProfile);
router.get("/me", authMiddleware, getMyProfile);
router.patch("/me/password", authMiddleware, updateMyPassword);
export default router;