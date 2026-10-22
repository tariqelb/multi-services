import React from "react";
import {
    Box,
    Typography,
    Card,
    CardMedia,
    Chip,
    Stack,
    Divider,
} from "@mui/material";

import getImageUrl from "../utils/getImageUrl";

export default function PropertyCard({ property = {}, onClick }) {
    const {
        title = "Modern Property",
        price = "0 MAD",
        image = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500",
        listingType = "For Sale",
        status = "Available",
        propertyType = "Apartment",
        referenceCode = "#48",
        city = "Casablanca",
        neighborhood = "",
        surface = "",
        rooms = "",
        salons = "",
        bathrooms = "",
        createdDate = "15/10/2026",
    } = property;

    const locationText = neighborhood
        ? `${city} — ${neighborhood}`
        : city;

    const formattedPrice =
        typeof price === "number" ? `${price} MAD` : price;

    const statusColors = {
        Available: {
            bgcolor: "#10b981",
            color: "#ffffff",
        },
        Rented: {
            bgcolor: "#ffedd5",
            color: "#9a3412",
        },
        Sold: {
            bgcolor: "#fee2e2",
            color: "#991b1b",
        },
        Inactive: {
            bgcolor: "#e5e7eb",
            color: "#374151",
        },
    };

    const currentStatusColor =
        statusColors[status] || statusColors.Available;

    // Convert old localhost image URLs to relative URLs.
    const imageUrl = getImageUrl(image);

    const fallbackImage =
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500";

    return (
        <Card
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onClick?.();
                }
            }}
            role="button"
            tabIndex={0}
            sx={{
                width: "100%",
                maxWidth: 440,
                height: 540,
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#ffffff",
                cursor: "pointer",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                },
                "&:focus-visible": {
                    outline: "2px solid #2563eb",
                    outlineOffset: "3px",
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2.5,
                    py: 1.5,
                    flexShrink: 0,
                    bgcolor: "#f8fafc",
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ minWidth: 0 }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 600,
                            color: "#6b7280",
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap",
                        }}
                    >
                        📅 {createdDate}
                    </Typography>

                    {referenceCode && (
                        <Chip
                            label={`REF ${referenceCode}`}
                            size="small"
                            sx={{
                                bgcolor: "#e2e8f0",
                                color: "#334155",
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                height: 22,
                            }}
                        />
                    )}
                </Stack>

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.7}
                    sx={{ flexShrink: 0 }}
                >
                    <Chip
                        label={listingType}
                        size="small"
                        sx={{
                            bgcolor:
                                listingType === "For Rent"
                                    ? "#0284c7"
                                    : "#10b981",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            height: 24,
                            borderRadius: "6px",
                        }}
                    />

                    <Chip
                        label={status}
                        size="small"
                        sx={{
                            ...currentStatusColor,
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            height: 24,
                            borderRadius: "6px",
                        }}
                    />
                </Stack>
            </Box>

            {/* Image */}
            <Box
                sx={{
                    position: "relative",
                    width: "100%",
                    height: 210,
                    flexShrink: 0,
                    overflow: "hidden",
                    bgcolor: "#f1f5f9",
                }}
            >
                <CardMedia
                    component="img"
                    image={imageUrl || fallbackImage}
                    alt={title}
                    onError={(event) => {
                        if (event.currentTarget.src !== fallbackImage) {
                            event.currentTarget.src = fallbackImage;
                        }
                    }}
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />

                {propertyType && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            bgcolor: "rgba(255,255,255,0.95)",
                            color: "#1f2937",
                            px: 1.2,
                            py: 0.4,
                            borderRadius: "6px",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                        }}
                    >
                        🏷️ {propertyType}
                    </Box>
                )}
            </Box>

            {/* Body */}
            <Box
                sx={{
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    justifyContent: "space-between",
                    minHeight: 0,
                }}
            >
                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            color: "#111827",
                            mb: 1,
                            lineHeight: 1.3,
                            fontSize: "1.1rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {title}
                    </Typography>

                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.8}
                        sx={{ color: "#4b5563", mb: 2, minWidth: 0 }}
                    >
                        <Typography
                            component="span"
                            sx={{ fontSize: "0.95rem" }}
                        >
                            📍
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: "0.88rem",
                                fontWeight: 600,
                                color: "#4b5563",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {locationText}
                        </Typography>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {/* Property information */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.2,
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <Typography
                                component="span"
                                sx={{ color: "#6b7280", fontWeight: 600 }}
                            >
                                Price:
                            </Typography>

                            <Typography
                                component="span"
                                sx={{
                                    color: "#2563eb",
                                    fontWeight: 800,
                                    fontSize: "0.95rem",
                                    textAlign: "right",
                                }}
                            >
                                {formattedPrice}
                            </Typography>
                        </Box>

                        {surface !== "" && surface != null && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#6b7280",
                                        fontWeight: 600,
                                    }}
                                >
                                    Surface:
                                </Typography>

                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#1f2937",
                                        fontWeight: 700,
                                    }}
                                >
                                    {surface} m²
                                </Typography>
                            </Box>
                        )}

                        {rooms !== "" && rooms != null && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#6b7280",
                                        fontWeight: 600,
                                    }}
                                >
                                    Rooms:
                                </Typography>

                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#1f2937",
                                        fontWeight: 700,
                                    }}
                                >
                                    {rooms}
                                </Typography>
                            </Box>
                        )}

                        {salons !== "" && salons != null && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#6b7280",
                                        fontWeight: 600,
                                    }}
                                >
                                    Salons:
                                </Typography>

                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#1f2937",
                                        fontWeight: 700,
                                    }}
                                >
                                    {salons}
                                </Typography>
                            </Box>
                        )}

                        {bathrooms !== "" && bathrooms != null && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#6b7280",
                                        fontWeight: 600,
                                    }}
                                >
                                    Bathrooms:
                                </Typography>

                                <Typography
                                    component="span"
                                    sx={{
                                        color: "#1f2937",
                                        fontWeight: 700,
                                    }}
                                >
                                    {bathrooms}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Card>
    );
}