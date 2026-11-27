
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";

import {
    ArrowBack,
    ArrowForward,
    LocationOn,
    HomeWork,
    Map as MapIcon,
} from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";
import PropertyDetails from "./PropertyDetails";
import getImageUrl from "../../../utils/getImageUrl";
import { useGoBack } from "../../../Components/navigation/navHistory";

function InfoItem({ label, value }) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return (
        <Box
            sx={{
                bgcolor: "#f1f5f9",
                borderRadius: 2,
                p: 2,
                minWidth: 0,
                textAlign: "center",
                border: "1px solid #e2e8f0",
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            <Typography
                sx={{
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    color: "#0f172a",
                    overflowWrap: "anywhere",
                }}
            >
                {value}
            </Typography>

            <Typography
                variant="caption"
                sx={{ color: "#64748B", fontWeight: 600 }}
            >
                {label}
            </Typography>
        </Box>
    );
}

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

// Convert supported YouTube URLs into a safe embed URL.
function getYoutubeEmbedUrl(url) {
    if (!url || typeof url !== "string") return "";

    try {
        const parsedUrl = new URL(url.trim());
        const hostname = parsedUrl.hostname.toLowerCase();

        const allowedHosts = [
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
            "youtu.be",
            "youtube-nocookie.com",
            "www.youtube-nocookie.com",
        ];

        if (
            !allowedHosts.includes(hostname) ||
            !["https:", "http:"].includes(parsedUrl.protocol)
        ) {
            return "";
        }

        let videoId = "";

        if (hostname === "youtu.be") {
            videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
        } else {
            videoId =
                parsedUrl.searchParams.get("v") ||
                parsedUrl.pathname.match(
                    /^\/(?:embed|shorts|live)\/([^/?]+)/
                )?.[1];
        }

        if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            return "";
        }

        return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch {
        return "";
    }
}

// Translate rental period and furnishing status.
function getRentalValueLabel(value, t) {
    const translations = {
        Daily: "properties.details.rentalPeriod.daily",
        Monthly: "properties.details.rentalPeriod.monthly",
        Furnished: "properties.details.furnishingStatus.furnished",
        Unfurnished: "properties.details.furnishingStatus.unfurnished",
    };

    const translationKey = translations[value];

    return translationKey
        ? t(translationKey)
        : value || "";
}

export default function ProfilePropertyDetails() {
    const { t } = useTranslation();

    const { id } = useParams();
    const location = useLocation();

    const state = location.state;

    const [property, setProperty] = useState(state?.property || null);
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(!state?.property);
    const [error, setError] = useState("");

    // One step back (to where the user came from); "My publications" when opened directly.
    const goBack = useGoBack(state?.from || "/mypublication");
    const handleBack = () => goBack();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchProperty = async () => {
            const initialProperty = state?.property;

            if (
                initialProperty &&
                String(initialProperty._id || initialProperty.id) ===
                    String(id)
            ) {
                setProperty(initialProperty);
                setActiveImage(0);
                setLoading(false);
                setError("");
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await axiosInstance.get(`/property/${id}`);

                const data = response.data;
                const fetchedProperty =
                    data?.property || data?.data || data;

                if (!cancelled) {
                    setProperty(fetchedProperty);
                    setActiveImage(0);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            t("properties.details.loadError")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchProperty();
        } else {
            setLoading(false);
            setError(t("properties.details.missingId"));
        }

        return () => {
            cancelled = true;
        };
    }, [id, state?.property, t]);

    // Property photos only.
    const images = (property?.images || [])
        .map(getImageUrl)
        .filter(Boolean);

    // YouTube video is displayed separately underneath the photo gallery.
    const youtubeEmbedUrl = getYoutubeEmbedUrl(
        property?.youtubeVideoUrl
    );

    const title =
        property?.title || t("properties.details.title");

    const city = property?.city || "";
    const neighborhood = property?.neighborhood || "";

    const glocation = [neighborhood, city]
        .filter(Boolean)
        .join(", ");

    const price = Number(property?.price || 0).toLocaleString("en-US");

    const description =
        property?.description ||
        property?.details ||
        t("properties.details.noDescription");

    const googleMapLink =
        property?.googleMapLink ||
        property?.mapLink ||
        property?.locationUrl;

    const statusInfo = getStatusStyles(property?.status);

    const getStatusLabel = (status) => {
        const normalizedStatus = String(
            status || "Available"
        ).toLowerCase();

        const statusKeys = {
            available: "available",
            active: "available",
            pending: "pending",
            sold: "sold",
            rented: "rented",
            unavailable: "unavailable",
            inactive: "unavailable",
        };

        const key = statusKeys[normalizedStatus];

        return key
            ? t(`properties.details.status.${key}`)
            : status;
    };

    const getListingTypeLabel = (listingType) => {
        if (listingType === "For Sale") {
            return t("properties.card.forSale");
        }

        if (listingType === "For Rent") {
            return t("properties.card.forRent");
        }

        return listingType || "";
    };

    const getPropertyTypeLabel = (propertyType) => {
        if (!propertyType) return "";

        const normalizedType = propertyType.toLowerCase();

        const categoryKey = {
            "commercial space": "commercialSpace",
            "commercial store": "commercialStore",
        }[normalizedType] ||
            normalizedType.replace(
                /[^a-z0-9]+(.)/g,
                (_, char) => char.toUpperCase()
            );

        return t(`properties.categories.${categoryKey}`, {
            defaultValue: propertyType,
        });
    };

    const changeImage = (direction) => {
        if (!images.length) return;

        setActiveImage(
            (current) =>
                (current + direction + images.length) % images.length
        );
    };

    if (loading) {
        return (
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 10,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !property) {
        return (
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    p: { xs: 2, md: 4 },
                }}
            >
                <Button
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                    sx={{
                        mb: 3,
                        textTransform: "none",
                        fontWeight: 700,
                    }}
                >
                    {t("properties.details.back")}
                </Button>

                <Alert severity="error">
                    {error || t("properties.details.propertyNotFound")}
                </Alert>
            </Box>
        );
    }

    return (
        <PropertyDetails
            property={property}
            showContact={false}
            showSave={false}
            backAction={handleBack}
            backLabel={t("properties.details.back")}
        />
    );
}
