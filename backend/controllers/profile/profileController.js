import bcrypt from "bcryptjs";
import User from "../../DatabaseModels/Schema/User.js";

export async function updateMyProfile(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const allowedFields = [
            "firstName",
            "lastName",
            "email",
            "phoneNumber",
            "address",
            "bio",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (!Object.hasOwn(req.body, field)) {
                continue;
            }

            const value = req.body[field];

            if (typeof value !== "string") {
                return res.status(400).json({
                    message: `${field} must be a string.`,
                });
            }

            const cleanValue =
                field === "email"
                    ? value.trim().toLowerCase()
                    : value.trim();

            if (field === "firstName" || field === "lastName") {
                if (cleanValue.length < 2 || cleanValue.length > 50) {
                    return res.status(400).json({
                        message: `${field} must contain 2–50 characters.`,
                    });
                }
            }

            if (field === "email") {
                if (
                    cleanValue.length > 254 ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)
                ) {
                    return res.status(400).json({
                        message: "Please provide a valid email address.",
                    });
                }
            }

            if (
                field === "phoneNumber" &&
                cleanValue !== "" &&
                !/^\+?[0-9\s().-]{7,20}$/.test(cleanValue)
            ) {
                return res.status(400).json({
                    message: "Please provide a valid phone number.",
                });
            }

            if (field === "address" && cleanValue.length > 300) {
                return res.status(400).json({
                    message: "Address cannot exceed 300 characters.",
                });
            }

            if (field === "bio" && cleanValue.length > 1000) {
                return res.status(400).json({
                    message: "Bio cannot exceed 1000 characters.",
                });
            }

            updates[field] = cleanValue;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No profile changes were provided.",
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phoneNumber: updatedUser.phoneNumber ?? "",
                address: updatedUser.address ?? "",
                bio: updatedUser.bio ?? "",
                profileImage: updatedUser.profileImage ?? "",
            },
        });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(409).json({
                message: "This email address is already in use.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "The submitted profile data is invalid.",
            });
        }

        console.error("Profile update error:", error);

        return res.status(500).json({
            message: "Unable to update your profile.",
        });
    }
}

export async function getMyProfile(req, res) {
    try {
        // The authentication middleware should set req.user.
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        // Fetch only the authenticated user's profile.
        const user = await User.findById(userId)
            .select(
                "firstName lastName email phoneNumber address bio profileImage createdAt updatedAt"
            )
            .lean();

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.status(200).json({
            message: "Profile fetched successfully.",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber ?? "",
                address: user.address ?? "",
                bio: user.bio ?? "",
                profileImage: user.profileImage ?? "",
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            message: "Unable to fetch your profile.",
        });
    }
}

export async function updateMyPassword(req, res) {
    try {
        console.log("called : ", req.body);
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = req.body;

        // Validate required fields.
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "All password fields are required.",
            });
        }

        // Validate the new password.
        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must be at least 8 characters long.",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New password and confirmation do not match.",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from the current password.",
            });
        }

        // Fetch the authenticated user and explicitly include the password.
        const user = await User.findById(userId).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // Verify the current password.
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Current password is incorrect.",
            });
        }

        // Hash and save the new password.
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        return res.status(200).json({
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("Update password error:", error);

        return res.status(500).json({
            message: "Unable to update your password.",
        });
    }
}