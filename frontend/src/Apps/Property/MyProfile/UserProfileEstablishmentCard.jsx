// /home/tariq/multi-services/app/frontend/src/components/MyProfile/UserProfileEstablishmentCard.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Typography,
    Card,
    CardMedia,
    Button,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";

import {
    LocationOn,
    Visibility,
    Delete,
    Hotel,
    MeetingRoom,
} from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

function getImageUrl(image) {
    if (!image) return "";

    const imagePath =
        typeof image === "string"
            ? image
            : image.path || image.url || image.filename || "";

    if (!imagePath) return "";

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(
        /^\//,
        ""
    )}`;
}

function getStartingPrice(rooms = []) {
    const prices = rooms
        .map((room) => Number(room.pricePerNight))
        .filter((price) => Number.isFinite(price) && price > 0);

    return prices.length ? Math.min(...prices) : null;
}

export default function UserProfileEstablishmentCard({
    establishment = {},
    onDelete,
}) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [openDeleteModal, setOpenDeleteModal] = useState(false);

    const {
        name = "",
        accommodationType = "Accommodation",
        location = {},
        numberOfRooms,
        officialClassification,
        rooms = [],
        media = {},
        createdAt,
    } = establishment;

    const establishmentId =
        establishment._id || establishment.id;

    const coverImage = getImageUrl(media.coverPhoto);

    const startingPrice = getStartingPrice(rooms);

    const locationText = [
        location.neighborhood,
        location.city,
    ]
        .filter(Boolean)
        .join(", ");

    const locale =
        i18n.language === "ar"
            ? "ar-MA"
            : i18n.language === "fr"
                ? "fr-FR"
                : "en-GB";

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString(locale)
        : "";

    const formattedPrice =
        startingPrice !== null
            ? startingPrice.toLocaleString(locale)
            : null;

    const handleViewDetails = () => {
        if (!establishmentId) {
            console.error(
                "Establishment ID is missing:",
                establishment
            );
            return;
        }

        navigate(`/establishments/${establishmentId}`, {
            state: { establishment },
        });
    };

    const handleDeleteConfirm = async () => {
        if (!establishmentId) return;

        try {
            await onDelete?.(establishmentId);
            setOpenDeleteModal(false);
        } catch (error) {
            console.error(
                "Failed to delete establishment:",
                error
            );
        }
    };

    return (
        <>
            <Card
                variant="outlined"
                sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: {
                        xs: "column",
                        sm: "row",
                    },
                    borderRadius: "16px",
                    borderColor: "#e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    bgcolor: "#ffffff",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    },
                }}
            >
                {/* Establishment image */}
                <Box
                    sx={{
                        width: {
                            xs: "100%",
                            sm: 300,
                        },
                        height: {
                            xs: 200,
                            sm: 260,
                        },
                        flex: {
                            xs: "0 0 200px",
                            sm: "0 0 300px",
                        },
                        minWidth: 0,
                        position: "relative",
                        overflow: "hidden",
                        bgcolor: "#e2e8f0",
                    }}
                >
                    {coverImage ? (
                        <CardMedia
                            component="img"
                            image={coverImage}
                            alt={name}
                            sx={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                objectPosition: "center",
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Hotel
                                sx={{
                                    fontSize: 65,
                                    color: "#94a3b8",
                                }}
                            />
                        </Box>
                    )}

                    <Chip
                        icon={<Hotel />}
                        label={accommodationType}
                        size="small"
                        sx={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            bgcolor: "white",
                            fontWeight: 700,
                            maxWidth: "90%",
                        }}
                    />
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        p: 2.5,
                        pt: {
                            xs: 2.5,
                            sm: 3,
                        },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        flexGrow: 1,
                        minWidth: 0,
                    }}
                >
                    <Box>
                        {/* Title and classification */}
                        <Stack
                            direction={{
                                xs: "column",
                                md: "row",
                            }}
                            spacing={1}
                            sx={{ justifyContent: "space-between", alignItems: {
                                xs: "flex-start",
                                md: "center",
                            }, mb: 1 }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#64748B",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formattedDate
                                        ? `${t(
                                              "properties.profileCard.publishedOn",
                                              "Published on"
                                          )} ${formattedDate}`
                                        : accommodationType}
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        mt: 0.5,
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {name ||
                                        t(
                                            "profileEstablishment.unnamed",
                                            "Unnamed establishment"
                                        )}
                                </Typography>
                            </Box>

                            {officialClassification && (
                                <Chip
                                    label={officialClassification}
                                    size="medium"
                                    sx={{
                                        height: 35,
                                        px: 0.5,
                                        bgcolor: "#fef3c7",
                                        color: "#92400e",
                                        fontWeight: 700,
                                        borderRadius: "16px",
                                    }}
                                />
                            )}
                        </Stack>

                        {/* Location */}
                        {locationText && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ alignItems: "center",
                                    color: "#64748B",
                                    mb: 2,
                                }}
                            >
                                <LocationOn
                                    sx={{
                                        fontSize: 16,
                                        color: "#2563EB",
                                    }}
                                />

                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    {locationText}
                                </Typography>
                            </Stack>
                        )}

                        {/* Establishment details */}
                        <Stack
                            direction="row"
                            spacing={3}
                            sx={{
                                color: "#475569",
                                mb: 2,
                                typography: "body2",
                                fontWeight: 600,
                                flexWrap: "wrap",
                                rowGap: 1,
                            }}
                        >
                            {numberOfRooms != null && (
                                <Stack
                                    direction="row"
                                    spacing={0.7} sx={{ alignItems: "center" }}
                                >
                                    <MeetingRoom
                                        sx={{ fontSize: 18 }}
                                    />
                                    <Box>
                                        {numberOfRooms}{" "}
                                        {t(
                                            "profileEstablishment.rooms",
                                            "rooms"
                                        )}
                                    </Box>
                                </Stack>
                            )}
                        </Stack>
                    </Box>

                    {/* Price and actions */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                            pt: 2,
                            mt: "auto",
                            borderTop: "1px solid #f1f5f9",
                            width: "100%",
                            flexWrap: "wrap",
                        }}
                    >
                        <Box>
                            {formattedPrice !== null ? (
                                <>
                                    <Typography
                                        variant="h6" sx={{ fontWeight: 800, color: "#2563EB" }}
                                    >
                                        {formattedPrice} MAD
                                    </Typography>

                                    <Typography
                                        variant="caption" sx={{ color: "text.secondary" }}
                                    >
                                        {t(
                                            "profileEstablishment.startingPrice",
                                            "Starting price / night"
                                        )}
                                    </Typography>
                                </>
                            ) : (
                                <Typography
                                    variant="body2" sx={{ color: "text.secondary" }}
                                >
                                    {t(
                                        "profileEstablishment.contactForPrices",
                                        "Contact for prices"
                                    )}
                                </Typography>
                            )}
                        </Box>

                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                ml: "auto",
                                flexShrink: 0,
                            }}
                        >
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={handleViewDetails}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "#E2E8F0",
                                    color: "#334155",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {t(
                                    "properties.profileCard.viewDetails",
                                    "View details"
                                )}
                            </Button>

                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Delete />}
                                onClick={() =>
                                    setOpenDeleteModal(true)
                                }
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {t(
                                    "properties.profileCard.delete",
                                    "Delete"
                                )}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Card>

            {/* Delete confirmation */}
            <Dialog
                open={openDeleteModal}
                onClose={() => setOpenDeleteModal(false)}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {t(
                        "profileEstablishment.confirmDeleteTitle",
                        "Delete establishment?"
                    )}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        {t(
                            "profileEstablishment.confirmDeleteMessage",
                            {
                                name,
                                defaultValue:
                                    "Are you sure you want to delete this establishment? This action cannot be undone.",
                            }
                        )}
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() =>
                            setOpenDeleteModal(false)
                        }
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#64748B",
                        }}
                    >
                        {t(
                            "properties.profileCard.cancel",
                            "Cancel"
                        )}
                    </Button>

                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                        }}
                    >
                        {t(
                            "properties.profileCard.confirmDelete",
                            "Delete"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
