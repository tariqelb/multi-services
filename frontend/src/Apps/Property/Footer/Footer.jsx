
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Box,
    Container,
    Typography,
    Stack,
    Divider,
} from "@mui/material";

import {
    HomeRounded,
    ApartmentRounded,
    PeopleAltRounded,
    HotelRounded,
    TravelExploreRounded,
    FacebookRounded,
    Instagram,
    LinkedIn,
    X,
    LocationOnOutlined,
    EmailOutlined,
} from "@mui/icons-material";

import logo from "../../../assets/iconlogo.png";

const services = [
    {
        label: "realEstate",
        icon: <HomeRounded />,
        path: "/properties",
    },
    {
        label: "furnishedRentals",
        icon: <ApartmentRounded />,
        path: "/furnishedProperties",
    },
    {
        label: "roommates",
        icon: <PeopleAltRounded />,
        path: "/roommates",
    },
    {
        label: "establishments",
        icon: <HotelRounded />,
        path: "/establishments",
    },
    {
        label: "exploreMap",
        icon: <TravelExploreRounded />,
        path: "/findbymap",
    },
];

const quickLinks = [
    { label: "dashboard", path: "/" },
    { label: "browseProperties", path: "/properties" },
    { label: "browseRoommates", path: "/roommates" },
    { label: "browseEstablishments", path: "/establishments" },
    { label: "findOnMap", path: "/findbymap" },
    { label: "alerts", path: "/alert" },
];

const publishLinks = [
    { label: "publishAd", path: "/properties/publish" },
    {
        label: "publishEstablishment",
        path: "/establishments/publish",
    },
    { label: "myPublications", path: "/mypublication" },
];

const supportLinks = [
    { label: "myProfile", path: "/profile" },
    { label: "settings", path: "/setting" },
    { label: "sendFeedback", path: "/feedback" },
];

const socialLinks = [
    {
        icon: <FacebookRounded />,
        href: "https://web.facebook.com/tariqelbouhali",
        label: "Facebook",
    },
    {
        icon: <Instagram />,
        href: "https://www.instagram.com/tariqelbouhali/",
        label: "Instagram",
    },
    {
        icon: <LinkedIn />,
        href: "https://www.linkedin.com/in/tariq-el-bouhali-13b776284/",
        label: "LinkedIn",
    },
    {
        icon: <X />,
        href: "https://x.com/TariqElBouhali",
        label: "X",
    },
];

function FooterLink({ to, children }) {
    return (
        <Typography
            component={Link}
            to={to}
            sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                textDecoration: "none",
                width: "fit-content",
                transition: "color 0.2s ease",
                "&:hover": {
                    color: "primary.main",
                },
            }}
        >
            {children}
        </Typography>
    );
}

export default function Footer() {
    const { t } = useTranslation();

    return (
        <Box
            component="footer"
            sx={{
                width: "100%",
                mt: "auto",
                position: "relative",
                overflow: "hidden",
                bgcolor: "#ffffff",
                borderTop: "1px solid #E2E8F0",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                color: "text.primary",
            }}
        >
            <Container
                maxWidth={false}
                sx={{
                    maxWidth: "1280px",
                    px: { xs: 2.5, sm: 4, lg: 6 },
                    py: { xs: 5, md: 7 },
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr 1fr",
                            md: "1.5fr 1fr 1fr 1fr",
                        },
                        gap: { xs: 4, md: 5 },
                    }}
                >
                    {/* Brand */}
                    <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                        <Stack
                            component={Link}
                            to="/"
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center",
                                mb: 2,
                                textDecoration: "none",
                                width: "fit-content",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    flexShrink: 0,
                                    borderRadius: "10px",
                                    bgcolor: "#0B2E5C",
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={logo}
                                    alt="MultiServices logo"
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            </Box>

                            <Typography
                                sx={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    color: "text.primary",
                                    letterSpacing: "-0.025em",
                                }}
                            >
                                MultiServices
                            </Typography>
                        </Stack>

                        <Typography
                            sx={{
                                maxWidth: 340,
                                color: "text.secondary",
                                fontSize: "0.875rem",
                                lineHeight: 1.8,
                            }}
                        >
                            {t("footer.description")}
                        </Typography>

                        {/* Social media */}
                        <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                            {socialLinks.map((social) => (
                                <Box
                                    key={social.label}
                                    component="a"
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t("footer.socialProfile", {
                                        platform: social.label,
                                    })}
                                    title={social.label}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: "#F5F7FB",
                                        border: "1px solid #E2E8F0",
                                        color: "text.secondary",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            bgcolor: "primary.main",
                                            borderColor: "primary.main",
                                            color: "#ffffff",
                                            transform: "translateY(-3px)",
                                        },
                                    }}
                                >
                                    {social.icon}
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    {/* Explore */}
                    <Box>
                        <Typography sx={sectionTitle}>
                            {t("footer.explore")}
                        </Typography>

                        <Stack spacing={1.5}>
                            {quickLinks.map((item) => (
                                <FooterLink
                                    key={item.path}
                                    to={item.path}
                                >
                                    {t(`footer.links.${item.label}`)}
                                </FooterLink>
                            ))}
                        </Stack>
                    </Box>

                    {/* Services */}
                    <Box>
                        <Typography sx={sectionTitle}>
                            {t("footer.ourServices")}
                        </Typography>

                        <Stack spacing={1.5}>
                            {services.map((item) => (
                                <Stack
                                    key={item.label}
                                    direction="row"
                                    spacing={1} sx={{ alignItems: "center" }}
                                >
                                    <Box
                                        sx={{
                                            color: "primary.main",
                                            display: "flex",
                                            "& svg": {
                                                fontSize: 20,
                                            },
                                        }}
                                    >
                                        {item.icon}
                                    </Box>

                                    <FooterLink to={item.path}>
                                        {t(`footer.services.${item.label}`)}
                                    </FooterLink>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    {/* Account and support */}
                    <Box>
                        <Typography sx={sectionTitle}>
                            {t("footer.accountSupport")}
                        </Typography>

                        <Stack spacing={1.5}>
                            {supportLinks.map((item) => (
                                <FooterLink
                                    key={item.path}
                                    to={item.path}
                                >
                                    {t(`footer.links.${item.label}`)}
                                </FooterLink>
                            ))}
                        </Stack>

                        {/* Publishing */}
                        <Typography
                            sx={{
                                ...sectionTitle,
                                mt: 3,
                                mb: 1.5,
                            }}
                        >
                            {t("footer.publishing")}
                        </Typography>

                        <Stack spacing={1.5}>
                            {publishLinks.map((item) => (
                                <FooterLink
                                    key={item.path}
                                    to={item.path}
                                >
                                    {t(`footer.links.${item.label}`)}
                                </FooterLink>
                            ))}
                        </Stack>

                        {/* Contact information */}
                        <Stack spacing={1.5} sx={{ mt: 3 }}>
                            <Stack
                                direction="row"
                                spacing={1} sx={{ alignItems: "flex-start" }}
                            >
                                <EmailOutlined sx={contactIcon} />

                                <Box
                                    component="a"
                                    href="mailto:eltariq37@gmail.com"
                                    sx={{
                                        color: "text.secondary",
                                        fontSize: "0.8125rem",
                                        textDecoration: "none",
                                        overflowWrap: "anywhere",
                                        transition: "color 0.2s ease",
                                        "&:hover": {
                                            color: "primary.main",
                                        },
                                    }}
                                >
                                    eltariq37@gmail.com
                                </Box>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1} sx={{ alignItems: "center" }}
                            >
                                <LocationOnOutlined sx={contactIcon} />

                                <Typography sx={contactText}>
                                    {t("footer.location")}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Box>

                <Divider
                    sx={{
                        my: 4,
                        borderColor: "#E2E8F0",
                    }}
                />

                {/* Bottom section */}
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2} sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
                >
                    <Typography sx={bottomText}>
                        © {new Date().getFullYear()} MultiServices.{" "}
                        {t("footer.rightsReserved")}
                    </Typography>

                    <Typography sx={bottomText}>
                        {t("footer.motto")}
                    </Typography>

                    <Typography sx={bottomText}>
                        {t("footer.madeWithCare")}
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
}

const sectionTitle = {
    fontSize: "0.9375rem",
    fontWeight: 700,
    color: "text.primary",
    mb: 2.5,
};

const contactIcon = {
    fontSize: 18,
    color: "primary.main",
    flexShrink: 0,
};

const contactText = {
    fontSize: "0.875rem",
    color: "text.secondary",
};

const bottomText = {
    fontSize: "0.8125rem",
    color: "text.secondary",
};
