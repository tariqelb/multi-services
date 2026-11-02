
import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        verificationCode: {
            type: String,
            required: true,
            select: false,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        expiresAt: {
            type: Date,
            required: true,
            expires: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "PendingSignup",
    pendingSignupSchema
);
