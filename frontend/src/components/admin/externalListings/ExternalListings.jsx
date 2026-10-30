
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Chip,
    Divider,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import BathtubOutlinedIcon from "@mui/icons-material/BathtubOutlined";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";
import axiosInstance from "../../../api/axiosInstance";

const API_URL = "/external-listings";

function getListings(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.listings)) return data.listings;
    if (Array.isArray(data?.data?.listings)) return data.data.listings;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function cleanText(value) {
    if (typeof value !== "string") return "";

    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;|&#160;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function getPropertyImage(listing) {
    const candidates = [
        ...(Array.isArray(listing.imageUrls) ? listing.imageUrls : []),
        listing.imageUrl,
    ];

    for (const candidate of candidates) {
        const value =
            typeof candidate === "string" ? candidate : candidate?.url;

        if (!value) continue;

        try {
            const url = new URL(value, listing.sourceUrl);

            if (!["https:", "http:"].includes(url.protocol)) continue;

            // Avoid displaying common generic branding images as property photos.
            const imagePath = url.pathname.toLowerCase();

            if (
                /logo|favicon|placeholder|no-image|default-image|avatar/.test(
                    imagePath
                )
            ) {
                continue;
            }

            return url.href;
        } catch {
            continue;
        }
    }

    return "";
}

function formatPrice(listing) {
    if (listing.price == null || listing.price === "") {
        return "Price on request";
    }

    const price = Number(listing.price);

    const formatted = Number.isFinite(price)
        ? price.toLocaleString(undefined, {
              maximumFractionDigits: 2,
          })
        : cleanText(String(listing.price));

    const currency = listing.currency || "MAD";

    const suffix =
        listing.priceUnit === "monthly"
            ? " / month"
            : listing.priceUnit === "per_m2"
              ? " / m²"
              : "";

    return `${formatted} ${currency}${suffix}`;
}

function getLocation(listing) {
    return [
        cleanText(listing.neighborhood),
        cleanText(listing.city),
    ]
        .filter(Boolean)
        .join(", ");
}

function getListingType(listing) {
    if (["For Sale", "For Rent"].includes(listing.listingType)) {
        return listing.listingType;
    }

    return "Property";
}

function PropertyImage({ listing }) {
    const [failed, setFailed] = useState(false);
    const image = getPropertyImage(listing);

    useEffect(() => {
        setFailed(false);
    }, [image]);

    return (
        <Box
            sx={{
                height: { xs: 210, sm: 225 },
                bgcolor: "grey.100",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {image && !failed ? (
                <Box
                    component="img"
                    src={image}
                    alt={cleanText(listing.title) || "Property"}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    sx={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "cover",
                        transition: "transform 0.3s",
                        "&:hover": {
                            transform: "scale(1.04)",
                        },
                    }}
                />
            ) : (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    sx={{
                        width: "100%",
                        height: "100%",
                        color: "text.secondary",
                    }}
                >
                    <Box
                        component="svg"
                        viewBox="0 0 64 64"
                        sx={{ width: 58, height: 58 }}
                    >
                        <path
                            d="M7 29 32 8l25 21M14 25v30h36V25M25 55V37h14v18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Box>
                    <Typography variant="body2">
                        Property image unavailable
                    </Typography>
                </Stack>
            )}

            <Chip
                label={getListingType(listing)}
                size="small"
                color={
                    listing.listingType === "For Rent"
                        ? "info"
                        : "success"
                }
                sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    fontWeight: 700,
                    boxShadow: 1,
                }}
            />
        </Box>
    );
}

function PropertyCard({ listing }) {
    const title = cleanText(listing.title) || "Property listing";
    const description = cleanText(listing.description);
    const location = getLocation(listing);
    const sourceUrl = listing.sourceUrl;

    const details = [
        listing.surface != null && listing.surface !== ""
            ? {
                  icon: <SquareFootOutlinedIcon fontSize="small" />,
                  label: `${listing.surface} m²`,
              }
            : null,
        listing.rooms != null && listing.rooms !== ""
            ? {
                  icon: <BedOutlinedIcon fontSize="small" />,
                  label: `${listing.rooms} rooms`,
              }
            : null,
        listing.bathrooms != null && listing.bathrooms !== ""
            ? {
                  icon: <BathtubOutlinedIcon fontSize="small" />,
                  label: `${listing.bathrooms} bathrooms`,
              }
            : null,
    ].filter(Boolean);

    return (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "background.paper",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                },
            }}
        >
            <PropertyImage listing={listing} />

            <CardContent
                sx={{
                    p: 2.25,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    flexGrow: 1,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontSize: "1.05rem",
                        fontWeight: 750,
                        lineHeight: 1.5,
                        minHeight: "3em",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                    }}
                    title={title}
                >
                    {title}
                </Typography>

                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 800,
                        color: "success.dark",
                        fontSize: "1.3rem",
                    }}
                >
                    {formatPrice(listing)}
                </Typography>

                <Stack direction="row" spacing={0.75} alignItems="center">
                    <LocationOnOutlinedIcon
                        fontSize="small"
                        color="action"
                    />
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            overflowWrap: "anywhere",
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                        }}
                    >
                        {location || "Location not specified"}
                    </Typography>
                </Stack>

                {details.length > 0 && (
                    <>
                        <Divider />
                        <Stack
                            direction="row"
                            gap={1.5}
                            flexWrap="wrap"
                            alignItems="center"
                        >
                            {details.map((detail) => (
                                <Stack
                                    key={detail.label}
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                    sx={{ color: "text.secondary" }}
                                >
                                    {detail.icon}
                                    <Typography variant="body2">
                                        {detail.label}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </>
                )}

                {listing.propertyType && (
                    <Box>
                        <Chip
                            size="small"
                            variant="outlined"
                            label={cleanText(listing.propertyType)}
                        />
                    </Box>
                )}

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            lineHeight: 1.7,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 4,
                            overflow: "hidden",
                            overflowWrap: "anywhere",
                        }}
                        title={description}
                    >
                        {description}
                    </Typography>
                )}

                <Box sx={{ flexGrow: 1, minHeight: 4 }} />

                <Divider />

                <Typography variant="caption" color="text.secondary">
                    Source: {listing.sourceName || "External listing"}
                </Typography>

                {sourceUrl && (
                    <Button
                        component="a"
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        fullWidth
                        endIcon={<OpenInNewIcon />}
                    >
                        View original listing
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function ExternalListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadListings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axiosInstance.get(API_URL);
            setListings(getListings(response.data));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to load property listings. Please try again later."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1600,
                mx: "auto",
                p: { xs: 2, md: 3 },
            }}
        >
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.6rem", md: "2rem" },
                    }}
                >
                    Discover Properties
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    Explore properties published on external real estate websites.
                </Typography>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={loadListings}
                        >
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                    sx={{ py: 10 }}
                >
                    <CircularProgress />
                    <Typography color="text.secondary">
                        Loading properties...
                    </Typography>
                </Stack>
            ) : listings.length === 0 ? (
                <Box
                    sx={{
                        py: 8,
                        px: 2,
                        textAlign: "center",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 3,
                    }}
                >
                    <Typography variant="h6" fontWeight={700}>
                        No properties available
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        New listings will appear here when they are collected.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {listings.map((listing, index) => (
                        <Grid
                            key={listing._id || listing.sourceUrl || index}
                            size={{ xs: 12, sm: 6, lg: 4 }}
                        >
                            <PropertyCard listing={listing} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
