import React, { useCallback, useEffect, useState } from "react";
import {
    Badge,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";

import NotificationsNone from "@mui/icons-material/NotificationsNone";
import NotificationsActive from "@mui/icons-material/NotificationsActive";
import DoneAll from "@mui/icons-material/DoneAll";
import Delete from "@mui/icons-material/Delete";
import Circle from "@mui/icons-material/Circle";

import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { socket } from "../Socket/Socket";

const API_URL = "/notifications";

export default function NotificationMenu() {
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const open = Boolean(anchorEl);

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

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (notification) => {
        if (notification.isRead) return;

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
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to update notification."
            );
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axiosInstance.patch(`${API_URL}/read-all`);

            setNotifications((previous) =>
                previous.map((item) => ({
                    ...item,
                    isRead: true,
                }))
            );

            setUnreadCount(0);
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to update notifications."
            );
        }
    };

    const handleDelete = async (event, notificationId) => {
        event.stopPropagation();

        try {
            const notification = notifications.find(
                (item) => item._id === notificationId
            );

            await axiosInstance.delete(
                `${API_URL}/${notificationId}`
            );

            setNotifications((previous) =>
                previous.filter((item) => item._id !== notificationId)
            );

            if (notification && !notification.isRead) {
                setUnreadCount((count) => Math.max(0, count - 1));
            }

            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to delete notification."
            );
        }
    };

    const handleNotificationClick = async (notification) => {
        await handleMarkAsRead(notification);
        handleClose();

        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    color="inherit"
                    onClick={handleOpen}
                    aria-label={`Notifications, ${unreadCount} unread`}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={99}
                        overlap="circular"
                    >
                        {unreadCount > 0 ? (
                            <NotificationsActive />
                        ) : (
                            <NotificationsNone />
                        )}
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: 320, sm: 390 },
                            maxWidth: "calc(100vw - 24px)",
                            maxHeight: 480,
                            mt: 1,
                            borderRadius: 2,
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                    }}
                >
                    <Box>
                        <Typography fontWeight={800}>
                            Notifications
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {unreadCount} unread
                        </Typography>
                    </Box>

                    <Tooltip title="Mark all as read">
                        <span>
                            <IconButton
                                size="small"
                                onClick={handleMarkAllAsRead}
                                disabled={unreadCount === 0}
                                aria-label="Mark all notifications as read"
                            >
                                <DoneAll fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>

                <Divider />

                {error && (
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                        <Button size="small" onClick={fetchNotifications}>
                            Retry
                        </Button>
                    </Box>
                )}

                {loading && notifications.length === 0 ? (
                    <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={26} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Stack
                        alignItems="center"
                        spacing={1}
                        sx={{ py: 5, px: 2 }}
                    >
                        <NotificationsNone
                            sx={{ fontSize: 38, color: "text.disabled" }}
                        />
                        <Typography fontWeight={600}>
                            You're all caught up
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                        >
                            New notifications will appear here.
                        </Typography>
                    </Stack>
                ) : (
                    <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
                        {notifications.map((notification) => (
                            <MenuItem
                                key={notification._id}
                                onClick={() =>
                                    handleNotificationClick(notification)
                                }
                                sx={{
                                    alignItems: "flex-start",
                                    whiteSpace: "normal",
                                    py: 1.5,
                                    px: 2,
                                    gap: 1.25,
                                    bgcolor: notification.isRead
                                        ? "background.paper"
                                        : "action.hover",
                                }}
                            >
                                <Circle
                                    sx={{
                                        fontSize: 9,
                                        mt: 0.9,
                                        flexShrink: 0,
                                        color: notification.isRead
                                            ? "transparent"
                                            : "primary.main",
                                    }}
                                />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={
                                            notification.isRead ? 500 : 800
                                        }
                                    >
                                        {notification.title}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.5,
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {notification.message}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.disabled"
                                        sx={{ display: "block", mt: 0.75 }}
                                    >
                                        {new Date(
                                            notification.createdAt
                                        ).toLocaleString()}
                                    </Typography>
                                </Box>

                                <Tooltip title="Delete notification">
                                    <IconButton
                                        size="small"
                                        aria-label="Delete notification"
                                        onClick={(event) =>
                                            handleDelete(
                                                event,
                                                notification._id
                                            )
                                        }
                                        sx={{ mt: -0.5 }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </MenuItem>
                        ))}
                    </Box>
                )}
            </Menu>
        </>
    );
}