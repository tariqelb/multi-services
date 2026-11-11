
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import getImageUrl from "../../utils/getImageUrl";

const purposeColors = {
    "Share My Property": "success",
    "Find a Room": "primary",
    "Rent Together": "warning",
};

export default function RoommateCard({ listing }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    if (!listing) return null;

    const listingId = listing._id || listing.id;

    const firstImage = listing.images?.[0];

    const imagePath =
        firstImage?.path ||
        firstImage?.url ||
        (typeof firstImage === "string" ? firstImage : null);

    const imageUrl = imagePath ? getImageUrl(imagePath) : "";

    const purpose = listing.purpose || "Find a Room";

    const availablePlaces =
        listing.availablePlaces ??
        Math.max(
            0,
            (Number(listing.totalPeople) || 0) -
            (Number(listing.currentPeople) || 0)
        );

    const formatPrice = (value) => {
        if (value === undefined || value === null || value === "") {
            return t("roommates.card.priceNotSpecified", {
                defaultValue: "Price not specified",
            });
        }

        return new Intl.NumberFormat(
            i18n.language === "ar" ? "ar-MA" : "fr-FR",
            {
                maximumFractionDigits: 2,
            }
        ).format(Number(value));
    };

    const formatDate = (date) => {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "";

        return new Intl.DateTimeFormat(
            i18n.language === "ar"
                ? "ar-MA"
                : i18n.language === "fr"
                    ? "fr-FR"
                    : "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        ).format(parsedDate);
    };

    const handleOpenDetails = () => {
        if (!listingId) return;

        navigate(`/roommates/${listingId}`, {
            state: { listing },
        });
    };

    const ownerName = [
        listing.userId?.firstName,
        listing.userId?.lastName,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                height: 540,
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
                transition: "all 0.25s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 5,
                    borderColor: "primary.main",
                },
            }}
        >
            <CardActionArea
                onClick={handleOpenDetails}
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                }}
            >
                {/* Image */}
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: 220,
                        flexShrink: 0,
                        backgroundColor: "action.hover",
                        overflow: "hidden",
                    }}
                >
                    {imageUrl ? (
                        <Box
                            component="img"
                            src={imageUrl}
                            alt={listing.title || "Roommate announcement"}
                            onError={(event) => {
                                event.currentTarget.style.display = "none";
                            }}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.3s ease",
                                ".MuiCard-root:hover &": {
                                    transform: "scale(1.04)",
                                },
                            }}
                        />
                    ) : (
                        <Stack
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                width: "100%",
                                height: "100%",
                                color: "text.secondary",
                            }}
                        >
                            <MeetingRoomIcon sx={{ fontSize: 55 }} />
                            <Typography variant="body2">
                                {t("roommates.card.noImage", {
                                    defaultValue: "No image available",
                                })}
                            </Typography>
                        </Stack>
                    )}

                    <Chip
                        label={t(`roommates.purpose.${purpose}`, {
                            defaultValue: purpose,
                        })}
                        color={purposeColors[purpose] || "default"}
                        size="small"
                        sx={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            fontWeight: 700,
                            maxWidth: "85%",
                        }}
                    />

                    {listing.propertyType && (
                        <Chip
                            label={t(
                                `properties.types.${listing.propertyType}`,
                                {
                                    defaultValue: listing.propertyType,
                                }
                            )}
                            size="small"
                            sx={{
                                position: "absolute",
                                bottom: 12,
                                left: 12,
                                backgroundColor: "rgba(0,0,0,0.65)",
                                color: "#fff",
                                fontWeight: 600,
                            }}
                        />
                    )}
                </Box>

                {/* Content */}
                <CardContent
                    sx={{
                        p: 2,
                        flex: 1,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ mb: 1 }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                        >
                            {listing.createdAt
                                ? formatDate(listing.createdAt)
                                : ""}
                        </Typography>

                        {listing.rentalPeriod && (
                            <Chip
                                size="small"
                                variant="outlined"
                                label={t(
                                    `properties.rentalPeriod.${listing.rentalPeriod}`,
                                    {
                                        defaultValue: listing.rentalPeriod,
                                    }
                                )}
                            />
                        )}
                    </Stack>

                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            mb: 1,
                            lineHeight: 1.35,
                            minHeight: 52,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {listing.title}
                    </Typography>

                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{ mb: 1.5 }}
                    >
                        <LocationOnIcon
                            fontSize="small"
                            color="action"
                        />

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                        >
                            {[listing.neighborhood, listing.city]
                                .filter(Boolean)
                                .join(", ")}
                        </Typography>
                    </Stack>

                    <Divider sx={{ mb: 1.5 }} />

                    {/* Rent */}
                    <Box sx={{ mb: 1.5 }}>
                        <Typography
                            variant="h6"
                            color="primary.main"
                            fontWeight={800}
                        >
                            {listing.totalRent !== undefined &&
                            listing.totalRent !== null
                                ? `${formatPrice(listing.totalRent)}`
                                : formatPrice(listing.individualRoomPrice)}
                            <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                fontWeight={400}
                            >
                                {" "}
                                {listing.totalRent !== undefined &&
                                listing.totalRent !== null
                                    ? ` / ${t("roommates.card.totalRent", {
                                        defaultValue: "total",
                                    })}`
                                    : ""}
                            </Typography>
                        </Typography>

                        {listing.rentPerPerson !== null &&
                            listing.rentPerPerson !== undefined && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {t("roommates.card.perPerson", {
                                        defaultValue: "Per person",
                                    })}
                                    : {formatPrice(listing.rentPerPerson)}
                                </Typography>
                            )}
                    </Box>

                    {/* Accommodation details */}
                    <Stack spacing={1} sx={{ mb: 1.5 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                        >
                            <PeopleAltIcon
                                fontSize="small"
                                color="action"
                            />

                            <Typography variant="body2">
                                {availablePlaces}{" "}
                                {t("roommates.card.availablePlaces", {
                                    defaultValue: "available places",
                                })}
                            </Typography>
                        </Stack>

                        {listing.rooms !== undefined &&
                            listing.rooms !== null && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                >
                                    <MeetingRoomIcon
                                        fontSize="small"
                                        color="action"
                                    />

                                    <Typography variant="body2">
                                        {listing.rooms}{" "}
                                        {t("roommates.card.bedrooms", {
                                            defaultValue: "bedrooms",
                                        })}
                                    </Typography>
                                </Stack>
                            )}

                        {listing.availableFrom && (
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                            >
                                <CalendarMonthIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography variant="body2">
                                    {t("roommates.card.availableFrom", {
                                        defaultValue: "Available from",
                                    })}
                                    : {formatDate(listing.availableFrom)}
                                </Typography>
                            </Stack>
                        )}
                    </Stack>

                    <Box sx={{ flexGrow: 1 }} />

                    {ownerName && (
                        <>
                            <Divider sx={{ mb: 1 }} />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                            >
                                {t("roommates.card.postedBy", {
                                    defaultValue: "Posted by",
                                })}{" "}
                                <Box
                                    component="span"
                                    sx={{
                                        color: "text.primary",
                                        fontWeight: 600,
                                    }}
                                >
                                    {ownerName}
                                </Box>
                            </Typography>
                        </>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
