
import express from "express";
import {
    trackExternalListingClick,
} from "../../controllers/externalListings/externalListingClickController.js";

const router = express.Router();

// Public endpoint: visitors do not need to log in.
router.post(
    "/:id/click",
    trackExternalListingClick
);

export default router;
