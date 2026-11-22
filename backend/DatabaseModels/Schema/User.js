//app/backend/DatabaseModels/Schema/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
            required: true,
        },
        lastName: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["client", "admin"],
            default: "client",
            lowercase: true,
            trim: true,
            required: true,
        },
        accountStatus: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
            lowercase: true,
            trim: true,
            index: true,
        },
        // Filled when an administrator suspends the account.
        suspendedAt: {
            type: Date,
            default: null,
        },
        suspendedReason: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },
        suspendedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        language: {
            type: String,
            enum: ["en", "fr", "ar"],
            default: "en",
            lowercase: true,
            trim: true,
            required: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationCodeHash: {
            type: String,
            select: false,
        },
        emailVerificationExpires: {
            type: Date,
            select: false,
        },
        phoneNumber: {
            type: String,
            trim: true,
            default: "",
        },
        phoneVerified: {
            type: Boolean,
            default: false,
        },
        phoneVerificationSessionId: {
            type: String,
            select: false,
        },
        phoneVerificationExpires: {
            type: Date,
            select: false,
        },
        // WhatsApp number used for publications and WhatsApp messages.
        whatsappNumber: {
            type: String,
            trim: true,
            default: "",
        },
        whatsappVerified: {
            type: Boolean,
            default: false,
        },
        whatsappVerificationSessionId: {
            type: String,
            select: false,
        },
        whatsappVerificationExpires: {
            type: Date,
            select: false,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        // false for accounts created with Google until the user sets a
        // password (no current password to type in the settings).
        passwordSet: {
            type: Boolean,
            default: true,
        },
        // Google account ID ("sub") when the user signs in with Google.
        googleId: {
            type: String,
            trim: true,
            default: undefined,
            select: false,
        },
        address: {
            type: String,
            default: "",
            trim: true,
        },
        bio: {
            type: String,
            default: "",
            trim: true,
        },
        profileImage: {
            type: String,
            default: "",
        },
        profileImagePublicId: {
            type: String,
            default: "",
        },
        notificationPreferences: {
            email: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                propertyAlerts: {
                    type: Boolean,
                    default: true,
                },
                roommateAlerts: {
                    type: Boolean,
                    default: true,
                },
            },
            // Switches only. The number is user.whatsappNumber.
            whatsapp: {
                enabled: {
                    type: Boolean,
                    default: false,
                },
                propertyAlerts: {
                    type: Boolean,
                    default: false,
                },
            },
        },
        deletionRequestedAt: {
            type: Date,
            default: null,
        },
        scheduledDeletionAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// One account per Google ID (accounts without Google are not indexed).
userSchema.index(
    { googleId: 1 },
    { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
);

// Reuse the existing model during development.
// If an old model is cached, ensure the active schema is correct.
let User;

if (mongoose.models.User) {
    const existingUser = mongoose.models.User;

    const hasVerificationFields =
        existingUser.schema.path("emailVerified") &&
        existingUser.schema.path("phoneVerified");

    if (hasVerificationFields) {
        User = existingUser;
    } else {
        console.warn(
            "[User Model] Replacing outdated User model schema."
        );

        delete mongoose.models.User;

        User = mongoose.model("User", userSchema);
    }
} else {
    User = mongoose.model("User", userSchema);
}

console.log("[User Model] Registered schema:", {
    modelName: User.modelName,
    collection: User.collection.name,
    emailVerified: User.schema.path("emailVerified")?.instance,
    phoneVerified: User.schema.path("phoneVerified")?.instance,
});

export default User;
