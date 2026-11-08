
import axiosInstance from "../api/axiosInstance";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageLayout from "./PageLayout";

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
    FormHelperText,
    InputLabel,
    MenuItem,
    Radio,
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
    TaskAlt,
    LightbulbOutlined,
} from "@mui/icons-material";

const REPORT_TYPES = [
    {
        value: "feedback",
        labelKey: "types.feedback.label",
        descriptionKey: "types.feedback.description",
        icon: <FeedbackOutlined />,
        color: "#2563eb",
        background: "#eff6ff",
    },
    {
        value: "bug",
        labelKey: "types.bug.label",
        descriptionKey: "types.bug.description",
        icon: <BugReportOutlined />,
        color: "#dc2626",
        background: "#fef2f2",
    },
    {
        value: "user_report",
        labelKey: "types.userReport.label",
        descriptionKey: "types.userReport.description",
        icon: <PersonOffOutlined />,
        color: "#9333ea",
        background: "#faf5ff",
    },
    {
        value: "other",
        labelKey: "types.other.label",
        descriptionKey: "types.other.description",
        icon: <ReportProblemOutlined />,
        color: "#d97706",
        background: "#fffbeb",
    },
];

const PRIORITIES = [
    { value: "low", labelKey: "priorities.low" },
    { value: "medium", labelKey: "priorities.medium" },
    { value: "high", labelKey: "priorities.high" },
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
    const { t } = useTranslation();

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const attachmentInputRef = useRef(null);

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
            reportedUser:
                type === "user_report" ? previous.reportedUser : "",
        }));

        setErrors({});
        setSuccess(false);
    };

    const handleAttachmentChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (!selectedFiles.length) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "text/plain",
        ];

        const validFiles = [];
        let errorMessage = "";

        for (const file of selectedFiles) {
            if (!allowedTypes.includes(file.type)) {
                errorMessage = t("feedback.attachments.unsupportedType", {
                    name: file.name,
                });
                break;
            }

            if (file.size > 5 * 1024 * 1024) {
                errorMessage = t("feedback.attachments.fileTooLarge", {
                    name: file.name,
                });
                break;
            }

            validFiles.push(file);
        }

        if (errorMessage) {
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error",
            });

            event.target.value = "";
            return;
        }

        setAttachments((previous) => {
            const combined = [...previous];

            for (const file of validFiles) {
                const duplicate = combined.some(
                    (existing) =>
                        existing.name === file.name &&
                        existing.size === file.size &&
                        existing.lastModified === file.lastModified
                );

                if (!duplicate) combined.push(file);
            }

            if (combined.length > 5) {
                setSnackbar({
                    open: true,
                    message: t("feedback.attachments.maxFiles"),
                    severity: "error",
                });

                return previous;
            }

            return combined;
        });

        event.target.value = "";
    };

    const handleRemoveAttachment = (index) => {
        setAttachments((previous) =>
            previous.filter((_, fileIndex) => fileIndex !== index)
        );
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formData.subject.trim()) {
            nextErrors.subject = t("feedback.validation.subjectRequired");
        } else if (formData.subject.trim().length < 4) {
            nextErrors.subject = t("feedback.validation.subjectMin");
        } else if (formData.subject.trim().length > 120) {
            nextErrors.subject = t("feedback.validation.subjectMax");
        }

        if (!formData.description.trim()) {
            nextErrors.description = t(
                "feedback.validation.descriptionRequired"
            );
        } else if (formData.description.trim().length < 10) {
            nextErrors.description = t(
                "feedback.validation.descriptionMin"
            );
        } else if (formData.description.trim().length > 5000) {
            nextErrors.description = t(
                "feedback.validation.descriptionMax"
            );
        }

        if (
            formData.type === "user_report" &&
            !formData.reportedUser.trim()
        ) {
            nextErrors.reportedUser = t(
                "feedback.validation.reportedUserRequired"
            );
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload = new FormData();

            payload.append("type", formData.type);
            payload.append("subject", formData.subject.trim());
            payload.append("description", formData.description.trim());
            payload.append("priority", formData.priority);
            payload.append(
                "reportedUser",
                formData.type === "user_report"
                    ? formData.reportedUser.trim()
                    : ""
            );
            payload.append("pageUrl", window.location.href);

            attachments.forEach((file) => {
                payload.append("attachments", file);
            });

            const response = await axiosInstance.post(
                "/feedback",
                payload
            );

            if (response.data.success) {
                setSuccess(true);

                setFormData({
                    ...INITIAL_FORM,
                    pageUrl: window.location.href,
                });

                setAttachments([]);
                setErrors({});

                if (attachmentInputRef.current) {
                    attachmentInputRef.current.value = "";
                }

                setSnackbar({
                    open: true,
                    message: t("feedback.success.submitted"),
                    severity: "success",
                });
            }
        } catch (error) {
            console.error(
                "Feedback submission error:",
                error.response?.data || error
            );

            setSnackbar({
                open: true,
                message:
                    error.response?.data?.message ||
                    t("feedback.errors.submit"),
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            ...INITIAL_FORM,
            pageUrl: window.location.href,
        });

        setAttachments([]);
        setErrors({});
        setSuccess(false);

        if (attachmentInputRef.current) {
            attachmentInputRef.current.value = "";
        }
    };

    return (
        <PageLayout
            title={t("feedback.title")}
            subtitle={t("feedback.subtitle")}
            maxWidth={1100}
            icon={
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        bgcolor: "#EFF6FF",
                        color: "#1D4ED8",
                    }}
                >
                    <FeedbackOutlined sx={{ fontSize: 27 }} />
                </Box>
            }
        >
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={3}>
                    {/* Report type */}
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: "16px",
                            borderColor: "#E2E8F0",
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                sx={{ mb: 0.75 }}
                            >
                                {t("feedback.chooseType")}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                            >
                                {t("feedback.chooseTypeSubtitle")}
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
                                                borderRadius: "16px",
                                                borderWidth: selected ? 2 : 1,
                                                borderColor: selected
                                                    ? type.color
                                                    : "#E2E8F0",
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
                                                            borderRadius: "10px",
                                                            bgcolor: "#fff",
                                                            color: type.color,
                                                            border: "1px solid",
                                                            borderColor: selected
                                                                ? type.color
                                                                : "#E2E8F0",
                                                        }}
                                                    >
                                                        {type.icon}
                                                    </Box>

                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            fontWeight={700}
                                                            sx={{ mb: 0.5 }}
                                                        >
                                                            {t(
                                                                `feedback.${type.labelKey}`
                                                            )}
                                                        </Typography>

                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ lineHeight: 1.6 }}
                                                        >
                                                            {t(
                                                                `feedback.${type.descriptionKey}`
                                                            )}
                                                        </Typography>
                                                    </Box>

                                                    <Radio
                                                        checked={selected}
                                                        value={type.value}
                                                        inputProps={{
                                                            "aria-label": t(
                                                                `feedback.${type.labelKey}`
                                                            ),
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
                            borderRadius: "16px",
                            borderColor: "#E2E8F0",
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                sx={{ mb: 0.75 }}
                            >
                                {t("feedback.detailsTitle")}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                            >
                                {t("feedback.detailsSubtitle")}
                            </Typography>

                            <Stack spacing={3}>
                                {formData.type === "user_report" && (
                                    <TextField
                                        name="reportedUser"
                                        label={t("feedback.reportedUser")}
                                        placeholder={t(
                                            "feedback.reportedUserPlaceholder"
                                        )}
                                        value={formData.reportedUser}
                                        onChange={handleChange}
                                        error={Boolean(errors.reportedUser)}
                                        helperText={
                                            errors.reportedUser ||
                                            t(
                                                "feedback.reportedUserHelper"
                                            )
                                        }
                                        fullWidth
                                        required
                                    />
                                )}

                                <TextField
                                    name="subject"
                                    label={t("feedback.subject")}
                                    placeholder={t(
                                        `feedback.subjectPlaceholders.${formData.type}`
                                    )}
                                    value={formData.subject}
                                    onChange={handleChange}
                                    error={Boolean(errors.subject)}
                                    helperText={
                                        errors.subject ||
                                        t("feedback.characterCount", {
                                            current: formData.subject.length,
                                            max: 120,
                                        })
                                    }
                                    inputProps={{ maxLength: 120 }}
                                    fullWidth
                                    required
                                />

                                <TextField
                                    name="description"
                                    label={t("feedback.description")}
                                    placeholder={t(
                                        `feedback.descriptionPlaceholders.${formData.type}`
                                    )}
                                    value={formData.description}
                                    onChange={handleChange}
                                    error={Boolean(errors.description)}
                                    helperText={
                                        errors.description ||
                                        t("feedback.characterCount", {
                                            current:
                                                formData.description.length,
                                            max: 5000,
                                        })
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
                                        label={t("feedback.pageUrl")}
                                        value={formData.pageUrl}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        helperText={t(
                                            "feedback.pageUrlHelper"
                                        )}
                                    />
                                )}

                                <FormControl fullWidth>
                                    <InputLabel id="priority-label">
                                        {t("feedback.priority")}
                                    </InputLabel>

                                    <Select
                                        labelId="priority-label"
                                        name="priority"
                                        value={formData.priority}
                                        label={t("feedback.priority")}
                                        onChange={handleChange}
                                    >
                                        {PRIORITIES.map((priority) => (
                                            <MenuItem
                                                key={priority.value}
                                                value={priority.value}
                                            >
                                                {t(
                                                    `feedback.${priority.labelKey}`
                                                )}
                                            </MenuItem>
                                        ))}
                                    </Select>

                                    <FormHelperText>
                                        {t("feedback.priorityHelper")}
                                    </FormHelperText>
                                </FormControl>

                                <Divider />

                                {/* Attachments */}
                                <Box>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<AttachFileOutlined />}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderRadius: "10px",
                                            py: 1.1,
                                        }}
                                    >
                                        {t("feedback.attachments.button")}

                                        <input
                                            ref={attachmentInputRef}
                                            hidden
                                            type="file"
                                            multiple
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
                                        {t("feedback.attachments.helper")}
                                    </Typography>

                                    {attachments.length > 0 && (
                                        <Stack
                                            direction="row"
                                            flexWrap="wrap"
                                            useFlexGap
                                            gap={1}
                                            sx={{ mt: 1.5 }}
                                        >
                                            {attachments.map((file, index) => (
                                                <Chip
                                                    key={`${file.name}-${file.lastModified}-${index}`}
                                                    label={file.name}
                                                    onDelete={() =>
                                                        handleRemoveAttachment(index)
                                                    }
                                                    sx={{ maxWidth: "100%" }}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Privacy note */}
                    <Alert
                        severity="info"
                        icon={<LightbulbOutlined />}
                        sx={{
                            borderRadius: "16px",
                            alignItems: "flex-start",
                        }}
                    >
                        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                            {t("feedback.reminderTitle")}
                        </Typography>

                        {t("feedback.reminderDescription")}
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
                                borderRadius: "10px",
                                px: 3,
                                py: 1.35,
                            }}
                        >
                            {t("feedback.clearForm")}
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
                            sx={{ px: 4, py: 1.35 }}
                        >
                            {loading
                                ? t("feedback.submitting")
                                : t("feedback.submit")}
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
                    {t("feedback.success.confirmation")}
                </Alert>
            )}
        </PageLayout>
    );
}
