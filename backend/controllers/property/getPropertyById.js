import Property from "../../DatabaseModels/Schema/Property.js";
import mongoose from "mongoose";
import { isHiddenForRequester, isRequesterAdmin } from "../../services/accountStatus.js";
import User from "../../DatabaseModels/Schema/User.js";
import {
    isPropertyContactClosed,
    OWNER_CONTACT_FIELDS,
    propertyForViewer,
    withOwnerContact,
} from "../../utils/listingStatus.js";

export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid property ID" });
        }

        const property = await Property.findById(id);

        // Publisher suspended: hidden (administrators still see it).
        if (!property || (await isHiddenForRequester(property.userId, req))) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Inactive: no contact for visitors (owner and admins still see it).
        // The owner's current phone / WhatsApp / email, with "verified" flags.
        const owner = await User.findById(property.userId).select(OWNER_CONTACT_FIELDS).lean();
        const data = withOwnerContact(property.toObject ? property.toObject() : property, owner);
        const viewerId = req.user?.userId || req.user?.id || null;
        const isAdmin = isPropertyContactClosed(data) ? await isRequesterAdmin(req) : false;

        res.status(200).json(propertyForViewer(data, { viewerId, isAdmin }));
    } catch (error) {
        res.status(500).json({ message: error.message || "Server error" });
    }
};