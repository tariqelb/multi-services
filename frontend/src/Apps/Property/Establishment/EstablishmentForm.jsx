
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Rating,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
// import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Delete, DeleteForever } from "@mui/icons-material";
import cities from "../../../data/moroccanCities";

/* --------------------------------------------------
   CONSTANTS
-------------------------------------------------- */

const accommodationTypes = [
    "Hotel",
    "Riad",
    "Guesthouse",
    "Hostel",
    "Aparthotel",
    "Other",
];

const roomTypes = [
    "Single Room",
    "Double Room",
    "Twin Room",
    "Triple Room",
    "Family Room",
    "Suite",
    "Deluxe Room",
    "Studio",
    "Apartment",
    "Dormitory",
    "Other",
];

const bedTypes = [
    "Single Bed",
    "Double Bed",
    "Queen Bed",
    "King Bed",
    "Sofa Bed",
    "Bunk Bed",
];

const facilityFields = [
    { name: "swimmingPool", label: "Swimming pool", icon: "🏊" },
    { name: "restaurant", label: "Restaurant", icon: "🍽️" },
    { name: "breakfast", label: "Breakfast", icon: "🥐" },
    { name: "wifi", label: "Wi-Fi", icon: "📶" },
    { name: "parking", label: "Parking", icon: "🚗" },
    { name: "spaHammam", label: "Spa / Hammam", icon: "🧖" },
    { name: "airportTransfer", label: "Airport transfer", icon: "✈️" },
    { name: "gardenRooftop", label: "Garden / Rooftop", icon: "🌿" },
    { name: "reception", label: "Reception", icon: "🛎️" },
    { name: "laundry", label: "Laundry", icon: "🧺" },
    { name: "roomService", label: "Room service", icon: "🛎️" },
];

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        backgroundColor: "#ffffff",
        "& fieldset": { borderColor: "#D5DCE8" },
        "&:hover fieldset": { borderColor: "#93C5FD" },
        "&.Mui-focused fieldset": {
            borderColor: "#2563EB",
            borderWidth: "1.5px",
        },
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#2563EB",
    },
};

/* --------------------------------------------------
   YOUTUBE HELPER
-------------------------------------------------- */

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

/* --------------------------------------------------
   IMAGE GALLERY VIEWER

   Supports:
   - Previous / next navigation
   - Thumbnail selection
   - Removing the selected image
-------------------------------------------------- */

function ImageGalleryViewer({
    images = [],
    onRemove,
    height = 220,
    translate,
    emptyText = "No images selected",
}) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (activeIndex >= images.length) {
            setActiveIndex(Math.max(0, images.length - 1));
        }
    }, [images.length, activeIndex]);

    if (!images.length) {
        return (
            <Box
                sx={{
                    p: 3,
                    border: "1px dashed #CBD5E1",
                    borderRadius: 2,
                    textAlign: "center",
                    color: "text.secondary",
                }}
            >
                <Typography variant="body2">
                    {emptyText}
                </Typography>
            </Box>
        );
    }

    const activeImage = images[activeIndex];

    const getImageSource = (image) =>
        image?.preview || image?.path || image?.url || image;

    const previousImage = () => {
        setActiveIndex((current) =>
            current === 0 ? images.length - 1 : current - 1
        );
    };

    const nextImage = () => {
        setActiveIndex((current) =>
            current === images.length - 1 ? 0 : current + 1
        );
    };

    const removeActiveImage = () => {
        onRemove?.(activeIndex);
        setActiveIndex((current) =>
            Math.max(0, Math.min(current, images.length - 2))
        );
    };

    return (
        <Stack spacing={1.5}>
            {/* MAIN IMAGE */}
            <Box
                sx={{
                    position: "relative",
                    width: "100%",
                    height,
                    bgcolor: "#0F172A",
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                <Box
                    component="img"
                    src={getImageSource(activeImage)}
                    alt={`Image ${activeIndex + 1}`}
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                    }}
                />

                {/* IMAGE COUNTER */}
                <Chip
                    label={`${activeIndex + 1} / ${images.length}`}
                    size="small"
                    sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        bgcolor: "rgba(15,23,42,0.75)",
                        color: "#fff",
                        fontWeight: 600,
                    }}
                />

                {/* PREVIOUS */}
                {images.length > 1 && (
                    <IconButton
                        onClick={previousImage}
                        aria-label="Previous image"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: 10,
                            transform: "translateY(-50%)",
                            bgcolor: "rgba(255,255,255,0.9)",
                            "&:hover": {
                                bgcolor: "#fff",
                            },
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                )}

                {/* NEXT */}
                {images.length > 1 && (
                    <IconButton
                        onClick={nextImage}
                        aria-label="Next image"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            right: 10,
                            transform: "translateY(-50%)",
                            bgcolor: "rgba(255,255,255,0.9)",
                            "&:hover": {
                                bgcolor: "#fff",
                            },
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                )}

                {/* REMOVE */}
                {onRemove && (
                    <IconButton
                        onClick={removeActiveImage}
                        aria-label="Remove image"
                        sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            bgcolor: "rgba(255,255,255,0.9)",
                            color: "#DC2626",
                            "&:hover": {
                                bgcolor: "#FEE2E2",
                            },
                        }}
                    >
                        <Delete />
                    </IconButton>
                )}
            </Box>

            {/* THUMBNAILS */}
            {images.length > 1 && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        overflowX: "auto",
                        pb: 1,
                        "&::-webkit-scrollbar": {
                            height: 6,
                        },
                    }}
                >
                    {images.map((image, index) => (
                        <Box
                            key={image.preview || image.path || index}
                            onClick={() => setActiveIndex(index)}
                            sx={{
                                flex: "0 0 auto",
                                width: 76,
                                height: 62,
                                borderRadius: 1.5,
                                overflow: "hidden",
                                cursor: "pointer",
                                border: index === activeIndex
                                    ? "3px solid #2563EB"
                                    : "2px solid #E2E8F0",
                                opacity: index === activeIndex ? 1 : 0.65,
                                transition: "all 0.2s",
                                "&:hover": {
                                    opacity: 1,
                                },
                            }}
                        >
                            <Box
                                component="img"
                                src={getImageSource(image)}
                                alt={`Thumbnail ${index + 1}`}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </Box>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

/* --------------------------------------------------
   SECTION COMPONENTS
-------------------------------------------------- */

function SectionHeader({ icon, title, subtitle, number }) {
    return (
        <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "12px",
                        bgcolor: "#EFF6FF",
                        color: "#2563EB",
                        fontSize: "21px",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#0F172A",
                            fontSize: "1.08rem",
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#5B6577", mt: 0.3 }}
                    >
                        {subtitle}
                    </Typography>
                </Box>

                <Chip
                    label={`0${number}`}
                    size="small"
                    sx={{
                        fontWeight: 700,
                        color: "#2563EB",
                        bgcolor: "#EFF6FF",
                        borderRadius: "8px",
                    }}
                />
            </Stack>

            <Divider sx={{ mt: 2.5, borderColor: "#E2E8F0" }} />
        </Box>
    );
}

function SectionPaper({ children }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3.5, md: 4 },
                mb: 3,
                border: "1px solid #E2E8F0",
                borderRadius: "16px",
                bgcolor: "#ffffff",
                boxShadow: "0 3px 12px rgba(15, 23, 42, 0.025)",
            }}
        >
            {children}
        </Paper>
    );
}

/* --------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */

export default function EstablishmentForm({
    formData,
    errors = {},
    loading,
    coverFile,
    galleryFiles = [],
    notification,
    otherService,
    socialPlatform,
    socialUrl,
    setOtherService,
    setSocialPlatform,
    setSocialUrl,
    handleChange,
    updateNestedField,
    updateRoom,
    addRoom,
    removeRoom,
    toggleBed,
    handleRoomPhotos,
    removeRoomPhoto,
    handleCoverChange,
    removeCover,
    handleGalleryChange,
    removeGalleryImage,
    addOtherService,
    removeOtherService,
    addSocialLink,
    removeSocialLink,
    handleSubmit,
    resetForm,
    closeNotification,
}) {
    const { t } = useTranslation();
    const coverInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    // Translation helper with English fallback.
    const tr = (key, fallback) =>
        t(`establishmentForm.${key}`, {
            defaultValue: fallback,
        });

    const selectedCity =
        cities.find(
            (city) =>
                city.en.toLowerCase() ===
                (formData.location?.city || "").toLowerCase()
        ) || null;

    const youtubeVideoId = getYoutubeVideoId(
        formData.media?.videoUrl
    );

    const classificationValue = Number.parseInt(
        formData.officialClassification,
        10
    );

    const hotelStarRating =
        Number.isInteger(classificationValue) &&
        classificationValue >= 1 &&
        classificationValue <= 5
            ? classificationValue
            : 0;

    const translateOption = (value) =>
        tr(
            `options.${value.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
            value
        );

    const renderField = (name, label, options = {}) => (
        <TextField
            fullWidth
            size="medium"
            sx={fieldSx}
            name={name}
            label={label}
            value={formData[name] ?? ""}
            onChange={handleChange}
            error={Boolean(errors[name])}
            helperText={errors[name] || ""}
            {...options}
        />
    );

    const renderNestedField = (
        section,
        name,
        label,
        options = {}
    ) => (
        <TextField
            fullWidth
            size="medium"
            sx={fieldSx}
            label={label}
            value={formData[section]?.[name] ?? ""}
            onChange={(e) =>
                updateNestedField(section, name, e.target.value)
            }
            {...options}
        />
    );

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1100,
                mx: "auto",
                py: { xs: 2, md: 4 },
                px: { xs: 1, sm: 2 },
            }}
        >
            {/* PAGE HEADER */}
            <Box sx={{ mb: 4, px: { xs: 1, sm: 0 } }}>
                <Chip
                    label={tr("badge", "ACCOMMODATION")}
                    size="small"
                    sx={{
                        bgcolor: "#EFF6FF",
                        color: "#2563EB",
                        fontWeight: 600,
                        mb: 1.5,
                    }}
                />

                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        color: "#0F172A",
                        fontSize: "1.875rem",
                        mb: 1,
                    }}
                >
                    {tr("title", "Add your establishment")}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{ color: "#5B6577", maxWidth: 650, lineHeight: 1.8 }}
                >
                    {tr(
                        "description",
                        "Create a detailed profile for your hotel, riad, guesthouse or other accommodation."
                    )}
                </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
                {/* 01 INFORMATION */}
                <SectionPaper>
                    <SectionHeader
                        icon="🏨"
                        title={tr("sections.information", "Establishment information")}
                        subtitle={tr("sections.informationSubtitle", "Introduce your accommodation.")}
                        number={1}
                    />

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderField(
                                "name",
                                tr("fields.name", "Establishment name"),
                                {
                                    required: true,
                                    placeholder: tr("placeholders.name", "e.g. Riad Atlas Palace"),
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                fullWidth
                                required
                                label={tr("fields.accommodationType", "Accommodation type")}
                                value={formData.accommodationType || ""}
                                onChange={(e) =>
                                    handleChange({
                                        target: {
                                            name: "accommodationType",
                                            value: e.target.value,
                                        },
                                    })
                                }
                                error={Boolean(errors.accommodationType)}
                                helperText={errors.accommodationType}
                                sx={fieldSx}
                            >
                                {accommodationTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {translateOption(type)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            {renderField(
                                "shortDescription",
                                tr("fields.shortDescription", "Short description"),
                                {
                                    multiline: true,
                                    rows: 2,
                                    placeholder: tr("placeholders.shortDescription", "A short introduction..."),
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            {renderField(
                                "fullDescription",
                                tr("fields.fullDescription", "Full description"),
                                {
                                    multiline: true,
                                    rows: 5,
                                    placeholder: tr("placeholders.fullDescription", "Describe your establishment..."),
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            {renderField(
                                "yearEstablished",
                                tr("fields.yearEstablished", "Year established"),
                                {
                                    type: "number",
                                    slotProps: {
                                        htmlInput: {
                                            min: 1000,
                                            max: new Date().getFullYear(),
                                        },
                                    },
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            {renderField(
                                "numberOfRooms",
                                tr("fields.numberOfRooms", "Number of rooms"),
                                {
                                    type: "number",
                                    slotProps: { htmlInput: { min: 0 } },
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            {renderField(
                                "numberOfFloors",
                                tr("fields.numberOfFloors", "Number of floors"),
                                {
                                    type: "number",
                                    slotProps: { htmlInput: { min: 0 } },
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Stack spacing={1}>
                                <TextField
                                    select
                                    fullWidth
                                    label={tr("fields.classification", "Hotel classification")}
                                    value={formData.officialClassification || ""}
                                    onChange={(e) =>
                                        handleChange({
                                            target: {
                                                name: "officialClassification",
                                                value: e.target.value,
                                            },
                                        })
                                    }
                                    sx={fieldSx}
                                >
                                    <MenuItem value="">
                                        {tr("notClassified", "Not classified")}
                                    </MenuItem>

                                    {[1, 2, 3, 4, 5].map((stars) => (
                                        <MenuItem
                                            key={stars}
                                            value={`${stars} ${stars === 1 ? "Star" : "Stars"}`}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                            >
                                                <Rating value={stars} readOnly size="small" />
                                                <Typography variant="body2">
                                                    {stars}{" "}
                                                    {stars === 1
                                                        ? tr("star", "Star")
                                                        : tr("stars", "Stars")}
                                                </Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {hotelStarRating > 0 && (
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        <Rating
                                            value={hotelStarRating}
                                            readOnly
                                            precision={1}
                                            sx={{ color: "#F59E0B" }}
                                        />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {hotelStarRating}{" "}
                                            {tr("stars", "Stars")}
                                        </Typography>
                                    </Stack>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </SectionPaper>

                {/* 02 LOCATION */}
                <SectionPaper>
                    <SectionHeader
                        icon="📍"
                        title={tr("sections.location", "Location")}
                        subtitle={tr("sections.locationSubtitle", "Where can visitors find your establishment?")}
                        number={2}
                    />

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                options={cities}
                                value={selectedCity}
                                onChange={(_, value) =>
                                    updateNestedField(
                                        "location",
                                        "city",
                                        value?.en || ""
                                    )
                                }
                                getOptionLabel={(option) => option.en}
                                isOptionEqualToValue={(a, b) => a.en === b.en}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        required
                                        label={tr("fields.city", "City")}
                                        placeholder={tr("placeholders.city", "Select a city")}
                                        sx={fieldSx}
                                        error={Boolean(errors.city)}
                                        helperText={errors.city}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderNestedField(
                                "location",
                                "neighborhood",
                                tr("fields.neighborhood", "Neighborhood")
                            )}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            {renderNestedField(
                                "location",
                                "fullAddress",
                                tr("fields.fullAddress", "Full address"),
                                {
                                    required: true,
                                    multiline: true,
                                    rows: 2,
                                    error: Boolean(errors.fullAddress),
                                    helperText: errors.fullAddress,
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            {renderNestedField(
                                "location",
                                "googleMapsLink",
                                tr("fields.googleMapsLink", "Google Maps link"),
                                {
                                    type: "url",
                                    placeholder: "https://maps.google.com/...",
                                    helperText: tr(
                                        "helpers.googleMaps",
                                        "Add a Google Maps share link so the location coordinates can be extracted automatically."
                                    ),
                                }
                            )}
                        </Grid>
                    </Grid>
                </SectionPaper>

                {/* 03 ROOMS */}
                <SectionPaper>
                    <SectionHeader
                        icon="🛏️"
                        title={tr("sections.rooms", "Rooms and accommodation")}
                        subtitle={tr("sections.roomsSubtitle", "Define your room categories and their prices.")}
                        number={3}
                    />

                    <Stack spacing={3}>
                        {(formData.rooms || []).map((room, index) => (
                            <Paper
                                key={index}
                                variant="outlined"
                                sx={{
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: "12px",
                                    borderColor: "#DCE3ED",
                                    bgcolor: "#FCFDFF",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{ mb: 2.5 }}
                                >
                                    <Chip
                                        label={`${tr("roomType", "Room type")} ${index + 1}`}
                                        color="primary"
                                        variant="outlined"
                                    />

                                    <Button
                                        color="error"
                                        size="small"
                                        startIcon={<Delete />}
                                        onClick={() => removeRoom(index)}
                                    >
                                        {tr("actions.remove", "Remove")}
                                    </Button>
                                </Stack>

                                <Grid container spacing={2.5}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            required
                                            label={tr("fields.roomType", "Room type")}
                                            value={room.roomType || ""}
                                            onChange={(e) =>
                                                updateRoom(index, "roomType", e.target.value)
                                            }
                                            sx={fieldSx}
                                            error={Boolean(errors[`roomType-${index}`])}
                                            helperText={errors[`roomType-${index}`]}
                                        >
                                            {roomTypes.map((type) => (
                                                <MenuItem key={type} value={type}>
                                                    {translateOption(type)}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            required
                                            label={tr("fields.roomQuantity", "Number of rooms of this type")}
                                            type="number"
                                            value={room.quantity ?? ""}
                                            onChange={(e) =>
                                                updateRoom(index, "quantity", e.target.value)
                                            }
                                            sx={fieldSx}
                                            error={Boolean(errors[`roomQuantity-${index}`])}
                                            helperText={errors[`roomQuantity-${index}`]}
                                            slotProps={{ htmlInput: { min: 1 } }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            required
                                            label={tr("fields.maxGuests", "Maximum guests")}
                                            type="number"
                                            value={room.maxGuests ?? ""}
                                            onChange={(e) =>
                                                updateRoom(index, "maxGuests", e.target.value)
                                            }
                                            sx={fieldSx}
                                            error={Boolean(errors[`roomGuests-${index}`])}
                                            helperText={errors[`roomGuests-${index}`]}
                                            slotProps={{ htmlInput: { min: 1 } }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            required
                                            label={tr("fields.pricePerNight", "Price per night (MAD)")}
                                            type="number"
                                            value={room.pricePerNight ?? ""}
                                            onChange={(e) =>
                                                updateRoom(index, "pricePerNight", e.target.value)
                                            }
                                            sx={fieldSx}
                                            error={Boolean(errors[`roomPrice-${index}`])}
                                            helperText={errors[`roomPrice-${index}`]}
                                            slotProps={{ htmlInput: { min: 0 } }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            {tr("fields.bedConfiguration", "Bed configuration")}
                                        </Typography>

                                        <Stack direction="row" flexWrap="wrap" gap={1}>
                                            {bedTypes.map((bed) => (
                                                <Chip
                                                    key={bed}
                                                    label={translateOption(bed)}
                                                    clickable
                                                    color={
                                                        (room.bedConfiguration || []).includes(bed)
                                                            ? "primary"
                                                            : "default"
                                                    }
                                                    variant={
                                                        (room.bedConfiguration || []).includes(bed)
                                                            ? "filled"
                                                            : "outlined"
                                                    }
                                                    onClick={() => toggleBed(index, bed)}
                                                />
                                            ))}
                                        </Stack>
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            {tr("fields.roomFacilities", "Room facilities")}
                                        </Typography>

                                        <Stack direction="row" flexWrap="wrap" columnGap={2}>
                                            {[
                                                ["privateBathroom", "Private bathroom"],
                                                ["airConditioning", "Air conditioning"],
                                                ["balconyOrTerrace", "Balcony / terrace"],
                                            ].map(([name, label]) => (
                                                <FormControlLabel
                                                    key={name}
                                                    control={
                                                        <Checkbox
                                                            checked={Boolean(room[name])}
                                                            onChange={(e) =>
                                                                updateRoom(index, name, e.target.checked)
                                                            }
                                                        />
                                                    }
                                                    label={tr(`roomFacilities.${name}`, label)}
                                                />
                                            ))}
                                        </Stack>
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label={tr("fields.roomDescription", "Room description")}
                                            multiline
                                            rows={3}
                                            value={room.description || ""}
                                            onChange={(e) =>
                                                updateRoom(index, "description", e.target.value)
                                            }
                                            sx={fieldSx}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Button
                                            component="label"
                                            variant="outlined"
                                            startIcon={<CloudUploadOutlinedIcon />}
                                        >
                                            {tr("actions.uploadRoomPhotos", "Upload room photos")}
                                            <input
                                                hidden
                                                type="file"
                                                multiple
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => {
                                                    handleRoomPhotos(index, e.target.files);
                                                    e.target.value = "";
                                                }}
                                            />
                                        </Button>

                                        <Typography
                                            variant="caption"
                                            display="block"
                                            color="text.secondary"
                                            sx={{ mt: 0.5 }}
                                        >
                                            {tr("helpers.roomPhotosLimit", "Maximum 15 photos per room type, 5MB each.")}
                                        </Typography>

                                        <Box sx={{ mt: 2 }}>
                                            <ImageGalleryViewer
                                                images={room.photos || []}
                                                height={180}
                                                translate={tr}
                                                emptyText={tr("empty.roomPhotos", "No room photos selected")}
                                                onRemove={(photoIndex) =>
                                                    removeRoomPhoto(index, photoIndex)
                                                }
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}

                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addRoom}
                            sx={{
                                alignSelf: "flex-start",
                                borderRadius: "9px",
                                textTransform: "none",
                                fontWeight: 600,
                            }}
                        >
                            {tr("actions.addRoom", "Add another room type")}
                        </Button>
                    </Stack>
                </SectionPaper>

                {/* 04 FACILITIES */}
                <SectionPaper>
                    <SectionHeader
                        icon="✨"
                        title={tr("sections.facilities", "Services and facilities")}
                        subtitle={tr("sections.facilitiesSubtitle", "Select everything your establishment offers.")}
                        number={4}
                    />

                    <Grid container spacing={1}>
                        {facilityFields.map((facility) => (
                            <Grid
                                size={{ xs: 12, sm: 6, md: 4 }}
                                key={facility.name}
                            >
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: "10px",
                                        px: 1.5,
                                        borderColor: formData.facilities?.[facility.name]
                                            ? "#93C5FD"
                                            : "#E2E8F0",
                                        bgcolor: formData.facilities?.[facility.name]
                                            ? "#EFF6FF"
                                            : "#fff",
                                    }}
                                >
                                    <FormControlLabel
                                        sx={{ width: "100%", m: 0 }}
                                        control={
                                            <Checkbox
                                                checked={Boolean(formData.facilities?.[facility.name])}
                                                onChange={(e) =>
                                                    updateNestedField(
                                                        "facilities",
                                                        facility.name,
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        }
                                        label={`${facility.icon} ${tr(`facilities.${facility.name}`, facility.label)}`}
                                    />
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                        {tr("fields.otherServices", "Other services")}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            fullWidth
                            sx={fieldSx}
                            placeholder={tr("placeholders.otherService", "Add another service...")}
                            value={otherService || ""}
                            onChange={(e) => setOtherService(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addOtherService();
                                }
                            }}
                        />

                        <Button
                            variant="outlined"
                            onClick={addOtherService}
                            startIcon={<AddIcon />}
                        >
                            {tr("actions.add", "Add")}
                        </Button>
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                        {(formData.facilities?.otherServices || []).map((service) => (
                            <Chip
                                key={service}
                                label={service}
                                onDelete={() => removeOtherService(service)}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                </SectionPaper>

                {/* 05 CONTACT */}
                <SectionPaper>
                    <SectionHeader
                        icon="📞"
                        title={tr("sections.contact", "Contact and online presence")}
                        subtitle={tr("sections.contactSubtitle", "How can visitors contact and find you online?")}
                        number={5}
                    />

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderNestedField("contact", "phoneNumber", tr("fields.phoneNumber", "Phone number"), {
                                placeholder: "+212 6...",
                            })}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderNestedField("contact", "whatsappNumber", tr("fields.whatsappNumber", "WhatsApp number"), {
                                placeholder: "+212 6...",
                            })}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderNestedField("contact", "email", tr("fields.email", "Email address"), {
                                type: "email",
                                error: Boolean(errors.email),
                                helperText: errors.email,
                            })}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderNestedField("contact", "officialWebsite", tr("fields.officialWebsite", "Official website"), {
                                type: "url",
                                placeholder: "https://example.com",
                            })}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            {renderNestedField("contact", "bookingWebsite", tr("fields.bookingWebsite", "Booking / reservation link"), {
                                type: "url",
                                placeholder: "https://...",
                            })}
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                        {tr("fields.socialMedia", "Social media links")}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            select
                            value={socialPlatform || ""}
                            onChange={(e) => setSocialPlatform(e.target.value)}
                            label={tr("fields.platform", "Platform")}
                            sx={{ ...fieldSx, minWidth: { sm: 180 } }}
                        >
                            {[
                                "Facebook",
                                "Instagram",
                                "TikTok",
                                "YouTube",
                                "LinkedIn",
                                "Other",
                            ].map((platform) => (
                                <MenuItem key={platform} value={platform}>
                                    {translateOption(platform)}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            label={tr("fields.socialUrl", "Social media URL")}
                            value={socialUrl || ""}
                            onChange={(e) => setSocialUrl(e.target.value)}
                            sx={fieldSx}
                            placeholder="https://..."
                        />

                        <Button
                            variant="outlined"
                            onClick={addSocialLink}
                            startIcon={<AddIcon />}
                        >
                            {tr("actions.add", "Add")}
                        </Button>
                    </Stack>

                    <Stack spacing={1} sx={{ mt: 2 }}>
                        {(formData.contact?.socialMedia || []).map((social) => (
                            <Paper
                                key={social.platform}
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                }}
                            >
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography fontWeight={600}>
                                        {translateOption(social.platform)}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ overflowWrap: "anywhere" }}
                                    >
                                        {social.url}
                                    </Typography>
                                </Box>

                                <Button
                                    color="error"
                                    size="small"
                                    onClick={() => removeSocialLink(social.platform)}
                                >
                                    {tr("actions.remove", "Remove")}
                                </Button>
                            </Paper>
                        ))}
                    </Stack>
                </SectionPaper>

                {/* 06 PHOTOS AND MEDIA */}
                <SectionPaper>
                    <SectionHeader
                        icon="📷"
                        title={tr("sections.photos", "Photos and media")}
                        subtitle={tr("sections.photosSubtitle", "Show visitors what your establishment looks like.")}
                        number={6}
                    />

                    {/* COVER PHOTO */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                        {tr("fields.coverPhoto", "Main cover photo")}
                    </Typography>

                    <input
                        hidden
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverChange}
                    />

                    <Box
                        onClick={() => coverInputRef.current?.click()}
                        sx={{
                            border: "2px dashed #BFDBFE",
                            borderRadius: 3,
                            p: 3,
                            textAlign: "center",
                            cursor: "pointer",
                            bgcolor: "#F5F9FF",
                            "&:hover": {
                                borderColor: "#3B82F6",
                                bgcolor: "#EFF6FF",
                            },
                        }}
                    >
                        {coverFile ? (
                            <Box
                                component="img"
                                src={coverFile.preview}
                                alt="Cover"
                                sx={{
                                    width: "100%",
                                    maxHeight: 280,
                                    objectFit: "cover",
                                    borderRadius: 2,
                                }}
                            />
                        ) : (
                            <>
                                <CloudUploadOutlinedIcon
                                    sx={{ fontSize: 42, color: "#2563EB" }}
                                />
                                <Typography fontWeight={600}>
                                    {tr("actions.uploadCover", "Upload main cover photo")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {tr("helpers.imageLimit", "JPG, PNG or WEBP · Maximum 5MB")}
                                </Typography>
                            </>
                        )}
                    </Box>

                    {coverFile && (
                        <Button
                            color="error"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={removeCover}
                        >
                            {tr("actions.removeCover", "Remove cover photo")}
                        </Button>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* GALLERY */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                        {tr("fields.gallery", "Establishment gallery")}
                    </Typography>

                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadOutlinedIcon />}
                    >
                        {tr("actions.uploadGallery", "Upload gallery photos")}
                        <input
                            ref={galleryInputRef}
                            hidden
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                                handleGalleryChange(e);
                                e.target.value = "";
                            }}
                        />
                    </Button>

                    <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        {tr("helpers.galleryLimit", "Maximum 30 images, 5MB per image.")}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <ImageGalleryViewer
                            images={galleryFiles}
                            height={300}
                            emptyText={tr("empty.gallery", "No gallery photos selected")}
                            onRemove={(index) => removeGalleryImage(index)}
                        />
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* YOUTUBE VIDEO */}
                    <Stack spacing={2}>
                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 700,
                                    color: "#0F172A",
                                    mb: 0.5,
                                }}
                            >
                                {tr("fields.establishmentVideo", "Establishment video")}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                {tr(
                                    "helpers.videoDescription",
                                    "Add a YouTube video to introduce your hotel, riad or guesthouse. Visitors will be able to watch it directly on your establishment page."
                                )}
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            label={tr("fields.youtubeUrl", "YouTube video URL")}
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.media?.videoUrl || ""}
                            onChange={(e) =>
                                updateNestedField("media", "videoUrl", e.target.value)
                            }
                            sx={fieldSx}
                            helperText={tr(
                                "helpers.youtubeUrl",
                                "Paste a YouTube video, Shorts or shortened YouTube link."
                            )}
                        />

                        {formData.media?.videoUrl && (
                            youtubeVideoId ? (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        borderColor: "#E2E8F0",
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 700, mb: 1.5 }}
                                    >
                                        {tr("videoPreview", "Video preview")}
                                    </Typography>

                                    <Box
                                        sx={{
                                            position: "relative",
                                            width: "100%",
                                            aspectRatio: "16 / 9",
                                            bgcolor: "#0F172A",
                                            borderRadius: 2,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Box
                                            component="iframe"
                                            src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                                            title={tr("videoTitle", "Establishment video preview")}
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
                                        endIcon={<OpenInNewIcon />}
                                        sx={{
                                            mt: 1.5,
                                            textTransform: "none",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {tr("actions.watchOnYoutube", "Watch on YouTube")}
                                    </Button>
                                </Paper>
                            ) : (
                                <Alert severity="warning">
                                    {tr(
                                        "errors.invalidYoutube",
                                        "This YouTube link is not valid. Please check the URL."
                                    )}
                                </Alert>
                            )
                        )}
                    </Stack>
                </SectionPaper>

                {/* SUBMIT */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        bgcolor: "#ffffff",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                    >
                        <Box>
                            <Typography fontWeight={700} color="#0F172A">
                                {tr("submit.title", "Ready to create your establishment?")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {tr("submit.description", "Check your information before submitting.")}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                disabled={loading}
                                onClick={resetForm}
                                sx={{ textTransform: "none" }}
                            >
                                {tr("actions.reset", "Reset")}
                            </Button>

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    px: 3,
                                    py: 1.2,
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    bgcolor: "#2563EB",
                                    "&:hover": { bgcolor: "#1D4ED8" },
                                }}
                            >
                                {loading
                                    ? tr("actions.publishing", "Publishing...")
                                    : tr("actions.create", "Create establishment")}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Box>

            <Snackbar
                open={Boolean(notification?.open)}
                autoHideDuration={5000}
                onClose={closeNotification}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Alert
                    severity={notification?.severity || "info"}
                    variant="filled"
                    onClose={closeNotification}
                    sx={{ width: "100%" }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

// import React, { useRef } from "react";

// import {
//     Alert,
//     Autocomplete,
//     Box,
//     Button,
//     Checkbox,
//     Chip,
//     Divider,
//     FormControlLabel,
//     Grid,
//     MenuItem,
//     Paper,
//     Snackbar,
//     Stack,
//     TextField,
//     Typography,
//     Rating,
// } from "@mui/material";

// import OpenInNewIcon from "@mui/icons-material/OpenInNew";


// import AddIcon from "@mui/icons-material/Add";
// import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
// import { Delete } from "@mui/icons-material";

// import cities from "../../data/moroccanCities";

// function getYoutubeVideoId(videoUrl) {
//     if (!videoUrl || typeof videoUrl !== "string") {
//         return null;
//     }

//     try {
//         const url = new URL(videoUrl.trim());

//         if (!["https:", "http:"].includes(url.protocol)) {
//             return null;
//         }

//         const hostname = url.hostname
//             .toLowerCase()
//             .replace(/^www\./, "");

//         let videoId = "";

//         if (hostname === "youtu.be") {
//             videoId = url.pathname.slice(1).split("/")[0];
//         } else if (
//             [
//                 "youtube.com",
//                 "m.youtube.com",
//                 "youtube-nocookie.com",
//             ].includes(hostname)
//         ) {
//             if (url.pathname === "/watch") {
//                 videoId = url.searchParams.get("v") || "";
//             } else if (
//                 url.pathname.startsWith("/embed/") ||
//                 url.pathname.startsWith("/shorts/")
//             ) {
//                 videoId = url.pathname.split("/")[2] || "";
//             }
//         }

//         return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
//             ? videoId
//             : null;
//     } catch {
//         return null;
//     }
// }

// const accommodationTypes = [
//     "Hotel", "Riad", "Guesthouse", "Hostel", "Aparthotel", "Other",
// ];

// const roomTypes = [
//     "Single Room", "Double Room", "Twin Room", "Triple Room",
//     "Family Room", "Suite", "Deluxe Room", "Studio",
//     "Apartment", "Dormitory", "Other",
// ];

// const bedTypes = [
//     "Single Bed", "Double Bed", "Queen Bed",
//     "King Bed", "Sofa Bed", "Bunk Bed",
// ];

// const facilityFields = [
//     { name: "swimmingPool", label: "Swimming pool", icon: "🏊" },
//     { name: "restaurant", label: "Restaurant", icon: "🍽️" },
//     { name: "breakfast", label: "Breakfast", icon: "🥐" },
//     { name: "wifi", label: "Wi-Fi", icon: "📶" },
//     { name: "parking", label: "Parking", icon: "🚗" },
//     { name: "spaHammam", label: "Spa / Hammam", icon: "🧖" },
//     { name: "airportTransfer", label: "Airport transfer", icon: "✈️" },
//     { name: "gardenRooftop", label: "Garden / Rooftop", icon: "🌿" },
//     { name: "reception", label: "Reception", icon: "🛎️" },
//     { name: "laundry", label: "Laundry", icon: "🧺" },
//     { name: "roomService", label: "Room service", icon: "🛎️" },
// ];

// const fieldSx = {
//     "& .MuiOutlinedInput-root": {
//         borderRadius: "10px",
//         backgroundColor: "#ffffff",
//         "& fieldset": { borderColor: "#D5DCE8" },
//         "&:hover fieldset": { borderColor: "#93C5FD" },
//         "&.Mui-focused fieldset": {
//             borderColor: "#2563EB",
//             borderWidth: "1.5px",
//         },
//     },
//     "& .MuiInputLabel-root.Mui-focused": { color: "#2563EB" },
// };

// function SectionHeader({ icon, title, subtitle, number }) {
//     return (
//         <Box sx={{ mb: 3 }}>
//             <Stack direction="row" spacing={1.5} alignItems="center">
//                 <Box
//                     sx={{
//                         width: 44,
//                         height: 44,
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         borderRadius: "12px",
//                         bgcolor: "#EFF6FF",
//                         color: "#2563EB",
//                         fontSize: "21px",
//                         flexShrink: 0,
//                     }}
//                 >
//                     {icon}
//                 </Box>

//                 <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography
//                         variant="h6"
//                         sx={{ fontWeight: 600, color: "#0F172A", fontSize: "1.08rem" }}
//                     >
//                         {title}
//                     </Typography>
//                     <Typography variant="body2" sx={{ color: "#5B6577", mt: 0.3 }}>
//                         {subtitle}
//                     </Typography>
//                 </Box>

//                 <Chip
//                     label={`0${number}`}
//                     size="small"
//                     sx={{
//                         fontWeight: 700,
//                         color: "#2563EB",
//                         bgcolor: "#EFF6FF",
//                         borderRadius: "8px",
//                     }}
//                 />
//             </Stack>

//             <Divider sx={{ mt: 2.5, borderColor: "#E2E8F0" }} />
//         </Box>
//     );
// }

// function SectionPaper({ children }) {
//     return (
//         <Paper
//             elevation={0}
//             sx={{
//                 p: { xs: 2.5, sm: 3.5, md: 4 },
//                 mb: 3,
//                 border: "1px solid #E2E8F0",
//                 borderRadius: "16px",
//                 bgcolor: "#ffffff",
//                 boxShadow: "0 3px 12px rgba(15, 23, 42, 0.025)",
//             }}
//         >
//             {children}
//         </Paper>
//     );
// }

// function ImagePreview({ src, alt, onRemove, height = 120 }) {
//     return (
//         <Box sx={{ position: "relative" }}>
//             <Box
//                 component="img"
//                 src={src}
//                 alt={alt}
//                 sx={{
//                     width: "100%",
//                     height,
//                     objectFit: "cover",
//                     borderRadius: 2,
//                 }}
//             />
//             <Button
//                 size="small"
//                 color="error"
//                 onClick={onRemove}
//                 sx={{
//                     position: "absolute",
//                     top: 3,
//                     right: 3,
//                     minWidth: 25,
//                     bgcolor: "#fff",
//                 }}
//             >
//                 ×
//             </Button>
//         </Box>
//     );
// }

// export default function EstablishmentForm({
//     formData,
//     errors,
//     loading,
//     coverFile,
//     galleryFiles,
//     notification,
//     otherService,
//     socialPlatform,
//     socialUrl,
//     setOtherService,
//     setSocialPlatform,
//     setSocialUrl,
//     handleChange,
//     updateNestedField,
//     updateRoom,
//     addRoom,
//     removeRoom,
//     toggleBed,
//     handleRoomPhotos,
//     removeRoomPhoto,
//     handleCoverChange,
//     removeCover,
//     handleGalleryChange,
//     removeGalleryImage,
//     addOtherService,
//     removeOtherService,
//     addSocialLink,
//     removeSocialLink,
//     handleSubmit,
//     resetForm,
//     closeNotification,
// }) {
//     const coverInputRef = useRef(null);

//     const selectedCity =
//         cities.find(
//             (city) =>
//                 city.en.toLowerCase() ===
//                 (formData.location.city || "").toLowerCase()
//         ) || null;
    
//     const youtubeVideoId = getYoutubeVideoId(
//         formData.media?.videoUrl
//     );

//     const classificationValue = Number.parseInt(
//         formData.officialClassification,
//         10
//     );

//     const hotelStarRating =
//         Number.isInteger(classificationValue) &&
//         classificationValue >= 1 &&
//         classificationValue <= 5
//             ? classificationValue
//             : 0;

//     const renderField = (name, label, options = {}) => (
//         <TextField
//             fullWidth
//             size="medium"
//             sx={fieldSx}
//             name={name}
//             label={label}
//             value={formData[name] ?? ""}
//             onChange={handleChange}
//             error={Boolean(errors[name])}
//             helperText={errors[name] || ""}
//             {...options}
//         />
//     );

//     const renderNestedField = (section, name, label, options = {}) => (
//         <TextField
//             fullWidth
//             size="medium"
//             sx={fieldSx}
//             label={label}
//             value={formData[section][name] ?? ""}
//             onChange={(e) =>
//                 updateNestedField(section, name, e.target.value)
//             }
//             {...options}
//         />
//     );

//     return (
//         <Box
//             sx={{
//                 width: "100%",
//                 maxWidth: 1100,
//                 mx: "auto",
//                 py: { xs: 2, md: 4 },
//                 px: { xs: 1, sm: 2 },
//             }}
//         >
//             {/* PAGE HEADER */}
//             <Box sx={{ mb: 4, px: { xs: 1, sm: 0 } }}>
//                 <Chip
//                     label="ACCOMMODATION"
//                     size="small"
//                     sx={{
//                         bgcolor: "#EFF6FF",
//                         color: "#2563EB",
//                         fontWeight: 600,
//                         mb: 1.5,
//                     }}
//                 />

//                 <Typography
//                     variant="h4"
//                     sx={{
//                         fontWeight: 700,
//                         color: "#0F172A",
//                         fontSize: "1.875rem",
//                         mb: 1,
//                     }}
//                 >
//                     Add your establishment
//                 </Typography>

//                 <Typography
//                     variant="body1"
//                     sx={{ color: "#5B6577", maxWidth: 650, lineHeight: 1.8 }}
//                 >
//                     Create a detailed profile for your hotel, riad,
//                     guesthouse or other accommodation.
//                 </Typography>
//             </Box>

//             <Box component="form" onSubmit={handleSubmit}>
//                 {/* 01 INFORMATION */}
//                 <SectionPaper>
//                     <SectionHeader
//                         icon="🏨"
//                         title="Establishment information"
//                         subtitle="Introduce your accommodation."
//                         number={1}
//                     />

//                     <Grid container spacing={2.5}>
//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             {renderField("name", "Establishment name", {
//                                 required: true,
//                                 placeholder: "e.g. Riad Atlas Palace",
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             <TextField
//                                 select
//                                 fullWidth
//                                 required
//                                 label="Accommodation type"
//                                 value={formData.accommodationType}
//                                 onChange={(e) =>
//                                     handleChange({
//                                         target: {
//                                             name: "accommodationType",
//                                             value: e.target.value,
//                                         },
//                                     })
//                                 }
//                                 error={Boolean(errors.accommodationType)}
//                                 helperText={errors.accommodationType}
//                                 sx={fieldSx}
//                             >
//                                 {accommodationTypes.map((type) => (
//                                     <MenuItem key={type} value={type}>
//                                         {type}
//                                     </MenuItem>
//                                 ))}
//                             </TextField>
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                             {renderField("shortDescription", "Short description", {
//                                 multiline: true,
//                                 rows: 2,
//                                 placeholder: "A short introduction...",
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                             {renderField("fullDescription", "Full description", {
//                                 multiline: true,
//                                 rows: 5,
//                                 placeholder: "Describe your establishment...",
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                             {renderField("yearEstablished", "Year established", {
//                                 type: "number",
//                                 slotProps: {
//                                     htmlInput: {
//                                         min: 1000,
//                                         max: new Date().getFullYear(),
//                                     },
//                                 },
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                             {renderField("numberOfRooms", "Number of rooms", {
//                                 type: "number",
//                                 slotProps: { htmlInput: { min: 0 } },
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                             {renderField("numberOfFloors", "Number of floors", {
//                                 type: "number",
//                                 slotProps: { htmlInput: { min: 0 } },
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                             <Stack spacing={1}>
//                                 <TextField
//                                     select
//                                     fullWidth
//                                     label="Hotel classification"
//                                     value={formData.officialClassification || ""}
//                                     onChange={(e) =>
//                                         handleChange({
//                                             target: {
//                                                 name: "officialClassification",
//                                                 value: e.target.value,
//                                             },
//                                         })
//                                     }
//                                     sx={fieldSx}
//                                 >
//                                     <MenuItem value="">Not classified</MenuItem>

//                                     {[1, 2, 3, 4, 5].map((stars) => (
//                                         <MenuItem key={stars} value={`${stars} Stars`}>
//                                             <Stack direction="row" spacing={1} alignItems="center">
//                                                 <Rating value={stars} readOnly size="small" />
//                                                 <Typography variant="body2">
//                                                     {stars} {stars === 1 ? "Star" : "Stars"}
//                                                 </Typography>
//                                             </Stack>
//                                         </MenuItem>
//                                     ))}
//                                 </TextField>

//                                 {hotelStarRating > 0 && (
//                                     <Rating
//                                         value={hotelStarRating}
//                                         readOnly
//                                         precision={1}
//                                         sx={{ color: "#F59E0B" }}
//                                     />
//                                 )}
//                             </Stack>
//                         </Grid>
//                     </Grid>
//                 </SectionPaper>

//                 {/* 02 LOCATION */}
//                 <SectionPaper>
//                     <SectionHeader
//                         icon="📍"
//                         title="Location"
//                         subtitle="Where can visitors find your establishment?"
//                         number={2}
//                     />

//                     <Grid container spacing={2.5}>
//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             <Autocomplete
//                                 options={cities}
//                                 value={selectedCity}
//                                 onChange={(_, value) =>
//                                     updateNestedField(
//                                         "location",
//                                         "city",
//                                         value?.en || ""
//                                     )
//                                 }
//                                 getOptionLabel={(option) => option.en}
//                                 isOptionEqualToValue={(a, b) => a.en === b.en}
//                                 renderInput={(params) => (
//                                     <TextField
//                                         {...params}
//                                         required
//                                         label="City"
//                                         placeholder="Select a city"
//                                         sx={fieldSx}
//                                         error={Boolean(errors.city)}
//                                         helperText={errors.city}
//                                     />
//                                 )}
//                             />
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             {renderNestedField(
//                                 "location",
//                                 "neighborhood",
//                                 "Neighborhood"
//                             )}
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                             {renderNestedField(
//                                 "location",
//                                 "fullAddress",
//                                 "Full address",
//                                 {
//                                     required: true,
//                                     multiline: true,
//                                     rows: 2,
//                                     error: Boolean(errors.fullAddress),
//                                     helperText: errors.fullAddress,
//                                 }
//                             )}
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                             {renderNestedField(
//                                 "location",
//                                 "googleMapsLink",
//                                 "Google Maps link",
//                                 {
//                                     type: "url",
//                                     placeholder: "https://maps.google.com/...",
//                                     helperText:
//                                         "Add a Google Maps share link so the location coordinates can be extracted automatically.",
//                                 }
//                             )}
//                         </Grid>
//                     </Grid>
//                 </SectionPaper>

//                 {/* 03 ROOMS */}
//                 <SectionPaper>
//                     <SectionHeader
//                         icon="🛏️"
//                         title="Rooms and accommodation"
//                         subtitle="Define your room categories and their prices."
//                         number={3}
//                     />

//                     <Stack spacing={3}>
//                         {formData.rooms.map((room, index) => (
//                             <Paper
//                                 key={index}
//                                 variant="outlined"
//                                 sx={{
//                                     p: { xs: 2, sm: 3 },
//                                     borderRadius: "12px",
//                                     borderColor: "#DCE3ED",
//                                     bgcolor: "#FCFDFF",
//                                 }}
//                             >
//                                 <Stack
//                                     direction="row"
//                                     alignItems="center"
//                                     justifyContent="space-between"
//                                     sx={{ mb: 2.5 }}
//                                 >
//                                     <Chip
//                                         label={`Room type ${index + 1}`}
//                                         color="primary"
//                                         variant="outlined"
//                                     />

//                                     <Button
//                                         color="error"
//                                         size="small"
//                                         startIcon={<Delete />}
//                                         onClick={() => removeRoom(index)}
//                                     >
//                                         Remove
//                                     </Button>
//                                 </Stack>

//                                 <Grid container spacing={2.5}>
//                                     <Grid size={{ xs: 12, sm: 6 }}>
//                                         <TextField
//                                             select
//                                             fullWidth
//                                             label="Room type"
//                                             required
//                                             value={room.roomType}
//                                             onChange={(e) =>
//                                                 updateRoom(index, "roomType", e.target.value)
//                                             }
//                                             sx={fieldSx}
//                                             error={Boolean(errors[`roomType-${index}`])}
//                                             helperText={errors[`roomType-${index}`]}
//                                         >
//                                             {roomTypes.map((type) => (
//                                                 <MenuItem key={type} value={type}>
//                                                     {type}
//                                                 </MenuItem>
//                                             ))}
//                                         </TextField>
//                                     </Grid>

//                                     <Grid size={{ xs: 12, sm: 6 }}>
//                                         <TextField
//                                             fullWidth
//                                             label="Number of rooms of this type"
//                                             type="number"
//                                             required
//                                             value={room.quantity}
//                                             onChange={(e) =>
//                                                 updateRoom(index, "quantity", e.target.value)
//                                             }
//                                             sx={fieldSx}
//                                             error={Boolean(errors[`roomQuantity-${index}`])}
//                                             helperText={errors[`roomQuantity-${index}`]}
//                                             slotProps={{ htmlInput: { min: 1 } }}
//                                         />
//                                     </Grid>

//                                     <Grid size={{ xs: 12, sm: 6 }}>
//                                         <TextField
//                                             fullWidth
//                                             label="Maximum guests"
//                                             type="number"
//                                             required
//                                             value={room.maxGuests}
//                                             onChange={(e) =>
//                                                 updateRoom(index, "maxGuests", e.target.value)
//                                             }
//                                             sx={fieldSx}
//                                             error={Boolean(errors[`roomGuests-${index}`])}
//                                             helperText={errors[`roomGuests-${index}`]}
//                                             slotProps={{ htmlInput: { min: 1 } }}
//                                         />
//                                     </Grid>

//                                     <Grid size={{ xs: 12, sm: 6 }}>
//                                         <TextField
//                                             fullWidth
//                                             label="Price per night (MAD)"
//                                             type="number"
//                                             required
//                                             value={room.pricePerNight}
//                                             onChange={(e) =>
//                                                 updateRoom(index, "pricePerNight", e.target.value)
//                                             }
//                                             sx={fieldSx}
//                                             error={Boolean(errors[`roomPrice-${index}`])}
//                                             helperText={errors[`roomPrice-${index}`]}
//                                             slotProps={{ htmlInput: { min: 0 } }}
//                                         />
//                                     </Grid>

//                                     <Grid size={{ xs: 12 }}>
//                                         <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
//                                             Bed configuration
//                                         </Typography>

//                                         <Stack direction="row" flexWrap="wrap" gap={1}>
//                                             {bedTypes.map((bed) => (
//                                                 <Chip
//                                                     key={bed}
//                                                     label={bed}
//                                                     clickable
//                                                     color={
//                                                         room.bedConfiguration.includes(bed)
//                                                             ? "primary"
//                                                             : "default"
//                                                     }
//                                                     variant={
//                                                         room.bedConfiguration.includes(bed)
//                                                             ? "filled"
//                                                             : "outlined"
//                                                     }
//                                                     onClick={() => toggleBed(index, bed)}
//                                                 />
//                                             ))}
//                                         </Stack>
//                                     </Grid>

//                                     <Grid size={{ xs: 12 }}>
//                                         <Typography variant="subtitle2" sx={{ mb: 1 }}>
//                                             Room facilities
//                                         </Typography>

//                                         <Stack direction="row" flexWrap="wrap" columnGap={2}>
//                                             {[
//                                                 ["privateBathroom", "Private bathroom"],
//                                                 ["airConditioning", "Air conditioning"],
//                                                 ["balconyOrTerrace", "Balcony / terrace"],
//                                             ].map(([name, label]) => (
//                                                 <FormControlLabel
//                                                     key={name}
//                                                     control={
//                                                         <Checkbox
//                                                             checked={room[name]}
//                                                             onChange={(e) =>
//                                                                 updateRoom(
//                                                                     index,
//                                                                     name,
//                                                                     e.target.checked
//                                                                 )
//                                                             }
//                                                         />
//                                                     }
//                                                     label={label}
//                                                 />
//                                             ))}
//                                         </Stack>
//                                     </Grid>

//                                     <Grid size={{ xs: 12 }}>
//                                         <TextField
//                                             fullWidth
//                                             label="Room description"
//                                             multiline
//                                             rows={3}
//                                             value={room.description}
//                                             onChange={(e) =>
//                                                 updateRoom(index, "description", e.target.value)
//                                             }
//                                             sx={fieldSx}
//                                         />
//                                     </Grid>

//                                     <Grid size={{ xs: 12 }}>
//                                         <Button
//                                             component="label"
//                                             variant="outlined"
//                                             startIcon={<CloudUploadOutlinedIcon />}
//                                         >
//                                             Upload room photos
//                                             <input
//                                                 hidden
//                                                 type="file"
//                                                 multiple
//                                                 accept="image/jpeg,image/png,image/webp"
//                                                 onChange={(e) => {
//                                                     handleRoomPhotos(index, e.target.files);
//                                                     e.target.value = "";
//                                                 }}
//                                             />
//                                         </Button>

//                                         <Typography
//                                             variant="caption"
//                                             display="block"
//                                             color="text.secondary"
//                                             sx={{ mt: 0.5 }}
//                                         >
//                                             Maximum 15 photos per room type, 5MB each.
//                                         </Typography>

//                                         <Grid container spacing={1.5} sx={{ mt: 1 }}>
//                                             {room.photos.map((photo, photoIndex) => (
//                                                 <Grid
//                                                     size={{ xs: 4, sm: 3, md: 2 }}
//                                                     key={photo.preview}
//                                                 >
//                                                     <ImagePreview
//                                                         src={photo.preview}
//                                                         alt="Room"
//                                                         height={90}
//                                                         onRemove={() =>
//                                                             removeRoomPhoto(index, photoIndex)
//                                                         }
//                                                     />
//                                                 </Grid>
//                                             ))}
//                                         </Grid>
//                                     </Grid>
//                                 </Grid>
//                             </Paper>
//                         ))}

//                         <Button
//                             variant="outlined"
//                             startIcon={<AddIcon />}
//                             onClick={addRoom}
//                             sx={{
//                                 alignSelf: "flex-start",
//                                 borderRadius: "9px",
//                                 textTransform: "none",
//                                 fontWeight: 600,
//                             }}
//                         >
//                             Add another room type
//                         </Button>
//                     </Stack>
//                 </SectionPaper>

//                 {/* 04 FACILITIES */}
//                 <SectionPaper>
//                     <SectionHeader
//                         icon="✨"
//                         title="Services and facilities"
//                         subtitle="Select everything your establishment offers."
//                         number={4}
//                     />

//                     <Grid container spacing={1}>
//                         {facilityFields.map((facility) => (
//                             <Grid
//                                 size={{ xs: 12, sm: 6, md: 4 }}
//                                 key={facility.name}
//                             >
//                                 <Paper
//                                     variant="outlined"
//                                     sx={{
//                                         borderRadius: "10px",
//                                         px: 1.5,
//                                         borderColor: formData.facilities[facility.name]
//                                             ? "#93C5FD"
//                                             : "#E2E8F0",
//                                         bgcolor: formData.facilities[facility.name]
//                                             ? "#EFF6FF"
//                                             : "#fff",
//                                     }}
//                                 >
//                                     <FormControlLabel
//                                         sx={{ width: "100%", m: 0 }}
//                                         control={
//                                             <Checkbox
//                                                 checked={formData.facilities[facility.name]}
//                                                 onChange={(e) =>
//                                                     updateNestedField(
//                                                         "facilities",
//                                                         facility.name,
//                                                         e.target.checked
//                                                     )
//                                                 }
//                                             />
//                                         }
//                                         label={`${facility.icon} ${facility.label}`}
//                                     />
//                                 </Paper>
//                             </Grid>
//                         ))}
//                     </Grid>

//                     <Divider sx={{ my: 3 }} />

//                     <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
//                         Other services
//                     </Typography>

//                     <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
//                         <TextField
//                             fullWidth
//                             sx={fieldSx}
//                             placeholder="Add another service..."
//                             value={otherService}
//                             onChange={(e) => setOtherService(e.target.value)}
//                             onKeyDown={(e) => {
//                                 if (e.key === "Enter") {
//                                     e.preventDefault();
//                                     addOtherService();
//                                 }
//                             }}
//                         />

//                         <Button
//                             variant="outlined"
//                             onClick={addOtherService}
//                             startIcon={<AddIcon />}
//                         >
//                             Add
//                         </Button>
//                     </Stack>

//                     <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
//                         {formData.facilities.otherServices.map((service) => (
//                             <Chip
//                                 key={service}
//                                 label={service}
//                                 onDelete={() => removeOtherService(service)}
//                                 color="primary"
//                                 variant="outlined"
//                             />
//                         ))}
//                     </Stack>
//                 </SectionPaper>

//                 {/* 05 CONTACT */}
//                 <SectionPaper>
//                     <SectionHeader
//                         icon="📞"
//                         title="Contact and online presence"
//                         subtitle="How can visitors contact and find you online?"
//                         number={5}
//                     />

//                     <Grid container spacing={2.5}>
//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             {renderNestedField("contact", "phoneNumber", "Phone number", {
//                                 placeholder: "+212 6...",
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             {renderNestedField("contact", "whatsappNumber", "WhatsApp number", {
//                                 placeholder: "+212 6...",
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             {renderNestedField("contact", "email", "Email address", {
//                                 type: "email",
//                                 error: Boolean(errors.email),
//                                 helperText: errors.email,
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12, sm: 6 }}>
//                             {renderNestedField("contact", "officialWebsite", "Official website", {
//                                 type: "url",
//                                 placeholder: "https://example.com",
//                             })}
//                         </Grid>

//                         <Grid size={{ xs: 12 }}>
//                             {renderNestedField("contact", "bookingWebsite", "Booking / reservation link", {
//                                 type: "url",
//                                 placeholder: "https://...",
//                             })}
//                         </Grid>
//                     </Grid>

//                     <Divider sx={{ my: 3 }} />

//                     <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
//                         Social media links
//                     </Typography>

//                     <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
//                         <TextField
//                             select
//                             value={socialPlatform}
//                             onChange={(e) => setSocialPlatform(e.target.value)}
//                             label="Platform"
//                             sx={{ ...fieldSx, minWidth: { sm: 180 } }}
//                         >
//                             {[
//                                 "Facebook", "Instagram", "TikTok",
//                                 "YouTube", "LinkedIn", "Other",
//                             ].map((platform) => (
//                                 <MenuItem key={platform} value={platform}>
//                                     {platform}
//                                 </MenuItem>
//                             ))}
//                         </TextField>

//                         <TextField
//                             fullWidth
//                             label="Social media URL"
//                             value={socialUrl}
//                             onChange={(e) => setSocialUrl(e.target.value)}
//                             sx={fieldSx}
//                             placeholder="https://..."
//                         />

//                         <Button
//                             variant="outlined"
//                             onClick={addSocialLink}
//                             startIcon={<AddIcon />}
//                         >
//                             Add
//                         </Button>
//                     </Stack>

//                     <Stack spacing={1} sx={{ mt: 2 }}>
//                         {formData.contact.socialMedia.map((social) => (
//                             <Paper
//                                 key={social.platform}
//                                 variant="outlined"
//                                 sx={{
//                                     p: 1.5,
//                                     borderRadius: 2,
//                                     display: "flex",
//                                     alignItems: "center",
//                                     justifyContent: "space-between",
//                                     gap: 2,
//                                 }}
//                             >
//                                 <Box sx={{ minWidth: 0 }}>
//                                     <Typography fontWeight={600}>
//                                         {social.platform}
//                                     </Typography>
//                                     <Typography
//                                         variant="body2"
//                                         color="text.secondary"
//                                         sx={{ overflowWrap: "anywhere" }}
//                                     >
//                                         {social.url}
//                                     </Typography>
//                                 </Box>

//                                 <Button
//                                     color="error"
//                                     size="small"
//                                     onClick={() => removeSocialLink(social.platform)}
//                                 >
//                                     Remove
//                                 </Button>
//                             </Paper>
//                         ))}
//                     </Stack>
//                 </SectionPaper>

//                 {/* 06 PHOTOS */}
//                 <SectionPaper>
//                     <SectionHeader
//                         icon="📷"
//                         title="Photos and media"
//                         subtitle="Show visitors what your establishment looks like."
//                         number={6}
//                     />

//                     <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
//                         Main cover photo
//                     </Typography>

//                     <input
//                         hidden
//                         ref={coverInputRef}
//                         type="file"
//                         accept="image/jpeg,image/png,image/webp"
//                         onChange={handleCoverChange}
//                     />

//                     <Box
//                         onClick={() => coverInputRef.current?.click()}
//                         sx={{
//                             border: "2px dashed #BFDBFE",
//                             borderRadius: 3,
//                             p: 3,
//                             textAlign: "center",
//                             cursor: "pointer",
//                             bgcolor: "#F5F9FF",
//                             "&:hover": {
//                                 borderColor: "#3B82F6",
//                                 bgcolor: "#EFF6FF",
//                             },
//                         }}
//                     >
//                         {coverFile ? (
//                             <Box
//                                 component="img"
//                                 src={coverFile.preview}
//                                 alt="Cover"
//                                 sx={{
//                                     width: "100%",
//                                     maxHeight: 280,
//                                     objectFit: "cover",
//                                     borderRadius: 2,
//                                 }}
//                             />
//                         ) : (
//                             <>
//                                 <CloudUploadOutlinedIcon
//                                     sx={{ fontSize: 42, color: "#2563EB" }}
//                                 />
//                                 <Typography fontWeight={600}>
//                                     Upload main cover photo
//                                 </Typography>
//                                 <Typography variant="body2" color="text.secondary">
//                                     JPG, PNG or WEBP · Maximum 5MB
//                                 </Typography>
//                             </>
//                         )}
//                     </Box>

//                     {coverFile && (
//                         <Button
//                             color="error"
//                             size="small"
//                             sx={{ mt: 1 }}
//                             onClick={removeCover}
//                         >
//                             Remove cover photo
//                         </Button>
//                     )}

//                     <Divider sx={{ my: 3 }} />

//                     <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
//                         Establishment gallery
//                     </Typography>

//                     <Button
//                         component="label"
//                         variant="outlined"
//                         startIcon={<CloudUploadOutlinedIcon />}
//                     >
//                         Upload gallery photos
//                         <input
//                             hidden
//                             type="file"
//                             multiple
//                             accept="image/jpeg,image/png,image/webp"
//                             onChange={handleGalleryChange}
//                         />
//                     </Button>

//                     <Typography
//                         variant="caption"
//                         display="block"
//                         color="text.secondary"
//                         sx={{ mt: 1 }}
//                     >
//                         Maximum 30 images, 5MB per image.
//                     </Typography>

//                     <Grid container spacing={1.5} sx={{ mt: 2 }}>
//                         {galleryFiles.map((image, index) => (
//                             <Grid
//                                 size={{ xs: 6, sm: 4, md: 3 }}
//                                 key={image.preview}
//                             >
//                                 <ImagePreview
//                                     src={image.preview}
//                                     alt="Establishment"
//                                     onRemove={() => removeGalleryImage(index)}
//                                 />
//                             </Grid>
//                         ))}
//                     </Grid>

//                     <Divider sx={{ my: 3 }} />

//                     <Stack spacing={2}>
//                         <Box>
//                             <Typography
//                                 variant="subtitle1"
//                                 sx={{
//                                     fontWeight: 700,
//                                     color: "#0F172A",
//                                     mb: 0.5,
//                                 }}
//                             >
//                                 Establishment video
//                             </Typography>

//                             <Typography variant="body2" color="text.secondary">
//                                 Add a YouTube video to introduce your hotel, riad or guesthouse.
//                                 Visitors will be able to watch it directly on your establishment page.
//                             </Typography>
//                         </Box>

//                         <TextField
//                             fullWidth
//                             label="YouTube video URL"
//                             type="url"
//                             placeholder="https://www.youtube.com/watch?v=..."
//                             value={formData.media?.videoUrl || ""}
//                             onChange={(e) =>
//                                 updateNestedField("media", "videoUrl", e.target.value)
//                             }
//                             sx={fieldSx}
//                             helperText="Paste a YouTube video, Shorts or shortened YouTube link."
//                         />

//                         {formData.media?.videoUrl && (
//                             youtubeVideoId ? (
//                                 <Paper
//                                     variant="outlined"
//                                     sx={{
//                                         p: 2,
//                                         borderRadius: 3,
//                                         borderColor: "#E2E8F0",
//                                     }}
//                                 >
//                                     <Typography
//                                         variant="subtitle2"
//                                         sx={{ fontWeight: 700, mb: 1.5 }}
//                                     >
//                                         Video preview
//                                     </Typography>

//                                     <Box
//                                         sx={{
//                                             position: "relative",
//                                             width: "100%",
//                                             aspectRatio: "16 / 9",
//                                             bgcolor: "#0F172A",
//                                             borderRadius: 2,
//                                             overflow: "hidden",
//                                         }}
//                                     >
//                                         <Box
//                                             component="iframe"
//                                             src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
//                                             title="Establishment video preview"
//                                             loading="lazy"
//                                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//                                             allowFullScreen
//                                             referrerPolicy="strict-origin-when-cross-origin"
//                                             sx={{
//                                                 position: "absolute",
//                                                 inset: 0,
//                                                 width: "100%",
//                                                 height: "100%",
//                                                 border: 0,
//                                             }}
//                                         />
//                                     </Box>

//                                     <Button
//                                         component="a"
//                                         href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
//                                         target="_blank"
//                                         rel="noopener noreferrer"
//                                         endIcon={<OpenInNewIcon />}
//                                         sx={{
//                                             mt: 1.5,
//                                             textTransform: "none",
//                                             fontWeight: 600,
//                                         }}
//                                     >
//                                         Watch on YouTube
//                                     </Button>
//                                 </Paper>
//                             ) : (
//                                 <Alert severity="warning">
//                                     This YouTube link is not valid. Please check the URL.
//                                 </Alert>
//                             )
//                         )}
//                     </Stack>
//                 </SectionPaper>

//                 {/* SUBMIT */}
//                 <Paper
//                     elevation={0}
//                     sx={{
//                         p: 3,
//                         border: "1px solid #E2E8F0",
//                         borderRadius: "16px",
//                         bgcolor: "#ffffff",
//                     }}
//                 >
//                     <Stack
//                         direction={{ xs: "column", sm: "row" }}
//                         spacing={2}
//                         justifyContent="space-between"
//                         alignItems={{ xs: "stretch", sm: "center" }}
//                     >
//                         <Box>
//                             <Typography fontWeight={700} color="#0F172A">
//                                 Ready to create your establishment?
//                             </Typography>
//                             <Typography variant="body2" color="text.secondary">
//                                 Check your information before submitting.
//                             </Typography>
//                         </Box>

//                         <Stack direction="row" spacing={1}>
//                             <Button
//                                 variant="outlined"
//                                 color="inherit"
//                                 disabled={loading}
//                                 onClick={resetForm}
//                                 sx={{ textTransform: "none" }}
//                             >
//                                 Reset
//                             </Button>

//                             <Button
//                                 type="submit"
//                                 variant="contained"
//                                 disabled={loading}
//                                 sx={{
//                                     px: 3,
//                                     py: 1.2,
//                                     borderRadius: "10px",
//                                     textTransform: "none",
//                                     fontWeight: 700,
//                                     bgcolor: "#2563EB",
//                                     "&:hover": { bgcolor: "#1D4ED8" },
//                                 }}
//                             >
//                                 {loading ? "Publishing..." : "Create establishment"}
//                             </Button>
//                         </Stack>
//                     </Stack>
//                 </Paper>
//             </Box>

//             <Snackbar
//                 open={notification.open}
//                 autoHideDuration={5000}
//                 onClose={closeNotification}
//                 anchorOrigin={{ vertical: "top", horizontal: "right" }}
//             >
//                 <Alert
//                     severity={notification.severity}
//                     variant="filled"
//                     onClose={closeNotification}
//                     sx={{ width: "100%" }}
//                 >
//                     {notification.message}
//                 </Alert>
//             </Snackbar>
//         </Box>
//     );
// }
