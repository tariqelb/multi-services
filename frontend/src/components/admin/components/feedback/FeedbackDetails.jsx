
import React, { useEffect, useState } from "react";

import {
    Box,
    Card,
    Chip,
    Divider,
    Stack,
    Typography,
    Button,
    Alert,
    CircularProgress,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";

import SubjectOutlinedIcon from "@mui/icons-material/SubjectOutlined";
import PersonIcon from "@mui/icons-material/Person";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import axiosInstance from "../../../../api/axiosInstance";

const STATUS_OPTIONS = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

const formatLabel = (value = "") =>
    value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
        char.toUpperCase()
    );

const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatFileSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const statusStyles = {
    open: { bgcolor: "#dbeafe", color: "#1d4ed8" },
    in_progress: { bgcolor: "#fef3c7", color: "#92400e" },
    resolved: { bgcolor: "#dcfce7", color: "#166534" },
    closed: { bgcolor: "#f1f5f9", color: "#475569" },
};

const priorityStyles = {
    low: { bgcolor: "#f1f5f9", color: "#475569" },
    medium: { bgcolor: "#fef3c7", color: "#92400e" },
    high: { bgcolor: "#fee2e2", color: "#b91c1c" },
};

function DetailRow({ icon, label, children }) {
    return (
        <Stack
            direction="row"
            spacing={1.5}
            alignItems="flex-start"
            sx={{ minWidth: 0 }}
        >
            <Box sx={{ color: "#64748b", pt: 0.2, flexShrink: 0 }}>
                {icon}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                >
                    {label}
                </Typography>

                <Box sx={{ mt: 0.25, minWidth: 0 }}>
                    {children}
                </Box>
            </Box>
        </Stack>
    );
}

function AttachmentItem({
    attachment,
    feedbackId,
    onDownload,
    downloading,
}) {
    const isImage = attachment.mimetype?.startsWith("image/");

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: { xs: 1, sm: 2 },
                p: { xs: 1, sm: 1.5 },
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                bgcolor: "#fff",
                minWidth: 0,
            }}
        >
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ minWidth: 0, flex: 1 }}
            >
                <Box
                    sx={{
                        width: { xs: 36, sm: 42 },
                        height: { xs: 36, sm: 42 },
                        flexShrink: 0,
                        borderRadius: 2,
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {isImage ? (
                        <ImageOutlinedIcon />
                    ) : (
                        <InsertDriveFileOutlinedIcon />
                    )}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        color="#334155"
                        sx={{
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                        }}
                    >
                        {attachment.originalName || attachment.filename}
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ overflowWrap: "anywhere" }}
                    >
                        {formatFileSize(attachment.size)}
                        {attachment.mimetype
                            ? ` • ${attachment.mimetype}`
                            : ""}
                    </Typography>
                </Box>
            </Stack>

            <Button
                size="small"
                variant="outlined"
                startIcon={
                    downloading ? (
                        <CircularProgress size={15} />
                    ) : (
                        <DownloadIcon />
                    )
                }
                disabled={downloading}
                onClick={() => onDownload(feedbackId, attachment)}
                sx={{
                    flexShrink: 0,
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: "auto",
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                    "& .MuiButton-startIcon": {
                        mr: { xs: 0.5, sm: 1 },
                    },
                }}
            >
                Download
            </Button>
        </Box>
    );
}

export default function FeedbackDetails({
    feedback,
    onStatusUpdate,
}) {
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadError, setDownloadError] = useState("");

    const [selectedStatus, setSelectedStatus] = useState(
        feedback?.status || "open"
    );

    const [savingStatus, setSavingStatus] = useState(false);
    const [statusError, setStatusError] = useState("");

    useEffect(() => {
        setSelectedStatus(feedback?.status || "open");
        setStatusError("");
        setDownloadError("");
    }, [feedback?._id, feedback?.status]);

    const handleDownload = async (feedbackId, attachment) => {
        try {
            setDownloadingId(attachment._id);
            setDownloadError("");

            const response = await axiosInstance.get(
                `/feedback/${feedbackId}/attachments/${attachment._id}`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type:
                    attachment.mimetype ||
                    response.headers["content-type"] ||
                    "application/octet-stream",
            });

            const objectUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = objectUrl;
            link.download =
                attachment.originalName ||
                attachment.filename ||
                "attachment";

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(objectUrl);
            }, 1000);
        } catch (error) {
            console.error(
                "Attachment download error:",
                error.response?.data || error
            );

            setDownloadError(
                "Unable to download this attachment. Please try again."
            );
        } finally {
            setDownloadingId(null);
        }
    };

    const handleSaveStatus = async () => {
        if (
            !feedback ||
            selectedStatus === feedback.status ||
            !onStatusUpdate
        ) {
            return;
        }

        try {
            setSavingStatus(true);
            setStatusError("");

            const success = await onStatusUpdate(
                feedback._id,
                selectedStatus
            );

            if (!success) {
                setStatusError(
                    "Status update failed. Please try again."
                );
            }
        } catch (error) {
            console.error("Status update error:", error);
            setStatusError(
                "Unable to update the feedback status."
            );
        } finally {
            setSavingStatus(false);
        }
    };

    if (!feedback) {
        return (
            <Card
                variant="outlined"
                sx={{
                    borderRadius: 3,
                    p: 5,
                    textAlign: "center",
                    borderColor: "#e2e8f0",
                }}
            >
                <Typography color="text.secondary">
                    Select a feedback submission to view its details.
                </Typography>
            </Card>
        );
    }

    const user =
        feedback.userId &&
        typeof feedback.userId === "object"
            ? feedback.userId
            : null;

    const userName = user
        ? [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ")
        : "User information unavailable";

    const attachments = Array.isArray(feedback.attachments)
        ? feedback.attachments
        : [];

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                borderColor: "#e2e8f0",
                p: { xs: 1.5, sm: 2, md: 3 },
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ minWidth: 0 }}>

                {/* Header and status management */}
                <Box sx={{ minWidth: 0 }}>
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
                        gap={{ xs: 2, sm: 2 }}
                    >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                variant="overline"
                                color="primary"
                                fontWeight={700}
                                sx={{
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                    lineHeight: 1.5,
                                }}
                            >
                                {formatLabel(feedback.type)}
                            </Typography>

                            <Typography
                                component="h2"
                                fontWeight={700}
                                color="#0f172a"
                                sx={{
                                    fontSize: {
                                        xs: "1.2rem",
                                        sm: "1.35rem",
                                        md: "1.5rem",
                                    },
                                    lineHeight: {
                                        xs: 1.3,
                                        sm: 1.35,
                                    },
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-word",
                                    minWidth: 0,
                                }}
                            >
                                {feedback.subject}
                            </Typography>

                            <Chip
                                icon={<FlagOutlinedIcon />}
                                label={`${formatLabel(feedback.priority)} priority`}
                                size="small"
                                sx={{
                                    mt: 1.5,
                                    ...priorityStyles[feedback.priority],
                                    fontWeight: 600,
                                }}
                            />
                        </Box>

                        <Stack
                            spacing={1}
                            sx={{
                                width: {
                                    xs: "100%",
                                    sm: 190,
                                },
                                maxWidth: {
                                    xs: "100%",
                                    sm: 190,
                                },
                                flexShrink: 0,
                            }}
                        >
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={selectedStatus}
                                    onChange={(event) =>
                                        setSelectedStatus(event.target.value)
                                    }
                                    disabled={savingStatus}
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        ...statusStyles[selectedStatus],
                                    }}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                startIcon={
                                    savingStatus ? (
                                        <CircularProgress
                                            size={16}
                                            color="inherit"
                                        />
                                    ) : (
                                        <SaveOutlinedIcon />
                                    )
                                }
                                onClick={handleSaveStatus}
                                disabled={
                                    savingStatus ||
                                    selectedStatus === feedback.status
                                }
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    boxShadow: "none",
                                    py: 0.8,
                                }}
                            >
                                {savingStatus
                                    ? "Updating..."
                                    : "Update Status"}
                            </Button>
                        </Stack>
                    </Stack>

                    {statusError && (
                        <Alert severity="error" sx={{ mt: 1.5 }}>
                            {statusError}
                        </Alert>
                    )}
                </Box>

                <Divider />

                {/* Description */}
                <Box sx={{ minWidth: 0 }}>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                    >
                        <SubjectOutlinedIcon color="primary" />

                        <Typography fontWeight={700} color="#334155">
                            Description
                        </Typography>
                    </Stack>

                    <Box
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            bgcolor: "#f8fafc",
                            borderRadius: 2,
                            minHeight: 100,
                            minWidth: 0,
                        }}
                    >
                        <Typography
                            variant="body2"
                            color="#334155"
                            sx={{
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                lineHeight: 1.8,
                            }}
                        >
                            {feedback.description}
                        </Typography>
                    </Box>
                </Box>

                {/* Attachments */}
                {attachments.length > 0 && (
                    <>
                        <Divider />

                        <Box sx={{ minWidth: 0 }}>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mb: 1.5 }}
                            >
                                <AttachFileIcon color="primary" />

                                <Typography
                                    fontWeight={700}
                                    color="#334155"
                                >
                                    Attachments ({attachments.length})
                                </Typography>
                            </Stack>

                            {downloadError && (
                                <Alert
                                    severity="error"
                                    sx={{ mb: 1.5 }}
                                    onClose={() => setDownloadError("")}
                                >
                                    {downloadError}
                                </Alert>
                            )}

                            <Stack spacing={1} sx={{ minWidth: 0 }}>
                                {attachments.map((attachment) => (
                                    <AttachmentItem
                                        key={attachment._id}
                                        attachment={attachment}
                                        feedbackId={feedback._id}
                                        onDownload={handleDownload}
                                        downloading={
                                            downloadingId === attachment._id
                                        }
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </>
                )}

                <Divider />

                {/* Submission information */}
                <Typography fontWeight={700} color="#334155">
                    Submission information
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "minmax(0, 1fr)",
                            sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: { xs: 2, sm: 2.5 },
                        minWidth: 0,
                    }}
                >
                    <DetailRow
                        icon={<PersonIcon fontSize="small" />}
                        label="Submitted by"
                    >
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {userName || "User information unavailable"}
                        </Typography>
                    </DetailRow>

                    <DetailRow
                        icon={<EmailOutlinedIcon fontSize="small" />}
                        label="Email"
                    >
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {feedback.email}
                        </Typography>
                    </DetailRow>

                    <DetailRow
                        icon={<CalendarTodayOutlinedIcon fontSize="small" />}
                        label="Created at"
                    >
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {formatDate(feedback.createdAt)}
                        </Typography>
                    </DetailRow>

                    <DetailRow
                        icon={<CalendarTodayOutlinedIcon fontSize="small" />}
                        label="Last updated"
                    >
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {formatDate(feedback.updatedAt)}
                        </Typography>
                    </DetailRow>

                    {feedback.reportedUser && (
                        <DetailRow
                            icon={<PersonIcon fontSize="small" />}
                            label="Reported user"
                        >
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ overflowWrap: "anywhere" }}
                            >
                                {feedback.reportedUser}
                            </Typography>
                        </DetailRow>
                    )}

                    {feedback.pageUrl && (
                        <DetailRow
                            icon={<LinkOutlinedIcon fontSize="small" />}
                            label="Page URL"
                        >
                            <Typography
                                component="a"
                                href={feedback.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="body2"
                                sx={{
                                    color: "#2563eb",
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-all",
                                    display: "inline-block",
                                    maxWidth: "100%",
                                }}
                            >
                                {feedback.pageUrl}
                            </Typography>
                        </DetailRow>
                    )}
                </Box>
            </Stack>
        </Card>
    );
}
