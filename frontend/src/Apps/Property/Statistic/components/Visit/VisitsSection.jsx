// admin/components/Visit/VisitsSection.jsx

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Pagination,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";

import {
    AccessTimeOutlined,
    ExitToAppOutlined,
    ExpandLessOutlined,
    ExpandMoreOutlined,
    FiberManualRecord,
    LayersOutlined,
    LoginOutlined,
    PeopleAltOutlined,
    PersonOutlineOutlined,
    UndoOutlined,
    VisibilityOutlined,
} from "@mui/icons-material";

import {
    ChartCard,
    ChartGrid,
    EmptyState,
    ErrorBanner,
    HourlyChart,
    KpiGrid,
    LoadingState,
    RangeSelect,
    RankedList,
    RefreshButton,
    SectionHeader,
    StatCard,
    TrendChart,
    getPeakHour,
    useAnalyticsData,
} from "../shared/AnalyticsUI";

import {
    formatDateTime,
    formatDecimal,
    formatDuration,
    formatHour,
    formatNumber,
    formatPercent,
    formatTime,
    getInitials,
    getLocale,
} from "../shared/analyticsUtils";

const PAGE_SIZE = 10;
const LIVE_REFRESH_MS = 60_000;

function JourneyItem({ time, dot, title, children, last = false }) {
    return (
        <TimelineItem>
            <TimelineOppositeContent
                sx={{ flex: "0 0 92px", px: 1, py: 1, textAlign: "right" }}
            >
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {time}
                </Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
                {dot}
                {!last && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent sx={{ py: 1, px: 2, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {title}
                </Typography>
                {children}
            </TimelineContent>
        </TimelineItem>
    );
}

function VisitorCard({ visitor, locale }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const name = visitor.fullName || t("visitsSection.anonymousVisitor", "Anonymous visitor");
    const pageHistory = visitor.pageHistory || [];

    return (
        <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
        >
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
                >
                    <Avatar
                        sx={{
                            width: 46,
                            height: 46,
                            fontWeight: 700,
                            bgcolor: visitor.userId ? "primary.main" : "grey.500",
                        }}
                    >
                        {visitor.userId ? getInitials(name) : <PersonOutlineOutlined />}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                            {name}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", overflowWrap: "anywhere" }}
                        >
                            {visitor.email || t("visitsSection.noAccountEmail", "No account")}
                            {" · "}
                            {formatDateTime(visitor.startedAt, locale)}
                        </Typography>
                    </Box>

                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                        <Chip
                            size="small"
                            icon={<FiberManualRecord sx={{ fontSize: 12 }} />}
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
                            label={`${visitor.pageViews || 0} ${t("visitsSection.pageViewsLabel", "pages")}`}
                        />

                        <Chip
                            size="small"
                            variant="outlined"
                            icon={<AccessTimeOutlined />}
                            label={formatDuration(visitor.activeSeconds)}
                        />

                        <Button
                            size="small"
                            onClick={() => setOpen((value) => !value)}
                            endIcon={open ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                            disabled={!pageHistory.length}
                            sx={{ textTransform: "none" }}
                        >
                            {t("visitsSection.navigationJourney", "Journey")}
                        </Button>
                    </Stack>
                </Stack>

                <Collapse in={open} unmountOnExit>
                    <Timeline
                        position="right"
                        sx={{
                            p: 0,
                            mt: 2,
                            mb: 0,
                            "& .MuiTimelineItem-root:before": { flex: 0, padding: 0 },
                        }}
                    >
                        <JourneyItem
                            time={formatTime(visitor.startedAt, locale)}
                            dot={<TimelineDot color="success" />}
                            title={t("visitsSection.sessionStarted", "Session started")}
                        />

                        {pageHistory.map((page, index) => (
                            <JourneyItem
                                key={`${page.path}-${index}`}
                                time={formatTime(page.visitedAt, locale)}
                                dot={
                                    <TimelineDot
                                        color={index === pageHistory.length - 1 ? "primary" : "grey"}
                                    />
                                }
                                title={`${t("visitsSection.pageVisited", "Page")} #${index + 1}`}
                            >
                                <Typography
                                    variant="body2"
                                    component="code"
                                    sx={{
                                        display: "block",
                                        mt: 0.5,
                                        p: 0.75,
                                        borderRadius: 1.5,
                                        bgcolor: "action.hover",
                                        color: "primary.main",
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {page.path}
                                </Typography>

                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {t("visitsSection.timeSpent", "Time spent")}:{" "}
                                    <strong>{formatDuration(page.durationSeconds)}</strong>
                                </Typography>
                            </JourneyItem>
                        ))}

                        <JourneyItem
                            last
                            time={formatTime(visitor.lastActivityAt, locale)}
                            dot={
                                <TimelineDot
                                    variant="outlined"
                                    color={visitor.isActive ? "success" : "warning"}
                                />
                            }
                            title={
                                visitor.isActive
                                    ? t("visitsSection.stillBrowsing", "Still browsing")
                                    : t("visitsSection.lastInteraction", "Last recorded interaction")
                            }
                        />
                    </Timeline>
                </Collapse>
            </CardContent>
        </Card>
    );
}

export default function VisitsSection() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);

    const [range, setRange] = useState("30d");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [range, filter]);

    const { data, loading, error, reload } = useAnalyticsData(
        "/property/dashboard/visits",
        { range, filter, page, limit: PAGE_SIZE },
        { refreshMs: LIVE_REFRESH_MS }
    );

    if (loading && !data) return <LoadingState />;

    const summary = data?.summary || {};
    const visitors = data?.visitors || [];
    const pagination = data?.pagination || { totalPages: 0, total: 0 };
    const peakHour = getPeakHour(data?.hourly, "sessions");

    const pageItems = (rows = [], valueKey, extra) =>
        rows.map((row) => ({
            key: row.path,
            primary: row.path,
            value: row[valueKey],
            valueLabel: formatNumber(row[valueKey], locale),
            extra: extra?.(row),
        }));

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<VisibilityOutlined />}
                title={t("visitsSection.title", "Visits")}
                subtitle={t(
                    "visitsSection.subtitle",
                    "Traffic, engagement and navigation behaviour."
                )}
            >
                <Chip
                    color="success"
                    icon={<FiberManualRecord sx={{ fontSize: 12 }} />}
                    label={t("visitsSection.activeNow", "{{count}} online now", {
                        count: formatNumber(summary.activeNow, locale),
                    })}
                    sx={{ fontWeight: 700 }}
                />
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid>
                <StatCard
                    title={t("visitsSection.totalVisits", "Sessions")}
                    value={formatNumber(summary.totalVisits, locale)}
                    change={summary.visitsChange}
                    description={t("visitsSection.todayCount", "{{count}} today", {
                        count: formatNumber(summary.dailyVisits, locale),
                    })}
                    icon={<VisibilityOutlined />}
                    locale={locale}
                />

                <StatCard
                    title={t("visitsSection.uniqueVisitors", "Unique visitors")}
                    value={formatNumber(summary.uniqueVisitors, locale)}
                    change={summary.uniqueVisitorsChange}
                    description={t("visitsSection.registeredUsers", "{{count}} signed-in users", {
                        count: formatNumber(summary.registeredUsers, locale),
                    })}
                    icon={<PeopleAltOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <StatCard
                    title={t("visitsSection.avgSession", "Avg. session time")}
                    value={formatDuration(summary.avgSessionSeconds)}
                    change={summary.avgSessionChange}
                    description={t("visitsSection.totalTime", "{{time}} in total", {
                        time: formatDuration(summary.totalActiveSeconds),
                    })}
                    icon={<AccessTimeOutlined />}
                    color="#0891B2"
                    locale={locale}
                />

                <StatCard
                    title={t("visitsSection.bounceRate", "Bounce rate")}
                    value={formatPercent(summary.bounceRate, locale)}
                    change={summary.bounceRateChange}
                    inverse
                    description={t("visitsSection.bounceDescription", "Sessions with one page")}
                    icon={<UndoOutlined />}
                    color="#EA580C"
                    locale={locale}
                />

                <StatCard
                    title={t("visitsSection.pagesPerSession", "Pages per session")}
                    value={formatDecimal(summary.pagesPerSession, locale)}
                    icon={<LayersOutlined />}
                    color="#9333EA"
                    locale={locale}
                />

                <StatCard
                    title={t("visitsSection.registeredShare", "Signed-in sessions")}
                    value={formatPercent(summary.registeredShare, locale)}
                    icon={<LoginOutlined />}
                    color="#2563EB"
                    locale={locale}
                />

                <StatCard
                    title={t("visitsSection.activeTimeToday", "Active time today")}
                    value={formatDuration(summary.dailyActiveSeconds)}
                    icon={<AccessTimeOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <StatCard
                    title={t("visitsSection.peakHour", "Busiest hour")}
                    value={peakHour === null ? "—" : formatHour(peakHour)}
                    description={t("visitsSection.peakHourDescription", "Most sessions start")}
                    icon={<AccessTimeOutlined />}
                    color="#EC4899"
                    locale={locale}
                />
            </KpiGrid>

            <ChartCard
                title={t("visitsSection.trend", "Traffic over time")}
                subtitle={t("visitsSection.trendDescription", "Sessions and unique visitors")}
                height={320}
            >
                <TrendChart
                    data={data?.trend || []}
                    locale={locale}
                    series={[
                        { key: "sessions", name: t("visitsSection.totalVisits", "Sessions"), color: "#2563EB" },
                        { key: "uniqueVisitors", name: t("visitsSection.uniqueVisitors", "Unique visitors"), color: "#16A34A" },
                    ]}
                />
            </ChartCard>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("visitsSection.topPages", "Most viewed pages")}
                    subtitle={t("visitsSection.topPagesDescription", "Views and average time on page")}
                    height={null}
                >
                    <RankedList
                        items={pageItems(data?.topPages, "views", (row) =>
                            t("visitsSection.avgTime", "avg {{time}}", {
                                time: formatDuration(row.avgDurationSeconds),
                            })
                        )}
                    />
                </ChartCard>

                <ChartCard
                    title={t("visitsSection.hourly", "Sessions by hour")}
                    subtitle={t("visitsSection.hourlyDescription", "When visitors arrive (Morocco time)")}
                    height={340}
                >
                    <HourlyChart
                        data={data?.hourly || []}
                        valueKey="sessions"
                        name={t("visitsSection.totalVisits", "Sessions")}
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard
                    title={t("visitsSection.entryPages", "Entry pages")}
                    subtitle={t("visitsSection.entryPagesDescription", "Where sessions start")}
                    action={<LoginOutlined color="action" />}
                    height={null}
                >
                    <RankedList items={pageItems(data?.entryPages, "sessions")} color="#16A34A" />
                </ChartCard>

                <ChartCard
                    title={t("visitsSection.exitPages", "Exit pages")}
                    subtitle={t("visitsSection.exitPagesDescription", "Where sessions end")}
                    action={<ExitToAppOutlined color="action" />}
                    height={null}
                >
                    <RankedList items={pageItems(data?.exitPages, "sessions")} color="#EA580C" />
                </ChartCard>
            </ChartGrid>

            {/* Sessions list */}
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                >
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {t("visitsSection.recentVisitors", "Sessions")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("visitsSection.sessionCount", "{{count}} sessions", {
                                count: formatNumber(pagination.total, locale),
                            })}
                        </Typography>
                    </Box>

                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={filter}
                        onChange={(_event, value) => value && setFilter(value)}
                    >
                        <ToggleButton value="all">{t("visitsSection.filters.all", "All")}</ToggleButton>
                        <ToggleButton value="active">{t("visitsSection.filters.active", "Online")}</ToggleButton>
                        <ToggleButton value="registered">{t("visitsSection.filters.registered", "Signed in")}</ToggleButton>
                        <ToggleButton value="anonymous">{t("visitsSection.filters.anonymous", "Anonymous")}</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {visitors.length === 0 ? (
                    <EmptyState message={t("visitsSection.empty", "No sessions found.")} />
                ) : (
                    <Stack spacing={1.5}>
                        {visitors.map((visitor) => (
                            <VisitorCard key={visitor._id} visitor={visitor} locale={locale} />
                        ))}
                    </Stack>
                )}

                {pagination.totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={page}
                            onChange={(_event, value) => setPage(value)}
                            color="primary"
                            shape="rounded"
                        />
                    </Box>
                )}
            </Stack>
        </Stack>
    );
}
