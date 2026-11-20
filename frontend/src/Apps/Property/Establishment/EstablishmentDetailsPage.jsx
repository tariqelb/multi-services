import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Rating,
    Stack,
    Typography,
} from "@mui/material";

import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import HotelOutlinedIcon from "@mui/icons-material/HotelOutlined";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RoomServiceOutlinedIcon from "@mui/icons-material/RoomServiceOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

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
    MobileActionBar,
    SidebarCard,
    StatusBadge,
    VideoEmbed,
} from "../../../Components/ui/DetailsKit";

import axiosInstance from "../../../api/axiosInstance";
import { trackListingContact } from "../../../api/trackContact";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

function getImageUrl(image) {
    if (!image) return "";

    const imagePath =
        typeof image === "string"
            ? image
            : image.path || image.url || image.filename || "";

    if (!imagePath) return "";

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
}

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
            [
                "youtube.com",
                "m.youtube.com",
                "youtube-nocookie.com",
            ].includes(hostname)
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

function formatPhoneNumber(phone) {
    return String(phone || "").replace(/[^\d+]/g, "");
}

function getStarRating(classification) {
    if (!classification) return 0;

    const match = String(classification).match(/[1-5]/);
    return match ? Number(match[0]) : 0;
}

export default function EstablishmentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const tr = (key, fallback) =>
        t(`establishments.details.${key}`, {
            defaultValue: fallback,
        });

    const [establishment, setEstablishment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const fetchEstablishment = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axiosInstance.get(
                    `/establishments/${id}`
                );

                if (active) {
                    setEstablishment(
                        response.data?.establishment || null
                    );
                }
            } catch (err) {
                console.error("Fetch establishment error:", err);

                if (active) {
                    setError(
                        err.response?.data?.message ||
                            tr(
                                "fetchError",
                                "Unable to retrieve this establishment."
                            )
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchEstablishment();
        }

        return () => {
            active = false;
        };
    }, [id]);

    const allImages = useMemo(() => {
        if (!establishment) return [];

        const coverImage = getImageUrl(
            establishment.media?.coverPhoto
        );

        const galleryImages = (
            establishment.media?.gallery || []
        )
            .map(getImageUrl)
            .filter(Boolean);

        return [
            ...new Set(
                [coverImage, ...galleryImages].filter(Boolean)
            ),
        ];
    }, [establishment]);

    if (loading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !establishment) {
        return (
            <DetailsContainer maxWidth={800}>
                <DetailsBackButton onClick={() => navigate(-1)} label={tr("back", "Back")} />
                <Alert severity="error">{error || tr("notFound", "Establishment not found.")}</Alert>
            </DetailsContainer>
        );
    }

    const {
        name,
        accommodationType,
        shortDescription,
        fullDescription,
        yearEstablished,
        numberOfRooms,
        numberOfFloors,
        officialClassification,
        location = {},
        rooms = [],
        facilities = {},
        contact = {},
        media = {},
    } = establishment;

    const phone = formatPhoneNumber(contact.phoneNumber);
    const whatsapp = formatPhoneNumber(contact.whatsappNumber);

    const website = contact.officialWebsite;
    const bookingWebsite = contact.bookingWebsite;

    const starRating = getStarRating(officialClassification);
    const youtubeVideoId = getYoutubeVideoId(media.videoUrl);

    const mapLink =
        location.googleMapsLink ||
        (location.fullAddress
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  location.fullAddress
              )}`
            : "");

    // Record the contact without delaying the link / call.
    const trackContact = (action, target = "") => {
        trackListingContact(
            "establishment",
            establishment._id || id,
            action,
            target
        );
    };

    const facilityLabels = {
        swimmingPool: tr("facilities.swimmingPool", "Swimming pool"),
        restaurant: tr("facilities.restaurant", "Restaurant"),
        breakfast: tr("facilities.breakfast", "Breakfast"),
        wifi: tr("facilities.wifi", "Wi-Fi"),
        parking: tr("facilities.parking", "Parking"),
        spaHammam: tr("facilities.spaHammam", "Spa / Hammam"),
        airportTransfer: tr("facilities.airportTransfer", "Airport transfer"),
        gardenRooftop: tr("facilities.gardenRooftop", "Garden / Rooftop"),
        reception: tr("facilities.reception", "Reception"),
        laundry: tr("facilities.laundry", "Laundry"),
        roomService: tr("facilities.roomService", "Room service"),
    };

    const translateOption = (value) =>
        value
            ? t(`establishmentForm.options.${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, {
                defaultValue: value,
            })
            : "";

    const locationLabel =
        [location.neighborhood, location.city].filter(Boolean).join(", ") ||
        tr("locationNotSpecified", "Location not specified");

    const otherServices = Array.isArray(facilities.otherServices)
        ? facilities.otherServices
        : facilities.otherServices
            ? [facilities.otherServices]
            : [];

    const enabledFacilities = Object.entries(facilityLabels).filter(([key]) => facilities[key]);

    const roomPrices = rooms.map((room) => Number(room.pricePerNight)).filter((value) => Number.isFinite(value) && value > 0);
    const fromPrice = roomPrices.length ? Math.min(...roomPrices) : null;

    const whatsappSx = { bgcolor: "#16A34A", color: "#fff", "&:hover": { bgcolor: "#15803D" } };

    const openCall = () => {
        if (!phone) return;
        trackContact("call");
        window.location.href = `tel:${phone}`;
    };

    const openWhatsApp = () => {
        if (!whatsapp) return;
        trackContact("whatsapp");
        window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer");
    };

    const overviewFacts = [
        { icon: <MeetingRoomOutlinedIcon />, label: tr("numberOfRooms", "Number of rooms"), value: numberOfRooms },
        { icon: <LayersOutlinedIcon />, label: tr("numberOfFloors", "Number of floors"), value: numberOfFloors },
        { icon: <CalendarMonthOutlinedIcon />, label: tr("established", "Established"), value: yearEstablished },
    ];

    const main = (
        <>
            <MediaGallery
                images={allImages}
                alt={name}
                emptyIcon={<HotelOutlinedIcon />}
                emptyLabel={tr("noImages", "No photos available")}
            />

            <DetailsSection title={tr("about", "About this establishment")} icon={<InfoOutlinedIcon />}>
                {shortDescription && (
                    <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                        {shortDescription}
                    </Typography>
                )}
                <DescriptionText>
                    {fullDescription || tr("noDescription", "No additional description provided.")}
                </DescriptionText>
                {overviewFacts.some((item) => item.value != null && item.value !== "") && (
                    <Box sx={{ mt: 2.5 }}>
                        <FactGrid items={overviewFacts} />
                    </Box>
                )}
            </DetailsSection>

            <DetailsSection title={tr("rooms", "Rooms & accommodation")} icon={<BedOutlinedIcon />}>
                {rooms.length === 0 ? (
                    <Typography sx={{ color: "text.secondary" }}>{tr("noRooms", "No room information provided.")}</Typography>
                ) : (
                    <Stack spacing={2}>
                        {rooms.map((room, index) => {
                            const roomPhotos = (room.photos || []).map(getImageUrl).filter(Boolean);
                            const roomTitle = room.roomType ? translateOption(room.roomType) : `${tr("room", "Room")} ${index + 1}`;

                            return (
                                <Paper
                                    key={room._id || index}
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: { xs: "column", sm: "row" },
                                    }}
                                >
                                    {roomPhotos.length > 0 && (
                                        <Box
                                            sx={{
                                                width: { xs: "100%", sm: 220 },
                                                flexShrink: 0,
                                                display: "flex",
                                                overflowX: "auto",
                                                scrollSnapType: "x mandatory",
                                                bgcolor: "background.muted",
                                            }}
                                        >
                                            {roomPhotos.map((src, photoIndex) => (
                                                <Box
                                                    key={`${src}-${photoIndex}`}
                                                    component="img"
                                                    src={src}
                                                    alt={`${roomTitle} ${photoIndex + 1}`}
                                                    loading="lazy"
                                                    sx={{
                                                        width: "100%",
                                                        flex: "0 0 100%",
                                                        height: { xs: 190, sm: "100%" },
                                                        minHeight: { sm: 170 },
                                                        objectFit: "cover",
                                                        scrollSnapAlign: "start",
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}

                                    <Box sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, minWidth: 0 }}>
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            useFlexGap sx={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="subtitle1">{roomTitle}</Typography>
                                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                    {room.quantity || 1} {tr("roomCount", "room(s)")}
                                                </Typography>
                                            </Box>

                                            {room.pricePerNight != null && (
                                                <Typography sx={{ fontWeight: 800, color: "primary.main", whiteSpace: "nowrap" }}>
                                                    {Number(room.pricePerNight).toLocaleString()} {t("common.currency", "MAD")}
                                                    <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>
                                                        {" "}/ {tr("night", "night")}
                                                    </Typography>
                                                </Typography>
                                            )}
                                        </Stack>

                                        {room.description && (
                                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.25 }}>
                                                {room.description}
                                            </Typography>
                                        )}

                                        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                                            {room.maxGuests && (
                                                <Chip size="small" icon={<PeopleAltOutlinedIcon />} label={`${room.maxGuests} ${tr("guests", "guests")}`} />
                                            )}
                                            {room.bedConfiguration?.map((bed, bedIndex) => (
                                                <Chip key={`${bed}-${bedIndex}`} size="small" icon={<BedOutlinedIcon />} label={translateOption(bed)} />
                                            ))}
                                            {room.privateBathroom && <Chip size="small" label={tr("privateBathroom", "Private bathroom")} />}
                                            {room.airConditioning && <Chip size="small" label={tr("airConditioning", "Air conditioning")} />}
                                            {room.balconyOrTerrace && <Chip size="small" label={tr("balcony", "Balcony / terrace")} />}
                                        </Stack>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </DetailsSection>

            {(enabledFacilities.length > 0 || otherServices.length > 0) && (
                <DetailsSection title={tr("facilitiesTitle", "Facilities & services")} icon={<RoomServiceOutlinedIcon />}>
                    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
                        {enabledFacilities.map(([key, label]) => (
                            <Chip
                                key={key}
                                icon={<CheckCircleRoundedIcon />}
                                label={label}
                                sx={{ bgcolor: "success.light", color: "success.dark", "& .MuiChip-icon": { color: "inherit" } }}
                            />
                        ))}
                        {otherServices.map((service, index) => (
                            <Chip key={`${service}-${index}`} label={service} variant="outlined" />
                        ))}
                    </Stack>
                </DetailsSection>
            )}

            {media.videoUrl && (
                <DetailsSection title={tr("video", "Establishment video")} icon={<PlayCircleOutlineRoundedIcon />}>
                    {youtubeVideoId ? (
                        <VideoEmbed
                            src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                            title={`${name} - ${tr("video", "Establishment video")}`}
                            externalUrl={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                        />
                    ) : (
                        <Alert
                            severity="info"
                            action={
                                <Button
                                    component="a"
                                    href={media.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    color="inherit"
                                >
                                    {tr("openVideo", "Open video")}
                                </Button>
                            }
                        >
                            {tr("invalidVideo", "This video link could not be embedded. You can try opening it directly.")}
                        </Alert>
                    )}
                </DetailsSection>
            )}
        </>
    );

    const contactLinks = [
        contact.email && {
            key: "email",
            icon: <MailOutlineRoundedIcon />,
            label: tr("sendEmail", "Send email"),
            href: `mailto:${contact.email}`,
        },
        website && {
            key: "website",
            icon: <LanguageRoundedIcon />,
            label: tr("officialWebsite", "Official website"),
            href: website,
            external: true,
        },
        bookingWebsite && {
            key: "booking",
            icon: <EventAvailableOutlinedIcon />,
            label: tr("bookingWebsite", "Visit booking website"),
            href: bookingWebsite,
            external: true,
        },
    ].filter(Boolean);

    const sidebar = (
        <>
            <SidebarCard>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {tr("contactReservation", "Contact & reservation")}
                </Typography>
                {fromPrice != null && (
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                        {tr("fromPrice", "From")}{" "}
                        <Box component="span" sx={{ fontWeight: 800, color: "primary.main", fontSize: "1.1rem" }}>
                            {fromPrice.toLocaleString()} {t("common.currency", "MAD")}
                        </Box>{" "}
                        / {tr("night", "night")}
                    </Typography>
                )}

                <Stack spacing={1.25} sx={{ mt: fromPrice != null ? 0 : 1.5 }}>
                    {phone && (
                        <Button variant="contained" size="large" startIcon={<PhoneRoundedIcon />} onClick={openCall} fullWidth>
                            {tr("call", "Call establishment")}
                        </Button>
                    )}
                    {whatsapp && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<WhatsAppIcon />}
                            onClick={openWhatsApp}
                            fullWidth
                            sx={whatsappSx}
                        >
                            {tr("whatsapp", "Contact on WhatsApp")}
                        </Button>
                    )}
                    {contactLinks.map((link) => (
                        <Button
                            key={link.key}
                            component="a"
                            href={link.href}
                            target={link.external ? "_blank" : undefined}
                            rel={link.external ? "noopener noreferrer" : undefined}
                            onClick={() => trackContact(link.key)}
                            variant="outlined"
                            startIcon={link.icon}
                            endIcon={link.external ? <OpenInNewRoundedIcon sx={{ fontSize: "16px !important" }} /> : null}
                            fullWidth
                        >
                            {link.label}
                        </Button>
                    ))}
                    {!phone && !whatsapp && contactLinks.length === 0 && (
                        <Alert severity="info">{tr("noContact", "No contact information provided.")}</Alert>
                    )}
                </Stack>

                {contact.socialMedia?.length > 0 && (
                    <Box sx={{ mt: 2.5 }}>
                        <Typography variant="overline" sx={{ color: "text.secondary" }}>
                            {tr("followUs", "Follow us")}
                        </Typography>
                        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                            {contact.socialMedia.map((social, index) => (
                                <Chip
                                    key={`${social.url}-${index}`}
                                    component="a"
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    clickable
                                    onClick={() => trackContact("social", social.platform || "")}
                                    label={social.platform || tr("socialMedia", "Social media")}
                                    variant="outlined"
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
            </SidebarCard>

            <SidebarCard>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                    <PlaceOutlinedIcon color="primary" fontSize="small" />
                    <Typography variant="h6">{tr("location", "Location")}</Typography>
                </Stack>
                <KeyValueList
                    items={[
                        { label: t("common.city", "City"), value: location.city },
                        { label: t("common.neighborhood", "Neighborhood"), value: location.neighborhood },
                    ]}
                />
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, mb: 2, overflowWrap: "anywhere" }}>
                    {location.fullAddress || tr("addressNotProvided", "Address not provided")}
                </Typography>
                {mapLink && (
                    <MapLinkButton href={mapLink} label={tr("viewMap", "View on Google Maps")} fullWidth />
                )}
            </SidebarCard>
        </>
    );

    return (
        <DetailsContainer withMobileBar={Boolean(phone || whatsapp)}>
            <DetailsBackButton onClick={() => navigate(-1)} label={tr("back", "Back")} />

            <DetailsHeader
                badges={
                    <>
                        {accommodationType && (
                            <StatusBadge tone="primary" icon={<HotelOutlinedIcon />} label={translateOption(accommodationType)} />
                        )}
                    </>
                }
                title={name}
                location={locationLabel}
                subtitle={
                    starRating > 0 ? (
                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                            <Rating value={starRating} readOnly size="small" sx={{ color: "#F59E0B" }} />
                            {starRating} {tr("starClassification", "star classification")}
                        </Box>
                    ) : null
                }
                price={fromPrice != null ? `${fromPrice.toLocaleString()} ${t("common.currency", "MAD")}` : null}
                priceCaption={fromPrice != null ? `${tr("fromPrice", "From")} / ${tr("night", "night")}` : undefined}
            />

            <DetailsLayout main={main} sidebar={sidebar} />

            {(phone || whatsapp) && (
                <MobileActionBar>
                    {phone && (
                        <Button variant="contained" startIcon={<PhoneRoundedIcon />} onClick={openCall}>
                            {tr("callShort", "Call")}
                        </Button>
                    )}
                    {whatsapp && (
                        <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={openWhatsApp} sx={whatsappSx}>
                            {tr("whatsappShort", "WhatsApp")}
                        </Button>
                    )}
                </MobileActionBar>
            )}
        </DetailsContainer>
    );
}
