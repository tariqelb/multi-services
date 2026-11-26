// Vehicles › Statistics › Alert demand: what people ask to be alerted about
// (cities, makes, cars or motos, sale or rent, budget), compared with the
// vehicles available.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ArchiveOutlined, NotificationsActiveOutlined, PeopleAltOutlined, QueryStatsOutlined } from "@mui/icons-material";

import {
    BarChartView,
    ChartCard,
    ChartGrid,
    DonutChart,
    ErrorBanner,
    KpiGrid,
    LoadingState,
    RangeSelect,
    RefreshButton,
    SectionHeader,
    StatCard,
    TrendChart,
    useAnalyticsData,
} from "../../../../Components/Analytics/AnalyticsUI";
import { formatDecimal, formatNumber, formatPercent, getLocale } from "../../../../Components/Analytics/analyticsUtils";

const gapOf = (row) => (!row.listings ? "noSupply" : row.demandPerListing >= 2 ? "high" : row.demandPerListing >= 0.5 ? "balanced" : "low");
const GAP_COLORS = { noSupply: "error", high: "warning", balanced: "success", low: "default" };

export default function VehicleAlertDemandTab() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const [range, setRange] = useState("30d");
    const { data, loading, error, reload } = useAnalyticsData("/vehicles/admin/statistics/alert-demand", { range });

    if (loading && !data) return <LoadingState />;

    const summary = data?.summary || {};
    const name = (value) => t(`vehicleStats.values.${value}`, value);

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<QueryStatsOutlined />}
                title={t("vehicleStats.alerts.title", "Alert demand")}
                subtitle={t("vehicleStats.alerts.subtitle", "What users ask to be alerted about, compared with the vehicles you have.")}
            >
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid>
                <StatCard
                    title={t("vehicleStats.alerts.created", "Alerts created")}
                    value={formatNumber(summary.created?.value, locale)}
                    change={summary.created?.change}
                    icon={<NotificationsActiveOutlined />}
                    locale={locale}
                />
                <StatCard
                    title={t("vehicleStats.alerts.active", "Active alerts")}
                    value={formatNumber(summary.active, locale)}
                    description={t("vehicleStats.alerts.perUser", "{{value}} per user", { value: formatDecimal(summary.alertsPerUser, locale) })}
                    icon={<NotificationsActiveOutlined />}
                    color="#16A34A"
                    locale={locale}
                />
                <StatCard
                    title={t("vehicleStats.alerts.users", "Searching users")}
                    value={formatNumber(summary.activeUsers, locale)}
                    icon={<PeopleAltOutlined />}
                    color="#9333EA"
                    locale={locale}
                />
                <StatCard
                    title={t("vehicleStats.alerts.archived", "Archived alerts")}
                    value={formatNumber(summary.archived, locale)}
                    description={t("vehicleStats.alerts.archiveRate", "{{rate}} archive rate", { rate: formatPercent(summary.archiveRate, locale) })}
                    icon={<ArchiveOutlined />}
                    color="#F59E0B"
                    locale={locale}
                />
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard title={t("vehicleStats.alerts.trend", "Alerts created over time")} height={300}>
                    <TrendChart data={data?.trend || []} locale={locale} series={[{ key: "alerts", name: t("vehicleStats.alerts.created", "Alerts created"), color: "#2563EB" }]} />
                </ChartCard>
                <ChartCard title={t("vehicleStats.alerts.makes", "Most wanted makes")} height={300}>
                    <BarChartView data={data?.makes || []} bars={[{ key: "alerts", name: t("vehicleStats.alerts.alerts", "Alerts"), color: "#9333EA" }]} layout="vertical" locale={locale} />
                </ChartCard>
            </ChartGrid>

            <ChartGrid template="1fr 1fr 1fr">
                <ChartCard title={t("vehicleStats.alerts.categories", "Cars or motos")} height={260}>
                    <DonutChart data={(data?.categories || []).map((row) => ({ name: name(row.name), value: row.alerts }))} locale={locale} />
                </ChartCard>
                <ChartCard title={t("vehicleStats.alerts.listingTypes", "Sale or rent")} height={260}>
                    <DonutChart data={(data?.listingTypes || []).map((row) => ({ name: name(row.name), value: row.alerts }))} locale={locale} />
                </ChartCard>
                <ChartCard title={t("vehicleStats.alerts.budget", "Maximum budget")} height={260}>
                    <BarChartView data={data?.priceBuckets || []} bars={[{ key: "alerts", name: t("vehicleStats.alerts.alerts", "Alerts"), color: "#0891B2" }]} locale={locale} />
                </ChartCard>
            </ChartGrid>

            <ChartCard title={t("vehicleStats.alerts.supply", "Demand vs supply by city")} subtitle={t("vehicleStats.alerts.supplyHelp", "Active alerts compared with the vehicles available in each city")} height={null}>
                {(data?.demandVsSupply || []).length === 0 ? (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {t("vehicleStats.empty", "Nothing in this period.")}
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t("vehicleStats.alerts.city", "City")}</TableCell>
                                    <TableCell align="right">{t("vehicleStats.alerts.alerts", "Alerts")}</TableCell>
                                    <TableCell align="right">{t("vehicleStats.alerts.available", "Vehicles available")}</TableCell>
                                    <TableCell align="right">{t("vehicleStats.alerts.gap", "Gap")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.demandVsSupply.map((row) => {
                                    const gap = gapOf(row);
                                    return (
                                        <TableRow key={row.city}>
                                            <TableCell>{row.city}</TableCell>
                                            <TableCell align="right">{formatNumber(row.alerts, locale)}</TableCell>
                                            <TableCell align="right">{formatNumber(row.listings, locale)}</TableCell>
                                            <TableCell align="right">
                                                <Chip size="small" color={GAP_COLORS[gap]} label={t(`vehicleStats.gaps.${gap}`, gap)} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </ChartCard>
        </Stack>
    );
}
