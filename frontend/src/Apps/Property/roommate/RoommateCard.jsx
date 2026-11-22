
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Box, Chip, Typography, Alert } from "@mui/material";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";

import ListingCard, { CardBadge } from "../../../Components/ui/ListingCard";

import getImageUrl from "../../../utils/getImageUrl";
import roommateDefaultImage from "../../../assets/roommate-default.svg";

const purposeTones = {
    "Share My Property": "success",
    "Share My Apartment": "success",
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

    const hasUploadedImage = Boolean(imagePath);

    const imageUrl = hasUploadedImage
        ? getImageUrl(imagePath)
        : roommateDefaultImage;

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

    const hasTotalRent =
        listing.totalRent !== undefined &&
        listing.totalRent !== null;

    const hasRentPerPerson =
        listing.rentPerPerson !== undefined &&
        listing.rentPerPerson !== null;

    const currency = t("common.currency", "MAD");

    return (
        <ListingCard
            onClick={handleOpenDetails}
            image={imageUrl}
            imageAlt={
                hasUploadedImage
                    ? listing.title || ""
                    : t("roommates.card.defaultImageAlt", {
                        defaultValue: "Illustration of a shared apartment",
                    })
            }
            emptyIcon={<MeetingRoomOutlinedIcon />}
            emptyLabel={t("roommates.card.noImage", {
                defaultValue: "No image available",
            })}
            topBadges={
                <CardBadge
                    tone={purposeTones[purpose] || "primary"}
                    label={t(`roommates.purpose.${purpose}`, {
                        defaultValue: purpose,
                    })}
                />
            }
            bottomBadges={
                listing.propertyType ? (
                    <CardBadge
                        tone="dark"
                        label={t(`properties.types.${listing.propertyType}`, {
                            defaultValue: listing.propertyType,
                        })}
                    />
                ) : null
            }
            meta={listing.createdAt ? formatDate(listing.createdAt) : ""}
            metaEnd={
                listing.rentalPeriod ? (
                    <Chip
                        size="small"
                        variant="outlined"
                        label={t(
                            `properties.rentalPeriod.${listing.rentalPeriod}`,
                            {
                                defaultValue: listing.rentalPeriod,
                            }
                        )}
                        sx={{ height: 22, fontSize: "0.7rem" }}
                    />
                ) : null
            }
            title={listing.title}
            location={[
                listing.neighborhood,
                listing.city,
            ].filter(Boolean).join(", ")}
            features={[
                {
                    icon: <PeopleAltOutlinedIcon />,
                    label: `${availablePlaces} ${t(
                        "roommates.card.availablePlaces",
                        { defaultValue: "available places" }
                    )}`,
                },
                listing.rooms !== undefined &&
                    listing.rooms !== null && {
                        icon: <MeetingRoomOutlinedIcon />,
                        label: `${listing.rooms} ${t(
                            "roommates.card.bedrooms",
                            { defaultValue: "bedrooms" }
                        )}`,
                    },
                listing.availableFrom && {
                    icon: <EventAvailableOutlinedIcon />,
                    label: formatDate(listing.availableFrom),
                },
            ].filter(Boolean)}
            price={`${formatPrice(
                hasTotalRent
                    ? listing.totalRent
                    : listing.individualRoomPrice
            )} ${currency}`}
            priceCaption={
                hasTotalRent
                    ? t("roommates.card.totalRent", {
                        defaultValue: "total",
                    })
                    : ""
            }
            priceNote={
                hasRentPerPerson
                    ? `${t("roommates.card.perPerson", {
                        defaultValue: "Per person",
                    })}: ${formatPrice(listing.rentPerPerson)} ${currency}`
                    : ""
            }
            footer={
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {!hasUploadedImage && (
                        <Alert
                            severity="info"
                            icon={false}
                            sx={{
                                py: 0.4,
                                px: 1.2,
                                borderRadius: 1,
                                "& .MuiAlert-message": {
                                    p: 0,
                                    fontSize: "0.7rem",
                                    lineHeight: 1.5,
                                },
                            }}
                        >
                            {t("roommates.card.defaultImageNotice", {
                                defaultValue:
                                    "Illustrative image only — this is not an actual photo of the property.",
                            })}
                        </Alert>
                    )}

                    {ownerName && (
                        <Typography
                            variant="caption"
                            noWrap
                            component="div"
                            sx={{ color: "text.secondary" }}
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
                    )}
                </Box>
            }
        />
    );
}
