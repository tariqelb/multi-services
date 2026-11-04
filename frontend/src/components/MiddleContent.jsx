
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

import propertiesImage from "../assets/properties.jpg";
import carsImage from "../assets/cars.jpg";
import servicesImage from "../assets/services.jpg";
import deliveryManImage from "../assets/delivery-man.jpg";
import transporterImage from "../assets/transporter.jpg";
import driverImage from "../assets/driver.jpg";

export default function MiddleContent({ activeNav }) {
    const navigate = useNavigate();

    const services = [
        {
            title: "Properties",
            description: "Buy, Sell & Rent Properties",
            details:
                "Explore thousands of verified residential and commercial properties available for immediate purchase, sale, or lease in your area.",
            image: propertiesImage,
            path: "/properties",
            available: true,
        },
        {
            title: "Cars",
            description: "Buy, Sell & Rent Vehicles",
            details:
                "Browse a wide selection of brand new and pre-owned cars, trucks, and SUVs with transparent pricing and direct owner contacts.",
            image: carsImage,
            available: false,
        },
        {
            title: "Services",
            description: "Find Companies & Offices",
            details:
                "Connect with certified local professionals, corporate offices, agencies, and businesses ready to cater to your project requirements.",
            image: servicesImage,
            available: false,
        },
        {
            title: "Delivery Man",
            description: "Hire a Delivery Person",
            details:
                "Book reliable on-demand couriers and delivery riders for fast, secure package transport and local errand execution.",
            image: deliveryManImage,
            available: false,
        },
        {
            title: "Transporter",
            description: "Book Transport Services",
            details:
                "Access heavy-duty trucks, moving vans, and logistics transport providers for smooth relocation and cargo delivery.",
            image: transporterImage,
            available: false,
        },
        {
            title: "Driver",
            description: "Hire a Personal Driver",
            details:
                "Hire professional, vetted private drivers for daily commutes, special occasions, out-of-town trips, or personal chauffeuring.",
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
        <PageLayout
            title={`${activeNav} Overview`}
            subtitle="Select a service category below to manage listings and requests."
            maxWidth={1280}
        >
            {/* Responsive Services Grid */}
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
                {services.map((service, index) => (
                    <Grid
                        key={index}
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
                                {/* Image Container */}
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
                                        alt={service.title}
                                        className="hover-media"
                                        sx={{
                                            height: "100%",
                                            width: "100%",
                                            objectFit: "cover",
                                            transition:
                                                "all 0.4s ease-in-out",
                                        }}
                                    />

                                    {/* Coming Soon Badge */}
                                    {!service.available && (
                                        <Chip
                                            label="Coming Soon"
                                            size="small"
                                            sx={{
                                                position: "absolute",
                                                top: 14,
                                                left: 14,
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

                                    {/* Hover Overlay Details */}
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
                                            {service.details}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Content Section */}
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
                                        }}
                                    >
                                        {service.title}
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
                                        }}
                                    >
                                        {service.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </PageLayout>
    );
}
