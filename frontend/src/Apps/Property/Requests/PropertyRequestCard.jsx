// src/Apps/Property/Requests/PropertyRequestCard.jsx
// One property request in a list (board, my requests, admin): what, where, budget,
// facts, message, status and an action area.

import { useTranslation } from "react-i18next";
import { Box, Card, CardActionArea, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";

import { REQUEST_COLOR, budgetLabel, cityName, daysLeft, requestFacts, requestTitle } from "./propertyRequestOptions";

const STATUS_COLORS = { active: "success", closed: "default", expired: "warning" };

export function PropertyRequestStatusChip({ request }) {
    const { t } = useTranslation();
    return <Chip size="small" color={STATUS_COLORS[request.status] || "default"} label={t(`requests.status.${request.status}`, request.status)} sx={{ fontWeight: 700 }} />;
}

export default function PropertyRequestCard({ request, onClick, badges = null, footer = null }) {
    const { t, i18n } = useTranslation();
    const color = REQUEST_COLOR;
    const Icon = HomeWorkOutlinedIcon;
    const facts = requestFacts(t, request, i18n.language);
    const left = daysLeft(request);

    const body = (
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" spacing={1.75} sx={{ alignItems: "flex-start" }}>
                <Box
                    sx={{
                        width: 46,
                        height: 46,
                        flexShrink: 0,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        color,
                        bgcolor: alpha(color, 0.1),
                    }}
                >
                    <Icon />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
                        <Chip size="small" label={t(`requests.wantTo.property.${request.transaction}`)} sx={{ fontWeight: 700, color, bgcolor: alpha(color, 0.1) }} />
                        <PropertyRequestStatusChip request={request} />
                        {badges}
                    </Stack>

                    <Typography sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.35 }}>{requestTitle(t, request)}</Typography>
                    <Typography sx={{ fontWeight: 700, color, mt: 0.25 }}>{budgetLabel(t, request, i18n.language)}</Typography>

                    {facts.length > 0 && (
                        <Typography variant="body2" sx={{ color: "#475569", mt: 0.5 }}>
                            {facts.join(" · ")}
                        </Typography>
                    )}

                    {request.message && (
                        <Typography
                            variant="body2"
                            dir="auto"
                            sx={{
                                mt: 1,
                                color: "#334155",
                                fontStyle: "italic",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            “{request.message}”
                        </Typography>
                    )}

                    <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 1.25, color: "#64748B", flexWrap: "wrap" }}>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">{[request.neighborhoods, cityName(t, request.city)].filter(Boolean).join(", ")}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <ScheduleOutlinedIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">
                                {new Date(request.createdAt).toLocaleDateString(i18n.language)}
                                {request.status === "active" ? ` · ${t("requests.daysLeft", "{{count}} days left", { count: left })}` : ""}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );

    return (
        <Card variant="outlined" sx={{ borderRadius: "16px", borderInlineStart: `4px solid ${color}`, overflow: "hidden" }}>
            {onClick ? <CardActionArea onClick={onClick}>{body}</CardActionArea> : body}
            {footer && <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2, pt: 0 }}>{footer}</Box>}
        </Card>
    );
}
