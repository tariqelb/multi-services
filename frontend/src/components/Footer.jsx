
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
import footerBackground from "../assets/Login_backgound.jpeg";
import {
    HomeRounded,
    DirectionsCarRounded,
    HandymanRounded,
    LocalShippingRounded,
    FacebookRounded,
    Instagram,
    LinkedIn,
    X,
    LocationOnOutlined,
    EmailOutlined,
} from "@mui/icons-material";

import logo from "../assets/iconlogo.png";

const services = [
    { label: "realEstate", icon: <HomeRounded />, path: "/properties" },
    { label: "cars", icon: <DirectionsCarRounded />, path: "/cars" },
    { label: "services", icon: <HandymanRounded />, path: "/services" },
    { label: "deliveryTransport", icon: <LocalShippingRounded />, path: "/transport" },
];

const quickLinks = [
    { label: "dashboard", path: "/" },
    { label: "browseProperties", path: "/properties" },
    { label: "savedProperties", path: "/saved" },
    { label: "myPublications", path: "/mypublication" },
    { label: "publishAd", path: "/properties/publish" },
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
                            alignItems="center"
                            spacing={1.5}
                            sx={{ mb: 2, textDecoration: "none", width: "fit-content" }}
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
                                    alt="MultiService logo"
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
                                MultiService
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
                                        bgcolor: "#F4F7FB",
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
                                <FooterLink key={item.path} to={item.path}>
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
                                    alignItems="center"
                                    spacing={1}
                                >
                                    <Box
                                        sx={{
                                            color: "primary.main",
                                            display: "flex",
                                            "& svg": { fontSize: 20 },
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

                    {/* Support */}
                    <Box>
                        <Typography sx={sectionTitle}>
                            {t("footer.accountSupport")}
                        </Typography>

                        <Stack spacing={1.5}>
                            {supportLinks.map((item) => (
                                <FooterLink key={item.path} to={item.path}>
                                    {t(`footer.links.${item.label}`)}
                                </FooterLink>
                            ))}
                        </Stack>

                        <Stack spacing={1.5} sx={{ mt: 3 }}>
                            {/* Support email */}
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="flex-start"
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

                            {/* Location */}
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <LocationOnOutlined sx={contactIcon} />
                                <Typography sx={contactText}>
                                    {t("footer.location")}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Box>

                <Divider sx={{ my: 4, borderColor: "#E2E8F0" }} />

                {/* Bottom section */}
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Typography sx={bottomText}>
                        © {new Date().getFullYear()} MultiService. {t("footer.rightsReserved")}
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
