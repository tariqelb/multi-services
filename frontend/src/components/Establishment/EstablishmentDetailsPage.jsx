
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    IconButton,
    Paper,
    Rating,
    Stack,
    Typography,
} from "@mui/material";

import {
    ArrowBack,
    Bed,
    Language,
    LocationOn,
    Phone,
    Email,
    Hotel,
    OpenInNew,
    WhatsApp,
    MeetingRoom,
    ChevronLeft,
    ChevronRight,
} from "@mui/icons-material";
import { OndemandVideo } from "@mui/icons-material";

import axiosInstance from "../../api/axiosInstance";

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

function FacilityItem({ label, enabled }) {
    if (!enabled) return null;

    return (
        <Chip
            label={label}
            variant="outlined"
            color="success"
            sx={{ borderRadius: 2 }}
        />
    );
}

function SectionTitle({ children }) {
    return (
        <Typography
            variant="h5"
            fontWeight={800}
            color="#0B2E5C"
            sx={{ mb: 2.5 }}
        >
            {children}
        </Typography>
    );
}

function EstablishmentGallery({ images, name, t }) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        setSelectedIndex(0);
    }, [images.join("|")]);

    const selectedImage = images[selectedIndex];

    const sideImages = images
        .map((image, index) => ({ image, index }))
        .filter((item) => item.index !== selectedIndex)
        .slice(0, 4);

    const showPrevious = () => {
        setSelectedIndex((current) =>
            current === 0 ? images.length - 1 : current - 1
        );
    };

    const showNext = () => {
        setSelectedIndex((current) =>
            current === images.length - 1 ? 0 : current + 1
        );
    };

    if (!images.length) {
        return (
            <Paper
                elevation={0}
                sx={{
                    height: 280,
                    bgcolor: "#e2e8f0",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 4,
                }}
            >
                <Hotel sx={{ fontSize: 80, color: "#94a3b8" }} />
            </Paper>
        );
    }

    return (
        <Grid container spacing={1} sx={{ mb: 4 }}>
            {/* Main selected image */}
            <Grid size={{ xs: 12, md: 8 }}>
                <Box
                    sx={{
                        position: "relative",
                        height: { xs: 260, sm: 350, md: 430 },
                        borderRadius: 3,
                        overflow: "hidden",
                        bgcolor: "#e2e8f0",
                    }}
                >
                    <Box
                        component="img"
                        src={selectedImage}
                        alt={name}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                        }}
                    />

                    {images.length > 1 && (
                        <>
                            <IconButton
                                onClick={showPrevious}
                                aria-label={t("establishments.details.previousImage", {
                                    defaultValue: "Previous image",
                                })}
                                sx={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    "&:hover": {
                                        bgcolor: "#fff",
                                    },
                                }}
                            >
                                <ChevronLeft />
                            </IconButton>

                            <IconButton
                                onClick={showNext}
                                aria-label={t("establishments.details.nextImage", {
                                    defaultValue: "Next image",
                                })}
                                sx={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    "&:hover": {
                                        bgcolor: "#fff",
                                    },
                                }}
                            >
                                <ChevronRight />
                            </IconButton>

                            <Chip
                                label={`${selectedIndex + 1} / ${images.length}`}
                                size="small"
                                sx={{
                                    position: "absolute",
                                    bottom: 14,
                                    right: 14,
                                    bgcolor: "rgba(15,23,42,0.75)",
                                    color: "#fff",
                                    fontWeight: 700,
                                }}
                            />
                        </>
                    )}
                </Box>
            </Grid>

            {/* Smaller images beside the main image */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Grid container spacing={1}>
                    {sideImages.map(({ image, index }) => (
                        <Grid
                            key={`${image}-${index}`}
                            size={{ xs: 6, md: 6 }}
                        >
                            <Box
                                onClick={() => setSelectedIndex(index)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    ) {
                                        event.preventDefault();
                                        setSelectedIndex(index);
                                    }
                                }}
                                sx={{
                                    position: "relative",
                                    height: {
                                        xs: 130,
                                        sm: 170,
                                        md: 212,
                                    },
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    outline:
                                        "2px solid transparent",
                                    "&:hover": {
                                        outline: "2px solid #2563EB",
                                    },
                                    "&:focus-visible": {
                                        outline: "2px solid #2563EB",
                                    },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={image}
                                    alt={`${name} ${index + 1}`}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                        bgcolor: "#e2e8f0",
                                        transition: "transform 0.25s",
                                    }}
                                />
                            </Box>
                        </Grid>
                    ))}

                    {images.length > 5 && (
                        <Grid size={12}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={showNext}
                                sx={{
                                    textTransform: "none",
                                    borderRadius: 2,
                                }}
                            >
                                {t("establishments.details.morePhotos", {
                                    defaultValue: "View more photos",
                                })}
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
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
            <Box
                sx={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !establishment) {
        return (
            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || tr("notFound", "Establishment not found.")}
                </Alert>

                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate("/establishments")}
                >
                    {tr("back", "Back to establishments")}
                </Button>
            </Container>
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

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Back button */}
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate("/establishments")}
                sx={{ mb: 3 }}
            >
                {tr("back", "Back to establishments")}
            </Button>

            {/* Main heading */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        color="#0B2E5C"
                    >
                        {name}
                    </Typography>

                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 1 }}
                    >
                        <LocationOn color="action" />

                        <Typography color="text.secondary">
                            {[
                                location.neighborhood,
                                location.city,
                            ]
                                .filter(Boolean)
                                .join(", ") ||
                                tr("locationNotSpecified", "Location not specified")}
                        </Typography>
                    </Stack>

                    {starRating > 0 && (
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            sx={{ mt: 1 }}
                        >
                            <Rating
                                value={starRating}
                                readOnly
                                precision={1}
                                sx={{
                                    color: "#F59E0B",
                                    fontSize: "1.5rem",
                                }}
                            />

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {starRating}{" "}
                                {tr("starClassification", "star classification")}
                            </Typography>
                        </Stack>
                    )}
                </Box>

                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                >
                    {accommodationType && (
                        <Chip
                            icon={<Hotel />}
                            label={accommodationType}
                            color="primary"
                        />
                    )}
                </Stack>
            </Stack>

            {/* Interactive cover image and gallery */}
            <EstablishmentGallery
                images={allImages}
                name={name}
                t={t}
            />

            <Grid container spacing={3}>
                {/* Main information */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* Description */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            border: "1px solid #e5e7eb",
                            borderRadius: 3,
                            mb: 3,
                        }}
                    >
                        <SectionTitle>
                            {tr("about", "About this establishment")}
                        </SectionTitle>

                        {shortDescription && (
                            <Typography
                                fontWeight={600}
                                sx={{ mb: 2 }}
                            >
                                {shortDescription}
                            </Typography>
                        )}

                        <Typography
                            color="text.secondary"
                            sx={{
                                whiteSpace: "pre-line",
                                lineHeight: 1.8,
                            }}
                        >
                            {fullDescription ||
                                tr("noDescription", "No additional description provided.")}
                        </Typography>

                        <Divider sx={{ my: 3 }} />

                        <Grid container spacing={2}>
                            {[
                                {
                                    label: tr("numberOfRooms", "Number of rooms"),
                                    value: numberOfRooms,
                                },
                                {
                                    label: tr("numberOfFloors", "Number of floors"),
                                    value: numberOfFloors,
                                },
                                {
                                    label: tr("established", "Established"),
                                    value: yearEstablished,
                                },
                            ]
                                .filter((item) => item.value != null)
                                .map((item) => (
                                    <Grid
                                        key={item.label}
                                        size={{ xs: 12, sm: 4 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {item.label}
                                        </Typography>

                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                        >
                                            {item.value}
                                        </Typography>
                                    </Grid>
                                ))}
                        </Grid>
                    </Paper>

                    {/* Rooms */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            border: "1px solid #e5e7eb",
                            borderRadius: 3,
                            mb: 3,
                        }}
                    >
                        <SectionTitle>
                            {tr("rooms", "Rooms & accommodation")}
                        </SectionTitle>

                        {rooms.length === 0 ? (
                            <Typography color="text.secondary">
                                {tr("noRooms", "No room information provided.")}
                            </Typography>
                        ) : (
                            <Stack spacing={2}>
                                {rooms.map((room, index) => {
                                    const roomPhotos = (
                                        room.photos || []
                                    )
                                        .map(getImageUrl)
                                        .filter(Boolean);

                                    return (
                                        <Card
                                            key={room._id || index}
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 2,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {roomPhotos.length > 0 && (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 1,
                                                        overflowX: "auto",
                                                        p: 1,
                                                    }}
                                                >
                                                    {roomPhotos.map(
                                                        (photo, photoIndex) => (
                                                            <Box
                                                                key={`${photo}-${photoIndex}`}
                                                                component="img"
                                                                src={photo}
                                                                alt={`${tr("room", "Room")} ${index + 1}`}
                                                                sx={{
                                                                    width: 160,
                                                                    height: 110,
                                                                    objectFit: "contain",
                                                                    bgcolor: "#e2e8f0",
                                                                    borderRadius: 1,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                </Box>
                                            )}

                                            <CardContent>
                                                <Stack
                                                    direction={{
                                                        xs: "column",
                                                        sm: "row",
                                                    }}
                                                    justifyContent="space-between"
                                                    spacing={1}
                                                >
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            fontWeight={700}
                                                        >
                                                            {room.roomType ||
                                                                `${tr("room", "Room")} ${index + 1}`}
                                                        </Typography>

                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {room.quantity || 1}{" "}
                                                            {tr("roomCount", "room(s)")}
                                                        </Typography>
                                                    </Box>

                                                    {room.pricePerNight != null && (
                                                        <Typography
                                                            variant="h6"
                                                            color="#0B2E5C"
                                                            fontWeight={800}
                                                        >
                                                            {Number(
                                                                room.pricePerNight
                                                            ).toLocaleString()}{" "}
                                                            MAD / {tr("night", "night")}
                                                        </Typography>
                                                    )}
                                                </Stack>

                                                {room.description && (
                                                    <Typography
                                                        color="text.secondary"
                                                        sx={{ mt: 2 }}
                                                    >
                                                        {room.description}
                                                    </Typography>
                                                )}

                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    flexWrap="wrap"
                                                    useFlexGap
                                                    sx={{ mt: 2 }}
                                                >
                                                    {room.maxGuests && (
                                                        <Chip
                                                            size="small"
                                                            icon={<MeetingRoom />}
                                                            label={`${room.maxGuests} ${tr("guests", "guests")}`}
                                                        />
                                                    )}

                                                    {room.bedConfiguration?.map(
                                                        (bed, bedIndex) => (
                                                            <Chip
                                                                key={`${bed}-${bedIndex}`}
                                                                size="small"
                                                                icon={<Bed />}
                                                                label={bed}
                                                            />
                                                        )
                                                    )}

                                                    {room.privateBathroom && (
                                                        <Chip
                                                            size="small"
                                                            label={tr("privateBathroom", "Private bathroom")}
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    )}

                                                    {room.airConditioning && (
                                                        <Chip
                                                            size="small"
                                                            label={tr("airConditioning", "Air conditioning")}
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    )}

                                                    {room.balconyOrTerrace && (
                                                        <Chip
                                                            size="small"
                                                            label={tr("balcony", "Balcony / terrace")}
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        )}
                    </Paper>

                    {/* Facilities */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            border: "1px solid #e5e7eb",
                            borderRadius: 3,
                            mb: 3,
                        }}
                    >
                        <SectionTitle>
                            {tr("facilitiesTitle", "Facilities & services")}
                        </SectionTitle>

                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                        >
                            {Object.entries(facilityLabels).map(
                                ([key, label]) => (
                                    <FacilityItem
                                        key={key}
                                        label={label}
                                        enabled={facilities[key]}
                                    />
                                )
                            )}

                            {(Array.isArray(facilities.otherServices)
                                ? facilities.otherServices
                                : facilities.otherServices
                                  ? [facilities.otherServices]
                                  : []
                            ).map((service, index) => (
                                <Chip
                                    key={`${service}-${index}`}
                                    label={service}
                                    variant="outlined"
                                />
                            ))}
                        </Stack>
                    </Paper>

                    {/* Location */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            border: "1px solid #e5e7eb",
                            borderRadius: 3,
                            mb: 3,
                        }}
                    >
                        <SectionTitle>
                            {tr("location", "Location")}
                        </SectionTitle>

                        <Typography color="text.secondary">
                            {location.fullAddress ||
                                tr("addressNotProvided", "Address not provided")}
                        </Typography>

                        {location.neighborhood && (
                            <Typography sx={{ mt: 1 }}>
                                {location.neighborhood}
                            </Typography>
                        )}

                        {mapLink && (
                            <Button
                                component="a"
                                href={mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<LocationOn />}
                                sx={{ mt: 2 }}
                            >
                                {tr("viewMap", "View on Google Maps")}
                                <OpenInNew sx={{ fontSize: 15, ml: 1 }} />
                            </Button>
                        )}
                    </Paper>

                    {/* YouTube video */}
                    {media.videoUrl && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, md: 3 },
                                border: "1px solid #e5e7eb",
                                borderRadius: 3,
                                mb: 3,
                            }}
                        >
                            <SectionTitle>
                                {tr("video", "Establishment video")}
                            </SectionTitle>

                            {youtubeVideoId ? (
                                <>
                                    <Box
                                        sx={{
                                            position: "relative",
                                            width: "100%",
                                            aspectRatio: "16 / 9",
                                            overflow: "hidden",
                                            borderRadius: 2,
                                            bgcolor: "#0F172A",
                                        }}
                                    >
                                        <Box
                                            component="iframe"
                                            src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                                            title={`${name} - ${tr("video", "Establishment video")}`}
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

                                    <Button
                                        component="a"
                                        href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        startIcon={<OndemandVideo />}
                                        endIcon={<OpenInNew />}
                                        sx={{
                                            mt: 1.5,
                                            textTransform: "none",
                                        }}
                                    >
                                        {tr("watchOnYoutube", "Watch on YouTube")}
                                    </Button>
                                </>
                            ) : (
                                <Alert severity="warning">
                                    {tr("invalidVideo", "This video link could not be embedded. You can try opening it directly.")}
                                    <Button
                                        component="a"
                                        href={media.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        endIcon={<OpenInNew />}
                                        sx={{ ml: 1 }}
                                    >
                                        {tr("openVideo", "Open video")}
                                    </Button>
                                </Alert>
                            )}
                        </Paper>
                    )}
                </Grid>

                {/* Contact sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: "1px solid #e5e7eb",
                            borderRadius: 3,
                            position: { md: "sticky" },
                            top: 90,
                        }}
                    >
                        <SectionTitle>
                            {tr("contactReservation", "Contact & reservation")}
                        </SectionTitle>

                        <Stack spacing={2}>
                            {phone && (
                                <Button
                                    component="a"
                                    href={`tel:${phone}`}
                                    variant="contained"
                                    startIcon={<Phone />}
                                    fullWidth
                                    sx={{
                                        bgcolor: "#0B2E5C",
                                        py: 1.3,
                                        "&:hover": {
                                            bgcolor: "#16477f",
                                        },
                                    }}
                                >
                                    {tr("call", "Call establishment")}
                                </Button>
                            )}

                            {whatsapp && (
                                <Button
                                    component="a"
                                    href={`https://wa.me/${whatsapp.replace(
                                        /^\+/,
                                        ""
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="contained"
                                    startIcon={<WhatsApp />}
                                    fullWidth
                                    sx={{
                                        bgcolor: "#16a34a",
                                        py: 1.3,
                                        "&:hover": {
                                            bgcolor: "#15803d",
                                        },
                                    }}
                                >
                                    {tr("whatsapp", "Contact on WhatsApp")}
                                </Button>
                            )}

                            {contact.email && (
                                <Button
                                    component="a"
                                    href={`mailto:${contact.email}`}
                                    variant="outlined"
                                    startIcon={<Email />}
                                    fullWidth
                                >
                                    {tr("sendEmail", "Send email")}
                                </Button>
                            )}

                            {website && (
                                <Button
                                    component="a"
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="outlined"
                                    startIcon={<Language />}
                                    fullWidth
                                >
                                    {tr("officialWebsite", "Official website")}
                                    <OpenInNew sx={{ fontSize: 15, ml: 1 }} />
                                </Button>
                            )}

                            {bookingWebsite && (
                                <Button
                                    component="a"
                                    href={bookingWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="contained"
                                    fullWidth
                                    sx={{
                                        bgcolor: "#e99b22",
                                        color: "#172033",
                                        py: 1.3,
                                        "&:hover": {
                                            bgcolor: "#d58a16",
                                        },
                                    }}
                                >
                                    {tr("bookingWebsite", "Visit booking website")}
                                    <OpenInNew sx={{ fontSize: 15, ml: 1 }} />
                                </Button>
                            )}
                        </Stack>

                        {/* Social media */}
                        {contact.socialMedia?.length > 0 && (
                            <>
                                <Divider sx={{ my: 3 }} />

                                <Typography
                                    fontWeight={700}
                                    sx={{ mb: 2 }}
                                >
                                    {tr("followUs", "Follow us")}
                                </Typography>

                                <Stack spacing={1}>
                                    {contact.socialMedia.map(
                                        (social, index) => (
                                            <Button
                                                key={`${social.url}-${index}`}
                                                component="a"
                                                href={social.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                endIcon={<OpenInNew />}
                                                sx={{
                                                    justifyContent: "flex-start",
                                                    textTransform: "none",
                                                }}
                                            >
                                                {social.platform ||
                                                    tr("socialMedia", "Social media")}
                                            </Button>
                                        )
                                    )}
                                </Stack>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
