// src/Components/Settings/SocialLinksSettings.jsx
//
// Settings > Social media: the user's Instagram, TikTok, YouTube, website...
// Each link has its own "Show on my public profile" switch.
// The server cleans every link ("@name" -> https://instagram.com/name) and
// refuses addresses that are not on the platform's own website.

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useRouteLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import axiosInstance from "../../api/axiosInstance";
import { SOCIAL_PLATFORMS, platformLabel, platformOf } from "../Profile/socialPlatforms";

const DEFAULT_MAX = 10;

let nextKey = 1;
const withKey = (link) => ({ key: nextKey++, platform: link.platform || "instagram", url: link.url || "", public: link.public === true });

const ERROR_TEXT = {
    domain: ["socialLinks.errors.domain", "This address is not on {{platform}}."],
    invalid: ["socialLinks.errors.invalid", "This address is not valid."],
    platform: ["socialLinks.errors.invalid", "This address is not valid."],
};

export default function SocialLinksSettings() {
    const { t } = useTranslation();
    const me = useRouteLoaderData("dashboard-layout");
    const userId = me?.id || me?._id;
    const navigate = useNavigate();
    const location = useLocation();
    const cardRef = useRef(null);

    const [links, setLinks] = useState([]);
    const [max, setMax] = useState(DEFAULT_MAX);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/profile/me/social-links")
            .then(({ data }) => {
                if (cancelled) return;
                setLinks((data.links || []).map(withKey));
                setMax(data.max || DEFAULT_MAX);
            })
            .catch((error) => !cancelled && setNotice({ type: "error", message: error.response?.data?.message || t("socialLinks.loadError", "Unable to load your social media links.") }))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [t]);

    // /setting#social-links (from my profile): scroll here.
    useEffect(() => {
        if (!loading && location.hash === "#social-links") cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [loading, location.hash]);

    const change = (key, patch) => {
        setLinks((previous) => previous.map((link) => (link.key === key ? { ...link, ...patch } : link)));
        setErrors((previous) => ({ ...previous, [key]: undefined }));
        setDirty(true);
        setNotice(null);
    };

    const add = () => {
        // Suggest a platform not used yet.
        const used = new Set(links.map((link) => link.platform));
        const platform = SOCIAL_PLATFORMS.find((item) => !used.has(item.id))?.id || "website";
        setLinks((previous) => [...previous, withKey({ platform, url: "", public: true })]);
        setDirty(true);
    };

    const remove = (key) => {
        setLinks((previous) => previous.filter((link) => link.key !== key));
        setDirty(true);
        setNotice(null);
    };

    const save = async () => {
        setSaving(true);
        setNotice(null);
        setErrors({});
        const sent = links.filter((link) => link.url.trim());
        try {
            const { data } = await axiosInstance.put("/profile/me/social-links", {
                links: sent.map(({ platform, url, public: isPublic }) => ({ platform, url: url.trim(), public: isPublic })),
            });
            setLinks((data.links || []).map(withKey));
            setDirty(false);
            setNotice({ type: "success", message: t("socialLinks.saved", "Saved. Public links are shown on your public profiles.") });
        } catch (error) {
            const byKey = {};
            for (const item of error.response?.data?.errors || []) {
                const link = sent[item.index];
                if (link) byKey[link.key] = item.error;
            }
            setErrors(byKey);
            setNotice({ type: "error", message: error.response?.data?.message || t("socialLinks.saveError", "Unable to save your social media links.") });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card variant="outlined" ref={cardRef} id="social-links" sx={{ borderRadius: "16px", scrollMarginTop: "5rem" }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", mb: 3 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: "10px", bgcolor: "#FDF2F8", color: "#BE185D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ShareOutlinedIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {t("socialLinks.title", "Social media")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("socialLinks.subtitle", "Add your accounts and your website. Choose for each one if visitors see it on your public profiles.")}
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

                        {!links.length && (
                            <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>
                                {t("socialLinks.none", "No links yet.")}
                            </Typography>
                        )}

                        {links.map((link) => {
                            const platform = platformOf(link.platform);
                            const { Icon } = platform;
                            const error = errors[link.key];
                            const [errorKey, errorFallback] = ERROR_TEXT[error] || [];
                            return (
                                <Box
                                    key={link.key}
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr auto", md: "190px minmax(0, 1fr) auto auto" },
                                        gap: 1.5,
                                        alignItems: "center",
                                        p: 1.5,
                                        border: "1px solid",
                                        borderColor: error ? "error.light" : "divider",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <TextField
                                        select
                                        size="small"
                                        label={t("socialLinks.platform", "Platform")}
                                        value={link.platform}
                                        onChange={(event) => change(link.key, { platform: event.target.value })}
                                        slotProps={{
                                            select: {
                                                renderValue: (value) => (
                                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                                        <Icon fontSize="small" sx={{ color: platformOf(value).color }} />
                                                        <span>{platformLabel(t, value)}</span>
                                                    </Stack>
                                                ),
                                            },
                                        }}
                                    >
                                        {SOCIAL_PLATFORMS.map((item) => (
                                            <MenuItem key={item.id} value={item.id}>
                                                <item.Icon fontSize="small" sx={{ color: item.color, mr: 1 }} />
                                                {platformLabel(t, item.id)}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <IconButton
                                        aria-label={t("socialLinks.remove", "Remove")}
                                        onClick={() => remove(link.key)}
                                        sx={{ display: { md: "none" }, justifySelf: "end" }}
                                    >
                                        <DeleteOutlineRoundedIcon />
                                    </IconButton>

                                    <TextField
                                        size="small"
                                        fullWidth
                                        label={t("socialLinks.address", "Link or user name")}
                                        placeholder={platform.hint}
                                        value={link.url}
                                        onChange={(event) => change(link.key, { url: event.target.value })}
                                        error={Boolean(error)}
                                        helperText={error ? t(errorKey, errorFallback, { platform: platformLabel(t, link.platform) }) : undefined}
                                        slotProps={{ htmlInput: { dir: "ltr", maxLength: 300, inputMode: "url", autoCapitalize: "none", spellCheck: false } }}
                                        sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
                                    />

                                    <FormControlLabel
                                        control={<Switch checked={link.public} onChange={(event) => change(link.key, { public: event.target.checked })} />}
                                        label={
                                            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                                                {link.public ? t("socialLinks.public", "Public") : t("socialLinks.privateShort", "Private")}
                                            </Typography>
                                        }
                                        sx={{ m: 0, gap: 0.5 }}
                                    />

                                    <Tooltip title={t("socialLinks.remove", "Remove")}>
                                        <IconButton onClick={() => remove(link.key)} sx={{ display: { xs: "none", md: "inline-flex" } }}>
                                            <DeleteOutlineRoundedIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            );
                        })}

                        <Box>
                            <Button
                                startIcon={<AddRoundedIcon />}
                                onClick={add}
                                disabled={links.length >= max}
                                sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                                {t("socialLinks.addLink", "Add a link")}
                            </Button>
                            {links.length >= max && (
                                <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
                                    {t("socialLinks.max", "Up to {{max}} links.", { max })}
                                </Typography>
                            )}
                        </Box>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end", pt: 1 }}>
                            {userId && (
                                <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => navigate(`/profile/${userId}`)} sx={{ textTransform: "none" }}>
                                    {t("publicVisibility.preview", "See my public profile")}
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                onClick={save}
                                disabled={saving || !dirty}
                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
                            >
                                {t("publicVisibility.save", "Save")}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
