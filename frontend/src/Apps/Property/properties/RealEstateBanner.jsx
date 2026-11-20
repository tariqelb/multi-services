import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";

import propertiesBgImage from "../../../assets/properties_bg_image.jpeg";

export default function RealEstateBanner() {
    const { t } = useTranslation();

    return (
        <Box
            component="section"
            sx={{
                position: "relative",
                width: "100%",
                minHeight: { xs: 220, sm: 280, md: 320 },
                backgroundImage: `url(${propertiesBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "flex-end",
                px: { xs: 2, sm: 3, md: 5 },
                py: { xs: 3, md: 5 },
                overflow: "hidden",
                boxSizing: "border-box",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.55) 55%, rgba(15,23,42,0.82) 100%)",
                    zIndex: 1,
                },
            }}
        >
            <Box sx={{ position: "relative", zIndex: 2, maxWidth: 720, color: "#fff" }}>
                <Chip
                    icon={<HomeWorkOutlinedIcon />}
                    label={t("properties.banner.badge", "Real estate")}
                    size="small"
                    sx={{
                        mb: 1.5,
                        color: "#fff",
                        bgcolor: "rgba(255,255,255,0.16)",
                        backdropFilter: "blur(6px)",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#fff" },
                    }}
                />
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontWeight: 800,
                        lineHeight: 1.25,
                        fontSize: { xs: "1.45rem", sm: "1.9rem", md: "2.3rem" },
                        textShadow: "0 2px 12px rgba(0,0,0,0.25)",
                    }}
                >
                    {t("properties.banner.title")}
                </Typography>

                <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.86)", fontSize: { xs: "0.92rem", md: "1.02rem" } }}>
                    {t("properties.banner.description")}
                </Typography>
            </Box>
        </Box>
    );
}
