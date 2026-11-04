
import React from "react";

import {
    Box,
    Card,
    CardActionArea,
    Chip,
    Stack,
    Typography,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";

import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";

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

const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatLabel = (value = "") =>
    value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
        char.toUpperCase()
    );

export default function FeedbackList({
    feedbacks = [],
    selectedFeedback,
    onSelect,
    limit,
    onLimitChange,
    total = 0,
}) {
    return (
        <Box
            sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 3,
                bgcolor: "#fff",
                overflow: "hidden",
                minWidth: 0,
            }}
        >
            {/* List header */}
            <Box
                sx={{
                    px: 2,
                    py: 1.75,
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                }}
            >
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                >
                    <Typography fontWeight={700} color="#0f172a">
                        Submissions
                    </Typography>

                    <Chip
                        label={total}
                        size="small"
                        sx={{
                            fontWeight: 700,
                            bgcolor: "#eff6ff",
                            color: "#2563eb",
                        }}
                    />
                </Stack>

                <FormControl size="small">
                    <Select
                        value={limit}
                        onChange={(event) =>
                            onLimitChange(event.target.value)
                        }
                        sx={{
                            minWidth: 100,
                            fontSize: 13,
                            fontWeight: 600,
                            borderRadius: 2,
                        }}
                    >
                        <MenuItem value="10">10</MenuItem>
                        <MenuItem value="50">50</MenuItem>
                        <MenuItem value="all">All</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Scrollable submissions */}
            <Box
                sx={{
                    height: {
                        xs: 420,
                        lg: 650,
                    },
                    overflowY: "auto",
                    overflowX: "hidden",
                    minHeight: 0,

                    scrollbarWidth: "thin",
                    scrollbarColor: "#94a3b8 #f1f5f9",

                    "&::-webkit-scrollbar": {
                        width: "7px",
                    },

                    "&::-webkit-scrollbar-track": {
                        bgcolor: "#f1f5f9",
                    },

                    "&::-webkit-scrollbar-thumb": {
                        bgcolor: "#94a3b8",
                        borderRadius: 10,
                    },

                    "&::-webkit-scrollbar-thumb:hover": {
                        bgcolor: "#64748b",
                    },
                }}
            >
                {feedbacks.map((feedback) => {
                    const isSelected =
                        selectedFeedback?._id === feedback._id;

                    return (
                        <Card
                            key={feedback._id}
                            elevation={0}
                            square
                            sx={{
                                borderBottom: "1px solid #f1f5f9",
                                bgcolor: isSelected ? "#eff6ff" : "#fff",
                                borderLeft: isSelected
                                    ? "3px solid #2563eb"
                                    : "3px solid transparent",
                            }}
                        >
                            <CardActionArea
                                onClick={() => onSelect(feedback)}
                                sx={{
                                    p: 2,
                                    "&:hover": {
                                        bgcolor: "#f8fafc",
                                    },
                                }}
                            >
                                <Stack spacing={1.2}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                        gap={1}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            sx={{
                                                minWidth: 0,
                                                flex: 1,
                                            }}
                                        >
                                            <FeedbackOutlinedIcon
                                                sx={{
                                                    color: "#2563eb",
                                                    fontSize: 19,
                                                    flexShrink: 0,
                                                }}
                                            />

                                            <Typography
                                                fontWeight={700}
                                                color="#1e293b"
                                                sx={{
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {feedback.subject}
                                            </Typography>
                                        </Stack>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                flexShrink: 0,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {formatDate(feedback.createdAt)}
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {feedback.description}
                                    </Typography>

                                    <Stack
                                        direction="row"
                                        spacing={0.75}
                                        flexWrap="wrap"
                                        useFlexGap
                                    >
                                        <Chip
                                            label={formatLabel(feedback.type)}
                                            size="small"
                                            variant="outlined"
                                        />

                                        <Chip
                                            label={formatLabel(feedback.priority)}
                                            size="small"
                                            sx={{
                                                ...priorityStyles[feedback.priority],
                                                fontWeight: 600,
                                            }}
                                        />

                                        <Chip
                                            label={formatLabel(feedback.status)}
                                            size="small"
                                            sx={{
                                                ...statusStyles[feedback.status],
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Stack>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        noWrap
                                    >
                                        {feedback.email}
                                    </Typography>
                                </Stack>
                            </CardActionArea>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
}
