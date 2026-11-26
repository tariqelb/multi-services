// backend/apps/main/controllers/account/professionalProfileController.js
//
// Settings > Receive requests (one profile per account, both services):
//   GET /api/profile/me/professional   my settings (+ suggestion from my listings)
//   PUT /api/profile/me/professional

import User from "../../models/User.js";
import { getPublishingActivity } from "../../services/serviceRegistry.js";
import { buildProfile, profileView } from "../../services/professionalProfile.js";

const me = (req) => String(req.user?.userId || "");
const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });

export const getMyProfessionalProfile = async (req, res) => {
    try {
        const user = await User.findById(me(req)).select("professionalProfile").lean();
        if (!user) return fail(res, 404, "User not found.");

        let suggestion = {};
        try {
            suggestion = await getPublishingActivity(me(req));
        } catch (error) {
            console.error("[ProfessionalProfile] Activity error:", error.message);
        }

        return res.status(200).json({ success: true, profile: profileView(user), suggestion });
    } catch (error) {
        console.error("[ProfessionalProfile] Load error:", error);
        return fail(res, 500, "Unable to load your settings.");
    }
};

export const updateMyProfessionalProfile = async (req, res) => {
    try {
        const { profile, errors } = buildProfile(req.body);
        if (Object.keys(errors).length) return fail(res, 400, "Please check the form.", { errors });

        const user = await User.findByIdAndUpdate(me(req), { $set: { professionalProfile: profile } }, { returnDocument: "after", runValidators: true })
            .select("professionalProfile")
            .lean();
        if (!user) return fail(res, 404, "User not found.");

        return res.status(200).json({ success: true, message: "Settings saved.", profile: profileView(user) });
    } catch (error) {
        console.error("[ProfessionalProfile] Save error:", error);
        return fail(res, 500, "Unable to save your settings.");
    }
};
