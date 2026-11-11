
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import axiosInstance from "../../api/axiosInstance";
import RoommateDetails from "./RoommateDetails";

export default function RoommateDetailsPage() {
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
        <Container
            maxWidth="xl"
            sx={{
                py: { xs: 2, md: 4 },
                px: { xs: 1.5, sm: 2, md: 3 },
            }}
        >
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{
                    mb: 3,
                    textTransform: "none",
                    fontWeight: 600,
                }}
            >
                {t("roommates.details.back", {
                    defaultValue: "Back to announcements",
                })}
            </Button>

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

                    <Typography color="text.secondary">
                        {t("roommates.details.loading", {
                            defaultValue: "Loading announcement...",
                        })}
                    </Typography>
                </Box>
            )}

            {!loading && error && (
                <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {error}
                    </Alert>

                    <Button
                        variant="contained"
                        onClick={() => navigate("/roommates")}
                        sx={{ mt: 2, textTransform: "none" }}
                    >
                        {t("roommates.details.viewAnnouncements", {
                            defaultValue: "View announcements",
                        })}
                    </Button>
                </Box>
            )}

            {!loading && !error && listing && (
                <RoommateDetails listing={listing} />
            )}
        </Container>
    );
}
