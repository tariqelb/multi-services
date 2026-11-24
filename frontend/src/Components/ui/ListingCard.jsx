// src/Components/ui/ListingCard.jsx
// One card design for every listing in the application
// (properties, furnished rentals, roommate announcements, establishments).

import { useState } from "react";
import {
    Box,
    Card,
    CardActionArea,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

const BADGE_TONES = {
    primary: { bgcolor: "primary.main", color: "#fff" },
    success: { bgcolor: "success.main", color: "#fff" },
    info: { bgcolor: "info.main", color: "#fff" },
    warning: { bgcolor: "warning.main", color: "#fff" },
    error: { bgcolor: "error.main", color: "#fff" },
    dark: { bgcolor: "rgba(15, 23, 42, 0.72)", color: "#fff" },
    light: { bgcolor: "rgba(255, 255, 255, 0.92)", color: "text.primary" },
};

/** Small badge displayed over the card image. */
export function CardBadge({ label, tone = "light", icon }) {
    if (!label) return null;

    return (
        <Chip
            size="small"
            icon={icon}
            label={label}
            sx={{
                ...(BADGE_TONES[tone] || BADGE_TONES.light),
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 700,
                backdropFilter: "blur(6px)",
                maxWidth: "100%",
                "& .MuiChip-icon": { color: "inherit", fontSize: 15, ml: 0.75 },
            }}
        />
    );
}

/**
 * Props
 * - image, imageAlt, emptyIcon
 * - topBadges / bottomBadges: badges over the image (top-start / bottom-start)
 * - topEndBadges: badges over the image (top-end)
 * - meta: small text above the title (date...)
 * - metaEnd: element on the right of the meta row
 * - title, location
 * - price, priceCaption, priceNote
 * - features: [{ icon, label }] short facts displayed as chips
 * - imageReferrerPolicy: e.g. "no-referrer" for pictures of other websites
 *   that refuse to show to other sites (optional)
 * - featureRows: keep room for this many rows of features, so every card
 *   of a grid has the same height (optional)
 * - footer: bottom element (owner, action button...)
 * - onClick
 */
export default function ListingCard({
    image,
    imageAlt = "",
    emptyIcon,
    emptyLabel,
    topBadges,
    topEndBadges,
    bottomBadges,
    meta,
    metaEnd,
    title,
    location,
    price,
    priceCaption,
    priceNote,
    features = [],
    footer,
    onClick,
    imageHeight = { xs: 200, sm: 190 },
    featureRows,
    imageReferrerPolicy,
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(image) && !imageFailed;
    const visibleFeatures = features.filter(
        (feature) => feature && feature.label !== undefined && feature.label !== null && feature.label !== ""
    );

    const content = (
        <>
            {/* Image */}
            <Box
                sx={{
                    position: "relative",
                    width: "100%",
                    height: imageHeight,
                    flexShrink: 0,
                    overflow: "hidden",
                    bgcolor: "background.muted",
                }}
            >
                {showImage ? (
                    <Box
                        component="img"
                        src={image}
                        alt={imageAlt}
                        loading="lazy"
                        referrerPolicy={imageReferrerPolicy}
                        onError={() => setImageFailed(true)}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transition: "transform .35s ease",
                            ".MuiCard-root:hover &": { transform: "scale(1.04)" },
                        }}
                    />
                ) : (
                    <Stack
                        spacing={0.75}
                        sx={{ alignItems: "center", justifyContent: "center", height: "100%", color: "text.disabled" }}
                    >
                        <Box sx={{ "& svg": { fontSize: 46 } }}>
                            {emptyIcon || <ImageNotSupportedOutlinedIcon />}
                        </Box>
                        {emptyLabel && <Typography variant="caption">{emptyLabel}</Typography>}
                    </Stack>
                )}

                {/* Soft gradient so badges stay readable on any photo */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "linear-gradient(180deg, rgba(15,23,42,0.28) 0%, rgba(15,23,42,0) 34%, rgba(15,23,42,0) 66%, rgba(15,23,42,0.32) 100%)",
                    }}
                />

                {topBadges && (
                    <Stack
                        direction="row"
                        useFlexGap
                        sx={{ flexWrap: "wrap", gap: 0.75, position: "absolute", top: 10, insetInlineStart: 10, maxWidth: "70%" }}
                    >
                        {topBadges}
                    </Stack>
                )}

                {topEndBadges && (
                    <Stack
                        direction="row"
                        useFlexGap
                        sx={{ flexWrap: "wrap", gap: 0.75, justifyContent: "flex-end", position: "absolute", top: 10, insetInlineEnd: 10, maxWidth: "50%" }}
                    >
                        {topEndBadges}
                    </Stack>
                )}

                {bottomBadges && (
                    <Stack
                        direction="row"
                        useFlexGap
                        sx={{ flexWrap: "wrap", gap: 0.75, position: "absolute", bottom: 10, insetInlineStart: 10, insetInlineEnd: 10 }}
                    >
                        {bottomBadges}
                    </Stack>
                )}
            </Box>

            {/* Content */}
            <Stack sx={{ p: 2, flex: 1, width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                {(meta || metaEnd) && (
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.75, minHeight: 24 }}
                    >
                        <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                            {meta}
                        </Typography>
                        {metaEnd}
                    </Stack>
                )}

                <Typography
                    variant="subtitle1"
                    component="h3"
                    sx={{
                        fontWeight: 700,
                        lineHeight: 1.35,
                        minHeight: "2.7em",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        overflowWrap: "anywhere",
                    }}
                >
                    {title}
                </Typography>

                {location && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.75, minWidth: 0 }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                        <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
                            {location}
                        </Typography>
                    </Stack>
                )}

                {(visibleFeatures.length > 0 || featureRows > 0) && (
                    <Stack
                        direction="row"
                        useFlexGap
                        sx={{
                            flexWrap: "wrap",
                            gap: 0.75,
                            mt: 1.5,
                            alignContent: "flex-start",
                            // One feature chip is 26px high, rows are 6px apart.
                            ...(featureRows > 0 ? { minHeight: featureRows * 26 + (featureRows - 1) * 6 } : {}),
                        }}
                    >
                        {visibleFeatures.map((feature, index) => (
                            <Stack
                                key={`${feature.label}-${index}`}
                                direction="row"
                                spacing={0.5}
                                sx={[{ alignItems: "center" }, ...(Array.isArray((theme) => ({
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                    color: "text.primary",
                                    "& svg": { fontSize: 16, color: "primary.main" },
                                })) ? (theme) => ({
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                    color: "text.primary",
                                    "& svg": { fontSize: 16, color: "primary.main" },
                                }) : [(theme) => ({
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                    color: "text.primary",
                                    "& svg": { fontSize: 16, color: "primary.main" },
                                })])]}
                            >
                                {feature.icon}
                                <Typography variant="caption" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                                    {feature.label}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {(price || priceNote) && (
                    <>
                        <Divider sx={{ my: 1.5 }} />
                        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end", justifyContent: "space-between" }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    sx={{ fontWeight: 800, color: "primary.main", fontSize: "1.15rem", lineHeight: 1.2 }}
                                    noWrap
                                >
                                    {price}
                                    {priceCaption && (
                                        <Typography component="span" variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                            {" "}
                                            / {priceCaption}
                                        </Typography>
                                    )}
                                </Typography>
                                {priceNote && (
                                    <Typography variant="caption" noWrap component="div" sx={{ color: "text.secondary" }}>
                                        {priceNote}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </>
                )}

                {footer && <Box sx={{ mt: 1.5 }}>{footer}</Box>}
            </Stack>
        </>
    );

    return (
        <Card
            variant="outlined"
            sx={(theme) => ({
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 4,
                overflow: "hidden",
                bgcolor: "background.paper",
                boxShadow: theme.customShadows?.sm,
                transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: theme.customShadows?.md || "0 12px 30px rgba(15,23,42,.12)",
                    borderColor: alpha(theme.palette.primary.main, 0.35),
                },
            })}
        >
            {onClick ? (
                <CardActionArea
                    onClick={onClick}
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: "flex-start",
                    }}
                >
                    {content}
                </CardActionArea>
            ) : (
                content
            )}
        </Card>
    );
}
