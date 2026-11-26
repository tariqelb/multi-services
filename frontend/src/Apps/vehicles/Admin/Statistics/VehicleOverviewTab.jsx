// Vehicles › Statistics › Overview: visitors, views, contacts, external
// clicks, new listings, saves, alerts, requests and portfolio in one place.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";
import {
    AutoStoriesOutlined,
    BookmarkBorderOutlined,
    CampaignOutlined,
    DashboardOutlined,
    DirectionsCarOutlined,
    ForumOutlined,
    MouseOutlined,
    NotificationsActiveOutlined,
    OpenInNewOutlined,
    PeopleAltOutlined,
    PhoneInTalkOutlined,
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
} from "../../../../Components/Analytics/AnalyticsUI";
import { formatNumber, formatPercent, getLocale } from "../../../../Components/Analytics/analyticsUtils";

const KPIS = [
    { key: "uniqueVisitors", label: "Unique visitors", icon: <PeopleAltOutlined />, color: "#2563EB" },
    { key: "views", label: "Listing views", icon: <MouseOutlined />, color: "#0891B2" },
    { key: "contacts", label: "Contacts", icon: <PhoneInTalkOutlined />, color: "#16A34A" },
    { key: "externalClicks", label: "External clicks", icon: <OpenInNewOutlined />, color: "#EA580C" },
    { key: "newListings", label: "New listings", icon: <DirectionsCarOutlined />, color: "#9333EA" },
    { key: "saves", label: "Saves", icon: <BookmarkBorderOutlined />, color: "#EC4899" },
    { key: "newAlerts", label: "New alerts", icon: <NotificationsActiveOutlined />, color: "#F59E0B" },
    { key: "newRequests", label: "Requests posted", icon: <CampaignOutlined />, color: "#0891B2" },
    { key: "newReplies", label: "Replies to requests", icon: <ForumOutlined />, color: "#16A34A" },
    { key: "newPortfolio", label: "Portfolio items", icon: <AutoStoriesOutlined />, color: "#9333EA" },
];

const FUNNEL_COLORS = ["#2563EB", "#0891B2", "#EC4899", "#16A34A"];

export default function VehicleOverviewTab() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const [range, setRange] = useState("30d");
    const { data, loading, error, reload } = useAnalyticsData("/vehicles/admin/statistics/overview", { range });

    if (loading && !data) return <LoadingState />;

    const kpis = data?.kpis || {};
    const ratios = data?.ratios || {};
    const top = data?.funnel?.[0]?.value || 0;
    const name = (value) => t(`vehicleStats.values.${value}`, value);

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<DashboardOutlined />}
                title={t("vehicleStats.overview.title", "Vehicles overview")}
                subtitle={t("vehicleStats.overview.subtitle", "Cars, motos & bikes, spare parts and external listings.")}
            >
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid columns={5}>
                {KPIS.map((item) => (
                    <StatCard
                        key={item.key}
                        title={t(`vehicleStats.kpis.${item.key}`, item.label)}
                        value={formatNumber(kpis[item.key]?.value, locale)}
                        change={kpis[item.key]?.change}
                        icon={item.icon}
                        color={item.color}
                        locale={locale}
                    />
                ))}
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard title={t("vehicleStats.overview.trend", "Views, contacts, external clicks and saves")} height={320}>
                    <TrendChart
                        data={data?.trend || []}
                        locale={locale}
                        series={[
                            { key: "views", name: t("vehicleStats.kpis.views", "Listing views"), color: "#0891B2" },
                            { key: "contacts", name: t("vehicleStats.kpis.contacts", "Contacts"), color: "#16A34A" },
                            { key: "externalClicks", name: t("vehicleStats.kpis.externalClicks", "External clicks"), color: "#EA580C" },
                            { key: "saves", name: t("vehicleStats.kpis.saves", "Saves"), color: "#EC4899" },
                        ]}
                    />
                </ChartCard>
                <ChartCard title={t("vehicleStats.overview.funnel", "Visitor journey")} height={null}>
                    <Stack spacing={1.5}>
                        {(data?.funnel || []).map((step, index) => (
                            <Box key={step.key}>
                                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {t(`vehicleStats.funnel.${step.key}`, step.key)}
                                </Typography>
                                <Box sx={{ height: 34, borderRadius: 2, bgcolor: "action.hover", overflow: "hidden" }}>
                                    <Box
                                        sx={{
                                            width: `${top ? Math.max(6, (step.value / top) * 100) : 6}%`,
                                            height: "100%",
                                            bgcolor: FUNNEL_COLORS[index],
                                            color: "#fff",
                                            fontWeight: 800,
                                            display: "flex",
                                            alignItems: "center",
                                            px: 1.5,
                                        }}
                                    >
                                        {formatNumber(step.value, locale)}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                        <RateBar label={t("vehicleStats.overview.contactRate", "Views that led to a contact")} value={ratios.contactRate} color="#16A34A" locale={locale} />
                        <RateBar label={t("vehicleStats.overview.saveRate", "Saves per view")} value={ratios.saveRate} color="#EC4899" locale={locale} />
                    </Stack>
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard title={t("vehicleStats.overview.online", "Listings online")} height={300}>
                    <DonutChart data={(data?.availableByType || []).map((row) => ({ ...row, name: name(row.name) }))} locale={locale} />
                </ChartCard>
                <ChartCard title={t("vehicleStats.overview.channels", "Contacts by channel")} height={300}>
                    <DonutChart data={(data?.contactChannels || []).map((row) => ({ name: name(row.name), value: row.count }))} locale={locale} />
                </ChartCard>
            </ChartGrid>

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {t("vehicleStats.overview.note", "Views, contacts and external clicks are counted from now on; the contact rate is {{rate}} in this period.", {
                    rate: formatPercent(ratios.contactRate, locale),
                })}
            </Typography>
        </Stack>
    );
}
