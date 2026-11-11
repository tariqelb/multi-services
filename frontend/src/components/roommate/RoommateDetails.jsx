
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BathtubIcon from "@mui/icons-material/Bathtub";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PetsIcon from "@mui/icons-material/Pets";
import SmokingRoomsIcon from "@mui/icons-material/SmokingRooms";
import PersonIcon from "@mui/icons-material/Person";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChairIcon from "@mui/icons-material/Chair";
import BalconyIcon from "@mui/icons-material/Balcony";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import KitchenIcon from "@mui/icons-material/Kitchen";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import getImageUrl from "../../utils/getImageUrl";

const purposeColors = {
    "Share My Property": "success",
    "Find a Room": "primary",
    "Rent Together": "warning",
};

function getYouTubeEmbedUrl(url) {
    if (!url || typeof url !== "string") return null;

    try {
        const parsedUrl = new URL(url.trim());
        const hostname = parsedUrl.hostname.replace(/^www\./, "");

        let videoId = null;

        if (hostname === "youtu.be") {
            videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
        } else if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com" ||
            hostname === "youtube-nocookie.com"
        ) {
            if (parsedUrl.pathname === "/watch") {
                videoId = parsedUrl.searchParams.get("v");
            } else {
                const match = parsedUrl.pathname.match(
                    /^\/(?:embed|shorts)\/([^/]+)/
                );

                videoId = match?.[1] || null;
            }
        }

        if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
            return null;
        }

        return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch {
        return null;
    }
}

function DetailItem({ icon, label, value }) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ py: 1 }}
        >
            <Box
                sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                    color: "primary.main",
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>

            <Box sx={{ minWidth: 0 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                >
                    {label}
                </Typography>

                <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ overflowWrap: "anywhere" }}
                >
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}

export default function RoommateDetails({ listing }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const images = useMemo(() => {
        return (listing?.images || [])
            .map((image) => {
                const path =
                    image?.path ||
                    image?.url ||
                    (typeof image === "string" ? image : null);

                return path ? getImageUrl(path) : null;
            })
            .filter(Boolean);
    }, [listing?.images]);

    const [activeImage, setActiveImage] = useState(0);

    const purpose = listing?.purpose || "";
    const owner = listing?.userId;

    const ownerId =
        typeof owner === "object"
            ? owner?._id || owner?.id
            : owner;

    const ownerName =
        typeof owner === "object"
            ? [
                owner?.firstName,
                owner?.lastName,
            ].filter(Boolean).join(" ")
            : "";

    const availablePlaces =
        listing?.availablePlaces ??
        Math.max(
            0,
            (Number(listing?.totalPeople) || 0) -
            (Number(listing?.currentPeople) || 0)
        );

    const youtubeEmbedUrl = getYouTubeEmbedUrl(
        listing?.youtubeVideoUrl
    );

    const formatPrice = (value) => {
        if (value === undefined || value === null || value === "") {
            return t("roommates.details.notSpecified", {
                defaultValue: "Not specified",
            });
        }

        return new Intl.NumberFormat(
            i18n.language === "ar"
                ? "ar-MA"
                : i18n.language === "fr"
                    ? "fr-FR"
                    : "en-GB",
            { maximumFractionDigits: 2 }
        ).format(Number(value));
    };

    const formatDate = (date) => {
        if (!date) {
            return t("roommates.details.notSpecified", {
                defaultValue: "Not specified",
            });
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return t("roommates.details.notSpecified", {
                defaultValue: "Not specified",
            });
        }

        return new Intl.DateTimeFormat(
            i18n.language === "ar"
                ? "ar-MA"
                : i18n.language === "fr"
                    ? "fr-FR"
                    : "en-GB",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }
        ).format(parsedDate);
    };

    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const translateEnum = (namespace, value) => {
        if (!value) return "";

        return t(`${namespace}.${value}`, {
            defaultValue: value,
        });
    };

    const preferences = listing?.preferences || {};

    const genderLabel = {
        Any: translate("roommates.preferences.any", "Any"),
        Male: translate("roommates.preferences.male", "Male"),
        Female: translate("roommates.preferences.female", "Female"),
    };

    const yesNo = (value) =>
        value
            ? translate("common.yes", "Yes")
            : translate("common.no", "No");

    const rentPeriod = listing?.rentalPeriod
        ? translateEnum("properties.rentalPeriod", listing.rentalPeriod)
        : "";

    const propertyType = listing?.propertyType
        ? translateEnum("properties.types", listing.propertyType)
        : "";

    const openMap = () => {
        if (!listing?.mapLink) return;

        window.open(
            listing.mapLink,
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <Box>
            {/* Heading */}
            <Box sx={{ mb: 3 }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                    sx={{ mb: 1.5 }}
                >
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            fontSize: {
                                xs: "1.45rem",
                                sm: "1.8rem",
                                md: "2rem",
                            },
                        }}
                    >
                        {listing.title}
                    </Typography>

                    <Chip
                        label={translateEnum(
                            "roommates.purpose",
                            purpose
                        )}
                        color={purposeColors[purpose] || "default"}
                        sx={{ fontWeight: 700 }}
                    />
                </Stack>

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    color="text.secondary"
                >
                    <LocationOnIcon fontSize="small" />

                    <Typography variant="body2">
                        {[listing.neighborhood, listing.city]
                            .filter(Boolean)
                            .join(", ")}
                    </Typography>
                </Stack>
            </Box>

            <Grid container spacing={3}>
                {/* Main content */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* Photos */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 1, sm: 2 },
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                width: "100%",
                                height: {
                                    xs: 260,
                                    sm: 400,
                                    md: 450,
                                },
                                borderRadius: 2,
                                overflow: "hidden",
                                bgcolor: "action.hover",
                            }}
                        >
                            {images.length > 0 ? (
                                <Box
                                    component="img"
                                    src={images[activeImage]}
                                    alt={listing.title}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <Stack
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{
                                        height: "100%",
                                        color: "text.secondary",
                                    }}
                                >
                                    <HomeWorkIcon sx={{ fontSize: 65 }} />

                                    <Typography>
                                        {translate(
                                            "roommates.details.noPhotos",
                                            "No photos available"
                                        )}
                                    </Typography>
                                </Stack>
                            )}
                        </Box>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    mt: 1.5,
                                    overflowX: "auto",
                                    pb: 1,
                                }}
                            >
                                {images.map((image, index) => (
                                    <Box
                                        key={`${image}-${index}`}
                                        component="button"
                                        type="button"
                                        onClick={() => setActiveImage(index)}
                                        aria-label={`View photo ${index + 1}`}
                                        sx={{
                                            p: 0,
                                            border: "2px solid",
                                            borderColor:
                                                activeImage === index
                                                    ? "primary.main"
                                                    : "transparent",
                                            borderRadius: 1.5,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            flexShrink: 0,
                                            width: 90,
                                            height: 70,
                                            bgcolor: "transparent",
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={image}
                                            alt={`Roommate property ${index + 1}`}
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* YouTube video under photos */}
                        {youtubeEmbedUrl && (
                            <Box sx={{ mt: 3 }}>
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{ mb: 1.5 }}
                                >
                                    {translate(
                                        "roommates.details.video",
                                        "Property video"
                                    )}
                                </Typography>

                                <Box
                                    sx={{
                                        position: "relative",
                                        width: "100%",
                                        aspectRatio: "16 / 9",
                                        overflow: "hidden",
                                        borderRadius: 2,
                                        bgcolor: "black",
                                    }}
                                >
                                    <Box
                                        component="iframe"
                                        src={youtubeEmbedUrl}
                                        title="Roommate property video"
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
                        )}
                    </Paper>

                    {/* Description */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            mt: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            {translate(
                                "roommates.details.description",
                                "Description"
                            )}
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{
                                whiteSpace: "pre-line",
                                overflowWrap: "anywhere",
                                lineHeight: 1.8,
                            }}
                        >
                            {listing.description ||
                                translate(
                                    "roommates.details.noDescription",
                                    "No description provided."
                                )}
                        </Typography>
                    </Paper>

                    {/* Accommodation details */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            mt: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            {translate(
                                "roommates.details.accommodation",
                                "Accommodation details"
                            )}
                        </Typography>

                        <Grid container spacing={1}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<HomeWorkIcon />}
                                    label={translate(
                                        "roommates.fields.propertyType",
                                        "Property type"
                                    )}
                                    value={propertyType}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<ChairIcon />}
                                    label={translate(
                                        "roommates.fields.furnishing",
                                        "Furnishing"
                                    )}
                                    value={translateEnum(
                                        "roommates.furnishing",
                                        listing.furnishingStatus
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<MeetingRoomIcon />}
                                    label={translate(
                                        "roommates.fields.rooms",
                                        "Bedrooms"
                                    )}
                                    value={listing.rooms}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<BathtubIcon />}
                                    label={translate(
                                        "roommates.fields.bathrooms",
                                        "Bathrooms"
                                    )}
                                    value={listing.bathrooms}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<HomeWorkIcon />}
                                    label={translate(
                                        "roommates.fields.surface",
                                        "Surface"
                                    )}
                                    value={
                                        listing.surface !== undefined &&
                                        listing.surface !== null
                                            ? `${listing.surface} m²`
                                            : null
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<PersonIcon />}
                                    label={translate(
                                        "roommates.fields.floor",
                                        "Floor"
                                    )}
                                    value={listing.floor}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<BalconyIcon />}
                                    label={translate(
                                        "roommates.fields.balcony",
                                        "Balcony"
                                    )}
                                    value={
                                        listing.hasBalcony === undefined
                                            ? null
                                            : yesNo(listing.hasBalcony)
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<KitchenIcon />}
                                    label={translate(
                                        "roommates.fields.kitchen",
                                        "Kitchen"
                                    )}
                                    value={
                                        listing.hasKitchen === undefined
                                            ? null
                                            : yesNo(listing.hasKitchen)
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<LocalParkingIcon />}
                                    label={translate(
                                        "roommates.fields.parking",
                                        "Parking"
                                    )}
                                    value={
                                        listing.hasParking === undefined
                                            ? null
                                            : yesNo(listing.hasParking)
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<HomeWorkIcon />}
                                    label={translate(
                                        "roommates.fields.condition",
                                        "Property condition"
                                    )}
                                    value={translateEnum(
                                        "roommates.condition",
                                        listing.propertyCondition
                                    )}
                                />
                            </Grid>
                        </Grid>

                        {listing.mapLink && (
                            <>
                                <Divider sx={{ my: 2 }} />

                                <Button
                                    variant="outlined"
                                    startIcon={<LocationOnIcon />}
                                    endIcon={<OpenInNewIcon />}
                                    onClick={openMap}
                                    sx={{ textTransform: "none" }}
                                >
                                    {translate(
                                        "roommates.details.viewMap",
                                        "View location on map"
                                    )}
                                </Button>
                            </>
                        )}
                    </Paper>

                    {/* Roommate preferences */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            mt: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            {translate(
                                "roommates.details.preferences",
                                "Roommate preferences"
                            )}
                        </Typography>

                        <Grid container spacing={1}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<PersonIcon />}
                                    label={translate(
                                        "roommates.fields.gender",
                                        "Preferred gender"
                                    )}
                                    value={
                                        genderLabel[preferences.gender] ||
                                        genderLabel.Any
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<SmokingRoomsIcon />}
                                    label={translate(
                                        "roommates.fields.smoking",
                                        "Smoking allowed"
                                    )}
                                    value={
                                        preferences.smokingAllowed === undefined
                                            ? null
                                            : yesNo(
                                                preferences.smokingAllowed
                                            )
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DetailItem
                                    icon={<PetsIcon />}
                                    label={translate(
                                        "roommates.fields.pets",
                                        "Pets allowed"
                                    )}
                                    value={
                                        preferences.petsAllowed === undefined
                                            ? null
                                            : yesNo(preferences.petsAllowed)
                                    }
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Sidebar information */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Rent and availability */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                            position: { md: "sticky" },
                            top: 20,
                        }}
                    >
                        <Typography
                            variant="h5"
                            color="primary.main"
                            fontWeight={800}
                            sx={{ mb: 0.5 }}
                        >
                            {listing.totalRent !== undefined &&
                            listing.totalRent !== null
                                ? formatPrice(listing.totalRent)
                                : formatPrice(listing.individualRoomPrice)}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            {listing.totalRent !== undefined &&
                            listing.totalRent !== null
                                ? translate(
                                    "roommates.details.totalRent",
                                    "Total rent"
                                )
                                : translate(
                                    "roommates.details.roomPrice",
                                    "Individual room price"
                                )}

                            {rentPeriod ? ` / ${rentPeriod}` : ""}
                        </Typography>

                        {listing.rentPerPerson !== null &&
                            listing.rentPerPerson !== undefined && (
                                <Alert
                                    severity="info"
                                    icon={false}
                                    sx={{ mb: 2 }}
                                >
                                    <Typography variant="body2">
                                        {translate(
                                            "roommates.details.rentPerPerson",
                                            "Estimated rent per person"
                                        )}
                                    </Typography>

                                    <Typography fontWeight={800}>
                                        {formatPrice(listing.rentPerPerson)}
                                    </Typography>
                                </Alert>
                            )}

                        <Divider sx={{ mb: 2 }} />

                        <DetailItem
                            icon={<PeopleAltIcon />}
                            label={translate(
                                "roommates.fields.totalPeople",
                                "Total capacity"
                            )}
                            value={listing.totalPeople}
                        />

                        <DetailItem
                            icon={<PeopleAltIcon />}
                            label={translate(
                                "roommates.fields.currentPeople",
                                "Current occupants"
                            )}
                            value={listing.currentPeople}
                        />

                        <DetailItem
                            icon={<PeopleAltIcon />}
                            label={translate(
                                "roommates.fields.availablePlaces",
                                "Available places"
                            )}
                            value={availablePlaces}
                        />

                        <DetailItem
                            icon={<CalendarMonthIcon />}
                            label={translate(
                                "roommates.fields.availableFrom",
                                "Available from"
                            )}
                            value={formatDate(listing.availableFrom)}
                        />

                        <Divider sx={{ my: 2 }} />

                        {/* Additional expenses */}
                        <Typography fontWeight={700} mb={1}>
                            {translate(
                                "roommates.details.additionalExpenses",
                                "Additional expenses"
                            )}
                        </Typography>

                        <DetailItem
                            icon={<HomeWorkIcon />}
                            label={translate(
                                "roommates.fields.deposit",
                                "Deposit"
                            )}
                            value={formatPrice(listing.deposit)}
                        />

                        <DetailItem
                            icon={<HomeWorkIcon />}
                            label={translate(
                                "roommates.fields.syndicateFees",
                                "Syndicate fees"
                            )}
                            value={formatPrice(listing.syndicateFees)}
                        />

                        <DetailItem
                            icon={<HomeWorkIcon />}
                            label={translate(
                                "roommates.fields.otherExpenses",
                                "Other expenses"
                            )}
                            value={formatPrice(listing.otherExpenses)}
                        />

                        <Divider sx={{ my: 2 }} />

                        {/* Owner */}
                        <Typography fontWeight={700} mb={1.5}>
                            {translate(
                                "roommates.details.owner",
                                "Announcement owner"
                            )}
                        </Typography>

                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                        >
                            <AccountCircleIcon
                                sx={{
                                    fontSize: 45,
                                    color: "text.secondary",
                                }}
                            />

                            <Box sx={{ minWidth: 0 }}>
                                <Typography fontWeight={700}>
                                    {ownerName ||
                                        translate(
                                            "roommates.details.owner",
                                            "Announcement owner"
                                        )}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {translate(
                                        "roommates.details.postedOn",
                                        "Posted on"
                                    )}{" "}
                                    {formatDate(listing.createdAt)}
                                </Typography>
                            </Box>
                        </Stack>

                        {ownerId && (
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() =>
                                    navigate(`/profile/${ownerId}`)
                                }
                                sx={{
                                    mt: 2,
                                    textTransform: "none",
                                    fontWeight: 700,
                                }}
                            >
                                {translate(
                                    "roommates.details.viewProfile",
                                    "View owner profile"
                                )}
                            </Button>
                        )}

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate("/roommates")}
                            sx={{
                                mt: 1.5,
                                textTransform: "none",
                                fontWeight: 600,
                            }}
                        >
                            {translate(
                                "roommates.details.backToAnnouncements",
                                "Back to announcements"
                            )}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
