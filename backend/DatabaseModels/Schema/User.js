
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },

        phoneNumber: {
            type: String,
            trim: true,
            maxlength: 20,
            default: "",
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        address: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },

        bio: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        profileImage: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;