// WhatsApp notification switches.
// The WhatsApp number is set in the profile and verified in
// "Contact verification" (it is shown here read-only).

import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControlLabel,
    Stack,
    Switch,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
    NotificationsActiveOutlined,
    VerifiedOutlined,
    WhatsApp,
} from "@mui/icons-material";

export default function WhatsappNotifications({
    settings = {},
    setSettings,
    whatsappNumber = "",
    whatsappVerified = false,
    loading,
    saving,
    error,
    onSave,
}) {
    const { t } = useTranslation();

    const update = (field, value) => {
        setSettings((previous) => ({
            ...previous,
            [field]: value,
            // Alerts need the channel switched on.
            ...(field === "enabled" && !value ? { propertyAlerts: false } : {}),
        }));
    };

    const ready = Boolean(whatsappNumber) && whatsappVerified;

    return (
        <Card variant="outlined" sx={{ borderRadius: "16px" }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", mb: 3.5 }}>
                    <Box
                        sx={(theme) => ({
                            width: 52,
                            height: 52,
                            borderRadius: "10px",
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        })}
                    >
                        <WhatsApp sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {t("settings.whatsappNotifications.title")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("settings.whatsappNotifications.subtitle")}
                        </Typography>
                    </Box>
                </Stack>

                {/* The number, read-only */}
                <Box
                    sx={{
                        p: 2,
                        mb: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                            {t("settings.whatsappNotifications.numberLabel", "Messages are sent to")}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                            {whatsappNumber || t("settings.whatsappNotifications.noNumber", "No WhatsApp number yet")}
                        </Typography>
                    </Box>

                    {whatsappNumber && (
                        <Chip
                            size="small"
                            icon={whatsappVerified ? <VerifiedOutlined /> : undefined}
                            color={whatsappVerified ? "success" : "warning"}
                            variant="outlined"
                            label={
                                whatsappVerified
                                    ? t("settings.verification.verified")
                                    : t("settings.verification.notVerified")
                            }
                        />
                    )}
                </Box>

                {!ready && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {t(
                            "settings.whatsappNotifications.setupHint",
                            "Add your WhatsApp number in your profile and verify it in “Contact verification” to turn these notifications on."
                        )}
                    </Alert>
                )}

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
                    <FormControlLabel
                        sx={{ alignItems: "flex-start", ml: 0 }}
                        control={
                            <Switch
                                checked={Boolean(settings.enabled)}
                                disabled={loading || saving || !ready}
                                onChange={(event) => update("enabled", event.target.checked)}
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                                    {t("settings.whatsappNotifications.enable")}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    {t("settings.whatsappNotifications.enableDescription")}
                                </Typography>
                            </Box>
                        }
                    />

                    <FormControlLabel
                        sx={{ alignItems: "flex-start", ml: 0 }}
                        control={
                            <Switch
                                checked={Boolean(settings.propertyAlerts)}
                                disabled={loading || saving || !ready || !settings.enabled}
                                onChange={(event) => update("propertyAlerts", event.target.checked)}
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                                    {t("settings.whatsappNotifications.propertyAlerts")}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    {t("settings.whatsappNotifications.propertyAlertsDescription")}
                                </Typography>
                            </Box>
                        }
                    />
                </Stack>

                <Button
                    variant="contained"
                    startIcon={<NotificationsActiveOutlined />}
                    onClick={onSave}
                    disabled={loading || saving || (settings.enabled && !ready)}
                    sx={{ mt: 4, fontWeight: 700, py: 1.25, px: 3, borderRadius: "10px" }}
                >
                    {saving ? t("settings.whatsappNotifications.saving") : t("settings.whatsappNotifications.save")}
                </Button>
            </CardContent>
        </Card>
    );
}
