import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Stack, Typography } from "@mui/material";

import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import BathtubOutlinedIcon from "@mui/icons-material/BathtubOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import SmokingRoomsOutlinedIcon from "@mui/icons-material/SmokingRoomsOutlined";
import WcOutlinedIcon from "@mui/icons-material/WcOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import ChairOutlinedIcon from "@mui/icons-material/ChairOutlined";
import BalconyOutlinedIcon from "@mui/icons-material/BalconyOutlined";
import LocalParkingOutlinedIcon from "@mui/icons-material/LocalParkingOutlined";
import KitchenOutlinedIcon from "@mui/icons-material/KitchenOutlined";
import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import StairsOutlinedIcon from "@mui/icons-material/StairsOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";

import {
    DescriptionText,
    DetailsHeader,
    DetailsLayout,
    DetailsSection,
    FactGrid,
    KeyValueList,
    MapLinkButton,
    MediaGallery,
    MobileActionBar,
    VideoEmbed,
    OwnerSummary,
    SidebarCard,
    StatusBadge,
} from "../../../Components/ui/DetailsKit";

import getImageUrl from "../../../utils/getImageUrl";
import { trackListingContact } from "../../../api/trackContact";

const purposeTones = {
    "Share My Property": "success",
    "Share My Apartment": "success",
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

export default function RoommateDetails({ listing, showContact = true }) {
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
    }, [listing]);


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

    
    const ownerPhone = (
        listing?.phone ||
        owner?.phoneNumber ||
        owner?.notificationPreferences?.whatsapp?.phoneNumber ||
        owner?.whatsappPhoneNumber ||
        ""
    ).trim();

    const whatsappNumber = ownerPhone.replace(/\D/g, "");


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

    // Record the contact without delaying the call / WhatsApp link.
    const trackContact = (action) => {
        trackListingContact(
            "roommate",
            listing?._id || listing?.id,
            action
        );
    };

    const openMap = () => {
        if (!listing?.mapLink) return;

        window.open(
            listing.mapLink,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const hasValue = (value) => value !== undefined && value !== null && value !== "";
    const optionalYesNo = (value) => (value === undefined || value === null ? null : yesNo(value));
    const money = (value) => (hasValue(value) ? `${formatPrice(value)} ${t("common.currency", "MAD")}` : null);

    const hasTotalRent = hasValue(listing.totalRent);
    const mainPrice = money(hasTotalRent ? listing.totalRent : listing.individualRoomPrice);
    const priceCaption = [
        hasTotalRent
            ? translate("roommates.details.totalRent", "Total rent")
            : translate("roommates.details.roomPrice", "Individual room price"),
        rentPeriod,
    ]
        .filter(Boolean)
        .join(" / ");

    const location = [listing.neighborhood, listing.city].filter(Boolean).join(", ");

    const accommodationFacts = [
        { icon: <CategoryOutlinedIcon />, label: translate("roommates.fields.propertyType", "Property type"), value: propertyType },
        {
            icon: <ChairOutlinedIcon />,
            label: translate("roommates.fields.furnishing", "Furnishing"),
            value: translateEnum("roommates.furnishing", listing.furnishingStatus),
        },
        { icon: <MeetingRoomOutlinedIcon />, label: translate("roommates.fields.rooms", "Bedrooms"), value: listing.rooms },
        { icon: <BathtubOutlinedIcon />, label: translate("roommates.fields.bathrooms", "Bathrooms"), value: listing.bathrooms },
        {
            icon: <SquareFootRoundedIcon />,
            label: translate("roommates.fields.surface", "Surface"),
            value: hasValue(listing.surface) ? `${listing.surface} m²` : null,
        },
        { icon: <StairsOutlinedIcon />, label: translate("roommates.fields.floor", "Floor"), value: listing.floor },
        { icon: <BalconyOutlinedIcon />, label: translate("roommates.fields.balcony", "Balcony"), value: optionalYesNo(listing.hasBalcony) },
        { icon: <KitchenOutlinedIcon />, label: translate("roommates.fields.kitchen", "Kitchen"), value: optionalYesNo(listing.hasKitchen) },
        { icon: <LocalParkingOutlinedIcon />, label: translate("roommates.fields.parking", "Parking"), value: optionalYesNo(listing.hasParking) },
        {
            icon: <BuildOutlinedIcon />,
            label: translate("roommates.fields.condition", "Property condition"),
            value: translateEnum("roommates.condition", listing.propertyCondition),
        },
    ];

    const preferenceFacts = [
        {
            icon: <WcOutlinedIcon />,
            label: translate("roommates.fields.gender", "Preferred gender"),
            value: genderLabel[preferences.gender] || preferences.gender,
        },
        {
            icon: <SmokingRoomsOutlinedIcon />,
            label: translate("roommates.fields.smoking", "Smoking allowed"),
            value: optionalYesNo(preferences.smokingAllowed),
        },
        {
            icon: <PetsOutlinedIcon />,
            label: translate("roommates.fields.pets", "Pets allowed"),
            value: optionalYesNo(preferences.petsAllowed),
        },
    ];

    const availability = [
        { icon: <PeopleAltOutlinedIcon />, label: translate("roommates.fields.totalPeople", "Total capacity"), value: listing.totalPeople },
        { icon: <PeopleAltOutlinedIcon />, label: translate("roommates.fields.currentPeople", "Current occupants"), value: listing.currentPeople },
        { icon: <EventAvailableOutlinedIcon />, label: translate("roommates.fields.availablePlaces", "Available places"), value: availablePlaces },
        { icon: <CalendarMonthOutlinedIcon />, label: translate("roommates.fields.availableFrom", "Available from"), value: listing.availableFrom ? formatDate(listing.availableFrom) : null },
    ];

    const expenses = [
        { label: translate("roommates.details.rentPerPerson", "Estimated rent per person"), value: money(listing.rentPerPerson) },
        { label: translate("roommates.fields.deposit", "Deposit"), value: money(listing.deposit) },
        { label: translate("roommates.fields.syndicateFees", "Syndicate fees"), value: money(listing.syndicateFees) },
        { label: translate("roommates.fields.otherExpenses", "Other expenses"), value: money(listing.otherExpenses) },
    ];

    const handleCall = () => {
        if (!ownerPhone) return;
        trackContact("call");
        window.location.href = `tel:${ownerPhone}`;
    };

    const handleWhatsApp = () => {
        if (!whatsappNumber) return;
        trackContact("whatsapp");
        window.open(`https://wa.me/${whatsappNumber}`, "_blank", "noopener,noreferrer");
    };

    const whatsappSx = { bgcolor: "#16A34A", color: "#fff", "&:hover": { bgcolor: "#15803D" } };

    const main = (
        <>
            <MediaGallery
                images={images}
                alt={listing.title}
                emptyIcon={<HomeWorkOutlinedIcon />}
                emptyLabel={translate("roommates.details.noPhotos", "No photos available")}
            />

            <DetailsSection title={translate("roommates.details.description", "Description")} icon={<DescriptionOutlinedIcon />}>
                <DescriptionText>
                    {listing.description || translate("roommates.details.noDescription", "No description provided.")}
                </DescriptionText>
            </DetailsSection>

            <DetailsSection
                title={translate("roommates.details.accommodation", "Accommodation details")}
                icon={<HomeWorkOutlinedIcon />}
                action={
                    listing.mapLink ? (
                        <MapLinkButton onClick={openMap} label={translate("roommates.details.viewMap", "View location on map")} />
                    ) : null
                }
            >
                <FactGrid items={accommodationFacts} />
            </DetailsSection>

            <DetailsSection title={translate("roommates.details.preferences", "Roommate preferences")} icon={<FavoriteBorderRoundedIcon />}>
                <FactGrid items={preferenceFacts} />
            </DetailsSection>

            {youtubeEmbedUrl && (
                <DetailsSection title={translate("roommates.details.video", "Property video")} icon={<PlayCircleOutlineRoundedIcon />}>
                    <VideoEmbed src={youtubeEmbedUrl} title={listing.title} externalUrl={listing.youtubeVideoUrl} />
                </DetailsSection>
            )}
        </>
    );

    const sidebar = (
        <>
            <SidebarCard>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                    {translate("roommates.details.availability", "Availability")}
                </Typography>
                <KeyValueList items={availability} />
            </SidebarCard>

            {expenses.some((item) => item.value) && (
                <SidebarCard>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                        <ReceiptLongOutlinedIcon color="primary" fontSize="small" />
                        <Typography variant="h6">
                            {translate("roommates.details.additionalExpenses", "Additional expenses")}
                        </Typography>
                    </Stack>
                    <KeyValueList items={expenses} />
                </SidebarCard>
            )}

            <SidebarCard>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {showContact
                        ? translate("roommates.details.contactOwner", "Contact announcement owner")
                        : translate("roommates.details.owner", "Announcement owner")}
                </Typography>

                <OwnerSummary
                    name={ownerName || translate("roommates.details.owner", "Announcement owner")}
                    avatar={typeof owner === "object" ? owner?.profileImage : undefined}
                    subtitle={
                        listing.createdAt
                            ? `${translate("roommates.details.postedOn", "Posted on")} ${formatDate(listing.createdAt)}`
                            : undefined
                    }
                />

                {!showContact ? null : ownerPhone ? (
                    <Stack spacing={1.25} sx={{ mt: 2.5 }}>
                        <Button variant="contained" size="large" startIcon={<PhoneRoundedIcon />} onClick={handleCall} fullWidth>
                            {translate("roommates.details.callOwner", "Call owner")}
                        </Button>
                        {whatsappNumber && (
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<WhatsAppIcon />}
                                onClick={handleWhatsApp}
                                fullWidth
                                sx={whatsappSx}
                            >
                                {translate("roommates.details.whatsappOwner", "Contact via WhatsApp")}
                            </Button>
                        )}
                    </Stack>
                ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {translate("roommates.details.noPhone", "The owner has not provided a phone number.")}
                    </Alert>
                )}

                {ownerId && (
                    <Button
                        variant="outlined"
                        startIcon={<AccountCircleOutlinedIcon />}
                        onClick={() => navigate(`/profile/${ownerId}`)}
                        fullWidth
                        sx={{ mt: 1.25 }}
                    >
                        {translate("roommates.details.viewProfile", "View owner profile")}
                    </Button>
                )}
            </SidebarCard>
        </>
    );

    return (
        <>
            <DetailsHeader
                badges={
                    purpose ? (
                        <StatusBadge tone={purposeTones[purpose] || "default"} label={translateEnum("roommates.purpose", purpose)} />
                    ) : null
                }
                title={listing.title}
                location={location}
                price={mainPrice}
                priceCaption={priceCaption}
            />

            <DetailsLayout main={main} sidebar={sidebar} />

            {showContact && ownerPhone && (
                <MobileActionBar>
                    <Button variant="contained" startIcon={<PhoneRoundedIcon />} onClick={handleCall}>
                        {translate("roommates.details.call", "Call")}
                    </Button>
                    {whatsappNumber && (
                        <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={handleWhatsApp} sx={whatsappSx}>
                            {translate("roommates.details.whatsapp", "WhatsApp")}
                        </Button>
                    )}
                </MobileActionBar>
            )}
        </>
    );
}
