// src/Components/Profile/socialPlatforms.js
//
// Social media platforms (icon, color, input hint) and small helpers,
// shared by the profile pages and Settings > Social media.

import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import XIcon from "@mui/icons-material/X";
import TelegramIcon from "@mui/icons-material/Telegram";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PhotoCameraFrontOutlinedIcon from "@mui/icons-material/PhotoCameraFrontOutlined";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

export const SOCIAL_PLATFORMS = [
    { id: "instagram", label: "Instagram", Icon: InstagramIcon, color: "#C13584", hint: "@name or instagram.com/name" },
    { id: "facebook", label: "Facebook", Icon: FacebookIcon, color: "#1877F2", hint: "facebook.com/name" },
    { id: "tiktok", label: "TikTok", Icon: MusicNoteRoundedIcon, color: "#111827", hint: "@name or tiktok.com/@name" },
    { id: "youtube", label: "YouTube", Icon: YouTubeIcon, color: "#FF0000", hint: "@channel or youtube.com/@channel" },
    { id: "linkedin", label: "LinkedIn", Icon: LinkedInIcon, color: "#0A66C2", hint: "linkedin.com/in/name" },
    { id: "x", label: "X", Icon: XIcon, color: "#111827", hint: "@name or x.com/name" },
    { id: "snapchat", label: "Snapchat", Icon: PhotoCameraFrontOutlinedIcon, color: "#B59A00", hint: "@name" },
    { id: "telegram", label: "Telegram", Icon: TelegramIcon, color: "#229ED9", hint: "@name or t.me/name" },
    { id: "threads", label: "Threads", Icon: AlternateEmailRoundedIcon, color: "#111827", hint: "@name" },
    { id: "website", label: "Website", Icon: LanguageRoundedIcon, color: "#2563EB", hint: "www.example.ma" },
];

export const platformOf = (id) => SOCIAL_PLATFORMS.find((platform) => platform.id === id) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];

/** "https://www.instagram.com/tariq" -> "instagram.com/tariq" */
export function displayUrl(url) {
    return String(url || "")
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .replace(/\/$/, "");
}

export const platformLabel = (t, id) =>
    id === "website" ? t("socialLinks.platforms.website", "Website") : platformOf(id).label;
