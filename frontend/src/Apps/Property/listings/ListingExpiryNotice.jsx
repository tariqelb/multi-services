// src/Components/listings/ListingExpiryNotice.jsx
//
// My Publications: "becomes inactive in N days" / "set to inactive"
// with a "Still available" button (60-day expiry, see backend
// services/listingExpiry.js).

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, CircularProgress } from "@mui/material";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";

import axiosInstance from "../../../api/axiosInstance";

const ENDPOINTS = {
    property: (id) => `/property/${id}/still-available`,
    roommate: (id) => `/roommates/${id}/still-available`,
};

/**
 * @param kind        "property" | "roommate"
 * @param expiry      { applies, expired, daysLeft, reminder } from the API
 * @param hidden      true once the owner changed the status here
 * @param onConfirmed (newStatus) => void
 */
export default function ListingExpiryNotice({ kind, id, expiry, hidden = false, onConfirmed }) {
    const { t } = useTranslation();
    const [state, setState] = useState(expiry || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (hidden || !id || !state || !(state.expired || state.reminder)) return null;

    const confirm = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.post(ENDPOINTS[kind](id));

            setState(response.data?.expiry || null);
            onConfirmed?.(response.data?.status);
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("listingExpiry.error", "Could not confirm the listing."));
        } finally {
            setLoading(false);
        }
    };

    const message = state.expired
        ? t("listingExpiry.expired", "Set to inactive because it was not confirmed for 60 days. Visitors cannot find or contact it.")
        : t("listingExpiry.reminder", "Becomes inactive in {{count}} days unless you confirm it is still available.", {
            count: state.daysLeft ?? 0,
        });

    return (
        <Alert
            severity={state.expired ? "warning" : "info"}
            sx={{ mt: 1.5, alignItems: "center", "& .MuiAlert-action": { pt: 0 } }}
            action={
                <Button
                    size="small"
                    variant="contained"
                    color={state.expired ? "warning" : "primary"}
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <EventAvailableRoundedIcon />}
                    onClick={confirm}
                    disabled={loading}
                    sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                    {state.expired
                        ? t("listingExpiry.reactivate", "Still available: reactivate")
                        : t("listingExpiry.confirm", "Still available")}
                </Button>
            }
        >
            {error || message}
        </Alert>
    );
}
