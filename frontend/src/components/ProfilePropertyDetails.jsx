
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

import axiosInstance from "../api/axiosInstance";
import getImageUrl from "../utils/getImageUrl";

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
                sx={{ color: "#5B6577", fontWeight: 600 }}
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
    const navigate = useNavigate();

    const state = location.state;

    const [property, setProperty] = useState(state?.property || null);
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(!state?.property);
    const [error, setError] = useState("");

    const handleBack = () => {
        navigate(state?.from || "/mypublication", {
            replace: true,
        });
    };

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
                    {t("properties.details.backToMyPublications")}
                </Button>

                <Alert severity="error">
                    {error || t("properties.details.propertyNotFound")}
                </Alert>
            </Box>
        );
    }

    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                minWidth: 0,
                maxWidth: 1100,
                mx: "auto",
                px: { xs: 2, md: 4 },
                py: 1,
                width: "100%",
                boxSizing: "border-box",
                bgcolor: "#f8fafc",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            {/* Back button */}
            <Button
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{
                    mb: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                }}
            >
                {t("properties.details.back")}
            </Button>

            {/* Property Photo Gallery */}
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    mb: 4,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                }}
            >
                <Box
                    sx={{
                        height: { xs: 300, sm: 450, md: 540 },
                        position: "relative",
                        bgcolor: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {images.length > 0 ? (
                        <Box
                            component="img"
                            src={images[activeImage]}
                            alt={title}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.3s ease",
                            }}
                        />
                    ) : (
                        <Stack alignItems="center" spacing={1}>
                            <HomeWork
                                sx={{ fontSize: 64, color: "#94a3b8" }}
                            />
                            <Typography sx={{ color: "#94a3b8" }}>
                                {t("properties.details.noImages")}
                            </Typography>
                        </Stack>
                    )}

                    {images.length > 1 && (
                        <>
                            <IconButton
                                aria-label={t(
                                    "properties.details.previousImage"
                                )}
                                onClick={() => changeImage(-1)}
                                sx={{
                                    position: "absolute",
                                    left: 16,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    "&:hover": { bgcolor: "white" },
                                    boxShadow: 2,
                                }}
                            >
                                <ArrowBack />
                            </IconButton>

                            <IconButton
                                aria-label={t(
                                    "properties.details.nextImage"
                                )}
                                onClick={() => changeImage(1)}
                                sx={{
                                    position: "absolute",
                                    right: 16,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    "&:hover": { bgcolor: "white" },
                                    boxShadow: 2,
                                }}
                            >
                                <ArrowForward />
                            </IconButton>

                            <Chip
                                label={`${activeImage + 1} / ${images.length}`}
                                size="small"
                                sx={{
                                    position: "absolute",
                                    bottom: 16,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    bgcolor: "rgba(15,23,42,0.85)",
                                    color: "white",
                                    fontWeight: 700,
                                }}
                            />
                        </>
                    )}
                </Box>

                {/* Photo Thumbnails */}
                {images.length > 1 && (
                    <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                            p: 2,
                            overflowX: "auto",
                            bgcolor: "white",
                            alignItems: "center",
                        }}
                    >
                        {images.map((src, index) => (
                            <Box
                                key={`${src}-${index}`}
                                component="button"
                                onClick={() => setActiveImage(index)}
                                aria-label={t(
                                    "properties.details.viewImage",
                                    { number: index + 1 }
                                )}
                                sx={{
                                    flex: "0 0 90px",
                                    height: 68,
                                    p: 0,
                                    border:
                                        index === activeImage
                                            ? "3px solid #2563EB"
                                            : "1px solid #D5DCE8",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    bgcolor: "white",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={src}
                                    alt=""
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>

            {/* YouTube Video - displayed separately below the photos */}
            {youtubeEmbedUrl && (
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        mb: 4,
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                    }}
                >
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                color: "#0f172a",
                                mb: 2,
                            }}
                        >
                            {t("properties.details.propertyVideo.title")}
                        </Typography>

                        <Box
                            sx={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: "16 / 9",
                                bgcolor: "#0f172a",
                                borderRadius: 2,
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                component="iframe"
                                src={youtubeEmbedUrl}
                                title={t(
                                    "properties.details.propertyVideo.iframeTitle",
                                    { title }
                                )}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    border: 0,
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Main Property Information */}
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: "16px",
                    mb: 4,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={3}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: "#0f172a",
                                mb: 1,
                                overflowWrap: "anywhere",
                            }}
                        >
                            {title}
                        </Typography>

                        {glocation && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                            >
                                <LocationOn
                                    sx={{
                                        fontSize: 20,
                                        color: "#2563EB",
                                    }}
                                />

                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: "#475569",
                                        fontWeight: 600,
                                    }}
                                >
                                    {glocation}
                                </Typography>
                            </Stack>
                        )}
                    </Box>

                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: "#1D4ED8",
                                mb: 0.5,
                            }}
                        >
                            {price} MAD
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            justifyContent={{
                                xs: "flex-start",
                                sm: "flex-end",
                            }}
                        >
                            <Chip
                                label={getListingTypeLabel(
                                    property.listingType
                                )}
                                size="medium"
                                sx={{
                                    bgcolor: "#EFF6FF",
                                    color: "#2563EB",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                }}
                            />

                            <Chip
                                label={getStatusLabel(property.status)}
                                size="medium"
                                sx={{
                                    bgcolor: statusInfo.bgcolor,
                                    color: statusInfo.color,
                                    fontWeight: 700,
                                    textTransform: "capitalize",
                                    fontSize: "1rem",
                                }}
                            />
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.details.surface")}
                            value={property.surface}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.profileDetails.rooms")}
                            value={property.rooms}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.card.bathrooms")}
                            value={property.bathrooms}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.card.salons")}
                            value={property.salons}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.details.floor")}
                            value={property.floor}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.details.propertyType")}
                            value={getPropertyTypeLabel(
                                property.propertyType
                            )}
                        />
                    </Grid>
                </Grid>

                {/* Google Maps Location */}
                {googleMapLink && (
                    <Box sx={{ mt: 3 }}>
                        <Button
                            component="a"
                            href={googleMapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            startIcon={<MapIcon />}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                            }}
                        >
                            {t("properties.details.viewOnMaps")}
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Property Description */}
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: "16px",
                    mb: 4,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: "#0f172a",
                    }}
                >
                    {t("properties.details.description")}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: "#334155",
                        whiteSpace: "pre-line",
                        lineHeight: 1.8,
                        overflowWrap: "anywhere",
                    }}
                >
                    {description}
                </Typography>

                {/* Syndicate Fees */}
                {property.syndicateFees != null &&
                    property.syndicateFees !== "" && (
                        <Typography
                            variant="body1"
                            sx={{
                                mt: 3,
                                fontWeight: 700,
                                color: "#0F172A",
                            }}
                        >
                            {t("properties.details.syndicateFees")}:{" "}
                            {Number(
                                property.syndicateFees
                            ).toLocaleString("en-US")}{" "}
                            MAD
                        </Typography>
                    )}

                {/* Rental Information */}
                {property.listingType === "For Rent" && (
                    <>
                        <Divider sx={{ my: 3 }} />

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                mb: 2,
                                color: "#0f172a",
                            }}
                        >
                            {t("properties.details.rentalInformation")}
                        </Typography>

                        <Grid container spacing={2}>
                            {/* Rental Period */}
                            {property.rentalPeriod && (
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        label={t(
                                            "properties.details.rentalPeriod.label"
                                        )}
                                        value={getRentalValueLabel(
                                            property.rentalPeriod,
                                            t
                                        )}
                                    />
                                </Grid>
                            )}

                            {/* Furnishing Status */}
                            {property.furnishingStatus && (
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        label={t(
                                            "properties.details.furnishingStatus.label"
                                        )}
                                        value={getRentalValueLabel(
                                            property.furnishingStatus,
                                            t
                                        )}
                                    />
                                </Grid>
                            )}

                            {property.rentWithContract != null && (
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        label={t(
                                            "properties.details.rentalContract"
                                        )}
                                        value={
                                            property.rentWithContract
                                                ? t(
                                                      "properties.details.contractAvailable"
                                                  )
                                                : t(
                                                      "properties.details.noContract"
                                                  )
                                        }
                                    />
                                </Grid>
                            )}

                            {property.mortgageAgreement != null && (
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        label={t(
                                            "properties.details.mortgageAgreement"
                                        )}
                                        value={
                                            property.mortgageAgreement
                                                ? t(
                                                      "properties.details.accepted"
                                                  )
                                                : t(
                                                      "properties.details.notAccepted"
                                                  )
                                        }
                                    />
                                </Grid>
                            )}

                            {property.deposit != null &&
                                property.deposit !== "" && (
                                    <Grid item xs={12} sm={6}>
                                        <InfoItem
                                            label={t(
                                                "properties.details.securityDeposit"
                                            )}
                                            value={`${Number(
                                                property.deposit
                                            ).toLocaleString("en-US")} MAD`}
                                        />
                                    </Grid>
                                )}

                            {property.mediatorFee != null &&
                                property.mediatorFee !== "" && (
                                    <Grid item xs={12} sm={6}>
                                        <InfoItem
                                            label={t(
                                                "properties.details.mediatorFee"
                                            )}
                                            value={`${Number(
                                                property.mediatorFee
                                            ).toLocaleString("en-US")} MAD`}
                                        />
                                    </Grid>
                                )}
                        </Grid>
                    </>
                )}
            </Paper>
        </Box>
    );
}
