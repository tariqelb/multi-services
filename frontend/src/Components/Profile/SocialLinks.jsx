// src/Components/Profile/SocialLinks.jsx
//
// Social media links of a user (Settings > Social media).
//
//   <SocialLinksList links />  icon buttons; showPrivate marks hidden ones
//   <MySocialLinksCard links /> "Social media" card of my own profile pages
//
// Links come from the server already cleaned (always https:// on the
// platform's own domain). They open in a new tab, without passing ranking
// or the page address to the other website.

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Stack, Tooltip, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { displayUrl, platformLabel, platformOf } from "./socialPlatforms";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

/**
 * Icon buttons, one per link. Compact: icon + platform name.
 * showPrivate: also lists private links, with a lock.
 */
export function SocialLinksList({ links = [], showPrivate = false }) {
    const { t } = useTranslation();
    const items = (links || []).filter((link) => link?.url && (showPrivate || link.public !== false));
    if (!items.length) return null;

    return (
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
            {items.map((link) => {
                const platform = platformOf(link.platform);
                const { Icon } = platform;
                const hidden = showPrivate && link.public === false;
                return (
                    <Tooltip
                        key={`${link.platform}-${link.url}`}
                        arrow
                        title={
                            <Box component="bdi" dir="ltr">
                                {displayUrl(link.url)}
                                {hidden ? ` · ${t("socialLinks.private", "Only you see it")}` : ""}
                            </Box>
                        }
                    >
                        <Button
                            component="a"
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow ugc"
                            referrerPolicy="no-referrer"
                            variant="outlined"
                            size="small"
                            startIcon={<Icon sx={{ color: platform.color }} />}
                            endIcon={hidden ? <LockOutlinedIcon sx={{ fontSize: "16px !important", color: "text.disabled" }} /> : null}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: "999px",
                                borderColor: "divider",
                                color: "text.primary",
                                px: 1.5,
                                opacity: hidden ? 0.75 : 1,
                                "&:hover": { borderColor: platform.color, bgcolor: "action.hover" },
                            }}
                        >
                            {platformLabel(t, link.platform)}
                        </Button>
                    </Tooltip>
                );
            })}
        </Stack>
    );
}

/** "Social media" card of my own profile (property and vehicles). */
export function MySocialLinksCard({ links = [] }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const count = (links || []).length;
    const publicCount = (links || []).filter((link) => link.public).length;

    return (
        <Card elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: count ? 2 : 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <ShareOutlinedIcon color="primary" />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                                {t("socialLinks.title", "Social media")}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {count
                                    ? t("socialLinks.publicCount", "{{public}} of {{count}} shown on your public profile", { public: publicCount, count })
                                    : t("socialLinks.empty", "Add your Instagram, TikTok, YouTube, website... and choose which ones visitors see.")}
                            </Typography>
                        </Box>
                    </Stack>
                    <Button
                        variant={count ? "text" : "outlined"}
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => navigate("/setting#social-links")}
                        sx={{ textTransform: "none", fontWeight: 700, alignSelf: { xs: "flex-start", sm: "center" } }}
                    >
                        {count ? t("socialLinks.edit", "Edit") : t("socialLinks.add", "Add links")}
                    </Button>
                </Stack>
                <SocialLinksList links={links} showPrivate />
            </CardContent>
        </Card>
    );
}
