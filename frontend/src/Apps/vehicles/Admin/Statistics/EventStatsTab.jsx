// Vehicles › Statistics: one tab of counted events (details pages opened,
// external listings opened, contact buttons pressed). Same layout for the three.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack } from "@mui/material";
import { InsightsOutlined, PeopleAltOutlined, PercentOutlined, Inventory2Outlined } from "@mui/icons-material";

import {
    BarChartView,
    ChartCard,
    ChartGrid,
    DonutChart,
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
    useAnalyticsData,
} from "../../../../Components/Analytics/AnalyticsUI";
import { formatDecimal, formatNumber, formatPercent, getLocale } from "../../../../Components/Analytics/analyticsUtils";
import TypeChips from "../../../../Components/Analytics/TypeChips";

export default function EventStatsTab({ url, icon, title, subtitle, color = "#2563EB", typeOptions, breakdown, rateLabel }) {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const [range, setRange] = useState("30d");
    const [type, setType] = useState("all");
    const { data, loading, error, reload } = useAnalyticsData(url, typeOptions ? { range, type } : { range });

    if (loading && !data) return <LoadingState />;

    const summary = data?.summary || {};
    const name = (value) => t(`vehicleStats.values.${value}`, value);
    const breakdownRows = (data?.[breakdown] || []).map((row) => ({ name: name(row.name), value: row.count }));

    return (
        <Stack spacing={3}>
            <SectionHeader icon={icon} title={title} subtitle={subtitle}>
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            {typeOptions && <TypeChips value={type} onChange={setType} options={typeOptions} />}

            <ErrorBanner error={error} />

            <KpiGrid>
                <StatCard
                    title={t("vehicleStats.events.total", "Total")}
                    value={formatNumber(summary.total?.value, locale)}
                    change={summary.total?.change}
                    icon={<InsightsOutlined />}
                    color={color}
                    locale={locale}
                />
                <StatCard
                    title={t("vehicleStats.events.unique", "Unique visitors")}
                    value={formatNumber(summary.uniqueVisitors?.value, locale)}
                    change={summary.uniqueVisitors?.change}
                    description={t("vehicleStats.events.perVisitor", "{{value}} per visitor", { value: formatDecimal(summary.perVisitor, locale) })}
                    icon={<PeopleAltOutlined />}
                    color="#9333EA"
                    locale={locale}
                />
                <StatCard
                    title={t("vehicleStats.events.items", "Listings concerned")}
                    value={formatNumber(summary.items, locale)}
                    icon={<Inventory2Outlined />}
                    color="#0891B2"
                    locale={locale}
                />
                {rateLabel && (
                    <StatCard
                        title={rateLabel}
                        value={formatPercent(data?.contactRate, locale)}
                        icon={<PercentOutlined />}
                        color="#16A34A"
                        locale={locale}
                    />
                )}
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard title={t("vehicleStats.events.trend", "Over time")} height={300}>
                    <TrendChart
                        data={data?.trend || []}
                        locale={locale}
                        series={[
                            { key: "count", name: t("vehicleStats.events.total", "Total"), color },
                            { key: "unique", name: t("vehicleStats.events.unique", "Unique visitors"), color: "#9333EA" },
                        ]}
                    />
                </ChartCard>
                <ChartCard title={t("vehicleStats.events.hours", "Hours of the day")} height={300}>
                    <HourlyChart data={data?.hourly || []} name={t("vehicleStats.events.total", "Total")} color={color} locale={locale} />
                </ChartCard>
            </ChartGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard title={t("vehicleStats.events.topItems", "Top listings")} height={null}>
                    <RankedList
                        color={color}
                        emptyMessage={t("vehicleStats.empty", "Nothing in this period.")}
                        items={(data?.topItems || []).map((row) => ({
                            key: row.id,
                            primary: row.title || "—",
                            secondary: [name(row.itemType), row.city, row.sourceDomain].filter(Boolean).join(" · "),
                            value: row.count,
                            onClick: row.link ? () => window.open(row.link, "_blank", "noopener") : undefined,
                        }))}
                    />
                </ChartCard>
                <ChartCard title={t(`vehicleStats.breakdown.${breakdown}`, breakdown)} height={300}>
                    <DonutChart data={breakdownRows} locale={locale} />
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard title={t("vehicleStats.events.makes", "By make")} height={300}>
                    <BarChartView data={data?.makes || []} bars={[{ key: "count", name: t("vehicleStats.events.total", "Total"), color }]} layout="vertical" locale={locale} />
                </ChartCard>
                <ChartCard title={t("vehicleStats.events.cities", "By city")} height={300}>
                    <BarChartView data={data?.cities || []} bars={[{ key: "count", name: t("vehicleStats.events.total", "Total"), color: "#0891B2" }]} layout="vertical" locale={locale} />
                </ChartCard>
            </ChartGrid>
        </Stack>
    );
}
