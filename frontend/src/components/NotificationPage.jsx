
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
    Tooltip,
} from "@mui/material";

import NotificationsNone from "@mui/icons-material/NotificationsNone";
import NotificationsActive from "@mui/icons-material/NotificationsActive";
import DoneAll from "@mui/icons-material/DoneAll";
import Visibility from "@mui/icons-material/Visibility";

import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { socket } from "../Socket/Socket";

import PageLayout from "./PageLayout";
import StatusBadge from "./StatusBadge";

const API_URL = "/notifications";

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axiosInstance.get(API_URL);

            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("notifications.errors.load")
            );
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchNotifications();

        const handleNewNotification = (notification) => {
            setNotifications((previous) => {
                if (
                    previous.some(
                        (item) => item._id === notification._id
                    )
                ) {
                    return previous;
                }

                return [notification, ...previous].slice(0, 50);
            });

            if (!notification.isRead) {
                setUnreadCount((count) => count + 1);
            }
        };

        socket.on("notification:new", handleNewNotification);

        return () => {
            socket.off("notification:new", handleNewNotification);
        };
    }, [fetchNotifications]);

    const handleMarkAsRead = async (notification) => {
        if (notification.isRead) return true;

        try {
            await axiosInstance.patch(
                `${API_URL}/${notification._id}/read`
            );

            setNotifications((previous) =>
                previous.map((item) =>
                    item._id === notification._id
                        ? { ...item, isRead: true }
                        : item
                )
            );

            setUnreadCount((count) => Math.max(0, count - 1));
            return true;
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("notifications.errors.markRead")
            );
            return false;
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        setMarkingAll(true);
        setError("");

        try {
            await axiosInstance.patch(`${API_URL}/read-all`);

            setNotifications((previous) =>
                previous.map((item) => ({
                    ...item,
                    isRead: true,
                }))
            );

            setUnreadCount(0);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("notifications.errors.markAllRead")
            );
        } finally {
            setMarkingAll(false);
        }
    };

    const handleDelete = async (notification) => {
        setBusyId(notification._id);
        setError("");

        try {
            await axiosInstance.delete(
                `${API_URL}/${notification._id}`
            );

            setNotifications((previous) =>
                previous.filter(
                    (item) => item._id !== notification._id
                )
            );

            if (!notification.isRead) {
                setUnreadCount((count) => Math.max(0, count - 1));
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("notifications.errors.delete")
            );
        } finally {
            setBusyId(null);
        }
    };

    const handleView = async (notification) => {
        const marked = await handleMarkAsRead(notification);

        if (!marked) return;

        if (notification.link) {
            navigate(notification.link);
        }
    };

    const formatDate = (date) => {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "";

        const localeMap = {
            en: "en-GB",
            fr: "fr-FR",
            ar: "ar-MA",
        };

        const currentLanguage = i18n.language?.split("-")[0];
        const locale = localeMap[currentLanguage] || "en-GB";

        return parsedDate.toLocaleString(locale, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <PageLayout
            title={t("notifications.title")}
            subtitle={t("notifications.subtitle")}
            icon={
                <NotificationsActive
                    color="primary"
                    sx={{ fontSize: 32 }}
                />
            }
            action={
                <Button
                    variant="outlined"
                    startIcon={
                        markingAll ? (
                            <CircularProgress size={16} />
                        ) : (
                            <DoneAll />
                        )
                    }
                    disabled={unreadCount === 0 || markingAll}
                    onClick={handleMarkAllAsRead}
                    sx={{
                        width: "auto",
                        minWidth: 0,
                        height: { xs: 36, sm: 40 },
                        px: { xs: 1.5, sm: 2 },
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}
                >
                    {markingAll
                        ? t("notifications.updating")
                        : t("notifications.markAllRead")}
                </Button>
            }
        >
            {/* Summary */}
            <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 3 }}
            >
                <StatusBadge
                    icon={<NotificationsNone />}
                    label={t("notifications.totalCount", {
                        count: notifications.length,
                    })}
                />

                <StatusBadge
                    label={t("notifications.unreadCount", {
                        count: unreadCount,
                    })}
                    tone={unreadCount > 0 ? "info" : "neutral"}
                />
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        borderRadius: "10px",
                        overflowWrap: "anywhere",
                    }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={fetchNotifications}
                        >
                            {t("notifications.retry")}
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 10,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : notifications.length === 0 ? (
                <Card
                    sx={{
                        textAlign: "center",
                        py: { xs: 5, sm: 9 },
                        px: 3,
                    }}
                >
                    <NotificationsNone
                        sx={{
                            fontSize: 56,
                            color: "text.secondary",
                            mb: 1.5,
                        }}
                    />

                    <Typography variant="h6">
                        {t("notifications.emptyTitle")}
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        {t("notifications.emptySubtitle")}
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={fetchNotifications}
                        sx={{ mt: 3 }}
                    >
                        {t("notifications.refresh")}
                    </Button>
                </Card>
            ) : (
                <Stack spacing={2}>
                    {notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderColor: notification.isRead
                                    ? "divider"
                                    : "#BFDBFE",
                                bgcolor: notification.isRead
                                    ? "background.paper"
                                    : "#F5F9FF",
                            }}
                        >
                            <Stack
                                direction={{
                                    xs: "column",
                                    sm: "row",
                                }}
                                justifyContent="space-between"
                                alignItems={{
                                    xs: "stretch",
                                    sm: "flex-start",
                                }}
                                spacing={2}
                            >
                                <Box
                                    sx={{
                                        minWidth: 0,
                                        flexGrow: 1,
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{ mb: 0.75 }}
                                    >
                                        <StatusBadge
                                            label={
                                                notification.isRead
                                                    ? t("notifications.read")
                                                    : t("notifications.new")
                                            }
                                            tone={
                                                notification.isRead
                                                    ? "neutral"
                                                    : "info"
                                            }
                                        />

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {formatDate(
                                                notification.createdAt
                                            )}
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontSize: "1.0625rem",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {notification.title}
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.5,
                                            lineHeight: 1.6,
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {notification.message}
                                    </Typography>
                                </Box>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    flexWrap="wrap"
                                    useFlexGap
                                    sx={{ flexShrink: 0 }}
                                >
                                    {!notification.isRead && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<DoneAll />}
                                            aria-label={t(
                                                "notifications.markRead"
                                            )}
                                            onClick={() =>
                                                handleMarkAsRead(
                                                    notification
                                                )
                                            }
                                            sx={{
                                                minWidth: "auto",
                                                height: 36,
                                                px: 1.5,
                                                borderRadius: "8px",
                                                textTransform: "none",
                                                fontWeight: 600,
                                                fontSize: "0.8rem",
                                                whiteSpace: "nowrap",
                                                color: "primary.main",
                                                borderColor: "#BFDBFE",
                                                "&:hover": {
                                                    borderColor: "primary.main",
                                                    backgroundColor: "action.hover",
                                                },
                                            }}
                                        >
                                            {t("notifications.markRead")}
                                        </Button>
                                    )}

                                        
                                    {notification.link && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<Visibility />}
                                            onClick={() => handleView(notification)}
                                            sx={{
                                                width: "auto",
                                                minWidth: 90,
                                                height: 40,
                                                minHeight: 40,
                                                maxHeight: 40,
                                                px: 1.5,
                                                py: 0,
                                                borderRadius: "8px",
                                                boxSizing: "border-box",
                                                textTransform: "none",
                                                fontWeight: 600,
                                                fontSize: "0.8rem",
                                                whiteSpace: "nowrap",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {t("notifications.view")}
                                        </Button>
                                    )}

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        aria-label={t("notifications.delete")}
                                        disabled={busyId === notification._id}
                                        onClick={() => handleDelete(notification)}
                                        sx={{
                                            width: "auto",
                                            minWidth: 90,
                                            height: 40,
                                            minHeight: 40,
                                            maxHeight: 40,
                                            px: 1.5,
                                            py: 0,
                                            borderRadius: "8px",
                                            boxSizing: "border-box",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            fontSize: "0.8rem",
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                            borderColor: "#F0B8B8",
                                        }}
                                    >
                                        {busyId === notification._id ? (
                                            <CircularProgress size={18} />
                                        ) : (
                                            t("notifications.delete")
                                        )}
                                    </Button>

                                </Stack>
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            )}
        </PageLayout>
    );
}
