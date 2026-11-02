
import User from "../../DatabaseModels/Schema/User.js";
import bcrypt from "bcryptjs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function getImageSizeFromDataUrl(value) {
    const match = value.match(
        /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]*={0,2})$/
    );

    if (!match) {
        return null;
    }

    const base64 = match[2];

    if (!base64 || base64.length % 4 !== 0) {
        return null;
    }

    return {
        size: Buffer.from(base64, "base64").length,
    };
}





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
            "profileImage",
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

            // Validate profile images separately.
            if (field === "profileImage") {
                if (value === "") {
                    updates.profileImage = "";
                    continue;
                }

                const image = getImageSizeFromDataUrl(value);

                if (!image) {
                    return res.status(400).json({
                        message:
                            "Profile image must be a valid JPEG, PNG, or WEBP Base64 image.",
                    });
                }

                if (image.size > MAX_IMAGE_SIZE) {
                    return res.status(400).json({
                        message: "Profile image cannot exceed 2 MB.",
                    });
                }

                updates.profileImage = value;
                continue;
            }

            const cleanValue =
                field === "email"
                    ? value.trim().toLowerCase()
                    : value.trim();

            if (
                (field === "firstName" || field === "lastName") &&
                (cleanValue.length < 2 || cleanValue.length > 50)
            ) {
                return res.status(400).json({
                    message: `${field} must contain 2–50 characters.`,
                });
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

       
        const updatedUser = await User.findById(userId).select(
            "+emailVerificationCodeHash " +
            "+emailVerificationExpires " +
            "+phoneVerificationSessionId " +
            "+phoneVerificationExpires"
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // Reset email verification only when the email actually changes.
        if (
            Object.hasOwn(updates, "email") &&
            updates.email !== updatedUser.email
        ) {
            updatedUser.email = updates.email;
            updatedUser.emailVerified = false;
            updatedUser.emailVerificationCodeHash = undefined;
            updatedUser.emailVerificationExpires = undefined;
        }

        // Reset phone verification only when the phone number changes.
        if (
            Object.hasOwn(updates, "phoneNumber") &&
            updates.phoneNumber !== updatedUser.phoneNumber
        ) {
            updatedUser.phoneNumber = updates.phoneNumber;
            updatedUser.phoneVerified = false;
            updatedUser.phoneVerificationSessionId = undefined;
            updatedUser.phoneVerificationExpires = undefined;
        }

        // Apply the other allowed profile changes.
        const fieldsToUpdate = [
            "firstName",
            "lastName",
            "address",
            "bio",
            "profileImage",
        ];

        for (const field of fieldsToUpdate) {
            if (Object.hasOwn(updates, field)) {
                updatedUser[field] = updates[field];
            }
        }

        await updatedUser.save();

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                emailVerified: updatedUser.emailVerified,
                phoneNumber: updatedUser.phoneNumber ?? "",
                phoneVerified: updatedUser.phoneVerified,
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
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId)
            .select(
                [
                    "firstName",
                    "lastName",
                    "email",
                    "emailVerified",
                    "phoneNumber",
                    "phoneVerified",
                    "notificationPreferences",
                    "address",
                    "bio",
                    "profileImage",
                    "role",
                    "createdAt",
                    "updatedAt",
                ].join(" ")
            )
            .lean();

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const whatsapp = user.notificationPreferences?.whatsapp || {};
        const emailNotifications =
            user.notificationPreferences?.email || {};

        return res.status(200).json({
            message: "Profile fetched successfully.",

            user: {
                id: user._id,

                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",

                emailVerified: user.emailVerified ?? false,

                phoneNumber: user.phoneNumber || "",
                phoneVerified: user.phoneVerified ?? false,

                notificationPreferences: {
                    email: {
                        enabled: emailNotifications.enabled ?? false,
                        propertyAlerts:
                            emailNotifications.propertyAlerts ?? false,
                    },

                    whatsapp: {
                        enabled: whatsapp.enabled ?? false,
                        phoneNumber: whatsapp.phoneNumber || "",
                        propertyAlerts:
                            whatsapp.propertyAlerts ?? false,
                        verified: whatsapp.verified ?? false,
                    },
                },

                address: user.address || "",
                bio: user.bio || "",
                profileImage: user.profileImage || "",
                role: user.role || "Member",

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

export async function getMyNotificationPreferences(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId)
            .select("notificationPreferences phoneNumber")
            .lean();

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const saved = user.notificationPreferences || {};
        const email = saved.email || {};
        const whatsapp = saved.whatsapp || {};

        return res.status(200).json({
            message: "Notification preferences fetched successfully.",
            preferences: {
                email: {
                    enabled: email.enabled ?? true,
                    propertyAlerts: email.propertyAlerts ?? true,
                },
                whatsapp: {
                    enabled: whatsapp.enabled ?? false,
                    propertyAlerts: whatsapp.propertyAlerts ?? false,
                    phoneNumber:
                        whatsapp.phoneNumber || user.phoneNumber || "",
                    verified: whatsapp.verified ?? false,
                },
            },
        });
    } catch (error) {
        console.error("Get notification preferences error:", error);

        return res.status(500).json({
            message: "Unable to fetch notification preferences.",
        });
    }
}

export async function updateMyNotificationPreferences(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const { email, whatsapp } = req.body;
        const updates = {};

        // Validate and update email preferences.
        if (email !== undefined) {
            if (
                !email ||
                typeof email !== "object" ||
                Array.isArray(email)
            ) {
                return res.status(400).json({
                    message: "Email preferences must be an object.",
                });
            }

            const allowedEmailFields = [
                "enabled",
                "propertyAlerts",
            ];

            for (const field of Object.keys(email)) {
                if (!allowedEmailFields.includes(field)) {
                    return res.status(400).json({
                        message: `Invalid email preference: ${field}.`,
                    });
                }

                if (typeof email[field] !== "boolean") {
                    return res.status(400).json({
                        message: `${field} must be a boolean.`,
                    });
                }

                updates[`notificationPreferences.email.${field}`] =
                    email[field];
            }
        }

        // Validate and update WhatsApp preferences.
        if (whatsapp !== undefined) {
            if (
                !whatsapp ||
                typeof whatsapp !== "object" ||
                Array.isArray(whatsapp)
            ) {
                return res.status(400).json({
                    message: "WhatsApp preferences must be an object.",
                });
            }

            const allowedWhatsAppFields = [
                "enabled",
                "propertyAlerts",
                "phoneNumber",
            ];

            for (const field of Object.keys(whatsapp)) {
                if (!allowedWhatsAppFields.includes(field)) {
                    return res.status(400).json({
                        message: `Invalid WhatsApp preference: ${field}.`,
                    });
                }

                const value = whatsapp[field];

                if (
                    field === "enabled" ||
                    field === "propertyAlerts"
                ) {
                    if (typeof value !== "boolean") {
                        return res.status(400).json({
                            message: `${field} must be a boolean.`,
                        });
                    }

                    updates[
                        `notificationPreferences.whatsapp.${field}`
                    ] = value;
                }

                if (field === "phoneNumber") {
                    if (typeof value !== "string") {
                        return res.status(400).json({
                            message: "Phone number must be a string.",
                        });
                    }

                    const phoneNumber = value.trim();

                    if (
                        phoneNumber.length > 20 ||
                        (phoneNumber !== "" &&
                            !/^\+?[0-9\s().-]{7,20}$/.test(
                                phoneNumber
                            ))
                    ) {
                        return res.status(400).json({
                            message: "Please provide a valid phone number.",
                        });
                    }

                    updates[
                        "notificationPreferences.whatsapp.phoneNumber"
                    ] = phoneNumber;

                    // A changed number must be verified again.
                    const existingUser = await User.findById(userId)
                        .select(
                            "notificationPreferences.whatsapp.phoneNumber"
                        )
                        .lean();

                    const existingPhone =
                        existingUser?.notificationPreferences
                            ?.whatsapp?.phoneNumber || "";

                    if (phoneNumber !== existingPhone) {
                        updates[
                            "notificationPreferences.whatsapp.verified"
                        ] = false;
                    }
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No notification preference changes provided.",
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            {
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        ).select("notificationPreferences phoneNumber");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const saved = updatedUser.notificationPreferences;

        return res.status(200).json({
            message: "Notification preferences updated successfully.",
            preferences: {
                email: {
                    enabled: saved?.email?.enabled ?? true,
                    propertyAlerts:
                        saved?.email?.propertyAlerts ?? true,
                },
                whatsapp: {
                    enabled: saved?.whatsapp?.enabled ?? false,
                    propertyAlerts:
                        saved?.whatsapp?.propertyAlerts ?? false,
                    phoneNumber:
                        saved?.whatsapp?.phoneNumber ||
                        updatedUser.phoneNumber ||
                        "",
                    verified: saved?.whatsapp?.verified ?? false,
                },
            },
        });
    } catch (error) {
        console.error("Update notification preferences error:", error);

        return res.status(500).json({
            message: "Unable to update notification preferences.",
        });
    }
}