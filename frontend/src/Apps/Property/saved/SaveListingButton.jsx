// src/Apps/Property/saved/SaveListingButton.jsx
// Save a roommate announcement or a hotel / riad (type: "roommate" or
// "establishment"). Shown in the contact card under WhatsApp, like the
// property and vehicle pages. Not shown to the owner; visitors are sent
// to the login page. Saved ones are on the Saved page (/saved).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Alert, Snackbar } from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";
import SaveToggleButton from "../../../Components/ui/SaveToggleButton";

const idOf = (user) => String(user?._id || user?.id || user?.userId || "");

export default function SaveListingButton({ type, listingId, ownerId, sx }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth?.user ?? state.loginForm?.user ?? null);
    const userId = idOf(user);
    const isOwner = Boolean(userId) && Boolean(ownerId) && String(ownerId) === userId;

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Already saved? (logged-in visitors only)
    useEffect(() => {
        if (!userId || !listingId || isOwner) return undefined;
        let cancelled = false;
        axiosInstance
            .get(`/property/saved-listings/${type}/${listingId}`)
            .then(({ data }) => !cancelled && setSaved(Boolean(data.saved)))
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [userId, type, listingId, isOwner]);

    if (!listingId || isOwner) return null;

    const toggle = async () => {
        if (!userId) return navigate("/login");
        const next = !saved;
        setSaving(true);
        try {
            if (next) await axiosInstance.post(`/property/saved-listings/${type}/${listingId}`);
            else await axiosInstance.delete(`/property/saved-listings/${type}/${listingId}`);
            setSaved(next);
            setFeedback({ severity: "success", message: next ? t("savedListings.added", "Saved. Find it in Saved.") : t("savedListings.removed", "Removed from your saved list.") });
        } catch (requestError) {
            setFeedback({ severity: "error", message: requestError.response?.data?.message || t("savedListings.error", "Unable to update your saved list.") });
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
                saveLabel={t("savedListings.save", "Save")}
                savedLabel={t("savedListings.saved", "Saved")}
                sx={sx}
            />
            <Snackbar
                open={Boolean(feedback)}
                autoHideDuration={3000}
                onClose={() => setFeedback(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                sx={{ bottom: { xs: 96, lg: 24 } }}
            >
                <Alert severity={feedback?.severity || "success"} variant="filled" onClose={() => setFeedback(null)}>
                    {feedback?.message}
                </Alert>
            </Snackbar>
        </>
    );
}
