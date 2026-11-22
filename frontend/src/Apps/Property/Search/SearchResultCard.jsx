// src/Apps/Property/Search/SearchResultCard.jsx
// One result: numbered like its marker on the map. Hovering highlights the
// marker; clicking opens the listing.

import { useTranslation } from "react-i18next";
import { Box, Card, CardActionArea, Chip, Stack, Typography } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import LocationOffOutlinedIcon from "@mui/icons-material/LocationOffOutlined";

import getImageUrl from "../../../utils/getImageUrl";
import { KIND_COLORS, formatCity, formatFacts, formatPrice, formatType, resultKind } from "./searchFormat";

export default function SearchResultCard({ result, index, active, onHover, onOpen }) {
    const { t, i18n } = useTranslation();
    const kind = resultKind(result);
    const color = KIND_COLORS[kind];
    const image = getImageUrl(result.image);
    const facts = formatFacts(result, t);

    return (
        <Card
            variant="outlined"
            onMouseEnter={() => onHover?.(result.id)}
            onMouseLeave={() => onHover?.(null)}
            sx={{
                height: "100%",
                borderRadius: "14px",
                borderColor: active ? color : "divider",
                boxShadow: active ? `0 0 0 2px ${color}33, 0 10px 24px rgba(15,23,42,0.10)` : "none",
                transition: "box-shadow .15s, border-color .15s, transform .15s",
                transform: active ? "translateY(-2px)" : "none",
            }}
        >
            <CardActionArea onClick={() => onOpen?.(result)} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                <Box sx={{ position: "relative", aspectRatio: "16 / 10", bgcolor: "#E2E8F0", overflow: "hidden" }}>
                    {image && (
                        <Box component="img" src={image} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    )}

                    {/* Same number as the marker on the map */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 10,
                            insetInlineStart: 10,
                            minWidth: 30,
                            height: 30,
                            px: 0.75,
                            borderRadius: "15px",
                            bgcolor: color,
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            display: "grid",
                            placeItems: "center",
                            border: "2px solid #fff",
                            boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                        }}
                    >
                        {index}
                    </Box>

                    <Chip
                        size="small"
                        label={t(`search.kinds.${kind}`)}
                        sx={{ position: "absolute", top: 12, insetInlineEnd: 10, bgcolor: "rgba(255,255,255,.92)", color, fontWeight: 700 }}
                    />
                </Box>

                <Stack spacing={0.6} sx={{ p: 1.5, flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1rem" }}>
                        {formatPrice(result, t, i18n.language)}
                    </Typography>

                    <Typography sx={{ fontWeight: 600, fontSize: "0.92rem", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {result.title}
                    </Typography>

                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary" }}>
                        {result.location ? <PlaceOutlinedIcon sx={{ fontSize: 16 }} /> : <LocationOffOutlinedIcon sx={{ fontSize: 16 }} titleAccess={t("search.card.noLocation", "Not on the map")} />}
                        <Typography variant="body2" noWrap>{formatCity(result, i18n.language)}</Typography>
                    </Stack>

                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {[formatType(result, t), ...facts].filter(Boolean).join(" · ")}
                    </Typography>
                </Stack>
            </CardActionArea>
        </Card>
    );
}
