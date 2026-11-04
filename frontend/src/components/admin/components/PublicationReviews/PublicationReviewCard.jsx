
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
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material";

import {
    LocationOn,
    Visibility,
    Person,
    CalendarToday,
    Delete,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import getImageUrl from "../../../../utils/getImageUrl";

function getStatusStyles(status) {
    const normalized = String(status || "Available").toLowerCase();

    switch (normalized) {
        case "available":
        case "active":
            return { bgcolor: "#dcfce7", color: "#15803d" };

        case "sold":
        case "rented":
            return { bgcolor: "#fee2e2", color: "#b91c1c" };

        case "inactive":
            return { bgcolor: "#f1f5f9", color: "#475569" };

        default:
            return { bgcolor: "#fef9c3", color: "#a16207" };
    }
}

export default function PublicationReviewCard({
    property = {},
    onDeleted,
}) {
    const navigate = useNavigate();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const {
        title = "Untitled property",
        price = 0,
        images = [],
        listingType = "For Sale",
        propertyType = "Apartment",
        city = "",
        neighborhood = "",
        surface,
        rooms,
        bathrooms,
        status = "Available",
        createdAt,
    } = property;

    const propertyId = property._id || property.id;

    // The backend should populate userId with publisher details.
    const owner =
        property.userId && typeof property.userId === "object"
            ? property.userId
            : property.owner || {};

    const ownerName =
        [owner.firstName, owner.lastName].filter(Boolean).join(" ") ||
        owner.name ||
        "Unknown user";

    const ownerEmail = owner.email || "No email available";

    const imagePath = images?.[0]?.path || images?.[0];

    const imageUrl = imagePath
        ? getImageUrl(imagePath)
        : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=700";

    const location = [neighborhood, city].filter(Boolean).join(", ");

    const formattedPrice = Number(price || 0).toLocaleString();

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "Date unavailable";

    const statusStyle = getStatusStyles(status);

    const showNotification = (message, severity = "success") => {
        setNotification({
            open: true,
            message,
            severity,
        });
    };

    const handleViewDetails = () => {
        if (!propertyId) {
            console.error("Property ID is missing:", property);
            return;
        }

        navigate(`/property/${propertyId}`, {
            state: { property },
        });
    };

    const handleDeletePublication = async () => {
        if (!propertyId) {
            showNotification("Property ID is missing.", "error");
            return;
        }

        try {
            setDeleting(true);

            await axiosInstance.delete(
                `/property/deleteProperty/${propertyId}`
            );

            setDeleteDialogOpen(false);
            setDeleted(true);

            showNotification(
                "Publication deleted successfully.",
                "success"
            );

            onDeleted?.(propertyId);
        } catch (error) {
            console.error(
                "Failed to delete publication:",
                error.response?.data || error
            );

            showNotification(
                error.response?.data?.message ||
                    "Failed to delete publication.",
                "error"
            );
        } finally {
            setDeleting(false);
        }
    };

    if (deleted) {
        return null;
    }

    return (
        <>
            <Card
                variant="outlined"
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    borderRadius: "16px",
                    borderColor: "#e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    bgcolor: "#ffffff",
                    transition: "box-shadow 0.2s ease",
                    "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    },
                }}
            >
                {/* Property image */}
                <Box
                    sx={{
                        width: { xs: "100%", sm: 260 },
                        height: { xs: 190, sm: 240 },
                        flex: { xs: "0 0 190px", sm: "0 0 260px" },
                        minWidth: 0,
                        overflow: "hidden",
                        bgcolor: "#e2e8f0",
                    }}
                >
                    <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={title}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </Box>

                {/* Property information */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        p: { xs: 2, sm: 2.5 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box>
                        {/* Publication date and status */}
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={1}
                            sx={{ mb: 1 }}
                        >
                            <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                            >
                                <CalendarToday
                                    sx={{
                                        fontSize: 15,
                                        color: "#64748b",
                                    }}
                                />

                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#64748b",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formattedDate}
                                </Typography>
                            </Stack>

                            <Chip
                                label={status}
                                size="small"
                                sx={{
                                    ...statusStyle,
                                    fontWeight: 700,
                                    borderRadius: "7px",
                                }}
                            />
                        </Stack>

                        {/* Title and price */}
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                color: "#0f172a",
                                overflowWrap: "anywhere",
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

                        {/* Listing information */}
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            sx={{ mt: 1, mb: 1.5 }}
                        >
                            <Chip
                                label={listingType}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />

                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#64748b",
                                    fontWeight: 600,
                                }}
                            >
                                {propertyType}
                            </Typography>
                        </Stack>

                        {/* Location */}
                        {location && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{
                                    mb: 1.5,
                                    color: "#64748b",
                                }}
                            >
                                <LocationOn
                                    sx={{
                                        fontSize: 17,
                                        color: "#2563EB",
                                    }}
                                />

                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                >
                                    {location}
                                </Typography>
                            </Stack>
                        )}

                        {/* Property details */}
                        <Stack
                            direction="row"
                            spacing={2}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{
                                color: "#475569",
                                typography: "body2",
                                fontWeight: 600,
                                rowGap: 0.75,
                            }}
                        >
                            {surface !== "" && surface != null && (
                                <Box>Surface: {surface} m²</Box>
                            )}

                            {rooms !== "" && rooms != null && (
                                <Box>Rooms: {rooms}</Box>
                            )}

                            {bathrooms !== "" && bathrooms != null && (
                                <Box>Bathrooms: {bathrooms}</Box>
                            )}
                        </Stack>
                    </Box>

                    {/* Publisher and actions */}
                    <Box
                        sx={{
                            pt: 1.5,
                            borderTop: "1px solid #f1f5f9",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: {
                                xs: "flex-start",
                                sm: "center",
                            },
                            flexDirection: {
                                xs: "column",
                                sm: "row",
                            },
                            gap: 1.5,
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            minWidth={0}
                        >
                            <Person
                                sx={{
                                    color: "#2563EB",
                                    fontSize: 19,
                                }}
                            />

                            <Box minWidth={0}>
                                <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    color="#334155"
                                    noWrap
                                >
                                    {ownerName}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="#64748b"
                                    noWrap
                                >
                                    {ownerEmail}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                        >
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={handleViewDetails}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                }}
                            >
                                View Details
                            </Button>

                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Delete />}
                                onClick={() =>
                                    setDeleteDialogOpen(true)
                                }
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                }}
                            >
                                Delete
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Card>

            {/* Delete confirmation */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => {
                    if (!deleting) {
                        setDeleteDialogOpen(false);
                    }
                }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Delete publication?
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{title}"?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleting}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDeletePublication}
                        disabled={deleting}
                        startIcon={
                            deleting ? (
                                <CircularProgress
                                    size={16}
                                    color="inherit"
                                />
                            ) : (
                                // <Button
                                //     variant="outlined"
                                //     color="error"
                                //     size="small"
                                //     onClick={() => setDeleteDialogOpen(true)}
                                //     sx={{
                                //         textTransform: "none",
                                //         fontWeight: 700,
                                //         whiteSpace: "nowrap",
                                //         flexShrink: 0,
                                //     }}
                                // >
                                    
                                // </Button>
                                <Delete/>
                            )
                        }
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                        }}
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Feedback */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() =>
                    setNotification((previous) => ({
                        ...previous,
                        open: false,
                    }))
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    onClose={() =>
                        setNotification((previous) => ({
                            ...previous,
                            open: false,
                        }))
                    }
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
}
