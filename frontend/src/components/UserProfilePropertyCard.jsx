import React, { useState } from "react";
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
import { LocationOn, Visibility, Delete, Edit } from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";

const API_URL = "http://localhost:3000";

/**
 * Update property status API helper
 * @param {string} id - Property ID
 * @param {string} status - New status ("Available", "Rented", "Sold", "Inactive")
 */
export const updatePropertyStatus = async (id, status) => {
    const response = await axiosInstance.patch(`/property/editstatus/${id}`, { status });
    return response.data;
};

const STATUS_OPTIONS = ["Available", "Rented", "Sold", "Inactive"];

function getImageUrl(image) {
    const path = typeof image === "string" ? image : image?.path;

    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;

    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function getStatusStyles(status) {
    const normalizedStatus = String(status || "Available").toLowerCase();

    switch (normalizedStatus) {
        case "available":
        case "active":
            return {
                bgcolor: "#dcfce7",
                color: "#15803d",
                label: status || "Available",
            };

        case "pending":
            return {
                bgcolor: "#fef9c3",
                color: "#a16207",
                label: status || "Pending",
            };

        case "sold":
        case "rented":
        case "unavailable":
            return {
                bgcolor: "#fee2e2",
                color: "#b91c1c",
                label: status || "Unavailable",
            };

        case "inactive":
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
                label: status || "Inactive",
            };

        default:
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
                label: status || "Available",
            };
    }
}

export default function UserProfileCard({
    property = {},
    onViewDetails,
    onDelete,
    onStatusChange,
}) {
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [anchorElStatus, setAnchorElStatus] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const {
        title = "Property Title",
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

    const locationText = [neighborhood, city].filter(Boolean).join(", ");

    const formattedPrice = Number(price || 0).toLocaleString();

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString("en-GB")
        : "";

    const statusInfo = getStatusStyles(currentStatus);

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
                    borderRadius: 3,
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
                        height: { xs: 180, sm: "auto" },
                        minHeight: { sm: 260 },
                        flexShrink: 0,
                        position: "relative",
                        bgcolor: "#e2e8f0",
                    }}
                >
                    <CardMedia
                        component="img"
                        image={fullImageUrl}
                        alt={title}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
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
                                        color: "#64748b",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formattedDate &&
                                        `Published on ${formattedDate}`}{" "}
                                    • {propertyType}
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 800,
                                        color: "#0f172a",
                                        mt: 0.5,
                                    }}
                                >
                                    {title}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 900,
                                        color: "#059669",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {formattedPrice} MAD
                                </Typography>
                            </Box>

                            {/* Listing Type */}
                            <Chip
                                label={listingType}
                                size="medium"
                                sx={{
                                    height: 35,
                                    px: 0.5,
                                    py: 0.2,
                                    bgcolor:
                                        listingType === "For Rent"
                                            ? "#0284c7"
                                            : "#059669",
                                    color: "white",
                                    fontWeight: 800,
                                    fontSize: "0.925rem",
                                    borderRadius: "16px",
                                }}
                            />

                            {/* Listing Status */}
                            <Chip
                                label={statusInfo.label}
                                size="medium"
                                sx={{
                                    height: 35,
                                    px: 0.5,
                                    py: 0.2,
                                    bgcolor: statusInfo.bgcolor,
                                    color: statusInfo.color,
                                    fontWeight: 800,
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
                                    color: "#64748b",
                                    mb: 2,
                                }}
                            >
                                <LocationOn
                                    sx={{
                                        fontSize: 16,
                                        color: "#059669",
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
                                    Surface: <strong>{surface} m²</strong>
                                </Box>
                            )}

                            {rooms !== "" && rooms != null && (
                                <Box>
                                    Rooms: <strong>{rooms}</strong>
                                </Box>
                            )}

                            {bathrooms !== "" && bathrooms != null && (
                                <Box>
                                    Bathrooms: <strong>{bathrooms}</strong>
                                </Box>
                            )}
                        </Stack>
                    </Box>

                    {/* Actions Toolbar: aligned to the far right */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            pt: 2,
                            borderTop: "1px solid #f1f5f9",
                            mt: "auto",
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1.5}
                            justifyContent="flex-end"
                            alignItems="center"
                            sx={{
                                flexWrap: "wrap",
                                rowGap: 1,
                            }}
                        >
                            {/* Edit Status */}
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={updatingStatus}
                                startIcon={
                                    updatingStatus ? (
                                        <CircularProgress size={16} />
                                    ) : (
                                        <Edit />
                                    )
                                }
                                onClick={handleOpenStatusMenu}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "#cbd5e1",
                                    color: "#0f172a",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {updatingStatus ? "Updating..." : "Edit Status"}
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
                                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                                    >
                                        {opt}
                                    </MenuItem>
                                ))}
                            </Menu>

                            {/* View Details */}
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => onViewDetails?.(property)}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "#cbd5e1",
                                    color: "#334155",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                View Details
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
                                }}
                            >
                                Delete
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
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Confirm Property Deletion
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete{" "}
                        <strong>"{title}"</strong>? This action cannot be
                        undone and will permanently remove your listing.
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setOpenDeleteModal(false)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#64748b",
                        }}
                    >
                        Cancel
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
                        Yes, Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}