// Layout of the public pages (About, Contact, Privacy, Terms):
// readable without logging in.

import { useEffect } from "react";
import { Link as RouterLink, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Box, Button, Container, Stack } from "@mui/material";

import logo from "../../../assets/iconlogo.png";
import Footer from "../Footer/Footer";
import LoginLanguageSwitcher from "../language/LoginLanguageSwitcher";
import { getInfoContent } from "./infoContent";

export default function PublicLayout() {
    const { i18n } = useTranslation();
    const { pathname } = useLocation();
    const info = getInfoContent(i18n.resolvedLanguage || i18n.language);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);

    const links = [
        ["/about", info.nav.about],
        ["/contact", info.nav.contact],
        ["/privacy", info.nav.privacy],
        ["/terms", info.nav.terms],
    ];

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
            <Box
                component="header"
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Container maxWidth="lg" sx={{ py: 1.25 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Box
                            component={RouterLink}
                            to="/about"
                            sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", color: "text.primary", flexShrink: 0 }}
                        >
                            <Box component="img" src={logo} alt="" sx={{ width: 34, height: 34 }} />
                            <Box component="span" sx={{ fontWeight: 800, fontSize: "1.1rem", display: { xs: "none", sm: "inline" } }}>
                                MultiServices
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <LoginLanguageSwitcher />
                            <Button component={RouterLink} to="/" variant="contained" size="small" sx={{ whiteSpace: "nowrap" }}>
                                {info.nav.openApp}
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Page links */}
                    <Stack
                        direction="row"
                        component="nav"
                        sx={{
                            mt: 1,
                            gap: 0.5,
                            overflowX: "auto",
                            scrollbarWidth: "none",
                            "&::-webkit-scrollbar": { display: "none" },
                        }}
                    >
                        {links.map(([to, label]) => (
                            <Button
                                key={to}
                                component={NavLink}
                                to={to}
                                size="small"
                                sx={{
                                    flexShrink: 0,
                                    color: "text.secondary",
                                    fontWeight: 600,
                                    "&.active": { color: "primary.main", bgcolor: "action.selected" },
                                }}
                            >
                                {label}
                            </Button>
                        ))}
                    </Stack>
                </Container>
            </Box>

            <Box component="main" sx={{ flex: 1 }}>
                <Outlet />
            </Box>

            <Footer />
        </Box>
    );
}
