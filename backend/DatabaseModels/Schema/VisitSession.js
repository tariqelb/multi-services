import mongoose from "mongoose";

const visitSessionSchema = new mongoose.Schema(
    {
        visitorId: {
            type: String,
            required: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        fullName: {
            type: String,
            default: "",
        },

        email: {
            type: String,
            default: "",
        },

        startedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },

        lastActivityAt: {
            type: Date,
            default: Date.now,
            required: true,
        },

        activeSeconds: {
            type: Number,
            default: 0,
            min: 0,
        },

        lastHeartbeatAt: {
            type: Date,
            default: null,
        },

        pageViews: {
            type: Number,
            default: 1,
            min: 1,
        },

        lastPage: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

visitSessionSchema.index({ visitorId: 1, startedAt: -1 });
visitSessionSchema.index({ userId: 1, startedAt: -1 });
visitSessionSchema.index({ startedAt: -1 });

export default mongoose.model("VisitSession", visitSessionSchema);