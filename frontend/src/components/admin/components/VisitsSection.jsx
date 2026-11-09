import { useEffect, useState } from "react";
import Chip from "@mui/material/Chip";

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";

import {
    Alert,
    Avatar,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

import axiosInstance from "../../../api/axiosInstance";

function formatDuration(seconds = 0) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
}

function formatDate(date) {
    if (!date) return "Unknown";

    return new Date(date).toLocaleString();
}

function SummaryCard({ title, value, icon, description }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                >
                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={600}
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight={700}
                            sx={{ mt: 1, color: "#0F172A" }}
                        >
                            {value}
                        </Typography>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {description}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: "#EFF6FF",
                            color: "#1D4ED8",
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}


function VisitorCard({ visitor }) {
    const { t } = useTranslation();

    const name =
        visitor.fullName ||
        t("visitsSection.anonymousVisitor");

    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const pageHistory = visitor.pageHistory || [];

    const formatTime = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <Card
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                width: "100%",
                minWidth: 0,
            }}
        >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {/* Visitor information */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                >
                    <Avatar
                        sx={{
                            width: 52,
                            height: 52,
                            bgcolor: "#1D4ED8",
                            fontWeight: 700,
                        }}
                    >
                        {initials}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {name}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {visitor.email ||
                                t("visitsSection.noAccountEmail")}
                        </Typography>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {t("visitsSection.userId")}:{" "}
                            {visitor.userId ||
                                t("visitsSection.anonymous")}
                        </Typography>
                    </Box>

                    <Stack
                        direction="row"
                        flexWrap="wrap"
                        gap={1}
                        alignItems="center"
                    >
                        <Chip
                            size="small"
                            color={visitor.isActive ? "success" : "default"}
                            label={
                                visitor.isActive
                                    ? t("visitsSection.active", "Active")
                                    : t("visitsSection.inactive", "Inactive")
                            }
                        />

                        <Chip
                            size="small"
                            variant="outlined"
                            label={`${visitor.pageViews || 0} ${t(
                                "visitsSection.pageViewsLabel",
                                "pages"
                            )}`}
                        />
                    </Stack>
                </Stack>

                {/* Session statistics */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 2,
                        mt: 3,
                        p: 2,
                        bgcolor: "action.hover",
                        borderRadius: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {t("visitsSection.sessionStarted", "Session started")}
                        </Typography>

                        <Typography variant="body2" fontWeight={700}>
                            {formatDate(visitor.startedAt)}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {t("visitsSection.totalActiveTime", "Active time")}
                        </Typography>

                        <Typography variant="body2" fontWeight={700}>
                            {formatDuration(visitor.activeSeconds)}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {t("visitsSection.lastActivity", "Last activity")}
                        </Typography>

                        <Typography variant="body2" fontWeight={700}>
                            {formatDate(visitor.lastActivityAt)}
                        </Typography>
                    </Box>
                </Box>

                {/* Navigation journey */}
                <Box sx={{ mt: 3 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={750}
                        mb={1}
                    >
                        {t(
                            "visitsSection.navigationJourney",
                            "Navigation journey"
                        )}
                    </Typography>

                    {pageHistory.length === 0 ? (
                        <Alert severity="info">
                            {t(
                                "visitsSection.noHistory",
                                "Navigation history is not available for this session."
                            )}
                        </Alert>
                    ) : (
                        <Timeline
                            position="right"
                            sx={{
                                p: 0,
                                m: 0,
                                "& .MuiTimelineItem-root:before": {
                                    flex: 0,
                                    padding: 0,
                                },
                            }}
                        >
                            {/* Session start */}
                            <TimelineItem>
                                <TimelineOppositeContent
                                    sx={{
                                        flex: "0 0 105px",
                                        px: 1,
                                        py: 1,
                                        textAlign: "right",
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {formatTime(visitor.startedAt)}
                                    </Typography>
                                </TimelineOppositeContent>

                                <TimelineSeparator>
                                    <TimelineDot color="success" />
                                    <TimelineConnector />
                                </TimelineSeparator>

                                <TimelineContent sx={{ py: 1, px: 2, minWidth: 0 }}>
                                    <Typography fontWeight={700} variant="body2">
                                        {t(
                                            "visitsSection.sessionStarted",
                                            "Session started"
                                        )}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {t(
                                            "visitsSection.visitorEntered",
                                            "Visitor entered the website"
                                        )}
                                    </Typography>
                                </TimelineContent>
                            </TimelineItem>

                            {/* Visited pages */}
                            {pageHistory.map((page, index) => (
                                <TimelineItem key={`${page.path}-${index}`}>
                                    <TimelineOppositeContent
                                        sx={{
                                            flex: "0 0 105px",
                                            px: 1,
                                            py: 1,
                                            textAlign: "right",
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {formatTime(page.visitedAt)}
                                        </Typography>
                                    </TimelineOppositeContent>

                                    <TimelineSeparator>
                                        <TimelineDot
                                            color={
                                                index === pageHistory.length - 1
                                                    ? "primary"
                                                    : "grey"
                                            }
                                        />
                                        {index !== pageHistory.length - 1 && (
                                            <TimelineConnector />
                                        )}
                                    </TimelineSeparator>

                                    <TimelineContent
                                        sx={{
                                            py: 1,
                                            px: 2,
                                            minWidth: 0,
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                        >
                                            {t(
                                                "visitsSection.pageVisited",
                                                "Page visited"
                                            )}{" "}
                                            #{index + 1}
                                        </Typography>

                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                p: 1,
                                                borderRadius: 1.5,
                                                bgcolor: "action.hover",
                                                minWidth: 0,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                component="code"
                                                sx={{
                                                    display: "block",
                                                    whiteSpace: "normal",
                                                    overflowWrap: "anywhere",
                                                    color: "primary.main",
                                                }}
                                            >
                                                {page.path}
                                            </Typography>
                                        </Box>

                                        <Stack
                                            direction="row"
                                            flexWrap="wrap"
                                            gap={1.5}
                                            sx={{ mt: 1 }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {t(
                                                    "visitsSection.timeSpent",
                                                    "Time spent"
                                                )}:{" "}
                                                <strong>
                                                    {formatDuration(
                                                        page.durationSeconds
                                                    )}
                                                </strong>
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {t(
                                                    "visitsSection.lastSeen",
                                                    "Last seen"
                                                )}:{" "}
                                                <strong>
                                                    {formatTime(page.lastSeenAt)}
                                                </strong>
                                            </Typography>
                                        </Stack>
                                    </TimelineContent>
                                </TimelineItem>
                            ))}

                            {/* Last recorded interaction */}
                            <TimelineItem>
                                <TimelineOppositeContent
                                    sx={{
                                        flex: "0 0 105px",
                                        px: 1,
                                        py: 1,
                                        textAlign: "right",
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {formatTime(visitor.lastActivityAt)}
                                    </Typography>
                                </TimelineOppositeContent>

                                <TimelineSeparator>
                                    <TimelineDot
                                        color={visitor.isActive ? "success" : "warning"}
                                        variant="outlined"
                                    />
                                </TimelineSeparator>

                                <TimelineContent sx={{ py: 1, px: 2 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                    >
                                        {t(
                                            "visitsSection.lastInteraction",
                                            "Last recorded interaction"
                                        )}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {visitor.isActive
                                            ? t(
                                                "visitsSection.stillBrowsing",
                                                "Visitor is still browsing"
                                            )
                                            : t(
                                                "visitsSection.noRecentActivity",
                                                "No recent activity recorded"
                                            )}
                                    </Typography>
                                </TimelineContent>
                            </TimelineItem>
                        </Timeline>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}


export default function VisitsSection() {
    const { t } = useTranslation();

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axiosInstance.get(
                    "/dashboard/visits"
                );

                if (!cancelled) {
                    setAnalytics(response.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            t("visitsSection.loadError")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAnalytics();

        return () => {
            cancelled = true;
        };
    }, []);

    const summary = analytics?.summary;
    const visitors = analytics?.visitors || [];

    return (
        <Box>
            <Box mb={3}>
                <Typography variant="h5" fontWeight={700}>
                    {t("visitsSection.title")}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                >
                    {t("visitsSection.subtitle")}
                </Typography>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <>
                    <Grid container spacing={2} mb={4}>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <SummaryCard
                                title={t("visitsSection.visitsToday")}
                                value={summary?.dailyVisits ?? 0}
                                icon={<TodayOutlinedIcon />}
                                description={t("visitsSection.sessionsStartedToday")}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <SummaryCard
                                title={t("visitsSection.totalVisits")}
                                value={summary?.totalVisits ?? 0}
                                icon={<PeopleAltOutlinedIcon />}
                                description={t("visitsSection.allRecordedSessions")}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <SummaryCard
                                title={t("visitsSection.activeTimeToday")}
                                value={formatDuration(
                                    summary?.dailyActiveSeconds
                                )}
                                icon={<AccessTimeOutlinedIcon />}
                                description={t("visitsSection.estimatedTodayTime")}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <SummaryCard
                                title={t("visitsSection.totalActiveTime")}
                                value={formatDuration(
                                    summary?.totalActiveSeconds
                                )}
                                icon={<HistoryOutlinedIcon />}
                                description={t("visitsSection.estimatedAllTime")}
                            />
                        </Grid>
                    </Grid>

                    <Box mb={2}>
                        <Typography variant="h6" fontWeight={700}>
                            {t("visitsSection.recentVisitors")}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={0.5}
                        >
                            {t("visitsSection.latestSessions")}
                        </Typography>
                    </Box>

                    {visitors.length === 0 ? (
                        <Alert severity="info">
                            {t("visitsSection.empty")}
                        </Alert>
                    ) : (
                        <Stack spacing={2}>
                            {visitors.map((visitor) => (
                                <VisitorCard
                                    key={visitor._id}
                                    visitor={visitor}
                                />
                            ))}
                        </Stack>
                    )}
                </>
            )}
        </Box>
    );
}