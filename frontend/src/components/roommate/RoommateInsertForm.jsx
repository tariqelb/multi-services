
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axiosInstance";

import {
    Box,
    Typography,
    Divider,
    Stack,
    Chip,
    Paper,
    Snackbar,
    Alert,
    Grid,
    TextField,
    MenuItem,
    Button,
    Checkbox,
    FormControlLabel,
    CircularProgress,
} from "@mui/material";

import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PaymentsIcon from "@mui/icons-material/Payments";
import TuneIcon from "@mui/icons-material/Tune";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

// -----------------------------------------------------------------------------
// Initial form values
// -----------------------------------------------------------------------------

const initialFormData = {
    title: "",
    description: "",
    purpose: "Share My Property",

    propertyType: "Apartment",

    city: "",
    neighborhood: "",
    fullAddress: "",
    mapLink: "",

    totalRent: "",
    rentalPeriod: "Monthly",
    furnishingStatus: "Furnished",
    individualRoomPrice: "",
    rentSplitType: "Equal",

    deposit: "",
    syndicateFees: "",
    otherExpenses: "",

    surface: "",
    rooms: "",
    salons: "",
    bathrooms: "",
    floor: "",
    propertyCondition: "Good",

    hasBalcony: false,
    hasKitchen: false,
    hasParking: false,

    totalPeople: 2,
    currentPeople: 1,
    availableFrom: "",

    preferences: {
        gender: "Any",
        smokingAllowed: false,
        petsAllowed: false,
    },

    youtubeVideoUrl: "",
    images: [],
};

// -----------------------------------------------------------------------------
// Section header
// -----------------------------------------------------------------------------

const SectionHeader = ({ icon, title, subtitle, number }) => (
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
                    flexShrink: 0,
                    fontWeight: 700,
                    fontSize: "1.1rem",
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

// -----------------------------------------------------------------------------
// Section container
// -----------------------------------------------------------------------------

const SectionPaper = ({ children }) => (
    <Paper
        elevation={0}
        sx={{
            p: { xs: 2.5, sm: 3.5, md: 4 },
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

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export default function RoommateInsertForm({ onAddListing }) {
    const { t } = useTranslation();

    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // -------------------------------------------------------------------------
    // Translation helper
    // -------------------------------------------------------------------------

    const translate = (key, fallback, options = {}) =>
        t(key, {
            defaultValue: fallback,
            ...options,
        });

    // -------------------------------------------------------------------------
    // Field styling
    // -------------------------------------------------------------------------

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            transition: "all 0.2s ease",

            "& fieldset": {
                borderColor: "#D5DCE8",
            },

            "&:hover fieldset": {
                borderColor: "#93C5FD",
            },

            "&.Mui-focused fieldset": {
                borderColor: "#2563EB",
                borderWidth: "1.5px",
            },
        },

        "& .MuiInputLabel-root.Mui-focused": {
            color: "#2563EB",
        },
    };

    // -------------------------------------------------------------------------
    // Notification
    // -------------------------------------------------------------------------

    const showNotification = (message, severity = "success") => {
        setNotification({
            open: true,
            message,
            severity,
        });
    };

    // -------------------------------------------------------------------------
    // Load authenticated user's profile
    // -------------------------------------------------------------------------

    useEffect(() => {
        let cancelled = false;

        const loadUserProfile = async () => {
            try {
                setProfileLoading(true);

                const response = await axiosInstance.get("/auth/me", {
                    withCredentials: true,
                });

                const user = response.data?.user;

                if (!user) {
                    throw new Error("User profile not found");
                }

                const whatsapp =
                    user.notificationPreferences?.whatsapp;

                const userProfile = {
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email || "",

                    whatsappPhoneNumber:
                        typeof whatsapp?.phoneNumber === "string"
                            ? whatsapp.phoneNumber.trim()
                            : "",

                    emailVerified: user.emailVerified === true,
                    whatsappVerified: whatsapp?.verified === true,
                };

                if (!cancelled) {
                    setProfile(userProfile);
                }
            } catch (error) {
                console.error(
                    "[Roommate Form] Failed to load profile:",
                    error.response?.data || error.message
                );

                if (!cancelled) {
                    setProfile(null);

                    showNotification(
                        translate(
                            "roommates.insert.notifications.profileLoadError",
                            "Unable to load your profile. Please try again."
                        ),
                        "error"
                    );
                }
            } finally {
                if (!cancelled) {
                    setProfileLoading(false);
                }
            }
        };

        loadUserProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    // -------------------------------------------------------------------------
    // Scroll to top when form mounts
    // -------------------------------------------------------------------------

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, []);

    // -------------------------------------------------------------------------
    // Clean up image preview URLs when component unmounts
    // -------------------------------------------------------------------------

    useEffect(() => {
        return () => {
            formData.images.forEach((image) => {
                if (image?.url) {
                    URL.revokeObjectURL(image.url);
                }
            });
        };
    }, [formData.images]);

    // -------------------------------------------------------------------------
    // Handle regular fields
    // -------------------------------------------------------------------------

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));
    };

    // -------------------------------------------------------------------------
    // Handle nested roommate preferences
    // -------------------------------------------------------------------------

    const handlePreferenceChange = (event) => {
        const { name, value, checked, type } = event.target;

        setFormData((previous) => ({
            ...previous,
            preferences: {
                ...previous.preferences,
                [name]: type === "checkbox" ? checked : value,
            },
        }));
    };

    // -------------------------------------------------------------------------
    // Handle images
    // -------------------------------------------------------------------------

    const handleImageChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        const currentImages = formData.images || [];

        const validFiles = selectedFiles.filter(
            (file) =>
                [
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                ].includes(file.type) &&
                file.size <= 5 * 1024 * 1024
        );

        const remaining = Math.max(
            0,
            15 - currentImages.length
        );

        const newImages = validFiles
            .slice(0, remaining)
            .map((file) => ({
                file,
                url: URL.createObjectURL(file),
            }));

        if (selectedFiles.length !== validFiles.length) {
            showNotification(
                translate(
                    "roommates.insert.notifications.invalidImages",
                    "Some images were rejected. Use JPG, PNG or WEBP files up to 5 MB."
                ),
                "warning"
            );
        } else if (validFiles.length > remaining) {
            showNotification(
                translate(
                    "roommates.insert.notifications.maxImages",
                    "You can upload a maximum of 15 images."
                ),
                "warning"
            );
        }

        setFormData((previous) => ({
            ...previous,
            images: [...previous.images, ...newImages],
        }));

        event.target.value = "";
    };

    const handleRemoveImage = (index) => {
        const image = formData.images[index];

        if (image?.url) {
            URL.revokeObjectURL(image.url);
        }

        setFormData((previous) => ({
            ...previous,
            images: previous.images.filter(
                (_, imageIndex) => imageIndex !== index
            ),
        }));
    };

    // -------------------------------------------------------------------------
    // Reset form
    // -------------------------------------------------------------------------

    const resetForm = () => {
        formData.images.forEach((image) => {
            if (image?.url) {
                URL.revokeObjectURL(image.url);
            }
        });

        setFormData({
            ...initialFormData,
            preferences: { ...initialFormData.preferences },
            images: [],
        });

        setErrors({});

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // -------------------------------------------------------------------------
    // Validation helpers
    // -------------------------------------------------------------------------

    const isValidUrl = (value) => {
        try {
            const url = new URL(value);

            return ["http:", "https:"].includes(url.protocol);
        } catch {
            return false;
        }
    };

    const isValidYouTubeUrl = (value) => {
        try {
            const url = new URL(value.trim());

            const hostname = url.hostname
                .toLowerCase()
                .replace(/^www\./, "");

            let videoId = "";

            if (!["http:", "https:"].includes(url.protocol)) {
                return false;
            }

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

            return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
        } catch {
            return false;
        }
    };

    // -------------------------------------------------------------------------
    // Validate form
    // -------------------------------------------------------------------------

    const validateForm = () => {
        const validationErrors = {};

        const required = (field) => {
            if (
                formData[field] === "" ||
                formData[field] === null ||
                formData[field] === undefined
            ) {
                validationErrors[field] = translate(
                    "roommates.insert.validation.required",
                    "This field is required."
                );
            }
        };

        required("title");
        required("description");
        required("purpose");
        required("city");

        if (
            formData.title.trim().length < 5 ||
            formData.title.trim().length > 120
        ) {
            validationErrors.title = translate(
                "roommates.insert.validation.titleLength",
                "The title must contain between 5 and 120 characters."
            );
        }

        if (formData.description.trim().length > 3000) {
            validationErrors.description = translate(
                "roommates.insert.validation.descriptionLength",
                "The description cannot exceed 3000 characters."
            );
        }

        if (
            ["Share My Property", "Find a Room"].includes(
                formData.purpose
            ) &&
            !formData.propertyType
        ) {
            validationErrors.propertyType = translate(
                "roommates.insert.validation.required",
                "This field is required."
            );
        }

        const totalPeople = Number(formData.totalPeople);
        const currentPeople = Number(formData.currentPeople);

        if (!Number.isInteger(totalPeople) || totalPeople < 1) {
            validationErrors.totalPeople = translate(
                "roommates.insert.validation.invalidCapacity",
                "Enter a valid total number of people."
            );
        }

        if (
            !Number.isInteger(currentPeople) ||
            currentPeople < 0
        ) {
            validationErrors.currentPeople = translate(
                "roommates.insert.validation.invalidOccupants",
                "Enter a valid number of current occupants."
            );
        }

        if (
            Number.isInteger(totalPeople) &&
            Number.isInteger(currentPeople) &&
            currentPeople > totalPeople
        ) {
            validationErrors.currentPeople = translate(
                "roommates.insert.validation.capacityExceeded",
                "Current occupants cannot exceed total capacity."
            );
        }

        if (
            formData.purpose === "Share My Property" &&
            currentPeople >= totalPeople
        ) {
            validationErrors.totalPeople = translate(
                "roommates.insert.validation.availablePlaceRequired",
                "You must have at least one available place."
            );
        }

        if (formData.purpose === "Share My Property") {
            required("totalRent");
            required("rentalPeriod");
        }

        const numericFields = [
            "totalRent",
            "individualRoomPrice",
            "deposit",
            "syndicateFees",
            "otherExpenses",
            "surface",
            "rooms",
            "salons",
            "bathrooms",
            "floor",
        ];

        numericFields.forEach((field) => {
            const value = formData[field];

            if (value === "" || value === null) {
                return;
            }

            const number = Number(value);

            if (!Number.isFinite(number) || number < 0) {
                validationErrors[field] = translate(
                    "roommates.insert.validation.nonNegativeNumber",
                    "Enter a valid non-negative number."
                );
            }
        });

        if (
            formData.surface !== "" &&
            Number(formData.surface) <= 0
        ) {
            validationErrors.surface = translate(
                "roommates.insert.validation.surfacePositive",
                "Surface must be greater than zero."
            );
        }

        if (
            formData.mapLink.trim() &&
            !isValidUrl(formData.mapLink.trim())
        ) {
            validationErrors.mapLink = translate(
                "roommates.insert.validation.invalidMapUrl",
                "Enter a valid Google Maps URL."
            );
        }

        if (
            formData.youtubeVideoUrl.trim() &&
            !isValidYouTubeUrl(formData.youtubeVideoUrl)
        ) {
            validationErrors.youtubeVideoUrl = translate(
                "roommates.insert.validation.invalidYoutubeUrl",
                "Enter a valid YouTube video URL."
            );
        }

        if (
            formData.availableFrom &&
            Number.isNaN(new Date(formData.availableFrom).getTime())
        ) {
            validationErrors.availableFrom = translate(
                "roommates.insert.validation.invalidDate",
                "Enter a valid date."
            );
        }

        setErrors(validationErrors);

        return Object.keys(validationErrors).length === 0;
    };

    // -------------------------------------------------------------------------
    // Submit form
    // -------------------------------------------------------------------------

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading || profileLoading) return;

        if (!profile) {
            showNotification(
                translate(
                    "roommates.insert.notifications.profileVerifyError",
                    "Unable to verify your account. Please reload the page."
                ),
                "error"
            );

            return;
        }

        // Email and WhatsApp verification.
        if (
            !profile.emailVerified ||
            !profile.whatsappVerified ||
            !profile.whatsappPhoneNumber
        ) {
            const missing = [];

            if (!profile.emailVerified) {
                missing.push(
                    translate(
                        "roommates.insert.verification.email",
                        "email verification"
                    )
                );
            }

            if (
                !profile.whatsappVerified ||
                !profile.whatsappPhoneNumber
            ) {
                missing.push(
                    translate(
                        "roommates.insert.verification.whatsapp",
                        "WhatsApp verification"
                    )
                );
            }

            showNotification(
                translate(
                    "roommates.insert.notifications.verifyBeforePublishing",
                    "Please complete {{items}} before publishing.",
                    { items: missing.join(" and ") }
                ),
                "warning"
            );

            return;
        }

        if (!validateForm()) {
            showNotification(
                translate(
                    "roommates.insert.notifications.correctFields",
                    "Please correct the highlighted fields."
                ),
                "error"
            );

            return;
        }

        // ---------------------------------------------------------------------
        // Create FormData
        // IMPORTANT: Every field must be appended only once.
        // ---------------------------------------------------------------------

        const payload = new FormData();

        const submissionData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            purpose: formData.purpose,

            propertyType: formData.propertyType,

            city: formData.city.trim(),
            neighborhood: formData.neighborhood.trim(),
            fullAddress: formData.fullAddress.trim(),
            mapLink: formData.mapLink.trim(),

            totalRent: formData.totalRent,
            rentalPeriod: formData.rentalPeriod,
            furnishingStatus: formData.furnishingStatus,
            individualRoomPrice: formData.individualRoomPrice,
            rentSplitType: formData.rentSplitType,

            deposit: formData.deposit,
            syndicateFees: formData.syndicateFees,
            otherExpenses: formData.otherExpenses,

            surface: formData.surface,
            rooms: formData.rooms,
            salons: formData.salons,
            bathrooms: formData.bathrooms,
            floor: formData.floor,
            propertyCondition: formData.propertyCondition,

            hasBalcony: formData.hasBalcony,
            hasKitchen: formData.hasKitchen,
            hasParking: formData.hasParking,

            totalPeople: formData.totalPeople,
            currentPeople: formData.currentPeople,
            availableFrom: formData.availableFrom,

            youtubeVideoUrl: formData.youtubeVideoUrl.trim(),
        };

        // Append ordinary fields exactly once.
        Object.entries(submissionData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                payload.append(key, String(value));
            }
        });

        // Append nested preferences exactly once as JSON.
        const preferencesPayload = {
            gender: formData.preferences?.gender || "Any",
            smokingAllowed: Boolean(
                formData.preferences?.smokingAllowed
            ),
            petsAllowed: Boolean(
                formData.preferences?.petsAllowed
            ),
        };

        payload.append(
            "preferences",
            JSON.stringify(preferencesPayload)
        );

        // Append actual image files exactly once.
        formData.images.forEach((image) => {
            if (image?.file instanceof File) {
                payload.append("images", image.file);
            }
        });

        try {
            setLoading(true);

            const response = await axiosInstance.post(
                "/roommates",
                payload,
                {
                    withCredentials: true,
                }
            );

            // Match the backend response:
            // { message, roommateListing, availablePlaces, rentPerPerson }
            const createdListing =
                response.data?.roommateListing ||
                response.data?.listing ||
                response.data?.roommate ||
                response.data;

            resetForm();

            showNotification(
                response.data?.message ||
                    translate(
                        "roommates.insert.notifications.publishSuccess",
                        "Your roommate announcement has been published successfully."
                    ),
                "success"
            );

            if (typeof onAddListing === "function") {
                onAddListing(createdListing);
            }
        } catch (error) {
            console.error(
                "[Roommate Form] Failed to publish announcement:",
                {
                    message: error.message,
                    status: error.response?.status,
                    response: error.response?.data,
                }
            );

            showNotification(
                error.response?.data?.message ||
                    translate(
                        "roommates.insert.notifications.publishError",
                        "Failed to publish your announcement. Please try again."
                    ),
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // Reusable input
    // -------------------------------------------------------------------------

    const renderField = (
        name,
        label,
        options = {}
    ) => {
        const {
            type = "text",
            required = false,
            multiline = false,
            rows = 1,
            select = false,
            choices = [],
            disabled = false,
            helperText = "",
            placeholder = "",
        } = options;

        return (
            <TextField
                fullWidth
                name={name}
                label={label}
                type={type}
                value={formData[name] ?? ""}
                onChange={handleChange}
                required={required}
                multiline={multiline}
                rows={rows}
                select={select}
                disabled={disabled}
                placeholder={placeholder}
                error={Boolean(errors[name])}
                helperText={errors[name] || helperText}
                sx={fieldSx}
                InputLabelProps={
                    type === "date"
                        ? { shrink: true }
                        : undefined
                }
            >
                {select &&
                    choices.map((choice) => (
                        <MenuItem
                            key={choice.value}
                            value={choice.value}
                        >
                            {choice.label}
                        </MenuItem>
                    ))}
            </TextField>
        );
    };

    // -------------------------------------------------------------------------
    // Purpose descriptions
    // -------------------------------------------------------------------------

    const purposeDescriptions = {
        "Share My Property": translate(
            "roommates.insert.purposeDescriptions.share",
            "I already have accommodation and want to find people to share it with."
        ),

        "Find a Room": translate(
            "roommates.insert.purposeDescriptions.find",
            "I am looking for an available room in an existing shared property."
        ),

        "Rent Together": translate(
            "roommates.insert.purposeDescriptions.together",
            "I want to find people to rent a property together."
        ),
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <Box>
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 1100,
                    mx: "auto",
                    py: { xs: 2, md: 4 },
                    px: { xs: 1, sm: 2 },
                }}
            >
                {/* Page heading */}
                <Box sx={{ mb: 4, px: { xs: 1, sm: 0 } }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1.5 }}
                    >
                        <Chip
                            label={translate(
                                "roommates.insert.badge",
                                "ROOMMATE ANNOUNCEMENT"
                            )}
                            size="small"
                            sx={{
                                bgcolor: "#EFF6FF",
                                color: "#2563EB",
                                fontWeight: 600,
                                fontSize: "0.68rem",
                                letterSpacing: "0.6px",
                                borderRadius: "6px",
                            }}
                        />
                    </Stack>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: "#0F172A",
                            fontSize: "1.875rem",
                            mb: 1,
                        }}
                    >
                        {translate(
                            "roommates.insert.title",
                            "Create a roommate announcement"
                        )}
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: "#5B6577",
                            maxWidth: 700,
                            lineHeight: 1.8,
                        }}
                    >
                        {translate(
                            "roommates.insert.subtitle",
                            "Share your accommodation, find a room, or connect with people who want to rent together."
                        )}
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 2 }}
                    >
                        <Box
                            component="span"
                            sx={{
                                color: "#10b981",
                                fontWeight: 700,
                                fontSize: "1.1rem",
                            }}
                        >
                            ✓
                        </Box>

                        <Typography
                            variant="caption"
                            sx={{ color: "#5B6577" }}
                        >
                            {translate(
                                "roommates.insert.requiredFields",
                                "Fields marked with * are required."
                            )}
                        </Typography>
                    </Stack>
                </Box>

                {/* Form */}
                <Box component="form" onSubmit={handleSubmit}>
                    {/* Section 1: Announcement */}

                    <SectionPaper>
                        <SectionHeader
                            number={1}
                            icon={<DescriptionIcon />}
                            title={translate(
                                "roommates.insert.sections.announcement",
                                "Announcement information"
                            )}
                            subtitle={translate(
                                "roommates.insert.sections.announcementSubtitle",
                                "Tell people what kind of roommate you are looking for."
                            )}
                        />

                        <Stack spacing={2.5}>
                            {renderField(
                                "purpose",
                                translate(
                                    "roommates.fields.purpose",
                                    "Announcement purpose"
                                ),
                                {
                                    select: true,
                                    required: true,
                                    choices: [
                                        {
                                            value: "Share My Property",
                                            label: translate(
                                                "roommates.purpose.Share My Property",
                                                "Share My Property"
                                            ),
                                        },
                                        {
                                            value: "Find a Room",
                                            label: translate(
                                                "roommates.purpose.Find a Room",
                                                "Find a Room"
                                            ),
                                        },
                                        {
                                            value: "Rent Together",
                                            label: translate(
                                                "roommates.purpose.Rent Together",
                                                "Rent Together"
                                            ),
                                        },
                                    ],
                                }
                            )}

                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                {purposeDescriptions[formData.purpose]}
                            </Alert>

                            {renderField(
                                "title",
                                translate(
                                    "roommates.fields.title",
                                    "Announcement title"
                                ),
                                {
                                    required: true,
                                    placeholder: translate(
                                        "roommates.insert.titlePlaceholder",
                                        "Example: Looking for 2 roommates in Marrakech"
                                    ),
                                    helperText: `${formData.title.length}/120`,
                                }
                            )}

                            {renderField(
                                "description",
                                translate(
                                    "roommates.fields.description",
                                    "Description"
                                ),
                                {
                                    required: true,
                                    multiline: true,
                                    rows: 5,
                                    placeholder: translate(
                                        "roommates.insert.descriptionPlaceholder",
                                        "Describe the accommodation, expectations, and the type of roommate you are looking for."
                                    ),
                                    helperText: `${formData.description.length}/3000`,
                                }
                            )}
                        </Stack>
                    </SectionPaper>

                    {/* Section 2: Location and accommodation */}

                    <SectionPaper>
                        <SectionHeader
                            number={2}
                            icon={<LocationOnIcon />}
                            title={translate(
                                "roommates.insert.sections.location",
                                "Location and accommodation"
                            )}
                            subtitle={translate(
                                "roommates.insert.sections.locationSubtitle",
                                "Provide information about the property and its location."
                            )}
                        />

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "city",
                                    translate(
                                        "roommates.fields.city",
                                        "City"
                                    ),
                                    {
                                        required: true,
                                        placeholder: "Marrakech",
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "neighborhood",
                                    translate(
                                        "roommates.fields.neighborhood",
                                        "Neighborhood"
                                    ),
                                    {
                                        placeholder: "Gueliz",
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                {renderField(
                                    "fullAddress",
                                    translate(
                                        "roommates.fields.fullAddress",
                                        "Full address"
                                    ),
                                    {
                                        placeholder: translate(
                                            "roommates.insert.addressPlaceholder",
                                            "Optional address details"
                                        ),
                                    }
                                )}

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block", mt: 0.5 }}
                                >
                                    {translate(
                                        "roommates.insert.addressPrivacy",
                                        "Your full address should only be shared with people you choose."
                                    )}
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                {renderField(
                                    "mapLink",
                                    translate(
                                        "roommates.fields.mapLink",
                                        "Google Maps link"
                                    ),
                                    {
                                        placeholder: "https://maps.google.com/...",
                                    }
                                )}
                            </Grid>

                            {formData.purpose !== "Rent Together" && (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        {renderField(
                                            "propertyType",
                                            translate(
                                                "roommates.fields.propertyType",
                                                "Property type"
                                            ),
                                            {
                                                select: true,
                                                required: true,
                                                choices: [
                                                    "Apartment",
                                                    "House",
                                                    "Villa",
                                                    "Studio",
                                                    "Room",
                                                    "Other",
                                                ].map((value) => ({
                                                    value,
                                                    label: translate(
                                                        `properties.types.${value}`,
                                                        value
                                                    ),
                                                })),
                                            }
                                        )}
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        {renderField(
                                            "furnishingStatus",
                                            translate(
                                                "roommates.fields.furnishing",
                                                "Furnishing"
                                            ),
                                            {
                                                select: true,
                                                choices: [
                                                    {
                                                        value: "Furnished",
                                                        label: translate(
                                                            "roommates.furnishing.Furnished",
                                                            "Furnished"
                                                        ),
                                                    },
                                                    {
                                                        value: "Unfurnished",
                                                        label: translate(
                                                            "roommates.furnishing.Unfurnished",
                                                            "Unfurnished"
                                                        ),
                                                    },
                                                ],
                                            }
                                        )}
                                    </Grid>
                                </>
                            )}

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "surface",
                                    translate(
                                        "roommates.fields.surface",
                                        "Surface (m²)"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "propertyCondition",
                                    translate(
                                        "roommates.fields.condition",
                                        "Property condition"
                                    ),
                                    {
                                        select: true,
                                        choices: [
                                            "New",
                                            "Good",
                                            "Needs Renovation",
                                        ].map((value) => ({
                                            value,
                                            label: translate(
                                                `roommates.condition.${value}`,
                                                value
                                            ),
                                        })),
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "rooms",
                                    translate(
                                        "roommates.fields.rooms",
                                        "Bedrooms"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "salons",
                                    translate(
                                        "roommates.fields.salons",
                                        "Living rooms"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "bathrooms",
                                    translate(
                                        "roommates.fields.bathrooms",
                                        "Bathrooms"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "floor",
                                    translate(
                                        "roommates.fields.floor",
                                        "Floor"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />

                                <Typography
                                    fontWeight={600}
                                    sx={{ mb: 1 }}
                                >
                                    {translate(
                                        "roommates.insert.features",
                                        "Property features"
                                    )}
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    flexWrap="wrap"
                                    gap={1}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="hasBalcony"
                                                checked={formData.hasBalcony}
                                                onChange={handleChange}
                                            />
                                        }
                                        label={translate(
                                            "roommates.fields.balcony",
                                            "Balcony"
                                        )}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="hasKitchen"
                                                checked={formData.hasKitchen}
                                                onChange={handleChange}
                                            />
                                        }
                                        label={translate(
                                            "roommates.fields.kitchen",
                                            "Kitchen"
                                        )}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="hasParking"
                                                checked={formData.hasParking}
                                                onChange={handleChange}
                                            />
                                        }
                                        label={translate(
                                            "roommates.fields.parking",
                                            "Parking"
                                        )}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </SectionPaper>

                    {/* Section 3: Rent and capacity */}

                    <SectionPaper>
                        <SectionHeader
                            number={3}
                            icon={<PaymentsIcon />}
                            title={translate(
                                "roommates.insert.sections.rent",
                                "Rent and occupancy"
                            )}
                            subtitle={translate(
                                "roommates.insert.sections.rentSubtitle",
                                "Specify the rent, rental period, and number of roommates."
                            )}
                        />

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "totalRent",
                                    translate(
                                        "roommates.fields.totalRent",
                                        "Total property rent"
                                    ),
                                    {
                                        type: "number",
                                        required:
                                            formData.purpose ===
                                            "Share My Property",
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "rentalPeriod",
                                    translate(
                                        "roommates.fields.rentalPeriod",
                                        "Rental period"
                                    ),
                                    {
                                        select: true,
                                        choices: [
                                            {
                                                value: "Daily",
                                                label: translate(
                                                    "roommates.rentalPeriod.Daily",
                                                    "Daily"
                                                ),
                                            },
                                            {
                                                value: "Monthly",
                                                label: translate(
                                                    "roommates.rentalPeriod.Monthly",
                                                    "Monthly"
                                                ),
                                            },
                                        ],
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "individualRoomPrice",
                                    translate(
                                        "roommates.fields.individualRoomPrice",
                                        "Individual room price"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "rentSplitType",
                                    translate(
                                        "roommates.fields.rentSplitType",
                                        "Rent split"
                                    ),
                                    {
                                        select: true,
                                        choices: [
                                            {
                                                value: "Equal",
                                                label: translate(
                                                    "roommates.rentSplit.Equal",
                                                    "Equal"
                                                ),
                                            },
                                            {
                                                value: "Custom",
                                                label: translate(
                                                    "roommates.rentSplit.Custom",
                                                    "Custom"
                                                ),
                                            },
                                        ],
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                {renderField(
                                    "deposit",
                                    translate(
                                        "roommates.fields.deposit",
                                        "Deposit"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                {renderField(
                                    "syndicateFees",
                                    translate(
                                        "roommates.fields.syndicateFees",
                                        "Syndicate fees"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                {renderField(
                                    "otherExpenses",
                                    translate(
                                        "roommates.fields.otherExpenses",
                                        "Other expenses"
                                    ),
                                    { type: "number" }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />

                                <Typography
                                    fontWeight={600}
                                    sx={{ mb: 2 }}
                                >
                                    {translate(
                                        "roommates.insert.capacity",
                                        "Roommate capacity"
                                    )}
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                {renderField(
                                    "totalPeople",
                                    translate(
                                        "roommates.fields.totalPeople",
                                        "Total people"
                                    ),
                                    {
                                        type: "number",
                                        required: true,
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                {renderField(
                                    "currentPeople",
                                    translate(
                                        "roommates.fields.currentPeople",
                                        "Current occupants"
                                    ),
                                    {
                                        type: "number",
                                        required: true,
                                    }
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    label={translate(
                                        "roommates.fields.availablePlaces",
                                        "Available places"
                                    )}
                                    value={Math.max(
                                        0,
                                        Number(formData.totalPeople || 0) -
                                        Number(formData.currentPeople || 0)
                                    )}
                                    disabled
                                    sx={fieldSx}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderField(
                                    "availableFrom",
                                    translate(
                                        "roommates.fields.availableFrom",
                                        "Available from"
                                    ),
                                    { type: "date" }
                                )}
                            </Grid>
                        </Grid>
                    </SectionPaper>

                    {/* Section 4: Roommate preferences */}

                    <SectionPaper>
                        <SectionHeader
                            number={4}
                            icon={<TuneIcon />}
                            title={translate(
                                "roommates.insert.sections.preferences",
                                "Roommate preferences"
                            )}
                            subtitle={translate(
                                "roommates.insert.sections.preferencesSubtitle",
                                "Describe the type of roommate you would prefer."
                            )}
                        />

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    name="gender"
                                    label={translate(
                                        "roommates.fields.gender",
                                        "Preferred gender"
                                    )}
                                    value={formData.preferences.gender}
                                    onChange={handlePreferenceChange}
                                    sx={fieldSx}
                                >
                                    {[
                                        {
                                            value: "Any",
                                            label: translate(
                                                "roommates.preferences.any",
                                                "Any"
                                            ),
                                        },
                                        {
                                            value: "Male",
                                            label: translate(
                                                "roommates.preferences.male",
                                                "Male"
                                            ),
                                        },
                                        {
                                            value: "Female",
                                            label: translate(
                                                "roommates.preferences.female",
                                                "Female"
                                            ),
                                        },
                                    ].map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    gap={1}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="smokingAllowed"
                                                checked={
                                                    formData.preferences
                                                        .smokingAllowed
                                                }
                                                onChange={
                                                    handlePreferenceChange
                                                }
                                            />
                                        }
                                        label={translate(
                                            "roommates.fields.smokingAllowed",
                                            "Smoking allowed"
                                        )}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="petsAllowed"
                                                checked={
                                                    formData.preferences
                                                        .petsAllowed
                                                }
                                                onChange={
                                                    handlePreferenceChange
                                                }
                                            />
                                        }
                                        label={translate(
                                            "roommates.fields.petsAllowed",
                                            "Pets allowed"
                                        )}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </SectionPaper>

                    {/* Section 5: Photos and video */}

                    <SectionPaper>
                        <SectionHeader
                            number={5}
                            icon={<PhotoLibraryIcon />}
                            title={translate(
                                "roommates.insert.sections.media",
                                "Photos and video"
                            )}
                            subtitle={translate(
                                "roommates.insert.sections.mediaSubtitle",
                                "Add photos and an optional YouTube video of the accommodation."
                            )}
                        />

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            hidden
                            onChange={handleImageChange}
                        />

                        <Button
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            sx={{
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 600,
                                py: 1.2,
                                px: 2.5,
                            }}
                        >
                            {translate(
                                "roommates.insert.uploadImages",
                                "Upload photos"
                            )}
                        </Button>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 1 }}
                        >
                            {translate(
                                "roommates.insert.imageRules",
                                "JPG, PNG or WEBP. Maximum 15 images, 5 MB per image."
                            )}
                        </Typography>

                        {formData.images.length > 0 && (
                            <Grid container spacing={1.5} sx={{ mt: 2 }}>
                                {formData.images.map((image, index) => (
                                    <Grid
                                        key={`${image.url}-${index}`}
                                        size={{ xs: 6, sm: 4, md: 3 }}
                                    >
                                        <Box
                                            sx={{
                                                position: "relative",
                                                height: 140,
                                                borderRadius: 2,
                                                overflow: "hidden",
                                                border: "1px solid #E2E8F0",
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={image.url}
                                                alt={`Roommate image ${index + 1}`}
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />

                                            <Button
                                                size="small"
                                                color="error"
                                                variant="contained"
                                                onClick={() =>
                                                    handleRemoveImage(index)
                                                }
                                                sx={{
                                                    position: "absolute",
                                                    top: 6,
                                                    right: 6,
                                                    minWidth: 32,
                                                    width: 32,
                                                    height: 32,
                                                    p: 0,
                                                    borderRadius: "50%",
                                                }}
                                            >
                                                <DeleteOutlineOutlinedIcon fontSize="small" />
                                            </Button>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        <Divider sx={{ my: 3 }} />

                        {renderField(
                            "youtubeVideoUrl",
                            translate(
                                "roommates.fields.youtubeVideoUrl",
                                "YouTube video URL (optional)"
                            ),
                            {
                                placeholder: "https://www.youtube.com/watch?v=...",
                                helperText: translate(
                                    "roommates.insert.youtubeHelp",
                                    "Paste a YouTube video link. Video files cannot be uploaded."
                                ),
                            }
                        )}
                    </SectionPaper>

                    {/* Section 6: Publish */}

                    <SectionPaper>
                        <SectionHeader
                            number={6}
                            icon={<HomeWorkIcon />}
                            title={translate(
                                "roommates.insert.sections.publish",
                                "Publish announcement"
                            )}
                            subtitle={translate(
                                "roommates.insert.sections.publishSubtitle",
                                "Review your information before publishing."
                            )}
                        />

                        {profileLoading ? (
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1.5}
                            >
                                <CircularProgress size={22} />

                                <Typography color="text.secondary">
                                    {translate(
                                        "roommates.insert.loadingProfile",
                                        "Loading your profile..."
                                    )}
                                </Typography>
                            </Stack>
                        ) : (
                            <Box>
                                <Typography
                                    fontWeight={600}
                                    sx={{ mb: 1 }}
                                >
                                    {translate(
                                        "roommates.insert.publisher",
                                        "Publishing as"
                                    )}
                                </Typography>

                                <Typography color="text.secondary">
                                    {profile
                                        ? `${profile.firstName} ${profile.lastName}`.trim()
                                        : translate(
                                            "roommates.insert.profileUnavailable",
                                            "Profile unavailable"
                                        )}
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                    sx={{ mt: 2 }}
                                >
                                    <Chip
                                        label={
                                            profile?.emailVerified
                                                ? translate(
                                                    "roommates.insert.emailVerified",
                                                    "Email verified"
                                                )
                                                : translate(
                                                    "roommates.insert.emailNotVerified",
                                                    "Email not verified"
                                                )
                                        }
                                        color={
                                            profile?.emailVerified
                                                ? "success"
                                                : "warning"
                                        }
                                        variant="outlined"
                                    />

                                    <Chip
                                        label={
                                            profile?.whatsappVerified
                                                ? translate(
                                                    "roommates.insert.whatsappVerified",
                                                    "WhatsApp verified"
                                                )
                                                : translate(
                                                    "roommates.insert.whatsappNotVerified",
                                                    "WhatsApp not verified"
                                                )
                                        }
                                        color={
                                            profile?.whatsappVerified
                                                ? "success"
                                                : "warning"
                                        }
                                        variant="outlined"
                                    />
                                </Stack>
                            </Box>
                        )}

                        <Divider sx={{ my: 3 }} />

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            justifyContent="flex-end"
                        >
                            <Button
                                variant="outlined"
                                color="inherit"
                                disabled={loading}
                                onClick={resetForm}
                                sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1.2,
                                }}
                            >
                                {translate(
                                    "roommates.insert.reset",
                                    "Reset form"
                                )}
                            </Button>

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading || profileLoading}
                                sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.2,
                                    bgcolor: "#2563EB",
                                    "&:hover": {
                                        bgcolor: "#1D4ED8",
                                    },
                                }}
                            >
                                {loading ? (
                                    <CircularProgress
                                        size={23}
                                        color="inherit"
                                    />
                                ) : (
                                    translate(
                                        "roommates.insert.publish",
                                        "Publish announcement"
                                    )
                                )}
                            </Button>
                        </Stack>
                    </SectionPaper>
                </Box>
            </Box>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={() =>
                    setNotification((previous) => ({
                        ...previous,
                        open: false,
                    }))
                }
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    onClose={() =>
                        setNotification((previous) => ({
                            ...previous,
                            open: false,
                        }))
                    }
                    sx={{ width: "100%" }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
