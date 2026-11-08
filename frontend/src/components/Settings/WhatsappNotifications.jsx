
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    FormControlLabel,
    InputAdornment,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";

import {
    NotificationsActiveOutlined,
    PhoneAndroidOutlined,
    WhatsApp,
    VerifiedOutlined,
    MarkEmailReadOutlined,
} from "@mui/icons-material";

export default function WhatsappNotifications({
    settings = {},
    setSettings,
    loading,
    saving,
    error,
    onSave,
    onSendVerification,
    onConfirmVerification,
    sendingCode = false,
    confirmingCode = false,
}) {
    const { t } = useTranslation();

    const update = (field, value) => {
        setSettings((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const verified = settings?.verified === true;

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
                        <WhatsApp sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mb: 0.5 }}
                        >
                            {t("settings.whatsappNotifications.title")}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {t("settings.whatsappNotifications.subtitle")}
                        </Typography>
                    </Box>
                </Stack>

                <Alert severity="info" sx={{ mb: 3.5, py: 1.5 }}>
                    {t("settings.whatsappNotifications.info")}
                </Alert>

                {loading && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {t("settings.whatsappNotifications.loading")}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Stack spacing={3}>
                    <TextField
                        label={t("settings.whatsappNotifications.phoneNumber")}
                        placeholder="+212 6XX XXX XXX"
                        value={settings.phoneNumber || ""}
                        onChange={(event) => {
                            const phoneNumber = event.target.value;

                            setSettings((previous) => ({
                                ...previous,
                                phoneNumber,
                                verified: false,
                                enabled: false,
                                propertyAlerts: false,
                                verificationCode: "",
                            }));
                        }}
                        disabled={loading || saving || sendingCode}
                        fullWidth
                        helperText={t(
                            "settings.whatsappNotifications.phoneHelper"
                        )}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PhoneAndroidOutlined />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {verified ? (
                        <Alert
                            severity="success"
                            icon={<VerifiedOutlined />}
                        >
                            {t("settings.whatsappNotifications.verified")}
                        </Alert>
                    ) : (
                        <Box>
                            <Button
                                variant="outlined"
                                color="success"
                                startIcon={<WhatsApp />}
                                onClick={onSendVerification}
                                disabled={
                                    loading ||
                                    saving ||
                                    sendingCode ||
                                    !settings.phoneNumber?.trim()
                                }
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderRadius: "10px",
                                    py: 1.1,
                                }}
                            >
                                {sendingCode
                                    ? t("settings.whatsappNotifications.sendingCode")
                                    : t("settings.whatsappNotifications.sendCode")}
                            </Button>

                            {settings.verificationCodeSent && (
                                <Stack spacing={2} sx={{ mt: 2.5 }}>
                                    <TextField
                                        label={t(
                                            "settings.whatsappNotifications.verificationCode"
                                        )}
                                        placeholder={t(
                                            "settings.whatsappNotifications.codePlaceholder"
                                        )}
                                        value={settings.verificationCode || ""}
                                        onChange={(event) =>
                                            update(
                                                "verificationCode",
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6)
                                            )
                                        }
                                        inputProps={{
                                            inputMode: "numeric",
                                            maxLength: 6,
                                        }}
                                        fullWidth
                                        helperText={t(
                                            "settings.whatsappNotifications.codeHelper"
                                        )}
                                    />

                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<MarkEmailReadOutlined />}
                                        onClick={onConfirmVerification}
                                        disabled={
                                            confirmingCode ||
                                            loading ||
                                            settings.verificationCode?.length !== 6
                                        }
                                        sx={{
                                            alignSelf: "flex-start",
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderRadius: "10px",
                                            py: 1.1,
                                        }}
                                    >
                                        {confirmingCode
                                            ? t("settings.whatsappNotifications.verifying")
                                            : t("settings.whatsappNotifications.verifyNumber")}
                                    </Button>
                                </Stack>
                            )}
                        </Box>
                    )}

                    <FormControlLabel
                        sx={{ alignItems: "flex-start", ml: 0 }}
                        control={
                            <Switch
                                checked={Boolean(settings.enabled)}
                                disabled={loading || saving || !verified}
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
                                    {t("settings.whatsappNotifications.enable")}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    {t(
                                        "settings.whatsappNotifications.enableDescription"
                                    )}
                                </Typography>
                            </Box>
                        }
                    />

                    <FormControlLabel
                        sx={{ alignItems: "flex-start", ml: 0 }}
                        control={
                            <Switch
                                checked={Boolean(settings.propertyAlerts)}
                                disabled={
                                    loading ||
                                    saving ||
                                    !verified ||
                                    !settings.enabled
                                }
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
                                    {t("settings.whatsappNotifications.propertyAlerts")}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    {t(
                                        "settings.whatsappNotifications.propertyAlertsDescription"
                                    )}
                                </Typography>
                            </Box>
                        }
                    />
                </Stack>

                <Button
                    variant="contained"
                    startIcon={<NotificationsActiveOutlined />}
                    onClick={onSave}
                    disabled={
                        loading ||
                        saving ||
                        (settings.enabled && !verified)
                    }
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
                        ? t("settings.whatsappNotifications.saving")
                        : t("settings.whatsappNotifications.save")}
                </Button>
            </CardContent>
        </Card>
    );
}