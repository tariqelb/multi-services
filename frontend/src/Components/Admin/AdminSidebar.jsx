// src/Components/Admin/AdminSidebar.jsx
//
// Sidebar of the admin panel (opened from the admin icon of the main bar):
// one group per area (Account, Property, Vehicles, other services) with the
// pages this user can open. Members only see the sections they were given;
// "View" marks a read-only section.

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Chip, Collapse, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import {
    AdminPanelSettingsOutlined,
    ArticleOutlined,
    BarChartOutlined,
    BusinessOutlined,
    Circle,
    DirectionsCarOutlined,
    EngineeringOutlined,
    ExpandLess,
    ExpandMore,
    FeedbackOutlined,
    HomeWorkOutlined,
    LocalShippingOutlined,
    LocalTaxiOutlined,
    ManageAccountsOutlined,
    PeopleAltOutlined,
    PersonOutlined,
    AddLinkOutlined,
    VideoLibraryOutlined,
    VisibilityOutlined,
} from "@mui/icons-material";

import { ADMIN_GROUPS, adminItemForPath, useAdminAccess } from "./adminSections";

const ICONS = {
    account: PersonOutlined,
    property: HomeWorkOutlined,
    vehicles: DirectionsCarOutlined,
    dailyWorker: EngineeringOutlined,
    deliveryMan: LocalShippingOutlined,
    driver: LocalTaxiOutlined,
    servicesCompanies: BusinessOutlined,
    users: PeopleAltOutlined,
    visits: VisibilityOutlined,
    roles: ManageAccountsOutlined,
    statistics: BarChartOutlined,
    externalListings: AddLinkOutlined,
    knowledge: VideoLibraryOutlined,
    publications: ArticleOutlined,
    feedback: FeedbackOutlined,
};

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const { t, i18n } = useTranslation();
    const access = useAdminAccess();

    const isRTL = (i18n.resolvedLanguage || i18n.language || "en").startsWith("ar");
    const activeItem = adminItemForPath(location.pathname);

    // Groups with pages for this user; other services: "Soon".
    const groups = ADMIN_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => access.can(item.section)) })).filter(
        (group) => group.items.length > 0 || ADMIN_GROUPS.find((source) => source.id === group.id).items.length === 0
    );

    const [closed, setClosed] = useState({});
    const toggle = (id) => setClosed((previous) => ({ ...previous, [id]: !previous[id] }));

    // Close the mobile sidebar when clicking outside.
    useEffect(() => {
        if (!sidebarOpen) return undefined;
        const handleOutsideClick = (event) => {
            if (window.innerWidth >= 900) return;
            if (event.target.closest?.("[data-sidebar-toggle]")) return;
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) setSidebarOpen(false);
        };
        document.addEventListener("pointerdown", handleOutsideClick);
        return () => document.removeEventListener("pointerdown", handleOutsideClick);
    }, [sidebarOpen, setSidebarOpen]);

    const goTo = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <Box
            ref={sidebarRef}
            component="aside"
            dir={isRTL ? "rtl" : "ltr"}
            aria-label={t("adminPanel.title", "Admin panel")}
            sx={{
                width: "300px",
                minWidth: "300px",
                maxWidth: "85vw",
                flex: "0 0 290px",
                flexShrink: 0,
                bgcolor: "#0B2E5C",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: { xs: "fixed", md: "sticky" },
                top: "4rem",
                left: { xs: isRTL ? "auto" : 0, md: "auto" },
                right: { xs: isRTL ? 0 : "auto", md: "auto" },
                height: { xs: "calc(100dvh - 4rem)", md: "calc(100vh - 4rem)" },
                transform: {
                    xs: sidebarOpen ? "translateX(0)" : isRTL ? "translateX(100%)" : "translateX(-100%)",
                    md: "translateX(0)",
                },
                visibility: { xs: sidebarOpen ? "visible" : "hidden", md: "visible" },
                zIndex: { xs: 50, md: 20 },
                boxShadow: {
                    xs: sidebarOpen ? (isRTL ? "-2px 0 15px rgba(0,0,0,0.25)" : "2px 0 15px rgba(0,0,0,0.25)") : "none",
                    md: isRTL ? "-2px 0 5px rgba(0,0,0,0.1)" : "2px 0 5px rgba(0,0,0,0.1)",
                },
                transition: { xs: "transform 300ms ease, visibility 300ms ease", md: "none" },
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <Box sx={{ overflowY: "auto", overflowX: "hidden", py: 2, px: 2, flex: 1, minHeight: 0 }}>
                {/* Title */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1, pb: 2, mb: 1, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <AdminPanelSettingsOutlined sx={{ color: "#93C5FD" }} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{t("adminPanel.title", "Admin panel")}</Typography>
                        <Typography sx={{ color: "#93C5FD", fontSize: "0.72rem" }}>
                            {access.isAdmin ? t("adminPanel.roles.admin", "Administrator") : t("adminPanel.roles.member", "Team member")}
                        </Typography>
                    </Box>
                </Box>

                <List sx={{ px: 0, py: 0 }}>
                    {groups.map((group) => {
                        const GroupIcon = ICONS[group.icon];
                        const soon = group.items.length === 0;
                        const open = !closed[group.id];

                        return (
                            <Box key={group.id} sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    onClick={() => !soon && toggle(group.id)}
                                    disabled={soon}
                                    sx={{ borderRadius: "10px", py: 1, px: 1.25, "&:hover": { bgcolor: "rgba(255,255,255,0.08)" }, "&.Mui-disabled": { opacity: 0.55 } }}
                                >
                                    <ListItemIcon sx={{ color: "#93C5FD", minWidth: "34px" }}>
                                        <GroupIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t(group.labelKey, { defaultValue: group.label })}
                                        slotProps={{ primary: { sx: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#C9D6EA", textAlign: "start" } } }}
                                    />
                                    {soon ? (
                                        <Chip
                                            size="small"
                                            label={t("adminPanel.soon", "Soon")}
                                            sx={{ height: 20, fontSize: "0.65rem", color: "#C9D6EA", bgcolor: "rgba(255,255,255,0.1)" }}
                                        />
                                    ) : open ? (
                                        <ExpandLess sx={{ color: "#93C5FD" }} fontSize="small" />
                                    ) : (
                                        <ExpandMore sx={{ color: "#93C5FD" }} fontSize="small" />
                                    )}
                                </ListItemButton>

                                {!soon && (
                                    <Collapse in={open} timeout="auto" unmountOnExit>
                                        <List sx={{ py: 0.5, paddingInlineStart: "12px", borderInlineStart: "1px solid rgba(255,255,255,0.12)", marginInlineStart: "18px" }}>
                                            {group.items.map((item) => {
                                                const active = activeItem?.path === item.path;
                                                const Icon = ICONS[item.icon] || ArticleOutlined;
                                                const readOnly = access.level(item.section) === "read";

                                                return (
                                                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                                        <ListItemButton
                                                            onClick={() => goTo(item.path)}
                                                            selected={active}
                                                            sx={{
                                                                borderRadius: "10px",
                                                                py: 1.1,
                                                                bgcolor: active ? "#2563EB" : "transparent",
                                                                "&.Mui-selected": { bgcolor: "#2563EB" },
                                                                "&.Mui-selected:hover": { bgcolor: "#1D4ED8" },
                                                                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ color: "#ffffff", minWidth: "34px" }}>
                                                                <Icon fontSize="small" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={t(item.labelKey, { defaultValue: item.label })}
                                                                slotProps={{ primary: { sx: { fontSize: "0.875rem", fontWeight: active ? 600 : 400, textAlign: "start" } } }}
                                                            />
                                                            {readOnly && (
                                                                <Chip
                                                                    size="small"
                                                                    label={t("adminPanel.view", "View")}
                                                                    sx={{ height: 20, fontSize: "0.65rem", color: "#0B2E5C", bgcolor: "#BFDBFE", fontWeight: 700 }}
                                                                />
                                                            )}
                                                        </ListItemButton>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>
                                )}
                            </Box>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, bgcolor: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                    <Circle sx={{ width: 10, height: 10, color: "#10b981" }} />
                    <Typography variant="caption" sx={{ color: "#C9D6EA", fontWeight: 300 }}>
                        {t("sidebar.systemsOnline", { defaultValue: "All systems operational" })}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
