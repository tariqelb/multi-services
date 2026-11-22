// src/Components/listings/VerifiedContact.jsx
// A contact line (phone / WhatsApp / email) with a "Verified" badge when
// the server says it is the owner's verified number or email.

import { useTranslation } from "react-i18next";
import { Box, Chip, Stack, Typography } from "@mui/material";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

export function VerifiedBadge({ verified }) {
    const { t } = useTranslation();

    if (!verified) return null;

    return (
        <Chip
            size="small"
            icon={<VerifiedRoundedIcon />}
            label={t("contactVerified.badge", "Verified")}
            sx={{
                height: 22,
                bgcolor: "#DCFCE7",
                color: "#15803D",
                fontWeight: 700,
                fontSize: "0.72rem",
                "& .MuiChip-icon": { color: "#16A34A", fontSize: 15 },
            }}
        />
    );
}

export default function VerifiedContact({ icon, label, value, verified }) {
    if (!value) return null;

    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box sx={{ display: "flex", color: "text.secondary", "& svg": { fontSize: 18 } }}>{icon}</Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                {label && (
                    <Typography variant="caption" sx={{ display: "block", color: "text.secondary", lineHeight: 1.2 }}>
                        {label}
                    </Typography>
                )}
                <Typography variant="body2" dir="ltr" sx={{ fontWeight: 600, overflowWrap: "anywhere", textAlign: "start" }}>
                    {value}
                </Typography>
            </Box>
            <VerifiedBadge verified={verified} />
        </Stack>
    );
}
