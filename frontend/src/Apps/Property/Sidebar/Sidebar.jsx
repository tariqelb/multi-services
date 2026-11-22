// /home/tariq/multi-services/app/frontend/src/Apps/Property/Sidebar/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@mui/material";

import {
    TravelExplore,
    Apartment,
    Hotel as HotelIcon,
    Home as HomeIcon,
    Settings as SettingsIcon,
    CloudUpload as CloudUploadIcon,
    NotificationsActive as NotificationsActiveIcon,
    RateReviewOutlined as RateReviewOutlinedIcon,
    DashboardOutlined as DashboardOutlinedIcon,
    Public as PublicIcon,
    AddLink as AddLinkIcon,
    PeopleAlt as PeopleAltIcon,
    MenuBook as MenuBookIcon,
    VideoLibrary as VideoLibraryIcon,
    ArticleOutlined as ArticleOutlinedIcon,
    FeedbackOutlined as FeedbackOutlinedIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    ArrowBack as ArrowBackIcon,
    ManageSearch as ManageSearchIcon,
    ReviewsOutlined as ReviewsOutlinedIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

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

    const [showAdminMenu, setShowAdminMenu] = useState(false);

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

    // Regular navigation items.
    const navigationItems = [
        // One search for every kind of listing, with a map.  
        {
            name: t("sidebar.properties"),
            icon: HomeWorkIcon,
            path: "/properties",
        },
        {
            name: t("sidebar.findRoommate"),
            icon: PeopleAltIcon,
            path: "/roommates",
        },
        {
            name: t("sidebar.furnishedProperties"),
            icon: Apartment,
            path: "/furnishedProperties",
        },
        {
            name: t("sidebar.establishments"),
            icon: HotelIcon,
            path: "/establishments",
        },
        {
            name: t("sidebar.externalListing"),
            icon: PublicIcon,
            path: "/externalListings",
        },
        {
            name: t("sidebar.search", "Search"),
            icon: ManageSearchIcon,
            path: "/search",
        },
        {
            name: t("sidebar.findbymap"),
            icon: TravelExplore,
            path: "/findbymap",
        },

        {
            name: t("sidebar.publish"),
            icon: CloudUploadIcon,
            path: "/properties/publish",
        },
        {
            name: t("sidebar.publishEstablishment"),
            icon: CloudUploadIcon,
            path: "/establishments/publish",
        },
        {
            name: t("sidebar.alert"),
            icon: NotificationsActiveIcon,
            path: "/alert",
        },
        // Publishers ranked by their reviews, before contacting one.
        {
            name: t("sidebar.reviews", "Reviews"),
            icon: ReviewsOutlinedIcon,
            path: "/reviews",
        },
        // {
        //     name: t("sidebar.feedback"),
        //     icon: RateReviewOutlinedIcon,
        //     path: "/feedback",
        // },
        // {
        //     name: t("sidebar.settings"),
        //     icon: SettingsIcon,
        //     path: "/setting",
        // },
        {
            name: t("sidebar.knowledge"),
            icon: MenuBookIcon,
            path: "/knowledge",
        },
    ];

    // Admin-only navigation items.
    const adminNavigationItems = [
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
        {
            name: t("sidebar.publicationReviews"),
            icon: ArticleOutlinedIcon,
            path: "/admin/publications",
        },
        {
            name: t("sidebar.feedbackReviews"),
            icon: FeedbackOutlinedIcon,
            path: "/admin/feedback",
        },
    ];

    // Display the appropriate menu.
    const displayedItems = showAdminMenu
        ? adminNavigationItems
        : navigationItems;

    const handleNavigation = (item) => {
        setActiveNav(item.name);
        setSidebarOpen(false);
        navigate(item.path);
    };

    const handleAdminToggle = () => {
        setShowAdminMenu((previous) => !previous);
    };

    const handleBackToMainMenu = () => {
        setShowAdminMenu(false);
    };

    return (
        <Box
            ref={sidebarRef}
            component="aside"
            dir={isRTL ? "rtl" : "ltr"}
            sx={{
                width: "300px",
                minWidth: "300px",
                maxWidth: "85vw",
                flex: "0 0 290px",
                flexShrink: 0,

                bgcolor: "#14539a",
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
            {/* Navigation area */}
            <Box
                sx={{
                    overflowY: "auto",
                    overflowX: "hidden",
                    py: 2,
                    px: 2,
                    flex: 1,
                    minHeight: 0,
                }}
            >
                {/* Admin menu header and Back button */}
                {showAdminMenu && (
                    <Box sx={{ mb: 2 }}>
                        <ListItemButton
                            onClick={handleBackToMainMenu}
                            sx={{
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.15)",
                                py: 1.3,
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.08)",
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: "#ffffff",
                                    minWidth: "35px",
                                }}
                            >
                                <ArrowBackIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary={t("sidebar.backToMainMenu", {
                                    defaultValue: "Back to main menu",
                                })} slotProps={{ primary: { sx: {
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                } } }}
                            />
                        </ListItemButton>

                        <Typography
                            sx={{
                                color: "#93C5FD",
                                fontSize: "0.60rem",
                                fontWeight: 700,
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                                px: 2,
                                pt: 3,
                                pb: 1,
                            }}
                        >
                            {t("sidebar.adminPanel", {
                                defaultValue: "Admin Panel",
                            })}
                        </Typography>
                    </Box>
                )}

                {/* Navigation items */}
                <List sx={{ px: 0, py: 0 }}>
                    {displayedItems.map((item) => {
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
                                    onClick={() => handleNavigation(item)}
                                    sx={{
                                        borderRadius: "10px",
                                        bgcolor: isActive
                                            ? "#2563EB"
                                            : "transparent",
                                        "&:hover": {
                                            bgcolor:
                                                "rgba(255,255,255,0.08)",
                                        },
                                        py: 1.3,
                                        minWidth: 0,
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: "#ffffff",
                                            minWidth: "35px",
                                        }}
                                    >
                                        <Icon />
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={item.name} slotProps={{ primary: { sx: {
                                            fontWeight: isActive ? 600 : 400,
                                            overflowWrap: "anywhere",
                                            textAlign: "start",
                                        } } }}
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
                {/* Admin panel toggle - administrators only */}
                {isAdmin && (
                    <ListItemButton
                        onClick={handleAdminToggle}
                        sx={{
                            mb: 2,
                            px: 2,
                            py: 1.5,
                            borderRadius: "10px",
                            bgcolor: showAdminMenu
                                ? "#2563EB"
                                : "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            "&:hover": {
                                bgcolor: showAdminMenu
                                    ? "#1D4ED8"
                                    : "rgba(255,255,255,0.14)",
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                color: "#ffffff",
                                minWidth: "40px",
                            }}
                        >
                            <AdminPanelSettingsIcon />
                        </ListItemIcon>

                        <ListItemText
                            primary={t("sidebar.adminPanel", {
                                defaultValue: "Admin Panel",
                            })} slotProps={{ primary: { sx: {
                                fontSize: "0.875rem",
                                fontWeight: 600,
                            } } }}
                        />

                        <Typography
                            sx={{
                                color: "#93C5FD",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                            }}
                        >
                            {showAdminMenu ? "ON" : "OFF"}
                        </Typography>
                    </ListItemButton>
                )}

                {/* System status */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
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