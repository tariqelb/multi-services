
import axiosInstance from "../../../api/axiosInstance";
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

export const setProfile = createAction("profile/setProfile");
// GET /api/profile/me

export const getProfile = createAsyncThunk(
    "profile/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/profile/me");

            const user = response.data.user ?? response.data;

            if (!user || typeof user !== "object") {
                return rejectWithValue(
                    "The server returned invalid profile data."
                );
            }

            return user;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to load your profile."
            );
        }
    }
);

// PUT /api/profile/me
export const updateProfile = createAsyncThunk(
    "profile/updateProfile",
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                "/profile/me",
                profileData
            );

            return response.data.user;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    "Failed to update your profile."
            );
        }
    }
);