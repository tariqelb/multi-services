import React, { useCallback, useEffect, useState } from "react";
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
                    "Unable to load notifications."
            );
        } finally {
            setLoading(false);
        }
    }, []);

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
                    "Unable to mark notification as read."
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
                    "Unable to mark notifications as read."
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
                    "Unable to delete notification."
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

        return parsedDate.toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <PageLayout
            title="Notifications"
            subtitle="Stay updated with your property alerts and activity."
            icon={<NotificationsActive color="primary" sx={{ fontSize: 32 }} />}
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
                >
                    {markingAll ? "Updating..." : "Mark all as read"}
                </Button>
            }
        >
            {/* Summary */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                <StatusBadge
                    icon={<NotificationsNone />}
                    label={`${notifications.length} notifications`}
                />
                <StatusBadge
                    label={`${unreadCount} unread`}
                    tone={unreadCount > 0 ? "info" : "neutral"}
                />
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3, borderRadius: "10px", overflowWrap: "anywhere" }}
                    action={
                        <Button color="inherit" size="small" onClick={fetchNotifications}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                    <CircularProgress />
                </Box>
            ) : notifications.length === 0 ? (
                <Card sx={{ textAlign: "center", py: { xs: 5, sm: 9 }, px: 3 }}>
                    <NotificationsNone sx={{ fontSize: 56, color: "text.secondary", mb: 1.5 }} />

                    <Typography variant="h6">You're all caught up</Typography>

                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        New notifications will appear here when a property
                        matches your alerts.
                    </Typography>

                    <Button variant="outlined" onClick={fetchNotifications} sx={{ mt: 3 }}>
                        Refresh notifications
                    </Button>
                </Card>
            ) : (
                <Stack spacing={2}>
                    {notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderColor: notification.isRead ? "divider" : "#BFDBFE",
                                bgcolor: notification.isRead ? "background.paper" : "#F5F9FF",
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "stretch", sm: "flex-start" }}
                                spacing={2}
                            >
                                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                                        <StatusBadge
                                            label={notification.isRead ? "Read" : "New"}
                                            tone={notification.isRead ? "neutral" : "info"}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(notification.createdAt)}
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="h6"
                                        sx={{ fontSize: "1.0625rem", overflowWrap: "anywhere" }}
                                    >
                                        {notification.title}
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                        sx={{ mt: 0.5, lineHeight: 1.6, overflowWrap: "anywhere" }}
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
                                        <Tooltip title="Mark as read">
                                            <IconButton
                                                aria-label="Mark as read"
                                                onClick={() => handleMarkAsRead(notification)}
                                                sx={{
                                                    color: "primary.main",
                                                    border: "1px solid #BFDBFE",
                                                    borderRadius: "10px",
                                                    width: 44,
                                                    height: 40,
                                                }}
                                            >
                                                <DoneAll />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {notification.link && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<Visibility />}
                                            onClick={() => handleView(notification)}
                                        >
                                            View
                                        </Button>
                                    )}

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        aria-label="Delete notification"
                                        disabled={busyId === notification._id}
                                        onClick={() => handleDelete(notification)}
                                        sx={{ borderColor: "#F0B8B8" }}
                                    >
                                        {busyId === notification._id ? (
                                            <CircularProgress size={20} />
                                        ) : (
                                            "Delete"
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
