// admin/components/Overview/OverviewSection.jsx
// NEW: platform-wide KPIs, visitor journey, traffic & lead trends.

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import {
    AutoStoriesOutlined,
    BookmarkBorderOutlined,
    CampaignOutlined,
    DashboardOutlined,
    ForumOutlined,
    HomeWorkOutlined,
    MouseOutlined,
    NotificationsActiveOutlined,
    OpenInNewOutlined,
    PeopleAltOutlined,
    PersonAddAltOutlined,
    PhoneInTalkOutlined,
    VisibilityOutlined,
} from "@mui/icons-material";

import {
    ChartCard,
    ChartGrid,
    DonutChart,
    ErrorBanner,
    KpiGrid,
    LoadingState,
    RangeSelect,
    RateBar,
    RefreshButton,
    SectionHeader,
    StatCard,
    TrendChart,
    useAnalyticsData,
} from "../shared/AnalyticsUI";

import {
    formatDecimal,
    formatNumber,
    formatPercent,
    getLocale,
} from "../shared/analyticsUtils";

const KPI_CONFIG = [
    { key: "uniqueVisitors", label: "Unique visitors", icon: <PeopleAltOutlined />, color: "#2563EB" },
    { key: "sessions", label: "Sessions", icon: <VisibilityOutlined />, color: "#0891B2" },
    { key: "newUsers", label: "New accounts", icon: <PersonAddAltOutlined />, color: "#16A34A" },
    // Properties, roommate announcements, hotels & riads.
    { key: "newListings", label: "New listings (all types)", icon: <HomeWorkOutlined />, color: "#9333EA" },
    { key: "propertyClicks", label: "Property views", icon: <MouseOutlined />, color: "#2563EB" },
    { key: "externalClicks", label: "External clicks", icon: <OpenInNewOutlined />, color: "#EA580C" },
    { key: "saves", label: "Saved listings", icon: <BookmarkBorderOutlined />, color: "#EC4899" },
    { key: "contacts", label: "Contacts", icon: <PhoneInTalkOutlined />, color: "#16A34A" },
    { key: "newAlerts", label: "New alerts", icon: <NotificationsActiveOutlined />, color: "#F59E0B" },
    { key: "newRequests", label: "Requests posted", icon: <CampaignOutlined />, color: "#0891B2" },
    { key: "newReplies", label: "Replies to requests", icon: <ForumOutlined />, color: "#16A34A" },
    { key: "newPortfolio", label: "Portfolio items", icon: <AutoStoriesOutlined />, color: "#9333EA" },
];

const FUNNEL_LABELS = {
    visitors: "Unique visitors",
    propertyViewers: "Viewed a property",
    savers: "Saved a property",
    contactingClients: "Contacted an owner",
};

const FUNNEL_COLORS = ["#2563EB", "#0891B2", "#EC4899", "#16A34A"];

function Funnel({ steps = [], locale }) {
    const { t } = useTranslation();
    const top = steps[0]?.value || 0;

    return (
        <Stack spacing={1.5}>
            {steps.map((step, index) => {
                const width = top ? Math.max(6, (step.value / top) * 100) : 6;

                return (
                    <Box key={step.key}>
                        <Stack
                            direction="row"
                            spacing={1} sx={{ justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {t(`overview.funnel.${step.key}`, FUNNEL_LABELS[step.key])}
                            </Typography>

                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {index > 0 &&
                                    t("overview.funnel.fromPrevious", "{{rate}} of previous step", {
                                        rate: formatPercent(step.rateFromPrevious, locale),
                                    })}
                            </Typography>
                        </Stack>

                        <Box
                            sx={{
                                height: 38,
                                borderRadius: 2,
                                bgcolor: "action.hover",
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    width: `${width}%`,
                                    height: "100%",
                                    bgcolor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                                    display: "flex",
                                    alignItems: "center",
                                    px: 1.5,
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: 14,
                                    whiteSpace: "nowrap",
                                    transition: "width 0.4s ease",
                                }}
                            >
                                {formatNumber(step.value, locale)}
                            </Box>
                        </Box>
                    </Box>
                );
            })}

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {t(
                    "overview.funnel.note",
                    "Visitors are counted by device; saves and contacts by account."
                )}
            </Typography>
        </Stack>
    );
}

export default function OverviewSection() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);

    const [range, setRange] = useState("30d");

    const { data, loading, error, reload } = useAnalyticsData(
        "/property/dashboard/overview",
        { range }
    );

    if (loading && !data) return <LoadingState />;

    const kpis = data?.kpis || {};

    // "12 properties · 4 roommates · 2 establishments"
    const contactsBreakdown = (data?.contactsByType || [])
        .filter((item) => item.value > 0)
        .map((item) =>
            t(`overview.contactsByType.${item.name}`, {
                count: Number(item.value) || 0,
                value: formatNumber(item.value, locale),
                defaultValue: `${formatNumber(item.value, locale)} ${item.name}`,
            })
        )
        .join(" · ");
    const ratios = data?.ratios || {};

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<DashboardOutlined />}
                title={t("overview.title", "Platform overview")}
                subtitle={t(
                    "overview.subtitle",
                    "Traffic, engagement and leads across the whole marketplace."
                )}
            >
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid>
                {KPI_CONFIG.map((item) => (
                    <StatCard
                        key={item.key}
                        title={t(`overview.kpis.${item.key}`, item.label)}
                        value={formatNumber(kpis[item.key]?.value, locale)}
                        change={kpis[item.key]?.change}
                        description={item.key === "contacts" ? contactsBreakdown : undefined}
                        icon={item.icon}
                        color={item.color}
                        locale={locale}
                    />
                ))}
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("overview.trafficTrend", "Traffic")}
                    subtitle={t(
                        "overview.trafficTrendDescription",
                        "Sessions and property views over time"
                    )}
                    height={320}
                >
                    <TrendChart
                        data={data?.trend || []}
                        locale={locale}
                        series={[
                            { key: "sessions", name: t("overview.kpis.sessions", "Sessions"), color: "#0891B2" },
                            { key: "propertyClicks", name: t("overview.kpis.propertyClicks", "Property views"), color: "#2563EB" },
                            { key: "externalClicks", name: t("overview.kpis.externalClicks", "External clicks"), color: "#EA580C" },
                        ]}
                    />
                </ChartCard>

                <ChartCard
                    title={t("overview.funnel.title", "Visitor journey")}
                    subtitle={t(
                        "overview.funnel.subtitle",
                        "How far visitors go in the selected period"
                    )}
                    height={null}
                >
                    <Funnel steps={data?.funnel || []} locale={locale} />
                </ChartCard>
            </ChartGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("overview.leadsTrend", "Interest & leads")}
                    subtitle={t(
                        "overview.leadsTrendDescription",
                        "Saved properties and owner contacts over time"
                    )}
                    height={300}
                >
                    <TrendChart
                        data={data?.trend || []}
                        locale={locale}
                        series={[
                            { key: "saves", name: t("overview.kpis.saves", "Saved properties"), color: "#EC4899" },
                            { key: "contacts", name: t("overview.kpis.contacts", "Owner contacts"), color: "#16A34A" },
                        ]}
                    />
                </ChartCard>

                <Card
                    elevation={0}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
                >
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 750 }}>
                            {t("overview.ratios.title", "Key ratios")}
                        </Typography>

                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
                            {t("overview.ratios.subtitle", "Quality of traffic in the selected period")}
                        </Typography>

                        <Stack spacing={2.25}>
                            <RateBar
                                label={t("overview.ratios.contactRate", "Views that became contacts")}
                                value={ratios.contactRate}
                                color="#16A34A"
                                locale={locale}
                            />

                            <RateBar
                                label={t("overview.ratios.saveRate", "Views that became saves")}
                                value={ratios.saveRate}
                                color="#EC4899"
                                locale={locale}
                            />

                            <RateBar
                                label={t("overview.ratios.externalShare", "Share of clicks on external listings")}
                                value={ratios.externalShare}
                                color="#EA580C"
                                locale={locale}
                            />

                            <RateBar
                                label={t("overview.ratios.signupRate", "New accounts per unique visitor")}
                                value={ratios.signupRate}
                                color="#2563EB"
                                locale={locale}
                            />

                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {t("overview.ratios.clicksPerSession", "Listing clicks per session")}
                                </Typography>

                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                    {formatDecimal(ratios.clicksPerSession, locale, 2)}
                                </Typography>
                            </Stack>

                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <NotificationsActiveOutlined fontSize="small" color="action" />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {t("overview.kpis.newAlerts", "New property alerts")}
                                    </Typography>
                                </Stack>

                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                    {formatNumber(kpis.newAlerts?.value, locale)}
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </ChartGrid>

            <ChartGrid template="1fr 1fr">
                <ChartCard
                    title={t("overview.inventoryByType", "Listings online")}
                    subtitle={t("overview.inventoryByTypeDescription", "Available properties, open roommate announcements, hotels & riads")}
                    height={300}
                >
                    <DonutChart
                        data={(data?.availableByType || []).map((item) => ({
                            ...item,
                            name: t(`overview.listingTypes.${item.name}`, item.name),
                        }))}
                        locale={locale}
                    />
                </ChartCard>

                <ChartCard
                    title={t("overview.periodComparison", "Period comparison")}
                    subtitle={t(
                        "overview.periodComparisonDescription",
                        "Current period vs the previous one of the same length"
                    )}
                    height={null}
                >
                    {range === "all" ? (
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t(
                                "overview.noComparison",
                                "Select a limited date range to compare with the previous period."
                            )}
                        </Typography>
                    ) : (
                        <Stack spacing={1.25}>
                            {KPI_CONFIG.map((item) => (
                                <Stack
                                    key={item.key}
                                    direction="row"
                                    sx={{ justifyContent: "space-between",
                                        py: 0.75,
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    <Typography variant="body2">
                                        {t(`overview.kpis.${item.key}`, item.label)}
                                    </Typography>

                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {formatNumber(kpis[item.key]?.previous, locale)}
                                        {" → "}
                                        {formatNumber(kpis[item.key]?.value, locale)}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                </ChartCard>
            </ChartGrid>
        </Stack>
    );
}
