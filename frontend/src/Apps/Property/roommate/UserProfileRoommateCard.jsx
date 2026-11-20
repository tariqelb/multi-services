import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Card,
    CardMedia,
    Box,
    Stack,
    Typography,
    Chip,
    Button,
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
    People,
    Bed,
} from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";

const ROOMMATE_STATUS_OPTIONS = [
    "Open",
    "Full",
    "Inactive",
    "Completed",
];

function getRoommateStatusStyles(status) {
    const normalizedStatus = String(status || "Open").toLowerCase();

    switch (normalizedStatus) {
        case "open":
        case "active":
            return {
                bgcolor: "#dcfce7",
                color: "#15803d",
            };

        case "full":
        case "pending":
            return {
                bgcolor: "#fef9c3",
                color: "#a16207",
            };

        case "completed":
        case "sold":
        case "rented":
            return {
                bgcolor: "#e0f2fe",
                color: "#0369a1",
            };

        case "inactive":
        case "unavailable":
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

export default function UserProfileRoommateCard({
    roommate = {},
    onViewDetails,
    onDelete,
    onStatusChange,
}) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [anchorElStatus, setAnchorElStatus] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const roommateId = roommate._id || roommate.id;
    const initialStatus = roommate.status || "Open";
    const [currentStatus, setCurrentStatus] = useState(initialStatus);

    useEffect(() => {
        setCurrentStatus(roommate.status || "Open");
    }, [roommate.status]);

    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const imageUrl = useMemo(() => {
        const image = roommate.images?.[0];

        if (!image) return FALLBACK_IMAGE;

        const imagePath =
            typeof image === "string"
                ? image
                : image.url || image.path || image.filename;

        if (!imagePath) return FALLBACK_IMAGE;

        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://") ||
            imagePath.startsWith("data:")
        ) {
            return imagePath;
        }

        const baseURL = axiosInstance.defaults.baseURL || "";
        const serverURL = baseURL.replace(/\/api\/?$/, "");

        return `${serverURL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
    }, [roommate.images]);

    const formattedDate = roommate.createdAt
        ? new Date(roommate.createdAt).toLocaleDateString(
              i18n.language === "ar"
                  ? "ar-MA"
                  : i18n.language === "fr"
                  ? "fr-FR"
                  : "en-GB"
          )
        : "";

    const availablePlaces =
        roommate.availablePlaces ??
        Math.max(
            0,
            Number(roommate.totalPeople || 0) -
                Number(roommate.currentPeople || 0)
        );

    const rent =
        roommate.rentPerPerson ??
        roommate.individualRoomPrice ??
        roommate.totalRent ??
        0;

    const formattedRent = Number(rent).toLocaleString(
        i18n.language === "ar" ? "ar-MA" : i18n.language === "fr" ? "fr-FR" : "en-US"
    );

    const locationText = [roommate.neighborhood, roommate.city]
        .filter(Boolean)
        .join(", ");

    const statusInfo = getRoommateStatusStyles(currentStatus);

    const getStatusLabel = (status) => {
        const normalizedStatus = String(status || "Open").toLowerCase();
        const statusKeys = {
            open: "open",
            active: "open",
            full: "full",
            inactive: "inactive",
            completed: "completed",
        };
        const key = statusKeys[normalizedStatus];
        return key ? t(`profileRoommate.status.${key}`, { defaultValue: status }) : status;
    };

    const handleDeleteConfirm = () => {
        if (!roommateId) return;
        onDelete?.(roommateId);
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

        handleCloseStatusMenu();

        try {
            setUpdatingStatus(true);
            const success = await onStatusChange?.(roommateId, newStatus);
            // If parent returns true or doesn't return explicit boolean failure, update local state
            if (success !== false) {
                setCurrentStatus(newStatus);
            }
        } catch (error) {
            console.error("Failed to update roommate status:", error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleViewDetailsAction = () => {
        if (onViewDetails) {
            onViewDetails(roommate);
            return;
        }

        if (roommateId) {
            navigate(`/roommates/profile/${roommateId}`, {
                state: { listing: roommate },
            });
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
                        image={imageUrl}
                        alt={roommate.title || "Roommate announcement"}
                        onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                        }}
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
                        {/* Title and Badges / Prices */}
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
                        >
                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#64748B",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formattedDate &&
                                        `${translate("profileRoommate.published", "Published on")} ${formattedDate}`}
                                    {roommate.purpose ? ` • ${roommate.purpose}` : ""}
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
                                    {roommate.title ||
                                        translate("profileRoommate.untitled", "Untitled listing")}
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: "#2563EB",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {formattedRent} MAD
                                    <Typography
                                        component="span"
                                        variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}
                                    >
                                        {roommate.rentalPeriod ? ` / ${roommate.rentalPeriod}` : ""}
                                    </Typography>
                                </Typography>
                            </Box>

                            {/* Status Chip */}
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

                        {/* Roommate / People Details */}
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
                            <Stack direction="row" spacing={0.6} sx={{ alignItems: "center" }}>
                                <People fontSize="small" sx={{ color: "#2563EB" }} />
                                <Box>
                                    {translate("profileRoommate.people", "People")}:{" "}
                                    <strong>
                                        {roommate.currentPeople ?? 0}/{roommate.totalPeople ?? 0}
                                    </strong>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={0.6} sx={{ alignItems: "center" }}>
                                <Bed fontSize="small" sx={{ color: "#2563EB" }} />
                                <Box>
                                    {translate("profileRoommate.placesAvailable", "Available")}:{" "}
                                    <strong>{availablePlaces}</strong>
                                </Box>
                            </Stack>
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
                            sx={{ justifyContent: "flex-end", alignItems: "center",
                                flexWrap: "nowrap",
                                width: "100%",
                                minWidth: 0,
                            }}
                        >
                            {/* Edit Status Button */}
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
                                    borderColor: "#E2E8F0",
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
                                    ? translate("profileRoommate.updating", "Updating...")
                                    : translate("profileRoommate.editStatus", "Edit Status")}
                            </Button>

                            {/* Status Menu */}
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
                                {ROOMMATE_STATUS_OPTIONS.map((opt) => (
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

                            {/* View Details Button */}
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={handleViewDetailsAction}
                                disabled={!roommateId}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "#E2E8F0",
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
                                {translate("profileRoommate.viewDetails", "View Details")}
                            </Button>

                            {/* Delete Button */}
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Delete />}
                                onClick={() => setOpenDeleteModal(true)}
                                disabled={!roommateId}
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
                                {translate("profileRoommate.delete", "Delete")}
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
                    {translate("profileRoommate.deleteTitle", "Delete announcement?")}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        {translate(
                            "profileRoommate.deleteConfirmation",
                            `Are you sure you want to delete "${roommate.title || "this listing"}"? This action cannot be undone.`
                        )}
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setOpenDeleteModal(false)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#64748B",
                        }}
                    >
                        {translate("common.cancel", "Cancel")}
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
                        {translate("profileRoommate.confirmDelete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}