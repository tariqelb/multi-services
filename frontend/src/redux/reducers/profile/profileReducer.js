
import { createReducer } from "@reduxjs/toolkit";
import {
    getProfile,
    updateProfile,
    setProfile,
} from "../../actions/profile/profileAction";

const initialState = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    bio: "",
    profileImage: "",
    loading: false,
    error: null,
    success: false,
};

const profileReducer = createReducer(initialState, (builder) => {
    builder
        // GET profile
        .addCase(getProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getProfile.fulfilled, (state, action) => {
            Object.assign(state, action.payload);
            state.loading = false;
            state.error = null;
        })
        .addCase(getProfile.rejected, (state, action) => {
            state.loading = false;
            state.error =
                action.payload || "Failed to load your profile.";
        })

        // Set profile synchronously, if needed elsewhere
        .addCase(setProfile, (state, action) => {
            Object.assign(state, action.payload);
        })

        // PUT profile
        .addCase(updateProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
            state.success = false;
        })
        .addCase(updateProfile.fulfilled, (state, action) => {
            Object.assign(state, action.payload);
            state.loading = false;
            state.error = null;
            state.success = true;
        })
        .addCase(updateProfile.rejected, (state, action) => {
            state.loading = false;
            state.error =
                action.payload || "Failed to update your profile.";
            state.success = false;
        });
});

export default profileReducer;