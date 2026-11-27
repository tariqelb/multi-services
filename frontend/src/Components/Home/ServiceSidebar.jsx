// /home/tariq/multi-services/app/frontend/src/Components/Home/ServiceSidebar.jsx
import { useEffect, useRef } from "react";

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
    DescriptionOutlined,
    Circle,
    DirectionsCarOutlined,
    CloudUpload,
    BuildOutlined,
    LibraryBooksOutlined,
    TwoWheelerOutlined,
    TravelExplore,
    NotificationsActiveOutlined,
    ReviewsOutlined,
    BookmarksOutlined,
    PostAddOutlined,
    CampaignOutlined,
    ListAltOutlined,
    ManageSearch,
    Public,
    DashboardOutlined,
    HomeWorkOutlined,
    BusinessCenterOutlined,
    EngineeringOutlined,
    LocalShippingOutlined,
    LocalTaxiOutlined,
    ManageAccountsOutlined,
} from "@mui/icons-material";

// Icons for the service items (items[].icon).
const ITEM_ICONS = {
    browse: DirectionsCarOutlined,
    // Same icon as "Publish a property" / "Publish an establishment".
    publish: CloudUpload,
    mine: LibraryBooksOutlined,
    browseMoto: TwoWheelerOutlined,
    publishMoto: CloudUpload,
    parts: BuildOutlined,
    search: ManageSearch,
    // Same icon as the property "Find by map".
    map: TravelExplore,
    alerts: NotificationsActiveOutlined,
    reviews: ReviewsOutlined,
    saved: BookmarksOutlined,
    postRequest: PostAddOutlined,
    requestBoard: CampaignOutlined,
    myRequests: ListAltOutlined,
    // Same icon as the property "External listing".
    external: Public,
    // Dashboard sidebar
    dashboard: DashboardOutlined,
    aboutProperty: HomeWorkOutlined,
    aboutCompanies: BusinessCenterOutlined,
    aboutWorker: EngineeringOutlined,
    // Daily worker
    worker: EngineeringOutlined,
    workerProfile: ManageAccountsOutlined,
    aboutDelivery: LocalShippingOutlined,
    aboutDriver: LocalTaxiOutlined,
    aboutAccount: ManageAccountsOutlined,
};

import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ServiceSidebar({
    sidebarOpen,
    setSidebarOpen,
    title,
    descriptionPath,
    translationKey,
    items = [],
    itemsFirst = false,
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

    // Close the mobile sidebar when clicking outside.
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

    const descriptionLabel = t(
        `${translationKey}.sidebar.description`,
        { defaultValue: "Description" }
    );

    // No description entry when descriptionPath is empty (dashboard sidebar).
    const isActive =
        Boolean(descriptionPath) &&
        (location.pathname === descriptionPath ||
            location.pathname.startsWith(`${descriptionPath}/`));

    const goTo = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    const handleNavigation = () => goTo(descriptionPath);

    // Service pages: exact match, or the path and its sub-pages.
    const isItemActive = (item) =>
        item.exact
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

    const serviceItems = items.map((item) => {
                        const active = isItemActive(item);
                        const Icon = ITEM_ICONS[item.icon] || DescriptionOutlined;

                        return (
                            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    onClick={() => goTo(item.path)}
                                    selected={active}
                                    sx={{
                                        borderRadius: "10px",
                                        bgcolor: active ? "#2563EB" : "transparent",
                                        "&.Mui-selected": { bgcolor: "#2563EB" },
                                        "&.Mui-selected:hover": { bgcolor: "#1D4ED8" },
                                        "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                                        py: 1.3,
                                        minWidth: 0,
                                    }}
                                >
                                    <ListItemIcon sx={{ color: "#ffffff", minWidth: "35px" }}>
                                        <Icon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t(item.labelKey, { defaultValue: item.label })}
                                        slotProps={{
                                            primary: {
                                                sx: {
                                                    fontSize: "0.875rem",
                                                    fontWeight: active ? 600 : 400,
                                                    textAlign: "start",
                                                },
                                            },
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    });

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
                {/* Service title */}
                <Typography
                    sx={{
                        color: "#93C5FD",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        px: 2,
                        pb: 2,
                    }}
                >
                    {title}
                </Typography>

                {/* Description navigation */}
                <List sx={{ px: 0, py: 0 }}>
                    {itemsFirst && serviceItems}

                    {descriptionPath && (
                    <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            onClick={handleNavigation}
                            selected={isActive}
                            sx={{
                                borderRadius: "10px",
                                bgcolor: isActive
                                    ? "#2563EB"
                                    : "transparent",

                                "&.Mui-selected": {
                                    bgcolor: "#2563EB",
                                },

                                "&.Mui-selected:hover": {
                                    bgcolor: "#1D4ED8",
                                },

                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.08)",
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
                                <DescriptionOutlined />
                            </ListItemIcon>

                            <ListItemText
                                primary={descriptionLabel} slotProps={{ primary: { sx: {
                                    fontSize: "0.875rem",
                                    fontWeight: isActive ? 600 : 400,
                                    textAlign: "start",
                                } } }}
                            />
                        </ListItemButton>
                    </ListItem>
                    )}

                    {!itemsFirst && serviceItems}
                </List>
            </Box>

            {/* Sidebar footer */}
            <Box
                sx={{
                    p: 2,
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    flexShrink: 0,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        bgcolor: "rgba(0,0,0,0.2)",
                        borderRadius: "8px",
                    }}
                >
                    <Circle
                        sx={{
                            width: 10,
                            height: 10,
                            color: "#10b981",
                        }}
                    />

                    <Typography
                        variant="caption"
                        sx={{
                            color: "#C9D6EA",
                            fontWeight: 300,
                        }}
                    >
                        {t("sidebar.systemsOnline", {
                            defaultValue: "All systems operational",
                        })}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
