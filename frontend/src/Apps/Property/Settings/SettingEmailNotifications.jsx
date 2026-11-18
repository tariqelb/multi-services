import React from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControlLabel,
    Stack,
    Switch,
    Typography,
} from "@mui/material";

import { EmailOutlined } from "@mui/icons-material";

export default function SettingEmailNotifications({
    settings = {},
    setSettings,
    loading,
    saving,
    error,
    onSave,
    onRetry,
}) {
    const { t } = useTranslation();

    const enabled = settings?.enabled ?? true;
    const propertyAlerts = settings?.propertyAlerts ?? true;

    const update = (field, value) => {
        setSettings((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

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
                        <EmailOutlined sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mb: 0.5 }}
                        >
                            {t("settings.emailNotifications.title")}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {t("settings.emailNotifications.subtitle")}
                        </Typography>
                    </Box>
                </Stack>

                {loading && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {t("settings.emailNotifications.loading")}
                    </Alert>
                )}

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={onRetry}
                            >
                                {t("settings.emailNotifications.retry")}
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                <Stack spacing={3}>
                    <FormControlLabel
                        sx={{ alignItems: "flex-start", ml: 0 }}
                        control={
                            <Switch
                                checked={enabled}
                                disabled={loading}
                                onChange={(event) =>
                                    update("enabled", event.target.checked)
                                }
                                color="primary"
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography
                                    fontWeight={700}
                                    sx={{ fontSize: "1.05rem" }}
                                >
                                    {t("settings.emailNotifications.enable")}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    {t("settings.emailNotifications.enableDescription")}
                                </Typography>
                            </Box>
                        }
                    />

                    <Divider />

                    <FormControlLabel
                        sx={{ alignItems: "flex-start", ml: 0 }}
                        control={
                            <Switch
                                checked={propertyAlerts}
                                disabled={loading || !enabled}
                                onChange={(event) =>
                                    update(
                                        "propertyAlerts",
                                        event.target.checked
                                    )
                                }
                                color="primary"
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography
                                    fontWeight={700}
                                    sx={{ fontSize: "1.05rem" }}
                                >
                                    {t("settings.emailNotifications.propertyAlerts")}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    {t("settings.emailNotifications.propertyAlertsDescription")}
                                </Typography>
                            </Box>
                        }
                    />
                </Stack>

                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={loading || saving}
                    sx={{
                        mt: 4,
                        textTransform: "none",
                        fontWeight: 700,
                        py: 1.25,
                        px: 3,
                        borderRadius: "10px",
                    }}
                >
                    {saving
                        ? t("settings.emailNotifications.saving")
                        : t("settings.emailNotifications.save")}
                </Button>
            </CardContent>
        </Card>
    );
}
