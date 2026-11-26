// src/Components/Analytics/ActivityPanel.jsx
//
// "Publications & community" tab of a service's statistics: new listings per
// type, requests and replies, portfolio articles and videos, reviews and the
// most active publishers. Each service gives its own labels:
//   <ActivityPanel url="/property/dashboard/activity" listingTypes={[{ key: "properties", label, color }, ...]} />
// The endpoint answers:
//   { kpis: { [key]: { value, change } }, ratios, inventory, listingsByType,
//     listingTrend, communityTrend, requestCities, requestTransactions, publishers, extra }

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack } from "@mui/material";
import { AutoStoriesOutlined, CampaignOutlined, ForumOutlined, GroupsOutlined, StarBorderOutlined } from "@mui/icons-material";

import {
    BarChartView,
    ChartCard,
    ChartGrid,
    DonutChart,
    ErrorBanner,
    KpiGrid,
    LoadingState,
    RangeSelect,
    RankedList,
    RateBar,
    RefreshButton,
    SectionHeader,
    StatCard,
    TrendChart,
    useAnalyticsData,
} from "./AnalyticsUI";
import { formatDecimal, formatNumber, getLocale } from "./analyticsUtils";

export default function ActivityPanel({ url, title, subtitle, listingTypes = [], translateTransaction = (value) => value, profilePath }) {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const [range, setRange] = useState("30d");
    const { data, loading, error, reload } = useAnalyticsData(url, { range });

    if (loading && !data) return <LoadingState />;

    const kpis = data?.kpis || {};
    const ratios = data?.ratios || {};
    const label = (key) => listingTypes.find((type) => type.key === key)?.label || key;

    return (
        <Stack spacing={3}>
            <SectionHeader icon={<GroupsOutlined />} title={title} subtitle={subtitle}>
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid>
                {listingTypes.map((type) => (
                    <StatCard
                        key={type.key}
                        title={type.newLabel || type.label}
                        value={formatNumber(kpis[type.kpi]?.value, locale)}
                        change={kpis[type.kpi]?.change}
                        icon={type.icon}
                        color={type.color}
                        locale={locale}
                    />
                ))}
                <StatCard
                    title={t("activityStats.requests", "Requests posted")}
                    value={formatNumber(kpis.requests?.value, locale)}
                    change={kpis.requests?.change}
                    icon={<CampaignOutlined />}
                    color="#0891B2"
                    locale={locale}
                />
                <StatCard
                    title={t("activityStats.replies", "Replies to requests")}
                    value={formatNumber(kpis.replies?.value, locale)}
                    change={kpis.replies?.change}
                    description={t("activityStats.repliesPerRequest", "{{value}} per request", { value: formatDecimal(ratios.repliesPerRequest, locale) })}
                    icon={<ForumOutlined />}
                    color="#16A34A"
                    locale={locale}
                />
                <StatCard
                    title={t("activityStats.portfolio", "Portfolio articles / videos")}
                    value={`${formatNumber(kpis.articles?.value, locale)} / ${formatNumber(kpis.videos?.value, locale)}`}
                    description={t("activityStats.portfolioAuthors", "{{count}} authors", { count: formatNumber(ratios.portfolioAuthors, locale) })}
                    icon={<AutoStoriesOutlined />}
                    color="#9333EA"
                    locale={locale}
                />
                <StatCard
                    title={t("activityStats.reviews", "Reviews")}
                    value={formatNumber(kpis.reviews?.value, locale)}
                    change={kpis.reviews?.change}
                    description={ratios.averageRating ? `${formatDecimal(ratios.averageRating, locale)} ★` : undefined}
                    icon={<StarBorderOutlined />}
                    color="#F59E0B"
                    locale={locale}
                />
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard title={t("activityStats.listingTrend", "New listings")} height={300}>
                    <TrendChart
                        data={data?.listingTrend || []}
                        locale={locale}
                        stacked
                        series={listingTypes.map((type) => ({ key: type.key, name: type.label, color: type.color }))}
                    />
                </ChartCard>
                <ChartCard title={t("activityStats.online", "Listings online")} height={300}>
                    <DonutChart
                        data={(data?.inventory || []).map((item) => ({
                            ...item,
                            name: label(item.name),
                            color: listingTypes.find((type) => type.key === item.name)?.color,
                        }))}
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard title={t("activityStats.communityTrend", "Requests, replies and portfolio")} height={300}>
                    <TrendChart
                        data={data?.communityTrend || []}
                        locale={locale}
                        series={[
                            { key: "requests", name: t("activityStats.requests", "Requests posted"), color: "#0891B2" },
                            { key: "replies", name: t("activityStats.replies", "Replies to requests"), color: "#16A34A" },
                            { key: "portfolio", name: t("activityStats.portfolioItems", "Portfolio items"), color: "#9333EA" },
                        ]}
                    />
                </ChartCard>
                <ChartCard title={t("activityStats.requestQuality", "Requests")} height={null}>
                    <Stack spacing={2}>
                        <RateBar
                            label={t("activityStats.answeredRate", "Requests with at least one reply")}
                            value={ratios.answeredRequestRate}
                            color="#16A34A"
                            locale={locale}
                        />
                        <RankedList
                            showRank={false}
                            color="#0891B2"
                            items={(data?.requestTransactions || []).map((row) => ({
                                key: row.name,
                                primary: translateTransaction(row.name),
                                value: row.count,
                            }))}
                        />
                    </Stack>
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard title={t("activityStats.requestCities", "Requests by city")} height={300}>
                    <BarChartView
                        data={data?.requestCities || []}
                        bars={[{ key: "count", name: t("activityStats.requests", "Requests posted"), color: "#0891B2" }]}
                        layout="vertical"
                        locale={locale}
                    />
                </ChartCard>
                <ChartCard title={t("activityStats.publishers", "Most active publishers")} height={null}>
                    <RankedList
                        color="#9333EA"
                        emptyMessage={t("activityStats.noPublishers", "No new listings in this period.")}
                        items={(data?.publishers || []).map((row) => ({
                            key: row.id,
                            primary: row.name,
                            secondary: row.email,
                            value: row.listings,
                            onClick: profilePath ? () => window.open(profilePath(row.id), "_blank", "noopener") : undefined,
                        }))}
                    />
                </ChartCard>
            </ChartGrid>

            {data?.extra?.length > 0 && (
                <ChartGrid>
                    {data.extra.map((block) => (
                        <ChartCard key={block.key} title={t(`activityStats.extra.${block.key}`, block.title)} height={300}>
                            <BarChartView
                                data={block.rows || []}
                                bars={[{ key: "count", name: t(`activityStats.extra.${block.key}`, block.title), color: "#2563EB" }]}
                                layout="vertical"
                                locale={locale}
                            />
                        </ChartCard>
                    ))}
                </ChartGrid>
            )}
        </Stack>
    );
}

