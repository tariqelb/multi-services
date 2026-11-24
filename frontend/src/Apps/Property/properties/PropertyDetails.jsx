
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReportListingLink from "../listings/ReportListingLink";
import { VerifiedBadge } from "../listings/VerifiedContact";

import { Alert, Button, Snackbar } from "@mui/material";

import SaveToggleButton from "../../../Components/ui/SaveToggleButton";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import BathtubOutlinedIcon from "@mui/icons-material/BathtubOutlined";
import WeekendOutlinedIcon from "@mui/icons-material/WeekendOutlined";
import StairsOutlinedIcon from "@mui/icons-material/StairsOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import ChairOutlinedIcon from "@mui/icons-material/ChairOutlined";

import {
    DescriptionText,
    DetailsBackButton,
    DetailsContainer,
    DetailsHeader,
    DetailsLayout,
    DetailsSection,
    FactGrid,
    KeyValueList,
    MapLinkButton,
    MediaGallery,
    SidebarCard,
    StatusBadge,
    VideoEmbed,
} from "../../../Components/ui/DetailsKit";

import SimilarProperties from "./SimilarProperties";
import PropertyContactOwner from "./PropertyContactOwner";
import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import { getFurnishingStatus } from "../../../utils/furnishing";



function getRentalValueLabel(value, t) {
    const translations = {
        Daily: "properties.details.rentalPeriod.daily",
        Monthly: "properties.details.rentalPeriod.monthly",
        Furnished: "properties.details.furnishingStatus.furnished",
        Unfurnished: "properties.details.furnishingStatus.unfurnished",
    };

    const key = translations[value];

    return key ? t(key) : value || "";
}


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

        case "inactive":
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
                label: t("properties.card.inactive", "Inactive"),
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
    showSave = true,
    backAction,
    backLabel,
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

    // Inactive: the owner does not want to be contacted.
    const contactClosed = property.status === "Inactive" || property.contactHidden === true;
    const showOwnerContact = showContact && !contactClosed;

    const ownerEmail =
        property.showEmail === true && !contactClosed
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

    const statusTone = (() => {
        const s = String(property.status || "").toLowerCase();
        if (s === "available" || s === "active") return "success";
        if (s === "pending") return "warning";
        if (["sold", "rented", "unavailable"].includes(s)) return "error";
        return "default";
    })();

    const money = (value) =>
        value === undefined || value === null || value === ""
            ? null
            : `${formatPrice(value, i18n.language)} ${t("common.currency", "MAD")}`;

    const isRent = property.listingType === "For Rent";
    const propertyId = property._id || property.id;

    const facts = [
        { icon: <SquareFootRoundedIcon />, label: t("properties.details.surface"), value: property.surface ? `${property.surface} m²` : null },
        { icon: <BedOutlinedIcon />, label: t("properties.card.rooms"), value: property.rooms },
        { icon: <BathtubOutlinedIcon />, label: t("properties.card.bathrooms"), value: property.bathrooms },
        { icon: <WeekendOutlinedIcon />, label: t("properties.card.salons"), value: property.salons },
        { icon: <StairsOutlinedIcon />, label: t("properties.details.floor"), value: property.floor },
        {
            icon: <CategoryOutlinedIcon />,
            label: t("properties.details.propertyType"),
            value: getTranslatedPropertyValue(property.propertyType, t, "properties.categories"),
        },
        {
            icon: <ChairOutlinedIcon />,
            label: t("properties.details.furnishingStatus.label"),
            value: getFurnishingStatus(property) ? getRentalValueLabel(getFurnishingStatus(property), t) : null,
        },
        {
            icon: <BadgeOutlinedIcon />,
            label: t("properties.details.listingBy"),
            value: getTranslatedPropertyValue(property.role, t, "properties.details.roles"),
        },
        {
            icon: <ApartmentOutlinedIcon />,
            label: t("properties.details.syndicateFees"),
            value: property.syndicateFees != null ? money(property.syndicateFees) : null,
        },
    ];

    const rentalInfo = isRent
        ? [
            {
                label: t("properties.details.rentalPeriod.label"),
                value: property.rentalPeriod ? getRentalValueLabel(property.rentalPeriod, t) : null,
            },
            {
                label: t("properties.details.rentalContract"),
                value:
                    property.rentWithContract == null
                        ? null
                        : property.rentWithContract
                            ? t("properties.details.contractAvailable")
                            : t("properties.details.noContract"),
            },
            {
                label: t("properties.details.mortgageAgreement"),
                value:
                    property.mortgageAgreement == null
                        ? null
                        : property.mortgageAgreement
                            ? t("properties.details.accepted")
                            : t("properties.details.notAccepted"),
            },
            { label: t("properties.details.securityDeposit"), value: property.deposit != null ? money(property.deposit) : null },
            { label: t("properties.details.mediatorFee"), value: property.mediatorFee != null ? money(property.mediatorFee) : null },
        ].filter((item) => item.value !== null && item.value !== "")
        : [];

    // In the contact card, under WhatsApp (same place on every details page).
    const saveButton = showSave ? (
        <SaveToggleButton
            saved={saved}
            saving={saving}
            disabled={!propertyId}
            onClick={handleSaveClick}
            saveLabel={t("properties.details.save")}
            savedLabel={t("properties.details.unsave")}
        />
    ) : null;

    const main = (
        <>
            <MediaGallery
                images={images}
                alt={title}
                emptyIcon={<HomeWorkOutlinedIcon />}
                emptyLabel={t("properties.details.noImages")}
            />

            <DetailsSection title={t("properties.details.keyFacts", "Key facts")} icon={<InfoOutlinedIcon />}>
                <FactGrid items={facts} />
            </DetailsSection>

            <DetailsSection title={t("properties.details.description")} icon={<DescriptionOutlinedIcon />}>
                <DescriptionText>{description}</DescriptionText>
            </DetailsSection>

            {rentalInfo.length > 0 && (
                <DetailsSection title={t("properties.details.rentalInformation")} icon={<ReceiptLongOutlinedIcon />}>
                    <KeyValueList items={rentalInfo} />
                </DetailsSection>
            )}

            {youtubeVideoId && (
                <DetailsSection
                    title={t("properties.details.propertyVideo.title")}
                    icon={<PlayCircleOutlineRoundedIcon />}
                >
                    <VideoEmbed
                        src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                        title={title}
                        externalUrl={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                    />
                </DetailsSection>
            )}
        </>
    );

    const sidebar = (
        <>
            {showOwnerContact && <PropertyContactOwner property={property} withMobileBar saveButton={saveButton} />}

            {/* No contact card (inactive listing): the save button stays at the top. */}
            {!showOwnerContact && saveButton && <SidebarCard>{saveButton}</SidebarCard>}

            {showContact && contactClosed && (
                <SidebarCard>
                    <Alert severity="warning">
                        {t(
                            "properties.details.inactiveNoContact",
                            "This listing is inactive. The owner is not accepting contacts at the moment."
                        )}
                    </Alert>
                </SidebarCard>
            )}

            {(googleMapLink || fullAddress || location) && (
                <SidebarCard>
                    <KeyValueList
                        items={[
                            { icon: <PlaceOutlinedIcon />, label: t("properties.details.location", "Location"), value: location },
                            { label: t("properties.details.address", "Address"), value: fullAddress },
                        ]}
                    />
                    {googleMapLink && (
                        <MapLinkButton
                            href={googleMapLink}
                            label={t("properties.details.viewOnMaps")}
                            fullWidth
                        />
                    )}
                </SidebarCard>
            )}

            {ownerEmail && (
                <SidebarCard>
                    <Button
                        component="a"
                        href={`mailto:${ownerEmail}`}
                        variant="text"
                        startIcon={<MailOutlineRoundedIcon />}
                        sx={{ justifyContent: "flex-start", overflowWrap: "anywhere", textAlign: "start" }}
                        fullWidth
                    >
                        {ownerEmail}
                    </Button>
                    <VerifiedBadge verified={property.contactVerified?.email} />
                </SidebarCard>
            )}

            {/* Not on the owner's own view */}
            {showContact && (
                <ReportListingLink
                    title={title}
                    owner={[property.firstName, property.lastName].filter(Boolean).join(" ")}
                />
            )}
        </>
    );

    return (
        <DetailsContainer withMobileBar={showOwnerContact}>
            <DetailsBackButton onClick={backAction || (() => navigate(-1))} label={backLabel || t("properties.details.back")} />

            <DetailsHeader
                badges={
                    <>
                        <StatusBadge
                            tone="primary"
                            label={isRent ? t("properties.card.forRent") : t("properties.card.forSale")}
                        />
                        {statusInfo && <StatusBadge tone={statusTone} label={statusInfo.label} />}
                    </>
                }
                title={title}
                location={location}
                price={price ? `${price} ${t("common.currency", "MAD")}` : null}
                priceCaption={isRent && property.rentalPeriod ? getRentalValueLabel(property.rentalPeriod, t) : undefined}
            />

            <DetailsLayout main={main} sidebar={sidebar} />

            {similarProperties.length > 0 && (
                <SimilarProperties properties={similarProperties} onSelectProperty={onSelectSimilar} />
            )}

            <Snackbar
                open={feedback.open}
                autoHideDuration={3500}
                onClose={handleCloseFeedback}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                sx={{ bottom: { xs: 96, lg: 24 } }}
            >
                <Alert onClose={handleCloseFeedback} severity={feedback.severity} variant="filled" sx={{ width: "100%" }}>
                    {feedback.message}
                </Alert>
            </Snackbar>
        </DetailsContainer>
    );
}
