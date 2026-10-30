import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    FeedbackOutlined,
    BugReportOutlined,
    PersonOffOutlined,
    ReportProblemOutlined,
    SendOutlined,
    AttachFileOutlined,
    // CheckCircleOutline,
    TaskAlt,
    LightbulbOutlined,
} from "@mui/icons-material";

const REPORT_TYPES = [
    {
        value: "feedback",
        label: "General feedback",
        description: "Share an idea or suggest an improvement.",
        icon: <FeedbackOutlined />,
        color: "#2563eb",
        background: "#eff6ff",
    },
    {
        value: "bug",
        label: "Bug or technical issue",
        description: "Report an error, broken feature, or unexpected behavior.",
        icon: <BugReportOutlined />,
        color: "#dc2626",
        background: "#fef2f2",
    },
    {
        value: "user_report",
        label: "Report a user",
        description: "Report suspicious behavior, harassment, or a problematic listing.",
        icon: <PersonOffOutlined />,
        color: "#9333ea",
        background: "#faf5ff",
    },
    {
        value: "other",
        label: "Other problem",
        description: "Tell us about another problem with the application.",
        icon: <ReportProblemOutlined />,
        color: "#d97706",
        background: "#fffbeb",
    },
];

const PRIORITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

const INITIAL_FORM = {
    type: "feedback",
    subject: "",
    description: "",
    priority: "medium",
    email: "",
    reportedUser: "",
    pageUrl: window.location.href,
};

export default function FeedbackPage() {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const selectedType = REPORT_TYPES.find(
        (type) => type.value === formData.type
    );

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));

        if (success) setSuccess(false);
    };

    const handleTypeChange = (type) => {
        setFormData((previous) => ({
            ...previous,
            type,
            subject: "",
            reportedUser: type === "user_report" ? previous.reportedUser : "",
        }));

        setErrors({});
        setSuccess(false);
    };

    const handleAttachmentChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "text/plain",
        ];

        if (!allowedTypes.includes(file.type)) {
            setSnackbar({
                open: true,
                message: "Please upload a PNG, JPG, WEBP, GIF, or TXT file.",
                severity: "error",
            });

            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSnackbar({
                open: true,
                message: "The attachment must be smaller than 5 MB.",
                severity: "error",
            });

            event.target.value = "";
            return;
        }

        setAttachment(file);
        setSuccess(false);
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formData.subject.trim()) {
            nextErrors.subject = "Please enter a subject.";
        } else if (formData.subject.trim().length < 4) {
            nextErrors.subject = "The subject must contain at least 4 characters.";
        } else if (formData.subject.trim().length > 120) {
            nextErrors.subject = "The subject cannot exceed 120 characters.";
        }

        if (!formData.description.trim()) {
            nextErrors.description = "Please describe the issue.";
        } else if (formData.description.trim().length < 10) {
            nextErrors.description = "Please provide at least 10 characters.";
        } else if (formData.description.trim().length > 5000) {
            nextErrors.description = "The description cannot exceed 5000 characters.";
        }

        if (
            formData.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ) {
            nextErrors.email = "Please enter a valid email address.";
        }

        if (
            formData.type === "user_report" &&
            !formData.reportedUser.trim()
        ) {
            nextErrors.reportedUser =
                "Enter the reported user's email, login, or profile identifier.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);

            const payload = {
                type: formData.type,
                subject: formData.subject,
                description: formData.description,
                priority: formData.priority,
                reportedUser: formData.reportedUser || null,
                pageUrl: window.location.href,
            };

            const response = await axiosInstance.post(
                "/feedback",
                payload
            );

            if (response.data.success) {
                setSuccess(true);

                setFormData({
                    type: "feedback",
                    subject: "",
                    description: "",
                    priority: "medium",
                    reportedUser: "",
                    email: "",
                    pageUrl: "",
                });
            }
        } catch (error) {
            console.error(
                "Feedback submission error:",
                error.response?.data || error
            );

            setError(
                error.response?.data?.message ||
                "Failed to submit your report. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            ...INITIAL_FORM,
            pageUrl: window.location.href,
        });

        setAttachment(null);
        setErrors({});
        setSuccess(false);
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1100,
                mx: "auto",
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 3, md: 5 },
            }}
        >
            {/* Page heading */}
            <Stack spacing={1} sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: "#ecfdf5",
                            color: "#047857",
                        }}
                    >
                        <FeedbackOutlined sx={{ fontSize: 27 }} />
                    </Box>

                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: "-0.8px",
                                fontSize: { xs: "1.7rem", md: "2.15rem" },
                            }}
                        >
                            Feedback & Reports
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            Help us improve your experience.
                        </Typography>
                    </Box>
                </Stack>

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 720, lineHeight: 1.8, mt: 1 }}
                >
                    Found a bug, have an idea, or experienced a problem with
                    another user? Tell us what happened so we can investigate.
                </Typography>
            </Stack>

            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
            >
                <Stack spacing={3}>
                    {/* Report type */}
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: 3.5,
                            borderColor: "#e5e7eb",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.025)",
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                            <Typography
                                variant="h6"
                                fontWeight={800}
                                sx={{ mb: 0.75 }}
                            >
                                What would you like to report?
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                            >
                                Choose the category that best describes your
                                message.
                            </Typography>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, minmax(0, 1fr))",
                                    },
                                    gap: 2,
                                }}
                            >
                                {REPORT_TYPES.map((type) => {
                                    const selected =
                                        formData.type === type.value;

                                    return (
                                        <Card
                                            key={type.value}
                                            variant="outlined"
                                            onClick={() =>
                                                handleTypeChange(type.value)
                                            }
                                            sx={{
                                                cursor: "pointer",
                                                borderRadius: 3,
                                                borderWidth: selected ? 2 : 1,
                                                borderColor: selected
                                                    ? type.color
                                                    : "#e5e7eb",
                                                bgcolor: selected
                                                    ? type.background
                                                    : "#fff",
                                                transition: "all 0.18s ease",
                                                "&:hover": {
                                                    borderColor: type.color,
                                                    transform: "translateY(-2px)",
                                                },
                                            }}
                                        >
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1.5}
                                                    alignItems="flex-start"
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 42,
                                                            height: 42,
                                                            flexShrink: 0,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            borderRadius: 2.5,
                                                            bgcolor: "#fff",
                                                            color: type.color,
                                                            border: "1px solid",
                                                            borderColor: selected
                                                                ? type.color
                                                                : "#e5e7eb",
                                                        }}
                                                    >
                                                        {type.icon}
                                                    </Box>

                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            fontWeight={800}
                                                            sx={{ mb: 0.5 }}
                                                        >
                                                            {type.label}
                                                        </Typography>

                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ lineHeight: 1.6 }}
                                                        >
                                                            {type.description}
                                                        </Typography>
                                                    </Box>

                                                    <Radio
                                                        checked={selected}
                                                        value={type.value}
                                                        inputProps={{
                                                            "aria-label": type.label,
                                                        }}
                                                        sx={{
                                                            p: 0,
                                                            color: type.color,
                                                            "&.Mui-checked": {
                                                                color: type.color,
                                                            },
                                                        }}
                                                    />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Report details */}
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: 3.5,
                            borderColor: "#e5e7eb",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.025)",
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                            <Typography
                                variant="h6"
                                fontWeight={800}
                                sx={{ mb: 0.75 }}
                            >
                                Tell us more
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                            >
                                Please provide enough information for us to
                                understand the situation.
                            </Typography>

                            <Stack spacing={3}>
                                {formData.type === "user_report" && (
                                    <TextField
                                        name="reportedUser"
                                        label="Reported user"
                                        placeholder="User login, profile ID, or email"
                                        value={formData.reportedUser}
                                        onChange={handleChange}
                                        error={Boolean(errors.reportedUser)}
                                        helperText={
                                            errors.reportedUser ||
                                            "Provide an identifier if available. Do not include passwords or private credentials."
                                        }
                                        fullWidth
                                        required
                                    />
                                )}

                                <TextField
                                    name="subject"
                                    label="Subject"
                                    placeholder={
                                        formData.type === "bug"
                                            ? "Example: Unable to publish a property"
                                            : formData.type === "user_report"
                                              ? "Example: Suspicious property listing"
                                              : "Briefly summarize your message"
                                    }
                                    value={formData.subject}
                                    onChange={handleChange}
                                    error={Boolean(errors.subject)}
                                    helperText={
                                        errors.subject ||
                                        `${formData.subject.length}/120 characters`
                                    }
                                    inputProps={{ maxLength: 120 }}
                                    fullWidth
                                    required
                                />

                                <TextField
                                    name="description"
                                    label="Description"
                                    placeholder={
                                        formData.type === "bug"
                                            ? "What happened? What did you expect to happen? Include the steps to reproduce the problem."
                                            : formData.type === "user_report"
                                              ? "Describe the behavior or listing you are reporting. Include relevant details without sharing sensitive personal information."
                                              : "Write your feedback or explain the problem in detail..."
                                    }
                                    value={formData.description}
                                    onChange={handleChange}
                                    error={Boolean(errors.description)}
                                    helperText={
                                        errors.description ||
                                        `${formData.description.length}/5000 characters`
                                    }
                                    multiline
                                    minRows={5}
                                    maxRows={12}
                                    inputProps={{ maxLength: 5000 }}
                                    fullWidth
                                    required
                                />

                                {formData.type === "bug" && (
                                    <TextField
                                        label="Page where the error occurred"
                                        value={formData.pageUrl}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        helperText="This page address will be included with your report."
                                    />
                                )}

                                <FormControl fullWidth>
                                    <InputLabel id="priority-label">
                                        Priority
                                    </InputLabel>

                                    <Select
                                        labelId="priority-label"
                                        name="priority"
                                        value={formData.priority}
                                        label="Priority"
                                        onChange={handleChange}
                                    >
                                        {PRIORITIES.map((priority) => (
                                            <MenuItem
                                                key={priority.value}
                                                value={priority.value}
                                            >
                                                {priority.label}
                                            </MenuItem>
                                        ))}
                                    </Select>

                                    <FormHelperText>
                                        Choose how urgently this issue needs
                                        attention.
                                    </FormHelperText>
                                </FormControl>

                                <Divider />

                                <TextField
                                    name="email"
                                    label="Contact email (optional)"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={Boolean(errors.email)}
                                    helperText={
                                        errors.email ||
                                        "If provided, we may use this address to follow up on your report."
                                    }
                                    fullWidth
                                />

                                {/* Attachment */}
                                <Box>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<AttachFileOutlined />}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderRadius: 2.5,
                                            py: 1.1,
                                        }}
                                    >
                                        Attach screenshot or log

                                        <input
                                            hidden
                                            type="file"
                                            accept=".png,.jpg,.jpeg,.webp,.gif,.txt"
                                            onChange={handleAttachmentChange}
                                        />
                                    </Button>

                                    <Typography
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        Optional. PNG, JPG, WEBP, GIF, or TXT.
                                        Maximum size: 5 MB.
                                    </Typography>

                                    {attachment && (
                                        <Chip
                                            label={attachment.name}
                                            onDelete={() => setAttachment(null)}
                                            sx={{ mt: 1.5, maxWidth: "100%" }}
                                        />
                                    )}
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Privacy note */}
                    <Alert
                        severity="info"
                        icon={<LightbulbOutlined />}
                        sx={{ borderRadius: 3, alignItems: "flex-start" }}
                    >
                        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                            A quick reminder
                        </Typography>

                        Please avoid including passwords, authentication
                        tokens, payment details, or unnecessary personal
                        information in your report. Reports involving another
                        user should contain relevant facts and evidence.
                    </Alert>

                    {/* Actions */}
                    <Stack
                        direction={{ xs: "column-reverse", sm: "row" }}
                        spacing={2}
                        justifyContent="flex-end"
                    >
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                            disabled={loading}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2.5,
                                px: 3,
                                py: 1.35,
                            }}
                        >
                            Clear form
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <SendOutlined />
                                )
                            }
                            disabled={loading}
                            sx={{
                                textTransform: "none",
                                fontWeight: 800,
                                borderRadius: 2.5,
                                px: 4,
                                py: 1.35,
                                bgcolor: "#047857",
                                boxShadow: "none",
                                "&:hover": {
                                    bgcolor: "#065f46",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            {loading ? "Submitting..." : "Submit report"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() =>
                    setSnackbar((previous) => ({
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
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() =>
                        setSnackbar((previous) => ({
                            ...previous,
                            open: false,
                        }))
                    }
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {success && (
                <Alert
                    severity="success"
                    icon={<TaskAlt />}
                    sx={{ mt: 3, borderRadius: 3 }}
                >
                    Your report has been submitted successfully.
                </Alert>
            )}
        </Box>
    );
}