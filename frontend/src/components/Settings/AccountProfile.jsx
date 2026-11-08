import React, { useEffect, useRef, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Stack,
    TextField,
    Typography,
    MenuItem,
} from "@mui/material";

import {
    AccountCircle,
    CameraAlt,
    SaveOutlined,
} from "@mui/icons-material";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const BACKEND_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api\/?$/, "");

const COUNTRY_CODES = getCountries()
    .map((country) => ({
        country,
        code: `+${getCountryCallingCode(country)}`,
        label: `${country} (+${getCountryCallingCode(country)})`,
    }))
    .sort((a, b) => a.country.localeCompare(b.country));

function splitPhoneNumber(value = "") {
    const normalized = value.trim();

    if (!normalized) {
        return { countryCode: "+212", localNumber: "" };
    }

    if (!normalized.startsWith("+")) {
        return {
            countryCode: "+212",
            localNumber: normalized.replace(/\D/g, ""),
        };
    }

    const match = [...COUNTRY_CODES]
        .sort((a, b) => b.code.length - a.code.length)
        .find(({ code }) => normalized.startsWith(code));

    if (match) {
        return {
            countryCode: match.code,
            localNumber: normalized
                .slice(match.code.length)
                .replace(/\D/g, ""),
        };
    }

    return {
        countryCode: "",
        localNumber: normalized,
    };
}

function getProfileImageUrl(image) {
    if (!image) return undefined;

    if (image.startsWith("data:image/")) {
        return image;
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    if (image.startsWith("/uploads/")) {
        return `${BACKEND_URL}${image}`;
    }

    return image;
}

export default function AccountProfile({
    profile,
    setProfile,
    profileLoading,
    profileSaving,
    profileError,
    savedProfile,
    onSave,
    onRetry,
    onImageChanged,
}) {
    const { t } = useTranslation();

    const imageInputRef = useRef(null);

    const [countryCode, setCountryCode] = useState("+212");
    const [localNumber, setLocalNumber] = useState("");

    useEffect(() => {
        const parsed = splitPhoneNumber(profile.phoneNumber);

        setCountryCode(parsed.countryCode);
        setLocalNumber(parsed.localNumber);
    }, [profile.phoneNumber]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleCountryCodeChange = (event) => {
        const nextCountryCode = event.target.value;

        setCountryCode(nextCountryCode);

        setProfile((previous) => ({
            ...previous,
            phoneNumber: `${nextCountryCode}${localNumber}`,
        }));
    };

    const handlePhoneNumberChange = (event) => {
        const nextLocalNumber = event.target.value.replace(/\D/g, "");

        setLocalNumber(nextLocalNumber);

        setProfile((previous) => ({
            ...previous,
            phoneNumber: `${countryCode}${nextLocalNumber}`,
        }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert(t("settings.profile.invalidImage"));
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert(t("settings.profile.imageTooLarge"));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") return;

            setProfile((previous) => ({
                ...previous,
                profileImage: reader.result,
            }));

            onImageChanged?.(true);
        };

        reader.onerror = () => {
            alert(t("settings.profile.imageReadError"));
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setProfile((previous) => ({
            ...previous,
            profileImage: "",
        }));

        onImageChanged?.(true);

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const initials =
        `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
            .toUpperCase() || "U";

    const profileImageUrl = getProfileImageUrl(profile.profileImage);

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            }}
        >
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack
                    direction="row"
                    spacing={2.5}
                    alignItems="center"
                    sx={{ mb: 4.5 }}
                >
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "10px",
                            bgcolor: "#EFF6FF",
                            color: "#1D4ED8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <AccountCircle sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mb: 0.5 }}
                        >
                            {t("settings.profile.sectionTitle")}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {t("settings.profile.sectionSubtitle")}
                        </Typography>
                    </Box>
                </Stack>

                {profileLoading && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {t("settings.profile.loading")}
                    </Alert>
                )}

                {profileError && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={onRetry}
                            >
                                {t("settings.profile.retry")}
                            </Button>
                        }
                    >
                        {profileError}
                    </Alert>
                )}

                <form onSubmit={onSave}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={3.5}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        mb={5}
                    >
                        <Avatar
                            src={profileImageUrl}
                            alt={`${profile.firstName} ${profile.lastName}`}
                            sx={{
                                width: 92,
                                height: 92,
                                bgcolor: "#d1fae5",
                                color: "#1D4ED8",
                                fontSize: 32,
                                fontWeight: 700,
                                flexShrink: 0,
                            }}
                        >
                            {!profileImageUrl && initials}
                        </Avatar>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                                fontWeight={700}
                                sx={{
                                    fontSize: "1.05rem",
                                    mb: 0.5,
                                }}
                            >
                                {t("settings.profile.pictureTitle")}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                {t("settings.profile.pictureDescription")}
                            </Typography>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mb: 1 }}
                            >
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    startIcon={<CameraAlt />}
                                    component="label"
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                    }}
                                >
                                    {t("settings.profile.uploadPicture")}

                                    <input
                                        ref={imageInputRef}
                                        hidden
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                    />
                                </Button>

                                {profile.profileImage && (
                                    <Button
                                        color="error"
                                        onClick={handleRemoveImage}
                                        sx={{ textTransform: "none" }}
                                    >
                                        {t("settings.profile.removePicture")}
                                    </Button>
                                )}
                            </Stack>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                            >
                                {t("settings.profile.imageRequirements")}
                            </Typography>
                        </Box>
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                            },
                            gap: { xs: 3.5, sm: 4 },
                            mt: 3,
                            mb: 3,
                        }}
                    >
                        <TextField
                            label={t("settings.profile.firstName")}
                            name="firstName"
                            value={profile.firstName}
                            onChange={handleChange}
                            required
                            fullWidth
                        />

                        <TextField
                            label={t("settings.profile.lastName")}
                            name="lastName"
                            value={profile.lastName}
                            onChange={handleChange}
                            required
                            fullWidth
                        />

                        <TextField
                            label={t("settings.profile.email")}
                            name="email"
                            type="email"
                            value={profile.email}
                            onChange={handleChange}
                            required
                            fullWidth
                            sx={{ gridColumn: { sm: "1 / -1" } }}
                        />

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "minmax(115px, 0.8fr) minmax(0, 2fr)",
                                    sm: "minmax(115px, 0.8fr) minmax(0, 2fr)",
                                },
                                gap: 1.5,
                                gridColumn: { sm: "1 / -1" },
                            }}
                        >
                            <TextField
                                select
                                label={t("settings.profile.countryCode")}
                                value={
                                    COUNTRY_CODES.find(
                                        (country) =>
                                            country.code === countryCode
                                    )?.country ?? "MA"
                                }
                                onChange={(event) => {
                                    const selected = COUNTRY_CODES.find(
                                        (country) =>
                                            country.country ===
                                            event.target.value
                                    );

                                    if (selected) {
                                        handleCountryCodeChange({
                                            target: {
                                                value: selected.code,
                                            },
                                        });
                                    }
                                }}
                                fullWidth
                            >
                                {COUNTRY_CODES.map((country) => (
                                    <MenuItem
                                        key={country.country}
                                        value={country.country}
                                    >
                                        {country.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label={t("settings.profile.phoneNumber")}
                                type="tel"
                                value={localNumber}
                                onChange={handlePhoneNumberChange}
                                inputProps={{ inputMode: "numeric" }}
                                placeholder="655261677"
                                fullWidth
                            />
                        </Box>

                        <TextField
                            label={t("settings.profile.address")}
                            name="address"
                            value={profile.address}
                            onChange={handleChange}
                            fullWidth
                            sx={{ gridColumn: { sm: "1 / -1" } }}
                        />

                        <TextField
                            label={t("settings.profile.biography")}
                            name="bio"
                            value={profile.bio}
                            onChange={handleChange}
                            multiline
                            minRows={3}
                            fullWidth
                            sx={{ gridColumn: { sm: "1 / -1" } }}
                        />
                    </Box>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2.5}
                        mt={5}
                    >
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={
                                profileLoading ||
                                profileSaving ||
                                !savedProfile
                            }
                            startIcon={<SaveOutlined />}
                            sx={{
                                bgcolor: "#1D4ED8",
                                "&:hover": {
                                    bgcolor: "#1E40AF",
                                },
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1.75,
                                px: 4,
                                borderRadius: "10px",
                                minHeight: 48,
                            }}
                        >
                            {profileSaving
                                ? t("settings.profile.saving")
                                : t("settings.profile.save")}
                        </Button>
                    </Stack>
                </form>
            </CardContent>
        </Card>
    );
}