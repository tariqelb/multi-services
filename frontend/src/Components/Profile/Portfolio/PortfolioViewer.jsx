// src/Components/Profile/Portfolio/PortfolioViewer.jsx
//
// Opens one portfolio item: an article (photos + text) or a YouTube video.
// The video loads from youtube-nocookie.com only when the dialog is open.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Dialog, DialogContent, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import { youtubeEmbed } from "./portfolioUtils";

const dateOf = (value, locale) => {
    try {
        return new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return "";
    }
};

function Photos({ images, title }) {
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);
    if (!images.length) return null;
    const current = images[Math.min(index, images.length - 1)];
    const go = (step) => setIndex((value) => (value + step + images.length) % images.length);

    return (
        <Box sx={{ position: "relative", bgcolor: "grey.900", borderRadius: 2, overflow: "hidden", mb: 2 }}>
            <Box component="img" src={current.path} alt={title} sx={{ width: "100%", maxHeight: { xs: 280, sm: 440 }, objectFit: "contain", display: "block" }} />
            {images.length > 1 && (
                <>
                    <IconButton aria-label={t("portfolio.previous", "Previous photo")} onClick={() => go(-1)} sx={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,.85)", "&:hover": { bgcolor: "#fff" } }}>
                        <ChevronLeftRoundedIcon />
                    </IconButton>
                    <IconButton aria-label={t("portfolio.next", "Next photo")} onClick={() => go(1)} sx={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,.85)", "&:hover": { bgcolor: "#fff" } }}>
                        <ChevronRightRoundedIcon />
                    </IconButton>
                    <Stack direction="row" spacing={0.75} sx={{ position: "absolute", bottom: 10, left: 0, right: 0, justifyContent: "center" }}>
                        {images.map((image, i) => (
                            <Box key={image.path} onClick={() => setIndex(i)} sx={{ width: 8, height: 8, borderRadius: "50%", cursor: "pointer", bgcolor: i === index ? "#fff" : "rgba(255,255,255,.5)" }} />
                        ))}
                    </Stack>
                </>
            )}
        </Box>
    );
}

export default function PortfolioViewer({ item, onClose }) {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Dialog open={Boolean(item)} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
            {item && (
                <DialogContent sx={{ p: { xs: 2, sm: 3 }, position: "relative" }}>
                    <IconButton aria-label={t("portfolio.close", "Close")} onClick={onClose} sx={{ position: "absolute", top: 8, insetInlineEnd: 8, zIndex: 1 }}>
                        <CloseRoundedIcon />
                    </IconButton>

                    <Typography variant="h5" sx={{ fontWeight: 800, pr: 5, mb: 0.5, overflowWrap: "anywhere" }}>
                        {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                        {dateOf(item.createdAt, i18n.language)}
                    </Typography>

                    {item.type === "video" ? (
                        <Box sx={{ position: "relative", pt: "56.25%", borderRadius: 2, overflow: "hidden", bgcolor: "#000", mb: 2 }}>
                            <Box
                                component="iframe"
                                src={youtubeEmbed(item.youtubeId)}
                                title={item.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                            />
                        </Box>
                    ) : (
                        <Photos key={item.id} images={item.images || []} title={item.title} />
                    )}

                    {item.text && (
                        <Typography sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere", lineHeight: 1.75 }}>{item.text}</Typography>
                    )}
                </DialogContent>
            )}
        </Dialog>
    );
}
