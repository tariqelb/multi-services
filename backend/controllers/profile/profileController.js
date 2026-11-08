import User from "../../DatabaseModels/Schema/User.js";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROFILE_UPLOAD_DIR = path.resolve(
    __dirname,
    "../../uploads/profile"
);

const PROFILE_IMAGE_PREFIX = "/uploads/profile/";

function getImageFromDataUrl(value) {
    const match = value.match(
        /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]*={0,2})$/
    );

    if (!match) return null;

    const buffer = Buffer.from(match[2], "base64");

    if (
        !buffer.length ||
        buffer.toString("base64") !== match[2] ||
        buffer.length > MAX_IMAGE_SIZE
    ) {
        return null;
    }

    const extensions = {
        jpeg: "jpg",
        png: "png",
        webp: "webp",
    };

    return {
        buffer,
        extension: extensions[match[1]],
    };
}

//cloudinary
function uploadProfileImage(buffer, userId, extension) {
    return new Promise((resolve, reject) => {
        const publicId =
            `profile-${userId}-${Date.now()}-${randomBytes(4).toString("hex")}`;

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "multi-services/profiles",
                public_id: publicId,
                format: extension,
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);

                resolve({
                    path: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        stream.end(buffer);
    });
}

async function deleteProfileImage(imagePath, publicId = "") {
    if (!imagePath) return;

    if (process.env.NODE_ENV === "production") {
        if (!publicId) return;

        try {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: "image",
            });
        } catch (error) {
            console.error("Cloudinary deletion error:", error);
        }

        return;
    }

    if (!imagePath.startsWith(PROFILE_IMAGE_PREFIX)) return;

    const filename = imagePath.slice(PROFILE_IMAGE_PREFIX.length);

    if (
        !filename ||
        filename.includes("/") ||
        filename.includes("\\") ||
        filename.includes("..")
    ) {
        return;
    }

    try {
        await fs.unlink(path.join(PROFILE_UPLOAD_DIR, filename));
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Unable to delete profile image:", error);
        }
    }
}

function getProfileImagePath(filename) {
    if (!filename || typeof filename !== "string") return null;

    // Only allow files inside uploads/profile.
    if (
        filename.includes("/") ||
        filename.includes("\\") ||
        filename.includes("..")
    ) {
        return null;
    }

    return path.join(PROFILE_UPLOAD_DIR, filename);
}


export async function updateMyProfile(req, res) {
    let newImageFilePath = null;
    let newImagePublicId = null;

    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
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
        let newImage = null;

        const oldImagePath = updatedUser.profileImage || "";
        const oldImagePublicId =
            updatedUser.profileImagePublicId || "";

        for (const field of allowedFields) {
            if (!Object.hasOwn(req.body, field)) continue;

            const value = req.body[field];

            if (typeof value !== "string") {
                return res.status(400).json({
                    message: `${field} must be a string.`,
                });
            }

            if (field === "profileImage") {
                // Existing image: no upload necessary.
                if (value === oldImagePath) continue;

                // Empty value means remove the image.
                if (value === "") {
                    updates.profileImage = "";
                    updates.profileImagePublicId = "";
                    continue;
                }

                const image = getImageFromDataUrl(value);

                if (!image) {
                    return res.status(400).json({
                        message:
                            "Profile image must be a valid JPEG, PNG, or WEBP Base64 image.",
                    });
                }

                newImage = image;
                continue;
            }

            const cleanValue =
                field === "email"
                    ? value.trim().toLowerCase()
                    : value.trim();

            if (
                ["firstName", "lastName"].includes(field) &&
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

        if (Object.keys(updates).length === 0 && !newImage) {
            return res.status(400).json({
                message: "No profile changes were provided.",
            });
        }

        // Save the new image according to the environment.
        if (newImage) {
            if (process.env.NODE_ENV === "production") {
                const uploaded = await uploadProfileImage(
                    newImage.buffer,
                    userId,
                    newImage.extension
                );

                updates.profileImage = uploaded.path;
                updates.profileImagePublicId = uploaded.publicId;

                newImagePublicId = uploaded.publicId;
            } else {
                await fs.mkdir(PROFILE_UPLOAD_DIR, {
                    recursive: true,
                });

                const filename =
                    `profile-${Date.now()}-${randomBytes(4).toString("hex")}.` +
                    newImage.extension;

                newImageFilePath = path.join(
                    PROFILE_UPLOAD_DIR,
                    filename
                );

                await fs.writeFile(
                    newImageFilePath,
                    newImage.buffer
                );

                updates.profileImage =
                    `${PROFILE_IMAGE_PREFIX}${filename}`;

                updates.profileImagePublicId = "";
            }
        }

        // Handle email changes.
        if (
            Object.hasOwn(updates, "email") &&
            updates.email !== updatedUser.email
        ) {
            updatedUser.email = updates.email;
            updatedUser.emailVerified = false;
            updatedUser.emailVerificationCodeHash = undefined;
            updatedUser.emailVerificationExpires = undefined;
        }

        // Handle phone changes.
        if (
            Object.hasOwn(updates, "phoneNumber") &&
            updates.phoneNumber !== updatedUser.phoneNumber
        ) {
            updatedUser.phoneNumber = updates.phoneNumber;
            updatedUser.phoneVerified = false;
            updatedUser.phoneVerificationSessionId = undefined;
            updatedUser.phoneVerificationExpires = undefined;
        }

        const fieldsToUpdate = [
            "firstName",
            "lastName",
            "address",
            "bio",
            "profileImage",
            "profileImagePublicId",
        ];

        for (const field of fieldsToUpdate) {
            if (Object.hasOwn(updates, field)) {
                updatedUser[field] = updates[field];
            }
        }

        await updatedUser.save();

        // Delete the previous image only after the database save succeeds.
        if (
            oldImagePath &&
            oldImagePath !== updatedUser.profileImage
        ) {
            await deleteProfileImage(
                oldImagePath,
                oldImagePublicId
            );
        }

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
        // Clean up a newly uploaded local image.
        if (newImageFilePath) {
            try {
                await fs.unlink(newImageFilePath);
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    console.error(
                        "Local image cleanup error:",
                        cleanupError
                    );
                }
            }
        }

        // Clean up a newly uploaded Cloudinary image.
        if (newImagePublicId) {
            try {
                await cloudinary.uploader.destroy(
                    newImagePublicId,
                    { resource_type: "image" }
                );
            } catch (cleanupError) {
                console.error(
                    "Cloudinary cleanup error:",
                    cleanupError
                );
            }
        }

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
                    "language",
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
                language: user.language || "en",
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

export async function updateMyLanguage(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const { language } = req.body;

        const supportedLanguages = ["en", "fr", "ar"];

        if (
            typeof language !== "string" ||
            !supportedLanguages.includes(language.trim().toLowerCase())
        ) {
            return res.status(400).json({
                message: "Language must be en, fr, or ar.",
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    language: language.trim().toLowerCase(),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("language");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.status(200).json({
            message: "Language preference updated successfully.",
            language: updatedUser.language,
        });
    } catch (error) {
        console.error("Update language error:", error);

        return res.status(500).json({
            message: "Unable to update language preference.",
        });
    }
}