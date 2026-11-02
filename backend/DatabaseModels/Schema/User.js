
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
        password: {
            type: String,
            required: true,
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
            },
            whatsapp: {
                enabled: {
                    type: Boolean,
                    default: false,
                },
                propertyAlerts: {
                    type: Boolean,
                    default: false,
                },
                phoneNumber: {
                    type: String,
                    default: "",
                    trim: true,
                },
                verified: {
                    type: Boolean,
                    default: false,
                },
                verificationSessionId: {
                    type: String,
                    select: false,
                },
                verificationExpires: {
                    type: Date,
                    select: false,
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
