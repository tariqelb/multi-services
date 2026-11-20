
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";

import {
    Box,
    Typography,
    Stack,
    Chip,
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material";

import DescriptionIcon from "@mui/icons-material/Description";
import HomeWorkIcon from "@mui/icons-material/HomeWork";

import RoommateAnnouncementSection from "./RoommateAnnouncementSection";
import RoommateLocationSection from "./RoommateLocationSection";
import RoommateRentSection from "./RoommateRentSection";
import RoommatePreferencesSection from "./RoommatePreferencesSection";
import RoommateMediaSection from "./RoommateMediaSection";
import RoommatePublishSection from "./RoommatePublishSection";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import { FormPage, FormPageHeader } from "../../../Components/ui/FormKit";

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
// Main component
// -----------------------------------------------------------------------------

export default function RoommateInsertForm({ onAddListing }) {
    const { t } = useTranslation();

    const fileInputRef = useRef(null);
    const imagesRef = useRef([]);

    const [formData, setFormData] = useState(() => ({
        ...initialFormData,
        preferences: { ...initialFormData.preferences },
        images: [],
    }));

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
    // Translation
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
                borderColor: "#E2E8F0",
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

    const closeNotification = () => {
        setNotification((previous) => ({
            ...previous,
            open: false,
        }));
    };

    // -------------------------------------------------------------------------
    // Keep a reference to the current images for unmount cleanup
    // -------------------------------------------------------------------------

    useEffect(() => {
        imagesRef.current = formData.images;
    }, [formData.images]);

    useEffect(() => {
        return () => {
            imagesRef.current.forEach((image) => {
                if (image?.url) {
                    URL.revokeObjectURL(image.url);
                }
            });
        };
    }, []);

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
    // Regular field changes
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
    // City changes
    // The city component returns the English city name.
    // -------------------------------------------------------------------------

    const handleCityChange = (city) => {
        setFormData((previous) => ({
            ...previous,
            city: city || "",
        }));

        setErrors((previous) => ({
            ...previous,
            city: "",
        }));
    };

    // -------------------------------------------------------------------------
    // Nested roommate preferences
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
    // Image upload
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
        event?.preventDefault();

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

        Object.entries(submissionData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                payload.append(key, String(value));
            }
        });

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
    // Compatibility adapters for the extracted section components
    // -------------------------------------------------------------------------

    const purposeToSection = {
        "Share My Property": "Share My Apartment",
        "Find a Room": "Find a Room",
        "Rent Together": "Rent Together",
    };

    const purposeFromSection = {
        "Share My Apartment": "Share My Property",
        "Find a Room": "Find a Room",
        "Rent Together": "Rent Together",
    };

    const adaptedAnnouncementData = {
        ...formData,
        purpose: purposeToSection[formData.purpose] || formData.purpose,
    };

    const handleAnnouncementChange = (event) => {
        if (event.target.name === "purpose") {
            handleChange({
                target: {
                    ...event.target,
                    value:
                        purposeFromSection[event.target.value] ||
                        event.target.value,
                },
            });

            return;
        }

        handleChange(event);
    };

    const adaptedLocationData = {
        ...formData,
        furnishing: formData.furnishingStatus,
        condition: formData.propertyCondition,
        bedrooms: formData.rooms,
    };

    const locationFieldMap = {
        furnishing: "furnishingStatus",
        condition: "propertyCondition",
        bedrooms: "rooms",
    };

    const handleLocationChange = (event) => {
        const originalName =
            locationFieldMap[event.target.name] || event.target.name;

        handleChange({
            target: {
                ...event.target,
                name: originalName,
            },
        });
    };

    const adaptedPreferencesData = {
        ...formData,
        preferredGender: formData.preferences.gender,
        smokingAllowed: formData.preferences.smokingAllowed,
        petsAllowed: formData.preferences.petsAllowed,
    };

    const handleAdaptedPreferenceChange = (event) => {
        handlePreferenceChange({
            target: {
                ...event.target,
                name:
                    event.target.name === "preferredGender"
                        ? "gender"
                        : event.target.name,
            },
        });
    };

    const adaptedMediaData = {
        ...formData,
        youtubeLink: formData.youtubeVideoUrl,
    };

    const handleMediaChange = (event) => {
        const originalName =
            event.target.name === "youtubeLink"
                ? "youtubeVideoUrl"
                : event.target.name;

        handleChange({
            target: {
                ...event.target,
                name: originalName,
            },
        });
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <Box>
            <FormPage>
                <FormPageHeader
                    icon={<GroupAddOutlinedIcon />}
                    badge={translate("roommates.insert.badge", "ROOMMATE ANNOUNCEMENT")}
                    title={translate("roommates.insert.title", "Create a roommate announcement")}
                    subtitle={translate(
                        "roommates.insert.subtitle",
                        "Share your accommodation, find a room, or connect with people who want to rent together."
                    )}
                    requiredNote={translate(
                        "roommates.insert.requiredFields",
                        "Fields marked with * are required."
                    )}
                />

                {/* Form */}
                <Box component="form" onSubmit={handleSubmit}>
                    <Stack
                        spacing={{ xs: 2, sm: 3, md: 3.5 }}
                        sx={{
                            width: "100%",
                            "& > *": {
                                minWidth: 0,
                                width: "100%",
                            },
                        }}
                    >
                        <RoommateAnnouncementSection
                            formData={adaptedAnnouncementData}
                            errors={errors}
                            onChange={handleAnnouncementChange}
                            t={t}
                        />

                        <RoommateLocationSection
                            formData={adaptedLocationData}
                            errors={errors}
                            onChange={handleLocationChange}
                            onCityChange={handleCityChange}
                            t={t}
                        />

                        <RoommateRentSection
                            formData={formData}
                            errors={errors}
                            onChange={handleChange}
                            t={t}
                        />

                        <RoommatePreferencesSection
                            formData={adaptedPreferencesData}
                            onChange={handleAdaptedPreferenceChange}
                            t={t}
                        />

                        <RoommateMediaSection
                            images={formData.images}
                            previews={formData.images.map(
                                (image) => image.url
                            )}
                            onImagesChange={handleImageChange}
                            onRemoveImage={handleRemoveImage}
                            formData={adaptedMediaData}
                            onChange={handleMediaChange}
                            errors={errors}
                            t={t}
                        />

                        <RoommatePublishSection
                            loading={loading}
                            profileLoading={profileLoading}
                            profile={profile}
                            onSubmit={handleSubmit}
                            onReset={resetForm}
                            t={t}
                        />
                    </Stack>
                </Box>
            </FormPage>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={closeNotification}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    onClose={closeNotification}
                    sx={{ width: "100%" }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
