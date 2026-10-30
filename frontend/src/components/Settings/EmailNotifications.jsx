
import React from "react";
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

export default function EmailNotifications({
    settings,
    setSettings,
    loading,
    saving,
    error,
    onSave,
    onRetry,
}) {
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
                borderRadius: 3.5,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            }}
        >
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 4.5 }}>
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
                        <EmailOutlined sx={{ fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                            Email Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Receive property alerts directly in your inbox.
                        </Typography>
                    </Box>
                </Stack>

                {loading && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Loading your notification preferences...
                    </Alert>
                )}

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        action={
                            <Button color="inherit" size="small" onClick={onRetry}>
                                Retry
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
                                checked={settings.enabled}
                                disabled={loading}
                                onChange={(event) =>
                                    update("enabled", event.target.checked)
                                }
                                color="success"
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography fontWeight={700} sx={{ fontSize: "1.05rem" }}>
                                    Enable email notifications
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Allow the platform to send you email alerts.
                                </Typography>
                            </Box>
                        }
                    />

                    <Divider />

                    <FormControlLabel
                        sx={{ alignItems: "flex-start", ml: 0 }}
                        control={
                            <Switch
                                checked={settings.propertyAlerts}
                                disabled={loading || !settings.enabled}
                                onChange={(event) =>
                                    update("propertyAlerts", event.target.checked)
                                }
                                color="success"
                                sx={{ mt: 0.5, mr: 2 }}
                            />
                        }
                        label={
                            <Box>
                                <Typography fontWeight={700} sx={{ fontSize: "1.05rem" }}>
                                    Matching property alerts
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Get an email when a new property matches your saved alerts.
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
                        bgcolor: "#047857",
                        "&:hover": { bgcolor: "#065f46" },
                        textTransform: "none",
                        fontWeight: 700,
                        py: 1.25,
                        px: 3,
                        borderRadius: 2.5,
                    }}
                >
                    {saving ? "Saving..." : "Save email preferences"}
                </Button>
            </CardContent>
        </Card>
    );
}
