
import React, { useEffect, useRef, useState } from "react";
import {
    getCountries,
    getCountryCallingCode,
    parsePhoneNumberFromString,
} from "libphonenumber-js";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Divider,
    FormControlLabel,
    InputAdornment,
    Stack,
    TextField,
    Typography,
    MenuItem,
} from "@mui/material";

import {
    AccountCircle,
    CameraAlt,
    SaveOutlined,
    WhatsApp,
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

// Morocco is represented by MA.
// Exclude EH so it never appears as a separate country.
const COUNTRY_CODES = getCountries()
    .filter((country) => country !== "EH")
    .map((country) => ({
        country,
        code: `+${getCountryCallingCode(country)}`,
        label: `${country} (+${getCountryCallingCode(country)})`,
    }))
    .sort((a, b) => a.country.localeCompare(b.country));

function splitPhoneNumber(value = "") {
    const normalized = value.trim();

    if (!normalized) {
        return {
            country: "MA",
            localNumber: "",
        };
    }

    const parsed = parsePhoneNumberFromString(
        normalized,
        "MA"
    );

    if (parsed) {
        // Always interpret +212 as Morocco (MA).
        const country =
            parsed.countryCallingCode === "212"
                ? "MA"
                : parsed.country || "MA";

        let localNumber = parsed.nationalNumber;

        // Display Morocco's domestic leading zero in the input.
        // It will not be stored in the database.
        if (country === "MA") {
            localNumber = `0${localNumber}`;
        }

        return {
            country,
            localNumber,
        };
    }

    // Support older numbers saved in local format.
    if (/^0\d{9}$/.test(normalized)) {
        return {
            country: "MA",
            localNumber: normalized,
        };
    }

    return {
        country: "MA",
        localNumber: normalized.replace(/\D/g, ""),
    };
}

function buildInternationalPhoneNumber(country, localNumber) {
    let digits = localNumber.replace(/\D/g, "");

    if (!digits) return "";

    if (country === "MA") {
        // Accept either 0612345678 or 612345678.
        if (digits.length === 10 && digits.startsWith("0")) {
            digits = digits.slice(1);
        }

        // Store Moroccan numbers as +212 followed by 9 digits.
        return `+212${digits}`;
    }

    // If the user enters an international number directly.
    if (localNumber.trim().startsWith("+")) {
        const parsed = parsePhoneNumberFromString(
            localNumber.trim()
        );

        return parsed?.number || localNumber.trim();
    }

    // Use the selected country's calling code.
    const parsed = parsePhoneNumberFromString(
        digits,
        country
    );

    if (parsed?.isValid()) {
        return parsed.number;
    }

    // Keep an E.164-style value while the user is still typing.
    const callingCode = getCountryCallingCode(country);

    return `+${callingCode}${digits.replace(/^0/, "")}`;
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

/** Country code + local number, stored as an international number. */
function PhoneNumberInput({ label, value, onChange, disabled, startIcon, helperText }) {
    const { t } = useTranslation();

    const [selectedCountry, setSelectedCountry] = useState("MA");
    const [localNumber, setLocalNumber] = useState("");

    // Last value this input produced: typing must not re-parse the number.
    const emittedRef = useRef(null);

    useEffect(() => {
        if (value === emittedRef.current) return;

        const parsed = splitPhoneNumber(value || "");

        setSelectedCountry(parsed.country);
        setLocalNumber(parsed.localNumber);
    }, [value]);

    const emit = (country, local) => {
        const next = buildInternationalPhoneNumber(country, local);
        emittedRef.current = next;
        onChange(next);
    };

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "minmax(115px, 0.8fr) minmax(0, 2fr)",
                gap: 1.5,
                gridColumn: { sm: "1 / -1" },
            }}
        >
            <TextField
                select
                label={t("settings.profile.countryCode")}
                value={selectedCountry}
                disabled={disabled}
                onChange={(event) => {
                    const country = event.target.value;
                    setSelectedCountry(country);
                    emit(country, localNumber);
                }}
                fullWidth
            >
                {COUNTRY_CODES.map((country) => (
                    <MenuItem key={country.country} value={country.country}>
                        {country.label}
                    </MenuItem>
                ))}
            </TextField>

            <TextField
                label={label}
                type="tel"
                value={localNumber}
                disabled={disabled}
                onChange={(event) => {
                    const next = event.target.value.replace(/\D/g, "");
                    setLocalNumber(next);
                    emit(selectedCountry, next);
                }}
                placeholder={selectedCountry === "MA" ? "0612345678" : ""}
                helperText={helperText}
                slotProps={{
                    htmlInput: { inputMode: "numeric" },
                    input: startIcon
                        ? { startAdornment: <InputAdornment position="start">{startIcon}</InputAdornment> }
                        : undefined,
                }}
                fullWidth
            />
        </Box>
    );
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

    const handleChange = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // WhatsApp follows the phone number while "same as phone" is ticked.
    const whatsappSameAsPhone =
        Boolean(profile.phoneNumber) &&
        (profile.whatsappNumber || "") === profile.phoneNumber;

    const [sameAsPhone, setSameAsPhone] = useState(whatsappSameAsPhone);

    useEffect(() => {
        setSameAsPhone(whatsappSameAsPhone);
        // Only when the saved profile is (re)loaded.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedProfile]);

    const handlePhoneChange = (phoneNumber) => {
        setProfile((previous) => ({
            ...previous,
            phoneNumber,
            ...(sameAsPhone ? { whatsappNumber: phoneNumber } : {}),
        }));
    };

    const handleWhatsAppChange = (whatsappNumber) => {
        setProfile((previous) => ({ ...previous, whatsappNumber }));
    };

    const handleSameAsPhone = (checked) => {
        setSameAsPhone(checked);

        if (checked) {
            setProfile((previous) => ({ ...previous, whatsappNumber: previous.phoneNumber || "" }));
        }
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

    const profileImageUrl = getProfileImageUrl(
        profile.profileImage
    );

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
                    sx={{ alignItems: "center", mb: 4.5 }}
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
                            sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                            {t("settings.profile.sectionTitle")}
                        </Typography>

                        <Typography
                            variant="body2" sx={{ color: "text.secondary" }}
                        >
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
                        spacing={3.5} sx={{ alignItems: {
                            xs: "flex-start",
                            sm: "center",
                        }, mb: 5 }}
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
                                sx={{ fontWeight: 700,
                                    fontSize: "1.05rem",
                                    mb: 0.5,
                                }}
                            >
                                {t("settings.profile.pictureTitle")}
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mb: 2 }}
                            >
                                {t("settings.profile.pictureDescription")}
                            </Typography>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                useFlexGap
                                sx={{ alignItems: "center", flexWrap: "wrap", mb: 1 }}
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
                                        sx={{
                                            textTransform: "none",
                                        }}
                                    >
                                        {t("settings.profile.removePicture")}
                                    </Button>
                                )}
                            </Stack>

                            <Typography
                                variant="caption" sx={{ color: "text.secondary", display: "block" }}
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

                        <PhoneNumberInput
                            label={t("settings.profile.phoneNumber")}
                            value={profile.phoneNumber}
                            onChange={handlePhoneChange}
                        />

                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={sameAsPhone}
                                        onChange={(event) => handleSameAsPhone(event.target.checked)}
                                    />
                                }
                                label={t("settings.profile.whatsappSameAsPhone", "My WhatsApp number is the same as my phone number")}
                            />
                        </Box>

                        {!sameAsPhone && (
                            <PhoneNumberInput
                                label={t("settings.profile.whatsappNumber", "WhatsApp number")}
                                value={profile.whatsappNumber}
                                onChange={handleWhatsAppChange}
                                startIcon={<WhatsApp fontSize="small" sx={{ color: "#25D366" }} />}
                                helperText={t(
                                    "settings.profile.whatsappHelper",
                                    "Shown on your publications. Verify it below after saving."
                                )}
                            />
                        )}

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
                        spacing={2.5} sx={{ mt: 5 }}
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
