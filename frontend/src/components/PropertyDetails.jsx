
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
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
    Alert,
    Snackbar,
} from "@mui/material";

import {
    Bookmark,
    BookmarkAdded,
    ArrowBack,
    ArrowForward,
    LocationOn,
    HomeWork,
    Map as MapIcon,
} from "@mui/icons-material";

import SimilarProperties from "./SimilarProperties";
import PropertyContactOwner from "./PropertyContactOwner";
import axiosInstance from "../api/axiosInstance";
import getImageUrl from "../utils/getImageUrl";

// Extract a YouTube video ID from supported YouTube URLs.
function getYoutubeVideoId(videoUrl) {
    if (!videoUrl || typeof videoUrl !== "string") {
        return null;
    }

    try {
        const url = new URL(videoUrl.trim());

        if (!["https:", "http:"].includes(url.protocol)) {
            return null;
        }

        const hostname = url.hostname
            .toLowerCase()
            .replace(/^www\./, "");

        let videoId = "";

        if (hostname === "youtu.be") {
            videoId = url.pathname.slice(1).split("/")[0];
        } else if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com" ||
            hostname === "youtube-nocookie.com"
        ) {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v") || "";
            } else if (
                url.pathname.startsWith("/embed/") ||
                url.pathname.startsWith("/shorts/")
            ) {
                videoId = url.pathname.split("/")[2] || "";
            }
        }

        return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
            ? videoId
            : null;
    } catch {
        return null;
    }
}

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

function getStatusStyles(status, t) {
    const normalizedStatus = String(status || "").toLowerCase();

    switch (normalizedStatus) {
        case "available":
        case "active":
            return {
                bgcolor: "#dcfce7",
                color: "#15803d",
                label: t("properties.details.status.available"),
            };

        case "pending":
            return {
                bgcolor: "#fef9c3",
                color: "#a16207",
                label: t("properties.details.status.pending"),
            };

        case "sold":
            return {
                bgcolor: "#fee2e2",
                color: "#b91c1c",
                label: t("properties.details.status.sold"),
            };

        case "rented":
            return {
                bgcolor: "#fee2e2",
                color: "#b91c1c",
                label: t("properties.details.status.rented"),
            };

        case "unavailable":
            return {
                bgcolor: "#fee2e2",
                color: "#b91c1c",
                label: t("properties.details.status.unavailable"),
            };

        default:
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
                label: status,
            };
    }
}

function formatPrice(value, language) {
    if (value === undefined || value === null || value === "") {
        return "";
    }

    return Number(value).toLocaleString(language);
}

function getTranslatedPropertyValue(value, t, namespace) {
    if (!value) return value;

    const normalized = String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");

    const keyMap = {
        apartment: "apartment",
        house: "house",
        villa: "villa",
        studio: "studio",
        room: "room",
        store: "store",
        office: "office",
        land: "land",
        warehouse: "warehouse",
        commercialspace: "commercialSpace",
        commercialstore: "commercialStore",
        garage: "garage",
        other: "other",
        owner: "owner",
        realestateagent: "realEstateAgent",
        agency: "agency",
    };

    const key = keyMap[normalized];

    if (!key) return value;

    return t(`${namespace}.${key}`, { defaultValue: value });
}

export default function PropertyDetails({
    property: initialProperty,
    onBack,
    similarProperties = [],
    onSelectSimilar,
    showContact = true,
    onSaveProperty,
    isSaved = false,
}) {
    const { t, i18n } = useTranslation();

    const [property, setProperty] = useState(initialProperty || {});
    const [activeImage, setActiveImage] = useState(0);
    const [saved, setSaved] = useState(Boolean(isSaved));
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();

    const [feedback, setFeedback] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        setSaved(Boolean(isSaved));
    }, [isSaved, initialProperty?._id, initialProperty?.id]);

    useEffect(() => {
        setProperty(initialProperty || {});
        setActiveImage(0);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, [initialProperty]);

    const images = (property.images || [])
        .map(getImageUrl)
        .filter(Boolean);

    const youtubeVideoId = getYoutubeVideoId(
        property.youtubeVideoUrl
    );

    const title = property.title || t("properties.details.title");
    const city = property.city || "";
    const neighborhood = property.neighborhood || "";
    const fullAddress = property.fullAddress || "";

    const location = [neighborhood, city]
        .filter(Boolean)
        .join(", ");

    const price = formatPrice(property.price, i18n.language);

    const description =
        property.description ||
        property.details ||
        t("properties.details.noDescription");

    const googleMapLink =
        property.googleMapLink ||
        property.mapLink ||
        property.locationUrl;

    const statusInfo = property.status
        ? getStatusStyles(property.status, t)
        : null;

    const ownerEmail =
        property.showEmail === true
            ? property.email || ""
            : "";

    const changeImage = (direction) => {
        if (!images.length) return;

        setActiveImage(
            (current) =>
                (current + direction + images.length) % images.length
        );
    };

    const handleSaveClick = async () => {
        const id = property._id || property.id;

        if (!id || saving) return;

        const shouldSave = !saved;

        try {
            setSaving(true);

            if (onSaveProperty) {
                await onSaveProperty(id, shouldSave);
            } else if (shouldSave) {
                await axiosInstance.post(`/property/save/${id}`);
            } else {
                await axiosInstance.delete(`/property/unsave/${id}`);
            }

            setSaved(shouldSave);

            setFeedback({
                open: true,
                message: shouldSave
                    ? t("properties.details.feedback.saved")
                    : t("properties.details.feedback.unsaved"),
                severity: "success",
            });
        } catch (error) {
            console.error(
                "Failed to update saved property:",
                error.response?.data || error.message
            );

            setFeedback({
                open: true,
                message:
                    error.response?.data?.message ||
                    t("properties.details.feedback.saveError"),
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCloseFeedback = (_, reason) => {
        if (reason === "clickaway") return;

        setFeedback((previous) => ({
            ...previous,
            open: false,
        }));
    };

    return (
        <Box
            component="main"
            sx={{
                maxWidth: 1100,
                mx: "auto",
                px: { xs: 2, md: 4 },
                py: 1,
                width: "100%",
                bgcolor: "#f8fafc",
                minHeight: "calc(100vh - 64px)",
                boxSizing: "border-box",
            }}
        >
            <Button
                onClick={() => navigate(-1)}
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

            {/* Image Gallery */}
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
                                aria-label={t("properties.details.previousImage")}
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
                                aria-label={t("properties.details.nextImage")}
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

                {images.length > 1 && (
                    <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                            p: 2,
                            overflowX: "auto",
                            bgcolor: "white",
                        }}
                    >
                        {images.map((src, index) => (
                            <Box
                                key={`${src}-${index}`}
                                component="button"
                                onClick={() => setActiveImage(index)}
                                aria-label={t("properties.details.viewImage", {
                                    number: index + 1,
                                })}
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

            {/* YouTube Video - displayed after all property images */}
            {youtubeVideoId && (
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
                                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
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
                    <Box sx={{ minWidth: 0, flex: 1 }}>
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

                        {(location || fullAddress) && (
                            <Stack spacing={0.5}>
                                {location && (
                                    <Stack
                                        direction="row"
                                        spacing={0.5}
                                        alignItems="center"
                                    >
                                        <LocationOn
                                            sx={{
                                                fontSize: 20,
                                                color: "#2563EB",
                                                flexShrink: 0,
                                            }}
                                        />

                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: "#475569",
                                                fontWeight: 600,
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {location}
                                        </Typography>
                                    </Stack>
                                )}

                                {fullAddress && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#5B6577",
                                            pl: 3,
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {fullAddress}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>

                    <Box
                        sx={{
                            textAlign: { xs: "left", sm: "right" },
                            minWidth: 0,
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: "#1D4ED8",
                                mb: 0.5,
                                overflowWrap: "anywhere",
                            }}
                        >
                            {price} MAD
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent={{
                                xs: "flex-start",
                                sm: "flex-end",
                            }}
                            flexWrap="wrap"
                            useFlexGap
                        >
                            <Chip
                                label={
                                    property.listingType === "For Rent"
                                        ? t("properties.card.forRent")
                                        : t("properties.card.forSale")
                                }
                                size="medium"
                                sx={{
                                    bgcolor: "#EFF6FF",
                                    color: "#2563EB",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                }}
                            />

                            {statusInfo && (
                                <Chip
                                    label={statusInfo.label}
                                    size="medium"
                                    sx={{
                                        bgcolor: statusInfo.bgcolor,
                                        color: statusInfo.color,
                                        fontWeight: 700,
                                        textTransform: "capitalize",
                                        fontSize: "1rem",
                                    }}
                                />
                            )}
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* Property Statistics */}
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.details.surface")}
                            value={property.surface}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.card.rooms")}
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
                            value={getTranslatedPropertyValue(
                                property.propertyType,
                                t,
                                "properties.categories"
                            )}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label={t("properties.details.listingBy")}
                            value={getTranslatedPropertyValue(
                                property.role,
                                t,
                                "properties.details.roles"
                            )}
                        />
                    </Grid>

                    {property.syndicateFees != null && (
                        <Grid item xs={6} sm={4}>
                            <InfoItem
                                label={t("properties.details.syndicateFees")}
                                value={`${formatPrice(
                                    property.syndicateFees,
                                    i18n.language
                                )} MAD`}
                            />
                        </Grid>
                    )}
                </Grid>

                {/* Location and Save Actions */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                        justifyContent: "space-between",
                        alignItems: {
                            xs: "stretch",
                            sm: "center",
                        },
                        gap: 2,
                        width: "100%",
                        mt: 2,
                    }}
                >
                    {googleMapLink && (
                        <Box>
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
                                    maxWidth: "100%",
                                }}
                            >
                                {t("properties.details.viewOnMaps")}
                            </Button>
                        </Box>
                    )}

                    <Box
                        sx={{
                            textAlign: {
                                xs: "left",
                                sm: "right",
                            },
                        }}
                    >
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={
                                saving
                                    ? null
                                    : saved
                                        ? <BookmarkAdded />
                                        : <Bookmark />
                            }
                            disabled={
                                saving ||
                                !(property._id || property.id)
                            }
                            onClick={handleSaveClick}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 1,
                                px: 2,
                                py: 0.75,
                                borderColor: "#2563EB",
                                color: "#2563EB",
                                bgcolor: "transparent",
                                boxShadow: "none",
                                "&:hover": {
                                    borderColor: "#1D4ED8",
                                    bgcolor: "#EFF6FF",
                                    boxShadow: "none",
                                },
                                "&.Mui-disabled": {
                                    borderColor: "#D5DCE8",
                                    color: "#94a3b8",
                                },
                            }}
                        >
                            {saving
                                ? t("properties.details.saving")
                                : saved
                                    ? t("properties.details.unsave")
                                    : t("properties.details.save")}
                        </Button>
                    </Box>
                </Box>

                {/* Owner Email */}
                {ownerEmail && (
                    <Box
                        sx={{
                            mt: 3,
                            p: 2,
                            bgcolor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 2,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: "#5B6577",
                                fontWeight: 600,
                                mb: 0.5,
                            }}
                        >
                            {t("properties.details.contactEmail")}
                        </Typography>

                        <Typography
                            component="a"
                            href={`mailto:${ownerEmail}`}
                            sx={{
                                color: "#1D4ED8",
                                fontWeight: 600,
                                textDecoration: "none",
                                overflowWrap: "anywhere",
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            {ownerEmail}
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Property Description and Additional Information */}
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
                            {property.rentWithContract != null && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <InfoItem
                                        label={t("properties.details.rentalContract")}
                                        value={
                                            property.rentWithContract
                                                ? t("properties.details.contractAvailable")
                                                : t("properties.details.noContract")
                                        }
                                    />
                                </Grid>
                            )}

                            {property.mortgageAgreement != null && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <InfoItem
                                        label={t("properties.details.mortgageAgreement")}
                                        value={
                                            property.mortgageAgreement
                                                ? t("properties.details.accepted")
                                                : t("properties.details.notAccepted")
                                        }
                                    />
                                </Grid>
                            )}

                            {property.deposit != null && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <InfoItem
                                        label={t("properties.details.securityDeposit")}
                                        value={`${formatPrice(
                                            property.deposit,
                                            i18n.language
                                        )} MAD`}
                                    />
                                </Grid>
                            )}

                            {property.mediatorFee != null && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <InfoItem
                                        label={t("properties.details.mediatorFee")}
                                        value={`${formatPrice(
                                            property.mediatorFee,
                                            i18n.language
                                        )} MAD`}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </>
                )}
            </Paper>

            {/* Owner Contact Component */}
            {showContact && (
                <PropertyContactOwner property={property} />
            )}

            {/* Similar Properties */}
            {similarProperties.length > 0 && (
                <Box sx={{ mt: 4, width: "100%" }}>
                    <SimilarProperties
                        properties={similarProperties}
                        onSelectProperty={onSelectSimilar}
                    />
                </Box>
            )}

            {/* Save/Unsave Feedback */}
            <Snackbar
                open={feedback.open}
                autoHideDuration={3500}
                onClose={handleCloseFeedback}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                <Alert
                    onClose={handleCloseFeedback}
                    severity={feedback.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {feedback.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
