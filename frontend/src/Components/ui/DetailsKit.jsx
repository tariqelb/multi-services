// src/Components/ui/DetailsKit.jsx
// Shared building blocks for every "details" page
// (properties, furnished rentals, roommate announcements, establishments).
// Mobile first: single column on phones, content + sticky sidebar on desktop.

import { pagePaddingSx } from "./PageContainer";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const isEmpty = (value) =>
    value === undefined || value === null || value === "" ||
    (Array.isArray(value) && value.length === 0);

// -----------------------------------------------------------------------------
// Page container & back button
// -----------------------------------------------------------------------------

export function DetailsContainer({ children, withMobileBar = false }) {
    return (
        <Box
            component="main"
            sx={{
                ...pagePaddingSx,
                // Leave room for the fixed mobile contact bar.
                pb: withMobileBar ? { xs: 12, lg: 4 } : pagePaddingSx.py,
            }}
        >
            {children}
        </Box>
    );
}

export function DetailsBackButton({ onClick, label }) {
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <Button
            onClick={onClick}
            color="inherit"
            startIcon={
                <ArrowBackRoundedIcon
                    sx={{ transform: theme.direction === "rtl" ? "scaleX(-1)" : "none" }}
                />
            }
            sx={{ mb: 2, color: "text.secondary", px: 1.25 }}
        >
            {label || t("ui.details.back", "Back")}
        </Button>
    );
}

// -----------------------------------------------------------------------------
// Header: badges, title, location, price
// -----------------------------------------------------------------------------

export function DetailsHeader({
    badges,
    title,
    location,
    subtitle,
    price,
    priceCaption,
    actions,
}) {
    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 3 }}
            sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "flex-end" }, mb: { xs: 2, md: 3 } }}
        >
            <Box sx={{ minWidth: 0, flex: 1 }}>
                {badges && (
                    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mb: 1.25 }}>
                        {badges}
                    </Stack>
                )}

                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontSize: { xs: "1.45rem", sm: "1.8rem", md: "2.05rem" },
                        overflowWrap: "anywhere",
                    }}
                >
                    {title}
                </Typography>

                {location && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 1, color: "text.secondary" }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 19, color: "primary.main" }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, overflowWrap: "anywhere" }}>
                            {location}
                        </Typography>
                    </Stack>
                )}

                {subtitle && (
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {(price || actions) && (
                <Stack
                    direction={{ xs: "row", md: "column" }}
                    spacing={1.5}
                    sx={{ alignItems: { xs: "center", md: "flex-end" }, justifyContent: "space-between", flexShrink: 0 }}
                >
                    {price && (
                        <Box sx={{ textAlign: { xs: "start", md: "end" } }}>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    color: "primary.main",
                                    fontSize: { xs: "1.5rem", md: "1.85rem" },
                                    lineHeight: 1.2,
                                }}
                            >
                                {price}
                            </Typography>
                            {priceCaption && (
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {priceCaption}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {actions && (
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            {actions}
                        </Stack>
                    )}
                </Stack>
            )}
        </Stack>
    );
}

/** Small status badge used in headers / cards. */
export function StatusBadge({ label, tone = "default", icon }) {
    const palette = {
        default: { bg: "background.muted", color: "text.secondary" },
        primary: { bg: "primary.lighter", color: "primary.dark" },
        success: { bg: "success.light", color: "success.dark" },
        warning: { bg: "warning.light", color: "warning.dark" },
        error: { bg: "error.light", color: "error.dark" },
        info: { bg: "info.light", color: "info.dark" },
    }[tone] || { bg: "background.muted", color: "text.secondary" };

    if (!label) return null;

    return (
        <Chip
            size="small"
            icon={icon}
            label={label}
            sx={{
                bgcolor: palette.bg,
                color: palette.color,
                "& .MuiChip-icon": { color: "inherit" },
            }}
        />
    );
}

// -----------------------------------------------------------------------------
// Media gallery (swipe, arrows, thumbnails, fullscreen viewer)
// -----------------------------------------------------------------------------

function GalleryArrow({ direction, onClick, label, size = 40 }) {
    const theme = useTheme();
    const isRtl = theme.direction === "rtl";
    const isPrevious = direction === "previous";

    // In RTL the "previous" arrow sits on the right and points right.
    const Icon = isPrevious !== isRtl ? ChevronLeftRoundedIcon : ChevronRightRoundedIcon;

    return (
        <IconButton
            aria-label={label}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            sx={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                [isPrevious ? "insetInlineStart" : "insetInlineEnd"]: 12,
                width: size,
                height: size,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.92)",
                color: "text.primary",
                boxShadow: theme.customShadows?.sm,
                "&:hover": { bgcolor: "#fff" },
            }}
        >
            <Icon />
        </IconButton>
    );
}

function useSwipe(onPrevious, onNext) {
    const start = useRef(null);
    const theme = useTheme();
    const isRtl = theme.direction === "rtl";

    return {
        onTouchStart: (event) => {
            start.current = event.touches[0].clientX;
        },
        onTouchEnd: (event) => {
            if (start.current === null) return;

            const delta = event.changedTouches[0].clientX - start.current;
            start.current = null;

            if (Math.abs(delta) < 40) return;

            const swipedLeft = delta < 0;

            if (swipedLeft !== isRtl) onNext();
            else onPrevious();
        },
    };
}

export function MediaGallery({ images = [], alt = "", emptyIcon, emptyLabel }) {
    const { t } = useTranslation();
    const [active, setActive] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);

    const total = images.length;
    const imagesKey = images.join("|");

    useEffect(() => {
        setActive(0);
    }, [imagesKey]);

    const previous = useCallback(
        () => setActive((index) => (index - 1 + total) % total),
        [total]
    );

    const next = useCallback(
        () => setActive((index) => (index + 1) % total),
        [total]
    );

    const swipe = useSwipe(previous, next);

    useEffect(() => {
        if (!viewerOpen) return undefined;

        const onKey = (event) => {
            if (event.key === "ArrowLeft") previous();
            if (event.key === "ArrowRight") next();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [viewerOpen, previous, next]);

    if (!total) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    aspectRatio: { xs: "4 / 3", md: "21 / 9" },
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "background.muted",
                    color: "text.disabled",
                    mb: { xs: 2, md: 3 },
                }}
            >
                <Stack spacing={1} sx={{ alignItems: "center" }}>
                    <Box sx={{ "& svg": { fontSize: 56 } }}>
                        {emptyIcon || <ImageNotSupportedOutlinedIcon />}
                    </Box>
                    <Typography variant="body2">
                        {emptyLabel || t("ui.details.noPhotos", "No photos available")}
                    </Typography>
                </Stack>
            </Paper>
        );
    }

    const counter = `${active + 1} / ${total}`;
    const previousLabel = t("ui.details.previousPhoto", "Previous photo");
    const nextLabel = t("ui.details.nextPhoto", "Next photo");

    return (
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
            {/* Main image */}
            <Box
                {...swipe}
                onClick={() => setViewerOpen(true)}
                sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: { xs: "4 / 3", sm: "16 / 10", md: "16 / 8" },
                    borderRadius: { xs: 3, md: 4 },
                    overflow: "hidden",
                    bgcolor: "#0F172A",
                    cursor: "zoom-in",
                }}
            >
                {/* Blurred backdrop fills empty space for portrait photos */}
                <Box
                    aria-hidden
                    sx={{
                        position: "absolute",
                        inset: -20,
                        backgroundImage: `url("${images[active]}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "blur(24px) brightness(0.6)",
                    }}
                />

                <Box
                    component="img"
                    src={images[active]}
                    alt={alt}
                    loading="eager"
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        animation: "fadeIn .25s ease",
                    }}
                />

                {total > 1 && (
                    <>
                        <GalleryArrow direction="previous" onClick={previous} label={previousLabel} />
                        <GalleryArrow direction="next" onClick={next} label={nextLabel} />
                    </>
                )}

                <Stack
                    direction="row"
                    spacing={1}
                    sx={{ position: "absolute", bottom: 12, insetInlineEnd: 12 }}
                >
                    <Chip
                        size="small"
                        label={counter}
                        sx={{ bgcolor: "rgba(15,23,42,0.75)", color: "#fff", backdropFilter: "blur(4px)" }}
                    />
                    <Chip
                        size="small"
                        icon={<FullscreenRoundedIcon />}
                        label={t("ui.details.fullscreen", "Full screen")}
                        sx={{
                            display: { xs: "none", sm: "inline-flex" },
                            bgcolor: "rgba(15,23,42,0.75)",
                            color: "#fff",
                            "& .MuiChip-icon": { color: "#fff" },
                        }}
                    />
                </Stack>
            </Box>

            {/* Thumbnails */}
            {total > 1 && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        mt: 1.25,
                        overflowX: "auto",
                        pb: 0.5,
                        scrollSnapType: "x mandatory",
                    }}
                >
                    {images.map((src, index) => (
                        <Box
                            key={`${src}-${index}`}
                            component="button"
                            type="button"
                            onClick={() => setActive(index)}
                            aria-label={t("ui.details.viewPhoto", "View photo {{number}}", { number: index + 1 })}
                            aria-current={index === active}
                            sx={(theme) => ({
                                flex: "0 0 auto",
                                width: { xs: 72, sm: 96 },
                                height: { xs: 54, sm: 68 },
                                p: 0,
                                borderRadius: 2,
                                overflow: "hidden",
                                cursor: "pointer",
                                scrollSnapAlign: "start",
                                border: `2px solid ${index === active ? theme.palette.primary.main : "transparent"}`,
                                opacity: index === active ? 1 : 0.7,
                                transition: "opacity .2s, border-color .2s",
                                bgcolor: "background.muted",
                                "&:hover": { opacity: 1 },
                            })}
                        >
                            <Box
                                component="img"
                                src={src}
                                alt=""
                                loading="lazy"
                                sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        </Box>
                    ))}
                </Stack>
            )}

            {/* Fullscreen viewer */}
            <Dialog
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                fullScreen
                PaperProps={{ sx: { bgcolor: "#0B1120", borderRadius: 0 } }}
            >
                <Box
                    {...swipe}
                    sx={{ position: "relative", width: "100%", height: "100%", display: "grid", placeItems: "center" }}
                >
                    <Box
                        component="img"
                        src={images[active]}
                        alt={alt}
                        sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />

                    {total > 1 && (
                        <>
                            <GalleryArrow direction="previous" onClick={previous} label={previousLabel} size={48} />
                            <GalleryArrow direction="next" onClick={next} label={nextLabel} size={48} />
                        </>
                    )}

                    <IconButton
                        aria-label={t("ui.details.close", "Close")}
                        onClick={() => setViewerOpen(false)}
                        sx={{
                            position: "absolute",
                            top: 16,
                            insetInlineEnd: 16,
                            bgcolor: "rgba(255,255,255,0.12)",
                            color: "#fff",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                        }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>

                    <Chip
                        label={counter}
                        sx={{
                            position: "absolute",
                            bottom: 20,
                            left: "50%",
                            transform: "translateX(-50%)",
                            bgcolor: "rgba(255,255,255,0.12)",
                            color: "#fff",
                        }}
                    />
                </Box>
            </Dialog>
        </Box>
    );
}

// -----------------------------------------------------------------------------
// Two-column layout with sticky sidebar
// -----------------------------------------------------------------------------

export function DetailsLayout({ main, sidebar, sidebarFirstOnMobile = false }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    lg: "minmax(0, 1fr) 380px",
                },
                gap: { xs: 2, md: 3 },
                alignItems: "start",
            }}
        >
            <Stack spacing={{ xs: 2, md: 3 }} sx={{ minWidth: 0, order: { xs: sidebarFirstOnMobile ? 2 : 1, lg: 1 } }}>
                {main}
            </Stack>

            <Stack
                spacing={{ xs: 2, md: 3 }}
                sx={{
                    minWidth: 0,
                    order: { xs: sidebarFirstOnMobile ? 1 : 2, lg: 2 },
                    position: { lg: "sticky" },
                    top: { lg: 88 },
                }}
            >
                {sidebar}
            </Stack>
        </Box>
    );
}

// -----------------------------------------------------------------------------
// Section card
// -----------------------------------------------------------------------------

export function DetailsSection({ title, icon, subtitle, action, children, sx }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                borderRadius: 4,
                minWidth: 0,
                boxShadow: (theme) => theme.customShadows?.xs,
                ...sx,
            }}
        >
            {(title || action) && (
                <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
                >
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                        {icon && (
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 2,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: "primary.lighter",
                                    color: "primary.main",
                                    flexShrink: 0,
                                    "& svg": { fontSize: 20 },
                                }}
                            >
                                {icon}
                            </Box>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" component="h2">
                                {title}
                            </Typography>
                            {subtitle && (
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                    {action}
                </Stack>
            )}
            {children}
        </Paper>
    );
}

// -----------------------------------------------------------------------------
// Facts, key/values, features
// -----------------------------------------------------------------------------

/** items: [{ icon, label, value }] — empty values are hidden. */
export function FactGrid({ items = [], minWidth = 140 }) {
    const visible = items.filter((item) => !isEmpty(item.value));

    if (!visible.length) return null;

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
                },
                gap: 1.25,
            }}
        >
            {visible.map((item) => (
                <Stack
                    key={item.label}
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: "center",
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: "background.subtle",
                        border: "1px solid",
                        borderColor: "divider",
                        minWidth: 0,
                    }}
                >
                    {item.icon && (
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "background.paper",
                                color: "primary.main",
                                flexShrink: 0,
                                "& svg": { fontSize: 20 },
                            }}
                        >
                            {item.icon}
                        </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1.3 }}>
                            {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                            {item.value}
                        </Typography>
                    </Box>
                </Stack>
            ))}
        </Box>
    );
}

/** items: [{ label, value, icon? }] rendered as rows. */
export function KeyValueList({ items = [] }) {
    const visible = items.filter((item) => !isEmpty(item.value));

    if (!visible.length) return null;

    return (
        <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
            {visible.map((item) => (
                <Stack
                    key={item.label}
                    direction="row"
                    spacing={2}
                    sx={{ justifyContent: "space-between", alignItems: "center", py: 1.1 }}
                >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", minWidth: 0 }}>
                        {item.icon && <Box sx={{ display: "flex", "& svg": { fontSize: 18 } }}>{item.icon}</Box>}
                        <Typography variant="body2">{item.label}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "end", overflowWrap: "anywhere" }}>
                        {item.value}
                    </Typography>
                </Stack>
            ))}
        </Stack>
    );
}

/** items: [{ label, icon? }] */
export function FeatureChips({ items = [], emptyLabel }) {
    if (!items.length) {
        return emptyLabel ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {emptyLabel}
            </Typography>
        ) : null;
    }

    return (
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
            {items.map((item) => (
                <Chip
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    variant="outlined"
                    sx={(theme) => ({
                        borderColor: alpha(theme.palette.success.main, 0.35),
                        bgcolor: alpha(theme.palette.success.main, 0.06),
                        color: "success.dark",
                        "& .MuiChip-icon": { color: "success.main" },
                    })}
                />
            ))}
        </Stack>
    );
}

/** Long text with preserved line breaks. */
export function DescriptionText({ children }) {
    return (
        <Typography
            sx={{ color: "text.secondary", whiteSpace: "pre-line", overflowWrap: "anywhere", lineHeight: 1.85 }}
        >
            {children}
        </Typography>
    );
}

// -----------------------------------------------------------------------------
// Video & map
// -----------------------------------------------------------------------------

export function VideoEmbed({ src, title, externalUrl }) {
    const { t } = useTranslation();

    if (!src) return null;

    return (
        <Box>
            <Box
                sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "#0F172A",
                }}
            >
                <Box
                    component="iframe"
                    src={src}
                    title={title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
            </Box>

            {externalUrl && (
                <Button
                    component="a"
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    endIcon={<OpenInNewRoundedIcon />}
                    sx={{ mt: 1 }}
                >
                    {t("ui.details.watchOnYoutube", "Watch on YouTube")}
                </Button>
            )}
        </Box>
    );
}

export function MapLinkButton({ href, onClick, label, fullWidth = false }) {
    const { t } = useTranslation();

    if (!href && !onClick) return null;

    return (
        <Button
            component={href ? "a" : "button"}
            href={href}
            onClick={onClick}
            target={href ? "_blank" : undefined}
            rel={href ? "noopener noreferrer" : undefined}
            variant="outlined"
            color="primary"
            fullWidth={fullWidth}
            startIcon={<LocationOnOutlinedIcon />}
            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: "16px !important" }} />}
        >
            {label || t("ui.details.viewOnMap", "View on map")}
        </Button>
    );
}

// -----------------------------------------------------------------------------
// Sidebar cards
// -----------------------------------------------------------------------------

export function SidebarCard({ children, sx }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 4,
                boxShadow: (theme) => theme.customShadows?.sm,
                minWidth: 0,
                ...sx,
            }}
        >
            {children}
        </Paper>
    );
}

export function OwnerSummary({ name, subtitle, avatar, label }) {
    const initials = (name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <Box>
            {label && (
                <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                    {label}
                </Typography>
            )}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar src={avatar || undefined} sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
                    {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                        {name}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}

// -----------------------------------------------------------------------------
// Fixed contact bar on phones / tablets
// -----------------------------------------------------------------------------

export function MobileActionBar({ children }) {
    return (
        <Paper
            square
            sx={(theme) => ({
                display: { xs: "flex", lg: "none" },
                position: "fixed",
                insetInline: 0,
                bottom: 0,
                zIndex: theme.zIndex.appBar,
                gap: 1,
                px: 1.5,
                pt: 1.25,
                pb: "calc(10px + env(safe-area-inset-bottom))",
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: alpha(theme.palette.background.paper, 0.96),
                backdropFilter: "blur(10px)",
                boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.08)",
                "& > *": { flex: 1, minWidth: 0 },
            })}
        >
            {children}
        </Paper>
    );
}
