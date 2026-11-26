// src/Components/Profile/PublicVisibilitySettings.jsx
//
// Settings > Public profile: what visitors see on my public profiles
// (property and vehicles): email, phone, WhatsApp, address, and my active
// requests. Everything is hidden until turned on.

import { useEffect, useState } from "react";
import { useNavigate, useRouteLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import axiosInstance from "../../api/axiosInstance";

const FIELDS = [
    { key: "email", label: "Email address" },
    { key: "phone", label: "Phone number" },
    { key: "whatsapp", label: "WhatsApp number" },
    { key: "address", label: "Address" },
];

const EMPTY = { email: false, phone: false, whatsapp: false, address: false, requests: false };

export default function PublicVisibilitySettings() {
    const { t } = useTranslation();
    const me = useRouteLoaderData("dashboard-layout");
    const userId = me?.id || me?._id;
    const navigate = useNavigate();
    const [visibility, setVisibility] = useState(EMPTY);
    const [available, setAvailable] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/profile/me/public-visibility")
            .then(({ data }) => {
                if (cancelled) return;
                setVisibility({ ...EMPTY, ...data.visibility });
                setAvailable(data.available || {});
            })
            .catch((error) => !cancelled && setNotice({ type: "error", message: error.response?.data?.message || t("publicVisibility.loadError", "Unable to load these settings.") }))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [t]);

    const toggle = (key) => (event) => setVisibility((previous) => ({ ...previous, [key]: event.target.checked }));

    const save = async () => {
        setSaving(true);
        setNotice(null);
        try {
            const { data } = await axiosInstance.put("/profile/me/public-visibility", visibility);
            setVisibility({ ...EMPTY, ...data.visibility });
            setNotice({ type: "success", message: t("publicVisibility.saved", "Saved. Your public profiles show what you chose.") });
        } catch (error) {
            setNotice({ type: "error", message: error.response?.data?.message || t("publicVisibility.saveError", "Unable to save these settings.") });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card variant="outlined" id="public-profile" sx={{ borderRadius: "16px", scrollMarginTop: "5rem" }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", mb: 3 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: "10px", bgcolor: "#EFF6FF", color: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <PublicOutlinedIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {t("publicVisibility.title", "Public profile")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("publicVisibility.subtitle", "Choose what visitors see on your public profiles (property and vehicles). Hidden by default.")}
                        </Typography>
                    </Box>
                </Stack>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {notice && (
                            <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ borderRadius: "10px" }}>
                                {notice.message}
                            </Alert>
                        )}

                        <Typography sx={{ fontWeight: 700 }}>{t("publicVisibility.contactTitle", "Contact details")}</Typography>
                        <Stack spacing={0.5}>
                            {FIELDS.map((field) => (
                                <FormControlLabel
                                    key={field.key}
                                    control={<Switch checked={visibility[field.key]} onChange={toggle(field.key)} />}
                                    label={
                                        <Box>
                                            <Typography>{t(`publicVisibility.fields.${field.key}`, field.label)}</Typography>
                                            {available[field.key] === false && (
                                                <Typography variant="caption" sx={{ color: "warning.main" }}>
                                                    {t("publicVisibility.notSet", "Not set in your profile yet: nothing will be shown.")}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                    sx={{ m: 0, gap: 1 }}
                                />
                            ))}
                        </Stack>

                        <Divider />

                        <FormControlLabel
                            control={<Switch checked={visibility.requests} onChange={toggle("requests")} />}
                            label={
                                <Box>
                                    <Typography>{t("publicVisibility.fields.requests", "My active requests")}</Typography>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {t("publicVisibility.requestsHelp", "A \"Requests\" tab on your profiles: what you are looking for. Professionals still reply without seeing your contact.")}
                                    </Typography>
                                </Box>
                            }
                            sx={{ m: 0, gap: 1, alignItems: "flex-start" }}
                        />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end", pt: 1 }}>
                            {userId && (
                                <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => navigate(`/profile/${userId}`)} sx={{ textTransform: "none" }}>
                                    {t("publicVisibility.preview", "See my public profile")}
                                </Button>
                            )}
                            <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ textTransform: "none", fontWeight: 700, px: 3 }}>
                                {t("publicVisibility.save", "Save")}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
