
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";

import {
    updateField,
    setImages,
    setErrors,
} from "../../../redux/reducers/insertProperty/propertyFormSlice";

import { Box, Snackbar, Alert } from "@mui/material";
import AddHomeWorkRoundedIcon from "@mui/icons-material/AddHomeWorkRounded";

import {
    FormPage,
    FormPageHeader,
    SectionHeader,
    SectionPaper,
} from "../../../Components/ui/FormKit";

import PropertyInsertFormOwnerInfo from "./PropertyInsertFormOwnerInfo";
import PropertyInsertFormDetails from "./PropertyInsertFormDetails";
import PropertyInsertFormImages from "./PropertyInsertFormImages";
import PropertyInsertFormPublish from "./PropertyInsertFormPublish";
import PropertyInsertFormDescription from "./PropertyInsertFormDescription";

export default function PropertyInsertForm({ onAddProperty }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const formData = useSelector(
        (state) => state.propertyForm.formData
    );

    const errors = useSelector(
        (state) => state.propertyForm.errors
    );

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const fileInputRef = useRef(null);

    // Load authenticated user's profile.
    useEffect(() => {
        let cancelled = false;

        const loadUserProfile = async () => {
            setProfileLoading(true);

            try {
                const response = await axiosInstance.get("/auth/me");
                const user = response.data?.user;

                if (!user) {
                    throw new Error("User profile not found");
                }

                const whatsapp = user.notificationPreferences?.whatsapp;

                const whatsappPhoneNumber =
                    typeof whatsapp?.phoneNumber === "string"
                        ? whatsapp.phoneNumber.trim()
                        : "";

                const userProfile = {
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email || "",
                    whatsappPhoneNumber,
                    whatsappVerified: whatsapp?.verified === true,
                    emailVerified: user.emailVerified === true,
                };

                if (cancelled) return;

                setProfile(userProfile);

                // Populate authenticated user's contact information.
                dispatch(
                    updateField({
                        name: "firstName",
                        value: userProfile.firstName,
                    })
                );

                dispatch(
                    updateField({
                        name: "lastName",
                        value: userProfile.lastName,
                    })
                );

                dispatch(
                    updateField({
                        name: "email",
                        value: userProfile.email,
                    })
                );

                dispatch(
                    updateField({
                        name: "phone",
                        value: whatsappPhoneNumber,
                    })
                );

                dispatch(
                    updateField({
                        name: "whatsappPhoneNumber",
                        value: whatsappPhoneNumber,
                    })
                );
            } catch (error) {
                console.error(
                    "[Property Form] Failed to load profile:",
                    error.response?.data || error.message
                );

                if (!cancelled) {
                    setProfile(null);

                    setNotification({
                        open: true,
                        message: t("properties.insert.notifications.profileLoadError"),
                        severity: "error",
                    });
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
    }, [dispatch, t]);

    // Set the email visibility default without overriding an existing choice.
    useEffect(() => {
        if (formData.showEmail === undefined) {
            dispatch(
                updateField({
                    name: "showEmail",
                    value: false,
                })
            );
        }
    }, [dispatch, formData.showEmail]);

    // Reset page scroll position when this page mounts.
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, []);

    // Keep these values unchanged because they are stored form values.
    const propertyTypes = [
        "Apartment",
        "House",
        "Villa",
        "Studio",
        "Room",
        "Store",
        "Office",
        "Land",
        "Warehouse",
        "Commercial space",
        "Commercial store",
        "Garage",
        "other",
    ];

    // Input styles now come from the global theme.
    const fieldSx = {};

    // Update Redux form fields.
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        dispatch(
            updateField({
                name,
                value: type === "checkbox" ? checked : value,
            })
        );
    };

    const handleRoleChange = (_, value) => {
        if (value !== null) {
            dispatch(
                updateField({
                    name: "role",
                    value,
                })
            );
        }
    };

    const handleListingTypeChange = (_, value) => {
        if (value !== null) {
            dispatch(
                updateField({
                    name: "listingType",
                    value,
                })
            );
        }
    };

    // Reset property fields after successful publication.
    const resetPropertyForm = () => {
        // Revoke image preview URLs.
        (formData.images || []).forEach((image) => {
            if (image?.url) {
                URL.revokeObjectURL(image.url);
            }
        });

        // Preserve authenticated user's contact information.
        const profileFields = {
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            email: profile?.email || "",
            phone: profile?.whatsappPhoneNumber || "",
            whatsappPhoneNumber: profile?.whatsappPhoneNumber || "",
        };

        // Clear every form field according to its value type.
        Object.entries(formData).forEach(([key, value]) => {
            if (Object.prototype.hasOwnProperty.call(profileFields, key)) {
                dispatch(
                    updateField({
                        name: key,
                        value: profileFields[key],
                    })
                );

                return;
            }

            let emptyValue = "";

            if (Array.isArray(value)) {
                emptyValue = [];
            } else if (typeof value === "boolean") {
                emptyValue = false;
            }

            dispatch(
                updateField({
                    name: key,
                    value: emptyValue,
                })
            );
        });

        // Explicitly clear images and validation errors.
        dispatch(setImages([]));
        dispatch(setErrors({}));

        // Clear the native file input.
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Select and validate images.
    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
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
            setNotification({
                open: true,
                message: t("properties.insert.notifications.invalidImages"),
                severity: "warning",
            });
        } else if (validFiles.length > remaining) {
            setNotification({
                open: true,
                message: t("properties.insert.notifications.maxImages"),
                severity: "warning",
            });
        }

        dispatch(setImages([...currentImages, ...newImages]));

        // Allow selecting the same file again.
        e.target.value = "";
    };

    // Remove an image from the selected list.
    const handleRemoveImage = (index) => {
        const image = (formData.images || [])[index];

        if (image?.url) {
            URL.revokeObjectURL(image.url);
        }

        dispatch(
            setImages(
                (formData.images || []).filter(
                    (_, imageIndex) => imageIndex !== index
                )
            )
        );
    };

    // Validate and submit the property.
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading || profileLoading) return;

        if (!profile) {
            setNotification({
                open: true,
                message: t("properties.insert.notifications.profileVerifyError"),
                severity: "error",
            });

            return;
        }

        // Check email and WhatsApp verification.
        if (
            !profile.emailVerified ||
            !profile.whatsappVerified ||
            !profile.whatsappPhoneNumber
        ) {
            const missingVerification = [];

            if (!profile.emailVerified) {
                missingVerification.push(
                    t("properties.insert.verification.email")
                );
            }

            if (
                !profile.whatsappPhoneNumber ||
                !profile.whatsappVerified
            ) {
                missingVerification.push(
                    t("properties.insert.verification.whatsapp")
                );
            }

            setNotification({
                open: true,
                message: t(
                    "properties.insert.notifications.verifyBeforePublishing",
                    { items: missingVerification.join(" and ") }
                ),
                severity: "warning",
            });

            return;
        }

        const validationErrors = {};

        const requiredFields = [
            "firstName",
            "lastName",
            "phone",
            "title",
            "listingType",
            "propertyType",
            "city",
            "price",
            "surface",
        ];

        requiredFields.forEach((key) => {
            if (!String(formData[key] ?? "").trim()) {
                validationErrors[key] = t(
                    "properties.insert.validation.required"
                );
            }
        });

        // Validate numeric fields, including rental costs.
        const numericFields = [
            "price",
            "surface",
            "rooms",
            "salons",
            "bathrooms",
            "floor",
            "syndicateFees",
            "deposit",
            "mediatorFee",
        ];

        numericFields.forEach((key) => {
            const value = formData[key];

            if (
                value === "" ||
                value === null ||
                value === undefined
            ) {
                if (key === "price" || key === "surface") {
                    validationErrors[key] = t(
                        "properties.insert.validation.required"
                    );
                }

                return;
            }

            const number = Number(value);

            if (!Number.isFinite(number) || number < 0) {
                validationErrors[key] = t(
                    "properties.insert.validation.nonNegativeNumber"
                );
            } else if (key === "surface" && number <= 0) {
                validationErrors[key] = t(
                    "properties.insert.validation.surfacePositive"
                );
            }
        });

        if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            validationErrors.email = t(
                "properties.insert.validation.invalidEmail"
            );
        }

        if (formData.mapLink) {
            try {
                const url = new URL(formData.mapLink);

                if (!["http:", "https:"].includes(url.protocol)) {
                    throw new Error("Invalid URL protocol");
                }
            } catch {
                validationErrors.mapLink = t(
                    "properties.insert.validation.invalidMapUrl"
                );
            }
        }

        // Validate optional YouTube video URL.
        if (formData.youtubeVideoUrl?.trim()) {
            try {
                const url = new URL(formData.youtubeVideoUrl.trim());

                const hostname = url.hostname
                    .toLowerCase()
                    .replace(/^www\./, "");

                let videoId = "";

                if (
                    url.protocol !== "https:" &&
                    url.protocol !== "http:"
                ) {
                    throw new Error("Invalid URL protocol");
                }

                if (hostname === "youtu.be") {
                    videoId = url.pathname
                        .slice(1)
                        .split("/")[0];
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

                if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                    throw new Error("Invalid YouTube video ID");
                }
            } catch {
                validationErrors.youtubeVideoUrl = t(
                    "properties.insert.validation.invalidYoutubeUrl"
                );
            }
        }


        if ((formData.images || []).length > 15) {
            validationErrors.images = t(
                "properties.insert.validation.maxImages"
            );
        }

        dispatch(setErrors(validationErrors));

        if (Object.keys(validationErrors).length > 0) {
            setNotification({
                open: true,
                message: t("properties.insert.notifications.correctFields"),
                severity: "error",
            });

            return;
        }

        // Exclude profile information and verification flags.
        // The backend retrieves contact information from the authenticated user.
        const {
            firstName,
            lastName,
            email,
            phone,
            whatsappPhoneNumber,
            emailVerified,
            phoneVerified,
            whatsappVerified,
            ...propertyFields
        } = formData;

        const submissionData = {
            ...propertyFields,
            showEmail: formData.showEmail ?? false,
            rentWithContract: formData.rentWithContract ?? false,
            mortgageAgreement: formData.mortgageAgreement ?? false,
            deposit: formData.deposit ?? 0,
            mediatorFee: formData.mediatorFee ?? 0,
        };

        // Build multipart FormData.
        const payload = new FormData();

        Object.entries(submissionData).forEach(([key, value]) => {
            if (key === "images") {
                (value || []).forEach((image) => {
                    if (image?.file instanceof File) {
                        payload.append("images", image.file);
                    }
                });
            } else if (value !== null && value !== undefined) {
                payload.append(key, String(value));
            }
        });

        try {
            setLoading(true);

            const response = await axiosInstance.post(
                "/property/insert",
                payload
            );

            // Reset the form only after successful publication.
            resetPropertyForm();

            setNotification({
                open: true,
                message:
                    response.data?.message ||
                    t("properties.insert.notifications.publishSuccess"),
                severity: "success",
            });

            if (typeof onAddProperty === "function") {
                onAddProperty(response.data?.property);
            }
        } catch (error) {
            console.error(
                "[Frontend] Failed to publish property:",
                {
                    message: error.message,
                    status: error.response?.status,
                    response: error.response?.data,
                }
            );

            setNotification({
                open: true,
                message:
                    error.response?.data?.message ||
                    t("properties.insert.notifications.publishError"),
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <FormPage>
                <FormPageHeader
                    icon={<AddHomeWorkRoundedIcon />}
                    badge={t("properties.insert.badge")}
                    title={t("properties.insert.title")}
                    subtitle={t("properties.insert.subtitle")}
                    requiredNote={t("properties.insert.requiredFields")}
                />

                {/* Property form */}
                <Box component="form" onSubmit={handleSubmit}>
                    <PropertyInsertFormOwnerInfo
                        formData={formData}
                        errors={errors}
                        handleChange={handleChange}
                        handleRoleChange={handleRoleChange}
                        fieldSx={fieldSx}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormDetails
                        formData={formData}
                        errors={errors}
                        handleChange={handleChange}
                        handleListingTypeChange={handleListingTypeChange}
                        propertyTypes={propertyTypes}
                        fieldSx={fieldSx}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormDescription
                        formData={formData}
                        errors={errors}
                        handleChange={handleChange}
                        fieldSx={fieldSx}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormImages
                        formData={formData}
                        fileInputRef={fileInputRef}
                        handleImageChange={handleImageChange}
                        handleRemoveImage={handleRemoveImage}
                        SectionPaper={SectionPaper}
                        SectionHeader={SectionHeader}
                    />

                    <PropertyInsertFormPublish
                        loading={loading || profileLoading}
                    />
                </Box>
            </FormPage>

            {/* Success and error notifications */}
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