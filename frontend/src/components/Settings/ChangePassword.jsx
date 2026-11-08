import React from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { LockOutlined } from "@mui/icons-material";

export default function ChangePassword({
    passwords,
    setPasswords,
    error,
    success,
    loading,
    onSubmit,
}) {
    const { t } = useTranslation();

    const handleChange = (event) => {
        const { name, value } = event.target;

        setPasswords((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (
            !passwords.currentPassword ||
            !passwords.newPassword ||
            !passwords.confirmPassword
        ) {
            return;
        }

        if (passwords.newPassword.length < 8) {
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            return;
        }

        if (passwords.currentPassword === passwords.newPassword) {
            return;
        }

        onSubmit(event);
    };

    const newPasswordError =
        passwords.newPassword.length > 0 &&
        passwords.newPassword.length < 8;

    const confirmPasswordError =
        passwords.confirmPassword.length > 0 &&
        passwords.newPassword !== passwords.confirmPassword;

    const samePasswordError =
        passwords.currentPassword.length > 0 &&
        passwords.newPassword.length > 0 &&
        passwords.currentPassword === passwords.newPassword;

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: "16px",
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
                        <LockOutlined sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mb: 0.5 }}
                        >
                            {t("settings.password.sectionTitle")}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {t("settings.password.sectionSubtitle")}
                        </Typography>
                    </Box>
                </Stack>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2.5}>
                        <TextField
                            label={t("settings.password.currentPassword")}
                            name="currentPassword"
                            type="password"
                            value={passwords.currentPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            autoComplete="current-password"
                        />

                        <TextField
                            label={t("settings.password.newPassword")}
                            name="newPassword"
                            type="password"
                            value={passwords.newPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            autoComplete="new-password"
                            error={newPasswordError || samePasswordError}
                            helperText={
                                newPasswordError
                                    ? t("settings.password.minimumLength")
                                    : samePasswordError
                                      ? t("settings.password.sameAsCurrent")
                                      : t("settings.password.minimumHint")
                            }
                        />

                        <TextField
                            label={t("settings.password.confirmPassword")}
                            name="confirmPassword"
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            autoComplete="new-password"
                            error={confirmPasswordError}
                            helperText={
                                confirmPasswordError
                                    ? t("settings.password.mismatch")
                                    : ""
                            }
                        />
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2.5 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mt: 2.5 }}>
                            {success}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={<LockOutlined />}
                        sx={{
                            mt: 4,
                            textTransform: "none",
                            fontWeight: 700,
                            py: 1.25,
                            px: 3,
                            borderRadius: "10px",
                        }}
                    >
                        {loading
                            ? t("settings.password.updating")
                            : t("settings.password.updateButton")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}