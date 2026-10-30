import React, { useEffect, useRef, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
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
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

    // Preserve an unrecognized international prefix instead of
    // accidentally adding a second country code.
    return {
        countryCode: "",
        localNumber: normalized,
    };
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
            alert("Please select a valid JPG, PNG, or WEBP image.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert("The profile image must be smaller than 2 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") return;

            setProfile((previous) => ({
                ...previous,
                profileImage: reader.result,
            }));

            onImageChanged(true);
        };

        reader.onerror = () => {
            alert("Unable to read the selected image.");
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setProfile((previous) => ({
            ...previous,
            profileImage: "",
        }));

        onImageChanged(true);

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const initials =
        `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
            .toUpperCase() || "U";

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3.5,
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
                            borderRadius: 2.5,
                            bgcolor: "#ecfdf5",
                            color: "#047857",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <AccountCircle sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                            Account &amp; Profile
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage your personal information.
                        </Typography>
                    </Box>
                </Stack>

                {profileLoading && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Loading your saved profile...
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
                                Retry
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
                            src={profile.profileImage || undefined}
                            alt={`${profile.firstName} ${profile.lastName}`}
                            sx={{
                                width: 92,
                                height: 92,
                                bgcolor: "#d1fae5",
                                color: "#047857",
                                fontSize: 32,
                                fontWeight: 800,
                                flexShrink: 0,
                            }}
                        >
                            {!profile.profileImage && initials}
                        </Avatar>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                                fontWeight={700}
                                sx={{ fontSize: "1.05rem", mb: 0.5 }}
                            >
                                Profile picture
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Update your picture to help others recognize you.
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
                                    Upload picture
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
                                        Remove picture
                                    </Button>
                                )}
                            </Stack>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                            >
                                JPG, PNG, or WEBP. Maximum size: 2 MB.
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
                            label="First name"
                            name="firstName"
                            value={profile.firstName}
                            onChange={handleChange}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Last name"
                            name="lastName"
                            value={profile.lastName}
                            onChange={handleChange}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Email address"
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
                                label="Country code"
                                value={
                                    COUNTRY_CODES.find((country) => country.code === countryCode)
                                        ?.country ?? "MA"
                                }
                                onChange={(event) => {
                                    const selected = COUNTRY_CODES.find(
                                        (country) => country.country === event.target.value
                                    );

                                    if (selected) {
                                        setCountryCode(selected.code);
                                        setProfile((previous) => ({
                                            ...previous,
                                            phoneNumber: `${selected.code}${localNumber}`,
                                        }));
                                    }
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
                                label="Phone number"
                                type="tel"
                                value={localNumber}
                                onChange={handlePhoneNumberChange}
                                inputProps={{ inputMode: "numeric" }}
                                placeholder="655261677"
                                fullWidth
                            />
                        </Box>

                        <TextField
                            label="Address"
                            name="address"
                            value={profile.address}
                            onChange={handleChange}
                            fullWidth
                            sx={{ gridColumn: { sm: "1 / -1" } }}
                        />

                        <TextField
                            label="Biography"
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
                                bgcolor: "#047857",
                                "&:hover": { bgcolor: "#065f46" },
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1.75,
                                px: 4,
                                borderRadius: 2.5,
                                minHeight: 48,
                            }}
                        >
                            {profileSaving ? "Saving..." : "Save profile"}
                        </Button>
                    </Stack>
                </form>
            </CardContent>
        </Card>
    );
}
