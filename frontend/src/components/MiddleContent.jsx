import React from "react";
import PageLayout from "./PageLayout";

import {
    Box,
    Typography,
    Grid,
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Chip,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import propertiesImage from "../assets/properties.jpg";
import carsImage from "../assets/cars.jpg";
import servicesImage from "../assets/services.jpg";
import deliveryManImage from "../assets/delivery-man.jpg";
import transporterImage from "../assets/transporter.jpg";
import driverImage from "../assets/driver.jpg";

export default function MiddleContent({ activeNav }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const currentLanguage = (
        i18n.resolvedLanguage ||
        i18n.language ||
        "en"
    )
        .split("-")[0]
        .split("_")[0];

    const isRTL = currentLanguage === "ar";

    const services = [
        {
            key: "properties",
            image: propertiesImage,
            path: "/properties",
            available: true,
        },
        {
            key: "cars",
            image: carsImage,
            available: false,
        },
        {
            key: "services",
            image: servicesImage,
            available: false,
        },
        {
            key: "deliveryMan",
            image: deliveryManImage,
            available: false,
        },
        {
            key: "transporter",
            image: transporterImage,
            available: false,
        },
        {
            key: "driver",
            image: driverImage,
            available: false,
        },
    ];

    const handleCardClick = (service) => {
        if (service.available && service.path) {
            navigate(service.path);
        }
    };

    return (
        <Box dir={isRTL ? "rtl" : "ltr"} sx={{ width: "100%", minWidth: 0 }}>
            <PageLayout
                title={t("middleContent.overview", {
                    section: activeNav,
                })}
                subtitle={t("middleContent.subtitle")}
                maxWidth={1280}
            >
                <Grid
                    container
                    spacing={{
                        xs: 2,
                        sm: 2.5,
                        md: 3,
                    }}
                    sx={{
                        width: "100%",
                        maxWidth: "100%",
                        mx: 0,
                        alignItems: "stretch",
                    }}
                >
                    {services.map((service) => (
                        <Grid
                            key={service.key}
                            size={{
                                xs: 12,
                                sm: 6,
                                lg: 4,
                            }}
                            sx={{
                                display: "flex",
                                minWidth: 0,
                            }}
                        >
                            <Card
                                sx={{
                                    borderRadius: "16px",
                                    boxShadow: "none",
                                    border: "1px solid #E2E8F0",
                                    overflow: "hidden",
                                    width: "100%",
                                    minWidth: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",

                                    "&:hover .hover-media": {
                                        filter: "blur(4px) brightness(0.4)",
                                        transform: "scale(1.05)",
                                    },

                                    "&:hover .hover-details": {
                                        opacity: 1,
                                        transform: "translateY(0)",
                                    },
                                }}
                            >
                                <CardActionArea
                                    onClick={() => handleCardClick(service)}
                                    disabled={!service.available}
                                    sx={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        justifyContent: "flex-start",
                                        minWidth: 0,

                                        "&.Mui-disabled": {
                                            opacity: 1,
                                        },
                                    }}
                                >
                                    {/* Image container */}
                                    <Box
                                        sx={{
                                            position: "relative",
                                            height: {
                                                xs: 190,
                                                sm: 210,
                                                md: 230,
                                                lg: 240,
                                            },
                                            width: "100%",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            image={service.image}
                                            alt={t(
                                                `middleContent.services.${service.key}.title`
                                            )}
                                            className="hover-media"
                                            sx={{
                                                height: "100%",
                                                width: "100%",
                                                objectFit: "cover",
                                                transition:
                                                    "all 0.4s ease-in-out",
                                            }}
                                        />

                                        {/* Coming soon badge */}
                                        {!service.available && (
                                            <Chip
                                                label={t(
                                                    "middleContent.comingSoon"
                                                )}
                                                size="small"
                                                sx={{
                                                    position: "absolute",
                                                    top: 14,
                                                    insetInlineStart: 14,
                                                    zIndex: 3,
                                                    height: 28,
                                                    bgcolor: "#FEF3C7",
                                                    color: "#92400E",
                                                    fontWeight: 700,
                                                    fontSize: "0.75rem",
                                                    borderRadius: "7px",
                                                    boxShadow:
                                                        "0 2px 8px rgba(0,0,0,0.12)",
                                                }}
                                            />
                                        )}

                                        {/* Hover overlay details */}
                                        <Box
                                            className="hover-details"
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                p: {
                                                    xs: 2,
                                                    sm: 3,
                                                    md: 4,
                                                },
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                textAlign: "center",
                                                backgroundColor:
                                                    "rgba(0, 0, 0, 0.6)",
                                                opacity: 0,
                                                transform: "translateY(10px)",
                                                transition:
                                                    "all 0.4s ease-in-out",
                                                zIndex: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: "#ffffff",
                                                    fontWeight: 500,
                                                    lineHeight: 1.6,
                                                    fontSize: {
                                                        xs: "0.8rem",
                                                        sm: "0.875rem",
                                                        md: "1rem",
                                                    },
                                                }}
                                            >
                                                {t(
                                                    `middleContent.services.${service.key}.details`
                                                )}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Content section */}
                                    <CardContent
                                        sx={{
                                            width: "100%",
                                            minWidth: 0,
                                            bgcolor: "white",
                                            p: {
                                                xs: 2,
                                                sm: 2.5,
                                                md: 3.5,
                                            },
                                            height: {
                                                xs: 115,
                                                sm: 120,
                                                md: 130,
                                            },
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            boxSizing: "border-box",

                                            "&:last-child": {
                                                pb: {
                                                    xs: 2,
                                                    sm: 2.5,
                                                    md: 3.5,
                                                },
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 700,
                                                color: "#0F172A",
                                                fontSize: {
                                                    xs: "1rem",
                                                    sm: "1.05rem",
                                                    md: "1.15rem",
                                                },
                                                overflowWrap: "anywhere",
                                                textAlign: "start",
                                            }}
                                        >
                                            {t(
                                                `middleContent.services.${service.key}.title`
                                            )}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "#5B6577",
                                                mt: 0.5,
                                                fontSize: {
                                                    xs: "0.8rem",
                                                    sm: "0.875rem",
                                                },
                                                overflowWrap: "anywhere",
                                                textAlign: "start",
                                            }}
                                        >
                                            {t(
                                                `middleContent.services.${service.key}.description`
                                            )}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </PageLayout>
        </Box>
    );
}