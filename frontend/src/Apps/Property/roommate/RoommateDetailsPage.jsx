import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Typography,
} from "@mui/material";


import axiosInstance from "../../../api/axiosInstance";
import RoommateDetails from "./RoommateDetails";
import { DetailsBackButton, DetailsContainer } from "../../../Components/ui/DetailsKit";

export default function RoommateDetailsPage({
    DetailsComponent = RoommateDetails,
}) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchListing = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axiosInstance.get(
                    `/roommates/${id}`
                );

                if (!isMounted) return;

                setListing(response.data?.listing || null);

                if (!response.data?.listing) {
                    setError(
                        t("roommates.details.notFound", {
                            defaultValue:
                                "This roommate announcement could not be found.",
                        })
                    );
                }
            } catch (err) {
                console.error(
                    "[RoommateDetailsPage] Failed to fetch listing:",
                    err
                );

                if (!isMounted) return;

                setError(
                    err.response?.data?.message ||
                    t("roommates.details.loadFailed", {
                        defaultValue:
                            "Unable to load this announcement. Please try again.",
                    })
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchListing();
        } else {
            setError(
                t("roommates.details.invalidId", {
                    defaultValue: "Invalid announcement ID.",
                })
            );
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [id, t]);

    return (
        <DetailsContainer withMobileBar={Boolean(listing)}>
            <DetailsBackButton
                onClick={() => navigate(-1)}
                label={t("roommates.details.back", { defaultValue: "Back" })}
            />

            {loading && (
                <Box
                    sx={{
                        minHeight: 350,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ color: "text.secondary" }}>
                        {t("roommates.details.loading", { defaultValue: "Loading announcement..." })}
                    </Typography>
                </Box>
            )}

            {!loading && error && (
                <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
                    <Alert severity="error">{error}</Alert>
                    <Button variant="contained" onClick={() => navigate("/roommates")} sx={{ mt: 2 }}>
                        {t("roommates.details.viewAnnouncements", { defaultValue: "View announcements" })}
                    </Button>
                </Box>
            )}

            {!loading && !error && listing && <DetailsComponent listing={listing} />}
        </DetailsContainer>
    );
}
