import React, { useEffect, useRef } from "react";

import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import SettingsIcon from "@mui/icons-material/Settings";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PublicIcon from "@mui/icons-material/Public";
import AddLinkIcon from "@mui/icons-material/AddLink";

import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";


import MenuBookIcon from "@mui/icons-material/MenuBook";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";


export default function Sidebar({
    sidebarOpen,
    setSidebarOpen,
    activeNav,
    setActiveNav,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);

    const { t, i18n } = useTranslation();

    const currentLanguage = (
        i18n.resolvedLanguage ||
        i18n.language ||
        "en"
    )
        .split("-")[0]
        .split("_")[0];

    const isRTL = currentLanguage === "ar";

    // Get the user's role from Redux.
    const role = useSelector(
        (state) =>
            state.profile?.role ||
            state.auth?.user?.role ||
            state.loginForm?.user?.role
    );

    const isAdmin = role?.toLowerCase() === "admin";

    // Close mobile sidebar when clicking outside.
    useEffect(() => {
        if (!sidebarOpen) return;

        const handleOutsideClick = (event) => {
            if (window.innerWidth >= 900) return;

            // Ignore clicks on the sidebar toggle button.
            if (event.target.closest?.("[data-sidebar-toggle]")) {
                return;
            }

            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target)
            ) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener("pointerdown", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "pointerdown",
                handleOutsideClick
            );
        };
    }, [sidebarOpen, setSidebarOpen]);

    const navigationItems = [
        {
            name: t("sidebar.home"),
            icon: HomeIcon,
            path: "/",
        },
        {
            name: t("sidebar.properties"),
            icon: HomeWorkIcon,
            path: "/properties",
        },
        {
            name: t("sidebar.externalListing"),
            icon: PublicIcon,
            path: "/externalListings",
        },
        {
            name: t("sidebar.findbymap"),
            icon: PublicIcon,
            path: "/findbymap",
        },
        {
            name: t("sidebar.publish"),
            icon: CloudUploadIcon,
            path: "/properties/publish",
        },
        {
            name: t("sidebar.myPublication"),
            icon: LibraryBooksIcon,
            path: "/mypublication",
        },
        {
            name: t("sidebar.saved"),
            icon: BookmarkIcon,
            path: "/saved",
        },
        {
            name: t("sidebar.alert"),
            icon: NotificationsActiveIcon,
            path: "/alert",
        },
        {
            name: t("sidebar.feedback"),
            icon: RateReviewOutlinedIcon,
            path: "/feedback",
        },
        {
            name: t("sidebar.settings"),
            icon: SettingsIcon,
            path: "/setting",
        },
        {
            name: t("sidebar.knowledge"),
            icon: MenuBookIcon,
            path: "/knowledge",
        },


        ...(isAdmin
            ?   [
                    {
                        name: t("sidebar.statistics"),
                        icon: DashboardOutlinedIcon,
                        path: "/dashboard",
                    },
                    {
                        name: t("sidebar.addExternalListing"),
                        icon: AddLinkIcon,
                        path: "/addexternalListings",
                    },
                    {
                        name: t("sidebar.knowledgeManagement"),
                        icon: VideoLibraryIcon,
                        path: "/admin/knowledge",
                    },
                ]
            : []),
    ];

    const handleNavigation = (item) => {
        setActiveNav(item.name);
        setSidebarOpen(false);
        navigate(item.path);
    };

    return (
        <Box
            ref={sidebarRef}
            component="aside"
            dir={isRTL ? "rtl" : "ltr"}
            sx={{
                width: "290px",
                minWidth: "290px",
                maxWidth: "85vw",
                flex: "0 0 290px",
                flexShrink: 0,

                bgcolor: "#0B2E5C",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",

                position: {
                    xs: "fixed",
                    md: "sticky",
                },
                top: "4rem",

                left: {
                    xs: isRTL ? "auto" : 0,
                    md: "auto",
                },
                right: {
                    xs: isRTL ? 0 : "auto",
                    md: "auto",
                },

                height: {
                    xs: "calc(100dvh - 4rem)",
                    md: "calc(100vh - 4rem)",
                },

                transform: {
                    xs: sidebarOpen
                        ? "translateX(0)"
                        : isRTL
                          ? "translateX(100%)"
                          : "translateX(-100%)",
                    md: "translateX(0)",
                },

                visibility: {
                    xs: sidebarOpen ? "visible" : "hidden",
                    md: "visible",
                },

                zIndex: {
                    xs: 50,
                    md: 20,
                },

                boxShadow: {
                    xs: sidebarOpen
                        ? isRTL
                            ? "-2px 0 15px rgba(0,0,0,0.25)"
                            : "2px 0 15px rgba(0,0,0,0.25)"
                        : "none",
                    md: isRTL
                        ? "-2px 0 5px rgba(0,0,0,0.1)"
                        : "2px 0 5px rgba(0,0,0,0.1)",
                },

                transition: {
                    xs: "transform 300ms ease, visibility 300ms ease",
                    md: "none",
                },

                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            {/* Navigation items */}
            <Box
                sx={{
                    overflowY: "auto",
                    overflowX: "hidden",
                    py: 2,
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <List sx={{ px: 2, py: 0 }}>
                    {navigationItems.map((item) => {
                        const Icon = item.icon;

                        const isActive =
                            location.pathname === item.path ||
                            (item.path !== "/" &&
                                location.pathname.startsWith(
                                    `${item.path}/`
                                ));

                        return (
                            <ListItem
                                key={item.path}
                                disablePadding
                                sx={{ mb: 1 }}
                            >
                                <ListItemButton
                                    onClick={() =>
                                        handleNavigation(item)
                                    }
                                    sx={{
                                        borderRadius: "10px",
                                        bgcolor: isActive
                                            ? "#2563EB"
                                            : "transparent",
                                        "&:hover": {
                                            bgcolor:
                                                "rgba(255,255,255,0.08)",
                                        },
                                        py: 1.5,
                                        minWidth: 0,
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: "#ffffff",
                                            minWidth: "40px",
                                        }}
                                    >
                                        <Icon />
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={item.name}
                                        primaryTypographyProps={{
                                            fontSize: "0.875rem",
                                            fontWeight: isActive ? 600 : 400,
                                            sx: {
                                                overflowWrap: "anywhere",
                                                textAlign: "start",
                                            },
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Sidebar footer */}
            <Box
                sx={{
                    p: 2,
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    flexShrink: 0,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1,
                        bgcolor: "rgba(0, 0, 0, 0.2)",
                        borderRadius: "8px",
                    }}
                >
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            flexShrink: 0,
                            bgcolor: "#10b981",
                            borderRadius: "50%",
                        }}
                    />

                    <Typography
                        variant="caption"
                        sx={{
                            color: "#C9D6EA",
                            fontWeight: 300,
                        }}
                    >
                        {t("sidebar.systemsOnline")}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}