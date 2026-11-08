import { useEffect, useState } from "react";

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
    const name = visitor.fullName || t("visitsSection.anonymousVisitor");

    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <Card
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
            }}
        >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", md: "center" }}
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
                            {visitor.email || t("visitsSection.noAccountEmail")}
                        </Typography>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {t("visitsSection.userId")}: {visitor.userId || t("visitsSection.anonymous")}
                        </Typography>
                    </Box>

                    <Box sx={{ minWidth: { md: 180 } }}>
                        <Typography
                            variant="body2"
                            fontWeight={700}
                        >
                            {t("visitsSection.activeTime")}
                        </Typography>

                        <Typography color="text.secondary">
                            {formatDuration(visitor.activeSeconds)}
                        </Typography>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {t("visitsSection.pageViews", {
                                count: visitor.pageViews || 0,
                            })}
                        </Typography>
                    </Box>
                </Stack>

                <Box
                    sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {t("visitsSection.firstVisit")}
                        </Typography>

                        <Typography variant="body2" fontWeight={600}>
                            {formatDate(visitor.startedAt)}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {t("visitsSection.lastActivity")}
                        </Typography>

                        <Typography variant="body2" fontWeight={600}>
                            {formatDate(visitor.lastActivityAt)}
                        </Typography>
                    </Box>

                    {visitor.lastPage && (
                        <Box sx={{ gridColumn: "1 / -1", minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {t("visitsSection.lastPage")}
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{ overflowWrap: "anywhere" }}
                            >
                                {visitor.lastPage}
                            </Typography>
                        </Box>
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