import { Chip } from "@mui/material";

const tones = {
    info: ["#E3EEFC", "#124A9C"],
    success: ["#DDF3E8", "#0B6B43"],
    danger: ["#FCE4E4", "#9B1C1C"],
    neutral: ["#EEF2F7", "#475569"],
};

/** One badge style for For Sale / Available / Sold / New / Read ... */
export default function StatusBadge({ label, tone = "neutral", icon, sx }) {
    const [bg, color] = tones[tone] || tones.neutral;

    return (
        <Chip
            size="small"
            label={label}
            icon={icon}
            sx={{ bgcolor: bg, color, fontWeight: 600, "& .MuiChip-icon": { color }, ...sx }}
        />
    );
}
