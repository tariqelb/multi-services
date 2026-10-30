import React from "react";
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
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import { useNavigate } from "react-router-dom";

export default function Sidebar({
    sidebarOpen,
    setSidebarOpen,
    activeNav,
    setActiveNav,
}) {
    const navigate = useNavigate();

    const navigationItems = [
        { name: "Home", icon: HomeIcon, path: "/" },
        { name: "Properties", icon: HomeWorkIcon, path: "/properties" },
        { name: "Publish", icon: CloudUploadIcon, path: "/properties/publish" },
        { name: "My Publication", icon: LibraryBooksIcon, path: "/mypublication" },
        { name: "Saved", icon: BookmarkIcon, path: "/saved" },
        { name: "Alert", icon: NotificationsActiveIcon, path: "/alert" },
        {
            name: "Notifications",
            icon: NotificationsIcon,
            path: "/notificationpage",
        },
        {
            name: "Feedback",
            icon: RateReviewOutlinedIcon,
            path: "/feedback",
        },
        {
            name: "Dashboard",
            icon: DashboardOutlinedIcon,
            path: "/dashboard",
        },
        { name: "Settings", icon: SettingsIcon, path: "/setting" },
        {
            name: "External listing",
            icon: SettingsIcon,
            path: "/externalListings",
        },
        {
            name: "Add External listing",
            icon: SettingsIcon,
            path: "/addexternalListings",
        },
    ];

    const handleNavigation = (item) => {
        setActiveNav(item.name);
        setSidebarOpen(false);

        if (item.path) {
            navigate(item.path);
        }
    };

    return (
        <Box
            component="aside"
            sx={{
                width: "260px",
                minWidth: "260px",
                maxWidth: "85vw",
                flex: "0 0 260px",
                flexShrink: 0,

                bgcolor: "#0d3562",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",

                // Mobile: overlay the middle content.
                position: {
                    xs: "fixed",
                    md: "sticky",
                },
                top: {
                    xs: "4rem",
                    md: "4rem",
                },
                left: {
                    xs: 0,
                    md: "auto",
                },
                height: {
                    xs: "calc(100dvh - 4rem)",
                    md: "calc(100vh - 4rem)",
                },

                // Slide in/out on mobile; always visible on desktop.
                transform: {
                    xs: sidebarOpen
                        ? "translateX(0)"
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
                        ? "2px 0 15px rgba(0,0,0,0.25)"
                        : "none",
                    md: "2px 0 5px rgba(0,0,0,0.1)",
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
                <List sx={{ px: 2 }}>
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeNav === item.name;

                        return (
                            <ListItem
                                key={item.name}
                                disablePadding
                                sx={{ mb: 1 }}
                            >
                                <ListItemButton
                                    onClick={() => handleNavigation(item)}
                                    sx={{
                                        borderRadius: "12px",
                                        bgcolor: isActive
                                            ? "#0284c7"
                                            : "transparent",
                                        "&:hover": {
                                            bgcolor: "#14539a",
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
                                            fontSize: "0.95rem",
                                            fontWeight: isActive ? 600 : 400,
                                            sx: {
                                                overflowWrap: "anywhere",
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
                            color: "#cbd5e1",
                            fontWeight: 500,
                        }}
                    >
                        All systems online
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}