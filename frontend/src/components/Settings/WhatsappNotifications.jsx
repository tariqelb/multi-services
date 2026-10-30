

import React from "react";
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
    settings,
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
    const update = (field, value) => {
        setSettings((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const verified = settings.verified === true;

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
                        <WhatsApp sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                            WhatsApp Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Verify your WhatsApp number to receive property alerts.
                        </Typography>
                    </Box>
                </Stack>

                <Alert severity="info" sx={{ mb: 3.5, py: 1.5 }}>
                    Your WhatsApp number is verified separately from your account
                    phone number. You must verify it before enabling notifications.
                </Alert>

                {loading && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Loading your notification preferences...
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Stack spacing={3}>
                    <TextField
                        label="WhatsApp phone number"
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
                        helperText="Include your country code, for example +212..."
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
                            This WhatsApp number has been verified.
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
                                    borderRadius: 2.5,
                                    py: 1.1,
                                }}
                            >
                                {sendingCode
                                    ? "Sending code..."
                                    : "Send WhatsApp verification code"}
                            </Button>

                            {settings.verificationCodeSent && (
                                <Stack spacing={2} sx={{ mt: 2.5 }}>
                                    <TextField
                                        label="Verification code"
                                        placeholder="Enter 6-digit code"
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
                                        helperText="Enter the code sent to your WhatsApp number."
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
                                            borderRadius: 2.5,
                                            py: 1.1,
                                        }}
                                    >
                                        {confirmingCode
                                            ? "Verifying..."
                                            : "Verify WhatsApp number"}
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
                                color="success"
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography
                                    fontWeight={700}
                                    sx={{ fontSize: "1.05rem" }}
                                >
                                    Enable WhatsApp notifications
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    Receive selected alerts through WhatsApp.
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
                                    update("propertyAlerts", event.target.checked)
                                }
                                color="success"
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography
                                    fontWeight={700}
                                    sx={{ fontSize: "1.05rem" }}
                                >
                                    Matching property alerts
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    Receive messages when a new property matches
                                    your saved alerts.
                                </Typography>
                            </Box>
                        }
                    />
                </Stack>

                <Button
                    variant="contained"
                    startIcon={<NotificationsActiveOutlined />}
                    onClick={onSave}
                    disabled={loading || saving || (settings.enabled && !verified)}
                    sx={{
                        mt: 4,
                        bgcolor: "#047857",
                        "&:hover": { bgcolor: "#065f46" },
                        textTransform: "none",
                        fontWeight: 700,
                        py: 1.25,
                        px: 3,
                        borderRadius: 2.5,
                    }}
                >
                    {saving ? "Saving..." : "Save WhatsApp preferences"}
                </Button>
            </CardContent>
        </Card>
    );
}
