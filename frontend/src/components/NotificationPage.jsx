import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CircularProgress,
    Divider,
    IconButton,
    Stack,
    Typography,
    Chip,
    Tooltip,
} from "@mui/material";

import NotificationsNone from "@mui/icons-material/NotificationsNone";
import NotificationsActive from "@mui/icons-material/NotificationsActive";
import DoneAll from "@mui/icons-material/DoneAll";
import Visibility from "@mui/icons-material/Visibility";
import Circle from "@mui/icons-material/Circle";

import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { socket } from "../Socket/Socket";

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
        <Box
            sx={{
                width: "100%",
                maxWidth: 1200,
                minWidth: 0,
                mx: "auto",
                px: { xs: 1.5, sm: 3, md: 4 },
                py: { xs: 2.5, sm: 3, md: 5 },
                minHeight: "80vh",
                boxSizing: "border-box",
                overflowX: "clip",
            }}
        >
            {/* Page Header */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
                sx={{ mb: 3, minWidth: 0 }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.25}
                        sx={{ mb: 0.75, minWidth: 0 }}
                    >
                        <NotificationsActive
                            sx={{
                                fontSize: { xs: 27, sm: 32 },
                                flexShrink: 0,
                                color: "#059669",
                            }}
                        />

                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 900,
                                color: "#0f172a",
                                fontSize: {
                                    xs: "1.5rem",
                                    sm: "2rem",
                                },
                                overflowWrap: "anywhere",
                            }}
                        >
                            Notifications
                        </Typography>
                    </Stack>

                    <Typography
                        color="text.secondary"
                        sx={{
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                            overflowWrap: "anywhere",
                        }}
                    >
                        Stay updated with your property alerts and activity.
                    </Typography>
                </Box>

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
                        alignSelf: { xs: "flex-start", sm: "center" },
                        maxWidth: "100%",
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: "#cbd5e1",
                        color: "#0f172a",
                        borderRadius: 2,
                        px: { xs: 1.5, sm: 2 },
                        py: 1,
                        whiteSpace: "normal",
                    }}
                >
                    {markingAll ? "Updating..." : "Mark all as read"}
                </Button>
            </Stack>

            {/* Summary */}
            <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 3, minWidth: 0 }}
            >
                <Chip
                    icon={<NotificationsNone />}
                    label={`${notifications.length} notifications`}
                    sx={{
                        maxWidth: "100%",
                        bgcolor: "#f1f5f9",
                        color: "#334155",
                        fontWeight: 700,
                    }}
                />

                <Chip
                    label={`${unreadCount} unread`}
                    sx={{
                        maxWidth: "100%",
                        bgcolor: unreadCount > 0 ? "#dcfce7" : "#f1f5f9",
                        color: unreadCount > 0 ? "#15803d" : "#64748b",
                        fontWeight: 700,
                    }}
                />
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        minWidth: 0,
                        overflowWrap: "anywhere",
                    }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={fetchNotifications}
                        >
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            <Divider sx={{ mb: 3, borderColor: "#e2e8f0" }} />

            {/* Loading */}
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
                /* Empty State */
                <Card
                    variant="outlined"
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        borderRadius: 3,
                        borderColor: "#e2e8f0",
                        textAlign: "center",
                        py: { xs: 5, sm: 9 },
                        px: { xs: 2, sm: 3 },
                        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    }}
                >
                    <NotificationsNone
                        sx={{
                            fontSize: 58,
                            color: "#94a3b8",
                            mb: 1.5,
                        }}
                    />

                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            color: "#0f172a",
                            fontSize: { xs: "1.05rem", sm: "1.25rem" },
                        }}
                    >
                        You're all caught up
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{
                            mt: 1,
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                            overflowWrap: "anywhere",
                        }}
                    >
                        New notifications will appear here when a property
                        matches your alerts.
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={fetchNotifications}
                        sx={{
                            mt: 3,
                            textTransform: "none",
                            fontWeight: 700,
                            maxWidth: "100%",
                        }}
                    >
                        Refresh notifications
                    </Button>
                </Card>
            ) : (
                /* Notification Cards */
                <Stack spacing={2} sx={{ minWidth: 0, width: "100%" }}>
                    {notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            variant="outlined"
                            sx={{
                                position: "relative",
                                display: "flex",
                                flexDirection: {
                                    xs: "column",
                                    sm: "row",
                                },
                                width: "100%",
                                minWidth: 0,
                                boxSizing: "border-box",
                                borderRadius: 3,
                                borderColor: notification.isRead
                                    ? "#e2e8f0"
                                    : "#a7f3d0",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                overflow: "hidden",
                                bgcolor: notification.isRead
                                    ? "#ffffff"
                                    : "#f0fdf4",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    boxShadow:
                                        "0 8px 24px rgba(0,0,0,0.08)",
                                },
                            }}
                        >
                            {/* Left notification indicator */}
                            <Box
                                sx={{
                                    width: { xs: "100%", sm: 7 },
                                    height: { xs: 5, sm: "auto" },
                                    flexShrink: 0,
                                    bgcolor: notification.isRead
                                        ? "#e2e8f0"
                                        : "#059669",
                                }}
                            />

                            {/* Card Content */}
                            <Box
                                sx={{
                                    p: { xs: 1.5, sm: 2.5 },
                                    display: "flex",
                                    flexDirection: "column",
                                    flexGrow: 1,
                                    minWidth: 0,
                                    width: "100%",
                                    boxSizing: "border-box",
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
                                    spacing={1.5}
                                    sx={{ minWidth: 0 }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1.25,
                                            minWidth: 0,
                                            flexGrow: 1,
                                        }}
                                    >
                                        <Circle
                                            sx={{
                                                fontSize: 10,
                                                mt: 0.9,
                                                flexShrink: 0,
                                                color: notification.isRead
                                                    ? "#cbd5e1"
                                                    : "#059669",
                                            }}
                                        />

                                        <Box
                                            sx={{
                                                minWidth: 0,
                                                flexGrow: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "#64748b",
                                                    fontWeight: 600,
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {formatDate(
                                                    notification.createdAt
                                                )}
                                            </Typography>

                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: notification.isRead
                                                        ? 700
                                                        : 900,
                                                    color: "#0f172a",
                                                    mt: 0.5,
                                                    fontSize: {
                                                        xs: "1.05rem",
                                                        sm: "1.25rem",
                                                    },
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {notification.title}
                                            </Typography>

                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: "#475569",
                                                    mt: 1,
                                                    lineHeight: 1.7,
                                                    fontSize: {
                                                        xs: "0.9rem",
                                                        sm: "1rem",
                                                    },
                                                    overflowWrap: "anywhere",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {notification.message}
                                            </Typography>

                                            <Chip
                                                size="small"
                                                label={
                                                    notification.isRead
                                                        ? "Read"
                                                        : "New"
                                                }
                                                sx={{
                                                    mt: 1.5,
                                                    bgcolor: notification.isRead
                                                        ? "#f1f5f9"
                                                        : "#dcfce7",
                                                    color: notification.isRead
                                                        ? "#64748b"
                                                        : "#15803d",
                                                    fontWeight: 800,
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* Card Actions */}
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        justifyContent={{
                                            xs: "flex-start",
                                            sm: "flex-end",
                                        }}
                                        flexWrap="wrap"
                                        useFlexGap
                                        sx={{
                                            flexShrink: 0,
                                            minWidth: 0,
                                            maxWidth: "100%",
                                            pt: { xs: 1, sm: 0 },
                                        }}
                                    >
                                        {!notification.isRead && (
                                            <Tooltip title="Mark as read">
                                                <IconButton
                                                    aria-label="Mark as read"
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            notification
                                                        )
                                                    }
                                                    sx={{
                                                        color: "#059669",
                                                        border: "1px solid #a7f3d0",
                                                        borderRadius: 2,
                                                        width: {
                                                            xs: 42,
                                                            sm: 48,
                                                        },
                                                        height: 40,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <DoneAll />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {notification.link && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Visibility />}
                                                onClick={() =>
                                                    handleView(notification)
                                                }
                                                sx={{
                                                    textTransform: "none",
                                                    fontWeight: 700,
                                                    borderColor: "#cbd5e1",
                                                    color: "#334155",
                                                    whiteSpace: "nowrap",
                                                    minWidth: { xs: 90, sm: 110 },
                                                    height: 40,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                View
                                            </Button>
                                        )}

                                        <Tooltip title="Delete notification">
                                            <span>
                                                <IconButton
                                                    aria-label="Delete notification"
                                                    disabled={
                                                        busyId === notification._id
                                                    }
                                                    onClick={() =>
                                                        handleDelete(notification)
                                                    }
                                                    sx={{
                                                        color: "#dc2626",
                                                        border: "1px solid #fecaca",
                                                        borderRadius: 2,
                                                        fontSize: "0.875rem",
                                                        width: {
                                                            xs: 90,
                                                            sm: 110,
                                                        },
                                                        height: 40,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {busyId === notification._id ? (
                                                        <CircularProgress size={22} />
                                                    ) : (
                                                        <Box component="span">
                                                            Delete
                                                        </Box>
                                                    )}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
}