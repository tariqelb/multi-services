
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

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
    Menu,
    MenuItem,
    CircularProgress,
} from "@mui/material";

import {
    LocationOn,
    Visibility,
    Delete,
    Edit,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import getImageUrl from "../utils/getImageUrl";

export const updatePropertyStatus = async (id, status) => {
    const response = await axiosInstance.patch(
        `/property/editstatus/${id}`,
        { status }
    );

    return response.data;
};

const STATUS_OPTIONS = [
    "Available",
    "Rented",
    "Sold",
    "Inactive",
];

function getStatusStyles(status) {
    const normalizedStatus = String(status || "Available").toLowerCase();

    switch (normalizedStatus) {
        case "available":
        case "active":
            return {
                bgcolor: "#dcfce7",
                color: "#15803d",
            };

        case "pending":
            return {
                bgcolor: "#fef9c3",
                color: "#a16207",
            };

        case "sold":
        case "rented":
        case "unavailable":
            return {
                bgcolor: "#fee2e2",
                color: "#b91c1c",
            };

        case "inactive":
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
            };

        default:
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
            };
    }
}

export default function UserProfileCard({
    property = {},
    onViewDetails,
    onDelete,
    onStatusChange,
}) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [anchorElStatus, setAnchorElStatus] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const {
        title = t("properties.profileCard.defaultTitle"),
        price = 0,
        images = [],
        listingType = "For Sale",
        propertyType = "Apartment",
        city = "",
        neighborhood = "",
        surface = "",
        rooms = "",
        bathrooms = "",
        status: initialStatus = "Available",
        createdAt,
    } = property;

    const [currentStatus, setCurrentStatus] = useState(initialStatus);

    const imagePath = images?.[0]?.path;

    const fullImageUrl = imagePath
        ? getImageUrl(imagePath)
        : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500";

    const locationText = [neighborhood, city]
        .filter(Boolean)
        .join(", ");

    const formattedPrice = Number(price || 0).toLocaleString(
        i18n.language === "ar" ? "ar-MA" : i18n.language === "fr" ? "fr-FR" : "en-US"
    );

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString(
            i18n.language === "ar"
                ? "ar-MA"
                : i18n.language === "fr"
                    ? "fr-FR"
                    : "en-GB"
        )
        : "";

    const statusInfo = getStatusStyles(currentStatus);

    const getStatusLabel = (status) => {
        const normalizedStatus = String(status || "Available").toLowerCase();

        const statusKeys = {
            available: "available",
            active: "available",
            pending: "pending",
            rented: "rented",
            sold: "sold",
            inactive: "inactive",
            unavailable: "unavailable",
        };

        const key = statusKeys[normalizedStatus];

        return key
            ? t(`properties.profileCard.status.${key}`)
            : status;
    };

    const getListingTypeLabel = (type) => {
        if (type === "For Sale") {
            return t("properties.card.forSale");
        }

        if (type === "For Rent") {
            return t("properties.card.forRent");
        }

        return type;
    };

    const getPropertyTypeLabel = (type) => {
        if (!type) return "";

        const categoryKey = {
            "commercial space": "commercialSpace",
            "commercial store": "commercialStore",
        }[type.toLowerCase()] ||
            type
                .toLowerCase()
                .replace(/[^a-z0-9]+(.)/g, (_, char) =>
                    char.toUpperCase()
                );

        return t(`properties.categories.${categoryKey}`, {
            defaultValue: type,
        });
    };

    const handleDeleteConfirm = () => {
        onDelete?.(property._id || property.id);
        setOpenDeleteModal(false);
    };

    const handleOpenStatusMenu = (event) => {
        setAnchorElStatus(event.currentTarget);
    };

    const handleCloseStatusMenu = () => {
        setAnchorElStatus(null);
    };

    const handleSelectStatus = async (newStatus) => {
        if (newStatus === currentStatus) {
            handleCloseStatusMenu();
            return;
        }

        const propertyId = property._id || property.id;
        handleCloseStatusMenu();

        try {
            setUpdatingStatus(true);

            await updatePropertyStatus(propertyId, newStatus);

            setCurrentStatus(newStatus);
            onStatusChange?.(propertyId, newStatus);
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (
        <>
            <Card
                variant="outlined"
                sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
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
                {/* Image Thumbnail */}
                <Box
                    sx={{
                        width: { xs: "100%", sm: 300 },
                        height: { xs: 200, sm: 260 },
                        flex: { xs: "0 0 200px", sm: "0 0 300px" },
                        minWidth: 0,
                        position: "relative",
                        overflow: "hidden",
                        bgcolor: "#e2e8f0",
                    }}
                >
                    <CardMedia
                        component="img"
                        image={fullImageUrl}
                        alt={title}
                        sx={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                        }}
                    />
                </Box>

                {/* Content Section */}
                <Box
                    sx={{
                        p: 2.5,
                        pt: { xs: 2.5, sm: 3 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        flexGrow: 1,
                        minWidth: 0,
                    }}
                >
                    <Box>
                        {/* Title and Price */}
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={2}
                            sx={{ mb: 1 }}
                        >
                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#5B6577",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formattedDate &&
                                        `${t("properties.profileCard.publishedOn")} ${formattedDate}`}{" "}
                                    • {getPropertyTypeLabel(propertyType)}
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        mt: 0.5,
                                    }}
                                >
                                    {title}
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: "#2563EB",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {formattedPrice} MAD
                                </Typography>
                            </Box>

                            {/* Listing Type */}
                            <Chip
                                label={getListingTypeLabel(listingType)}
                                size="medium"
                                sx={{
                                    height: 35,
                                    px: 0.5,
                                    py: 0.2,
                                    bgcolor:
                                        listingType === "For Rent"
                                            ? "#0284c7"
                                            : "#2563EB",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "0.925rem",
                                    borderRadius: "16px",
                                }}
                            />

                            {/* Listing Status */}
                            <Chip
                                label={getStatusLabel(currentStatus)}
                                size="medium"
                                sx={{
                                    height: 35,
                                    px: 0.5,
                                    py: 0.2,
                                    bgcolor: statusInfo.bgcolor,
                                    color: statusInfo.color,
                                    fontWeight: 700,
                                    fontSize: "0.925rem",
                                    textTransform: "capitalize",
                                    borderRadius: "16px",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                }}
                            />
                        </Stack>

                        {/* Location */}
                        {locationText && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{
                                    color: "#5B6577",
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

                        {/* Property Details */}
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
                            {surface !== "" && surface != null && (
                                <Box>
                                    {t("properties.card.surface")}:{" "}
                                    <strong>{surface} m²</strong>
                                </Box>
                            )}

                            {rooms !== "" && rooms != null && (
                                <Box>
                                    {t("properties.card.rooms")}:{" "}
                                    <strong>{rooms}</strong>
                                </Box>
                            )}

                            {bathrooms !== "" && bathrooms != null && (
                                <Box>
                                    {t("properties.card.bathrooms")}:{" "}
                                    <strong>{bathrooms}</strong>
                                </Box>
                            )}
                        </Stack>
                    </Box>

                    {/* Actions Toolbar */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            pt: 2,
                            borderTop: "1px solid #f1f5f9",
                            mt: "auto",
                            width: "100%",
                            overflowX: "auto",
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={{ xs: 0.75, sm: 1.5 }}
                            justifyContent="flex-end"
                            alignItems="center"
                            sx={{
                                flexWrap: "nowrap",
                                width: "100%",
                                minWidth: 0,
                            }}
                        >
                            {/* Edit Status */}
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={updatingStatus}
                                startIcon={
                                    updatingStatus ? (
                                        <CircularProgress size={14} />
                                    ) : (
                                        <Edit />
                                    )
                                }
                                onClick={handleOpenStatusMenu}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "#D5DCE8",
                                    color: "#0f172a",
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    px: { xs: 0.8, sm: 1.5 },
                                    fontSize: { xs: "0.68rem", sm: "0.875rem" },
                                    "& .MuiButton-startIcon": {
                                        mr: { xs: 0.5, sm: 1 },
                                        ml: 0,
                                        "& > *:nth-of-type(1)": {
                                            fontSize: { xs: 15, sm: 20 },
                                        },
                                    },
                                }}
                            >
                                {updatingStatus
                                    ? t("properties.profileCard.updating")
                                    : t("properties.profileCard.editStatus")}
                            </Button>

                            {/* Status Selection Menu */}
                            <Menu
                                anchorEl={anchorElStatus}
                                open={Boolean(anchorElStatus)}
                                onClose={handleCloseStatusMenu}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "left",
                                }}
                                transformOrigin={{
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <MenuItem
                                        key={opt}
                                        selected={opt === currentStatus}
                                        onClick={() => handleSelectStatus(opt)}
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: "0.875rem",
                                        }}
                                    >
                                        {getStatusLabel(opt)}
                                    </MenuItem>
                                ))}
                            </Menu>

                            {/* View Details */}
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => {
                                    const propertyId =
                                        property._id || property.id;

                                    if (!propertyId) {
                                        console.error(
                                            "Property ID is missing:",
                                            property
                                        );
                                        return;
                                    }

                                    if (onViewDetails) {
                                        onViewDetails(property);
                                    } else {
                                        navigate(`/property/${propertyId}`, {
                                            state: { property },
                                        });
                                    }
                                }}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "#D5DCE8",
                                    color: "#334155",
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    px: { xs: 0.8, sm: 1.5 },
                                    fontSize: { xs: "0.68rem", sm: "0.875rem" },
                                    "& .MuiButton-startIcon": {
                                        mr: { xs: 0.5, sm: 1 },
                                        ml: 0,
                                        "& > *:nth-of-type(1)": {
                                            fontSize: { xs: 15, sm: 20 },
                                        },
                                    },
                                }}
                            >
                                {t("properties.profileCard.viewDetails")}
                            </Button>

                            {/* Delete */}
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Delete />}
                                onClick={() => setOpenDeleteModal(true)}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    px: { xs: 0.8, sm: 1.5 },
                                    fontSize: { xs: "0.68rem", sm: "0.875rem" },
                                    "& .MuiButton-startIcon": {
                                        mr: { xs: 0.5, sm: 1 },
                                        ml: 0,
                                        "& > *:nth-of-type(1)": {
                                            fontSize: { xs: 15, sm: 20 },
                                        },
                                    },
                                }}
                            >
                                {t("properties.profileCard.delete")}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog
                open={openDeleteModal}
                onClose={() => setOpenDeleteModal(false)}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {t("properties.profileCard.confirmDeleteTitle")}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        {t("properties.profileCard.confirmDeleteMessage", {
                            title,
                        })}
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setOpenDeleteModal(false)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#5B6577",
                        }}
                    >
                        {t("properties.profileCard.cancel")}
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
                        {t("properties.profileCard.confirmDelete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
