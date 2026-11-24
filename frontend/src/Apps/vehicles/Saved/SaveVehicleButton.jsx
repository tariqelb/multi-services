// src/Apps/vehicles/Saved/SaveVehicleButton.jsx
// "Save" / "Saved" on the vehicle page (same idea as saving a property,
// kept in the vehicles service). Visitors are sent to the login page.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Snackbar, Alert } from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";
import SaveToggleButton from "../../../Components/ui/SaveToggleButton";

export default function SaveVehicleButton({ vehicle, sx }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth?.user ?? state.loginForm?.user ?? null);

    const [saved, setSaved] = useState(Boolean(vehicle?.isSaved));
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const toggle = async () => {
        if (!user) return navigate("/login");
        if (saving) return;
        const next = !saved;
        setSaving(true);
        try {
            if (next) await axiosInstance.post(`/vehicles/${vehicle._id}/save`);
            else await axiosInstance.delete(`/vehicles/${vehicle._id}/save`);
            setSaved(next);
            setFeedback({
                severity: "success",
                message: next ? t("vehiclesApp.saved.added", "Saved. Find it in Saved vehicles.") : t("vehiclesApp.saved.removed", "Removed from your saved vehicles."),
            });
        } catch (requestError) {
            setFeedback({ severity: "error", message: requestError.response?.data?.message || t("vehiclesApp.saved.error", "Unable to update your saved vehicles.") });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <SaveToggleButton
                saved={saved}
                saving={saving}
                onClick={toggle}
                saveLabel={t("vehiclesApp.saved.saveButton", "Save this vehicle")}
                savedLabel={t("vehiclesApp.saved.savedButton", "Saved")}
                sx={sx}
            />
            <Snackbar open={Boolean(feedback)} autoHideDuration={3000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={feedback?.severity || "success"} variant="filled" onClose={() => setFeedback(null)}>
                    {feedback?.message}
                </Alert>
            </Snackbar>
        </>
    );
}
