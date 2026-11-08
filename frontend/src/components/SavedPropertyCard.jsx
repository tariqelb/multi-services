
import React from "react";
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
    CircularProgress,
} from "@mui/material";

import {
    LocationOn,
    Visibility,
    BookmarkRemove,
} from "@mui/icons-material";

import getImageUrl from "../utils/getImageUrl";

function getStatusStyles(status) {
    const normalizedStatus = String(status || "Available").toLowerCase();

    const styles = {
        available: { bgcolor: "#dcfce7", color: "#15803d" },
        active: { bgcolor: "#dcfce7", color: "#15803d" },
        pending: { bgcolor: "#fef9c3", color: "#a16207" },
        sold: { bgcolor: "#fee2e2", color: "#b91c1c" },
        rented: { bgcolor: "#fee2e2", color: "#b91c1c" },
        unavailable: { bgcolor: "#fee2e2", color: "#b91c1c" },
        inactive: { bgcolor: "#f1f5f9", color: "#475569" },
    };

    return styles[normalizedStatus] || {
        bgcolor: "#f1f5f9",
        color: "#475569",
    };
}

export default function SavedPropertyCard({
    property = {},
    onViewDetails,
    onRemove,
    removing = false,
}) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const {
        _id,
        id,
        title = t("properties.savedCard.defaultTitle"),
        price = 0,
        images = [],
        listingType = "For Sale",
        propertyType = "Apartment",
        city = "",
        neighborhood = "",
        surface = "",
        rooms = "",
        bathrooms = "",
        createdAt,
        status = "Available",
    } = property;

    const imagePath = images?.[0]?.path || images?.[0];

    const fullImageUrl =
        getImageUrl(imagePath) ||
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500";

    const locationText = [neighborhood, city]
        .filter(Boolean)
        .join(", ");

    const locale =
        i18n.language === "ar"
            ? "ar-MA"
            : i18n.language === "fr"
                ? "fr-FR"
                : "en-US";

    const formattedPrice = Number(price || 0).toLocaleString(locale);

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString(
            i18n.language === "ar"
                ? "ar-MA"
                : i18n.language === "fr"
                    ? "fr-FR"
                    : "en-GB"
        )
        : "";

    const statusInfo = getStatusStyles(status);

    const getStatusLabel = (value) => {
        const normalizedStatus = String(value || "Available").toLowerCase();

        const statusKeys = {
            available: "available",
            active: "available",
            pending: "pending",
            sold: "sold",
            rented: "rented",
            inactive: "inactive",
            unavailable: "unavailable",
        };

        const key = statusKeys[normalizedStatus];

        return key
            ? t(`properties.profileCard.status.${key}`)
            : value;
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

    return (
        <Card
            variant="outlined"
            sx={{
                position: "relative",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                height: { xs: "auto", sm: 280 },
                minHeight: { xs: 280, sm: 280 },
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
                    height: { xs: 180, sm: 280 },
                    flexShrink: 0,
                    position: "relative",
                    bgcolor: "#e2e8f0",
                    overflow: "hidden",
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
                    {/* Title, Price and Chips */}
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={1.5}
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
                                    `${t("properties.savedCard.publishedOn")} ${formattedDate}`}{" "}
                                • {getPropertyTypeLabel(propertyType)}
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

                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                        >
                            <Chip
                                label={getListingTypeLabel(listingType)}
                                size="medium"
                                sx={{
                                    height: 35,
                                    px: 0.5,
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

                            <Chip
                                label={getStatusLabel(status)}
                                size="medium"
                                sx={{
                                    height: 35,
                                    px: 0.5,
                                    ...statusInfo,
                                    fontWeight: 700,
                                    fontSize: "0.925rem",
                                    textTransform: "capitalize",
                                    borderRadius: "16px",
                                    boxShadow:
                                        "0 2px 6px rgba(0,0,0,0.06)",
                                }}
                            />
                        </Stack>
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
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => {
                                const propertyId = property._id || property.id;

                                if (!propertyId) {
                                    console.error("Property ID is missing:", property);
                                    return;
                                }

                                if (onViewDetails) {
                                    onViewDetails(property);
                                } else {
                                    navigate(`/properties/${propertyId}`, {
                                        state: {
                                            property,
                                            from: "/saved",
                                        },
                                    });
                                }
                            }}
                        >
                            {t("properties.savedCard.viewDetails")}
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            disabled={removing}
                            startIcon={
                                removing ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <BookmarkRemove />
                                )
                            }
                            onClick={() => onRemove?.(property)}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {removing
                                ? t("properties.savedCard.removing")
                                : t("properties.savedCard.removeSaved")}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Card>
    );
}
