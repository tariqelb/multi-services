import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import propertiesBgImage from "../assets/properties_bg_image.jpeg";

export default function RealEstateBanner() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <Box
            component="section"
            sx={{
                position: "relative",
                width: "100%",
                minHeight: "400px",
                backgroundImage: `url(${propertiesBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                p: { xs: 2, md: 4 },
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    zIndex: 1,
                },
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                    flexDirection: "column",
                    gap: 3,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                    }}
                >
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                        sx={{
                            textTransform: "none",
                            color: "#ffffff",
                            backgroundColor: "rgba(37, 99, 235, 0.92)",
                            fontWeight: 600,
                            px: 2,
                            py: 1,
                            borderRadius: "10px",
                            "&:hover": {
                                backgroundColor: "#1D4ED8",
                            },
                        }}
                    >
                        {t("properties.banner.back")}
                    </Button>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                >
                    <Box
                        sx={{
                            textAlign: "left",
                            color: "#ffef45",
                            maxWidth: "600px",
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                mb: 2,
                                lineHeight: 1.4,
                            }}
                        >
                            {t("properties.banner.title")}
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: "#ffef45",
                                fontWeight: 500,
                            }}
                        >
                            {t("properties.banner.description")}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}