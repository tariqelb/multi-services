
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
    Alert,
    Paper,
    Stack,
    Typography,
    Button,
    Snackbar,
} from "@mui/material";

import {
    Phone,
    WhatsApp,
    AccountCircle,
} from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";

export default function PropertyContactOwner({ property }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [tracking, setTracking] = useState(false);
    const [error, setError] = useState("");

    if (!property) return null;

    // Support both populated and unpopulated owner references.
    const ownerId =
        property.userId?._id ||
        property.userId?.id ||
        property.userId ||
        property.owner?._id ||
        property.owner?.id ||
        property.ownerId ||
        "";

    const phone =
        property.phone ||
        property.owner?.phoneNumber ||
        "";

    const ownerName =
        [
            property.firstName || property.owner?.firstName,
            property.lastName || property.owner?.lastName,
        ]
            .filter(Boolean)
            .join(" ") || t("properties.contactOwner.owner");

    const normalizedPhone = String(phone).trim();
    const whatsappNumber = normalizedPhone.replace(/\D/g, "");

    const handleVisitProfile = () => {
        if (!ownerId) {
            setError(
                t("properties.contactOwner.profileError", {
                    defaultValue: "Owner profile is unavailable.",
                })
            );
            return;
        }

        navigate(`/profile/${ownerId}`);
    };

    const handleContact = async (action) => {
        if (!property._id) {
            setError(t("properties.contactOwner.trackingError"));
            return;
        }

        if (tracking) return;

        setTracking(true);
        setError("");

        try {
            await axiosInstance.post(
                "/dashboard/property-contacts",
                {
                    propertyId: property._id,
                    action,
                }
            );

            if (action === "call") {
                window.location.href = `tel:${normalizedPhone}`;
            } else if (action === "whatsapp") {
                window.open(
                    `https://wa.me/${whatsappNumber}`,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        } catch (err) {
            console.error("Contact tracking error:", err);

            setError(
                t("properties.contactOwner.trackingError")
            );
        } finally {
            setTracking(false);
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 3, md: 4 },
                borderRadius: "16px",
                borderColor: "#E2E8F0",
                bgcolor: "#ffffff",
                textAlign: "center",
                mb: 4,
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: "#0F172A",
                }}
            >
                {t("properties.contactOwner.title")}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    color: "#5B6577",
                    mb: 3,
                }}
            >
                {t("properties.contactOwner.subtitle")}
            </Typography>

            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                }}
            >
                {ownerName}
            </Typography>

            {normalizedPhone ? (
                <Typography
                    component="a"
                    href={`tel:${normalizedPhone}`}
                    onClick={(event) => {
                        event.preventDefault();
                        handleContact("call");
                    }}
                    sx={{
                        display: "inline-block",
                        mt: 1,
                        color: "#1D4ED8",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        overflowWrap: "anywhere",
                        cursor: "pointer",
                        "&:hover": {
                            textDecoration: "underline",
                        },
                    }}
                >
                    <Phone
                        sx={{
                            fontSize: 18,
                            verticalAlign: "middle",
                            mr: 0.75,
                        }}
                    />
                    {normalizedPhone}
                </Typography>
            ) : (
                <Alert
                    severity="info"
                    sx={{
                        mt: 2,
                        maxWidth: 400,
                        mx: "auto",
                    }}
                >
                    {t("properties.contactOwner.noPhone")}
                </Alert>
            )}

            {/* Contact and profile buttons */}
            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}
                spacing={2}
                justifyContent="center"
                alignItems="stretch"
                sx={{
                    mt: 3,
                    maxWidth: 750,
                    mx: "auto",
                }}
            >
                <Button
                    onClick={() => handleContact("call")}
                    variant="contained"
                    startIcon={<Phone />}
                    fullWidth
                    disabled={tracking || !normalizedPhone}
                    sx={{ py: 1.2 }}
                >
                    {t("properties.contactOwner.call")}
                </Button>

                <Button
                    onClick={() => handleContact("whatsapp")}
                    variant="outlined"
                    startIcon={<WhatsApp />}
                    fullWidth
                    disabled={tracking || !whatsappNumber}
                    sx={{
                        color: "#047857",
                        borderColor: "#86CBA8",
                        "&:hover": {
                            borderColor: "#047857",
                            bgcolor: "#ecfdf5",
                        },
                        py: 1.2,
                    }}
                >
                    {t("properties.contactOwner.whatsapp")}
                </Button>

                <Button
                    onClick={handleVisitProfile}
                    variant="outlined"
                    startIcon={<AccountCircle />}
                    fullWidth
                    disabled={!ownerId}
                    sx={{
                        color: "#1D4ED8",
                        borderColor: "#93B4F5",
                        "&:hover": {
                            borderColor: "#1D4ED8",
                            bgcolor: "#EFF6FF",
                        },
                        py: 1.2,
                    }}
                >
                    {t("properties.contactOwner.visitProfile", {
                        defaultValue: "Visit profile",
                    })}
                </Button>
            </Stack>

            <Snackbar
                open={Boolean(error)}
                autoHideDuration={4000}
                onClose={() => setError("")}
                message={error}
            />
        </Paper>
    );
}
