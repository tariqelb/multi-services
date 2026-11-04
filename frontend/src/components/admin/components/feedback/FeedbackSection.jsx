
import React, { useCallback, useEffect, useState } from "react";

import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Snackbar,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import axiosInstance from "../../../../api/axiosInstance";

import FeedbackList from "./FeedbackList";
import FeedbackDetails from "./FeedbackDetails";

export default function FeedbackSection() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    const [limit, setLimit] = useState("10");
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const showNotification = (message, severity = "success") => {
        setNotification({
            open: true,
            message,
            severity,
        });
    };

    const fetchFeedbacks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(
                "/feedback/admin-list",
                {
                    params: {
                        limit,
                        page: 1,
                    },
                }
            );

            const data = Array.isArray(response.data.feedbacks)
                ? response.data.feedbacks
                : [];

            setFeedbacks(data);
            setTotal(response.data.total || 0);

            setSelectedFeedback((previous) => {
                if (!data.length) return null;

                return (
                    data.find(
                        (item) => item._id === previous?._id
                    ) || data[0]
                );
            });
        } catch (err) {
            console.error(
                "Failed to fetch feedback:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load feedback submissions."
            );
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
    };

    const handleStatusUpdate = async (feedbackId, newStatus) => {
        try {
            const response = await axiosInstance.patch(
                `/feedback/${feedbackId}/status`,
                {
                    status: newStatus,
                }
            );

            const updatedFeedback = response.data.feedback;

            setFeedbacks((previous) =>
                previous.map((item) =>
                    item._id === feedbackId
                        ? {
                            ...item,
                            ...updatedFeedback,
                            userId: item.userId,
                            attachments: item.attachments,
                        }
                        : item
                )
            );

            setSelectedFeedback((previous) =>
                previous?._id === feedbackId
                    ? {
                        ...previous,
                        ...updatedFeedback,
                        userId: previous.userId,
                        attachments: previous.attachments,
                    }
                    : previous
            );

            showNotification(
                "Feedback status updated successfully."
            );

            return true;
        } catch (err) {
            console.error(
                "Failed to update feedback status:",
                err.response?.data || err
            );

            showNotification(
                err.response?.data?.message ||
                "Unable to update feedback status.",
                "error"
            );

            return false;
        }
    };

    return (
        <Box sx={{ width: "100%", minWidth: 0 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        color="#0f172a"
                    >
                        User Feedback
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Review feedback, bug reports, and user submissions.
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchFeedbacks}
                    disabled={loading}
                    sx={{
                        textTransform: "none",
                        fontWeight: 600,
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 8,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : feedbacks.length === 0 ? (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 8,
                        px: 2,
                        border: "1px dashed #cbd5e1",
                        borderRadius: 3,
                    }}
                >
                    <Typography fontWeight={600} color="#334155">
                        No feedback submissions yet
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        User feedback will appear here.
                    </Typography>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "minmax(0, 1fr)",
                            lg: "minmax(300px, 0.85fr) minmax(0, 1.5fr)",
                        },
                        gap: 2.5,
                        alignItems: "start",
                        minWidth: 0,
                    }}
                >
                    <FeedbackList
                        feedbacks={feedbacks}
                        selectedFeedback={selectedFeedback}
                        onSelect={setSelectedFeedback}
                        limit={limit}
                        onLimitChange={handleLimitChange}
                        total={total}
                    />

                    <FeedbackDetails
                        feedback={selectedFeedback}
                        onStatusUpdate={handleStatusUpdate}
                    />
                </Box>
            )}

            <Snackbar
                open={notification.open}
                autoHideDuration={3500}
                onClose={() =>
                    setNotification((previous) => ({
                        ...previous,
                        open: false,
                    }))
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    onClose={() =>
                        setNotification((previous) => ({
                            ...previous,
                            open: false,
                        }))
                    }
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
