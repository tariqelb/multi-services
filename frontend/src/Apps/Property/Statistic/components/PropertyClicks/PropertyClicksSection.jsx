// admin/components/PropertyClicks/PropertyClicksSection.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Box,
    Grid,
    Pagination,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

import {
    HomeWork,
    LocationCity,
    LoginOutlined,
    PeopleAltOutlined,
    PhoneInTalkOutlined,
    QueryStatsOutlined,
    TouchAppOutlined,
    Visibility,
} from "@mui/icons-material";

import PropertyClickCard from "./PropertyClickCard";

import {
    BarChartView,
    ChartCard,
    ChartGrid,
    DonutChart,
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
    useAnalyticsData,
} from "../shared/AnalyticsUI";

import {
    formatDecimal,
    formatNumber,
    formatPercent,
    getLocale,
    translateValue,
    translateCity,
    translateCityRows,
} from "../shared/analyticsUtils";

const API_URL = "/property/clicks";
const ITEMS_PER_PAGE = 6;

export default function PropertyClicksSection() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const navigate = useNavigate();

    const [range, setRange] = useState("30d");
    const [sort, setSort] = useState("recent");
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [range, sort]);

    const { data, loading, error, reload } = useAnalyticsData(API_URL, {
        range,
        sort,
        page,
        limit: ITEMS_PER_PAGE,
    });

    if (loading && !data) return <LoadingState />;

    const summary = data?.summary || {};
    const charts = data?.charts || {};
    const properties = data?.properties || [];
    const pagination = data?.pagination || { total: 0, totalPages: 0 };

    const translateChart = (rows = [], namespace) =>
        rows.map((row) => ({
            ...row,
            name: translateValue(t, `adminPropertyClicks.${namespace}`, row.name),
        }));

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<Visibility />}
                title={t("adminPropertyClicks.title", "Property views")}
                subtitle={t(
                    "adminPropertyClicks.subtitle",
                    "Which internal listings attract attention and convert into contacts."
                )}
            >
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid>
                <StatCard
                    title={t("adminPropertyClicks.summary.clicksInRange", "Views in period")}
                    value={formatNumber(summary.clicksInRange, locale)}
                    change={summary.clicksChange}
                    icon={<Visibility />}
                    locale={locale}
                />

                <StatCard
                    title={t("adminPropertyClicks.summary.uniqueVisitors", "Unique viewers")}
                    value={formatNumber(summary.uniqueVisitors, locale)}
                    description={t("adminPropertyClicks.summary.perVisitor", "{{value}} views each", {
                        value: formatDecimal(summary.clicksPerVisitor, locale),
                    })}
                    icon={<PeopleAltOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <StatCard
                    title={t("adminPropertyClicks.summary.contacts", "Owner contacts")}
                    value={formatNumber(summary.contacts, locale)}
                    icon={<PhoneInTalkOutlined />}
                    color="#0891B2"
                    locale={locale}
                />

                <StatCard
                    title={t("adminPropertyClicks.summary.conversionRate", "View → contact rate")}
                    value={formatPercent(summary.conversionRate, locale)}
                    description={t("adminPropertyClicks.summary.conversionDescription", "Contacts per 100 views")}
                    icon={<TouchAppOutlined />}
                    color="#9333EA"
                    locale={locale}
                />

                <StatCard
                    title={t("adminPropertyClicks.summary.clickedProperties", "Properties viewed")}
                    value={formatNumber(summary.clickedProperties, locale)}
                    description={t("adminPropertyClicks.summary.trackedTotal", "{{count}} tracked overall", {
                        count: formatNumber(summary.totalProperties, locale),
                    })}
                    icon={<HomeWork />}
                    color="#EA580C"
                    locale={locale}
                />

                <StatCard
                    title={t("adminPropertyClicks.summary.registeredShare", "Signed-in viewers")}
                    value={formatPercent(summary.registeredShare, locale)}
                    icon={<LoginOutlined />}
                    color="#2563EB"
                    locale={locale}
                />

                <StatCard
                    title={t("adminPropertyClicks.summary.totalClicks", "Lifetime views")}
                    value={formatNumber(summary.totalClicks, locale)}
                    icon={<QueryStatsOutlined />}
                    color="#64748B"
                    locale={locale}
                />

                <StatCard
                    title={t("adminPropertyClicks.summary.cities", "Cities")}
                    value={formatNumber(summary.totalCities, locale)}
                    icon={<LocationCity />}
                    color="#EC4899"
                    locale={locale}
                />
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("adminPropertyClicks.charts.trend", "Views over time")}
                    subtitle={t("adminPropertyClicks.charts.trendDescription", "Views and unique viewers")}
                    height={320}
                >
                    <TrendChart
                        data={data?.trend || []}
                        locale={locale}
                        series={[
                            { key: "clicks", name: t("adminPropertyClicks.charts.clicks", "Views"), color: "#2563EB" },
                            { key: "uniqueVisitors", name: t("adminPropertyClicks.summary.uniqueVisitors", "Unique viewers"), color: "#16A34A" },
                        ]}
                    />
                </ChartCard>

                <ChartCard
                    title={t("adminPropertyClicks.charts.hourly", "Views by hour")}
                    subtitle={t("adminPropertyClicks.charts.hourlyDescription", "Best time to publish or boost listings")}
                    height={320}
                >
                    <HourlyChart
                        data={data?.hourly || []}
                        valueKey="clicks"
                        name={t("adminPropertyClicks.charts.clicks", "Views")}
                        color="#2563EB"
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartGrid template="1fr 1fr 1fr">
                <ChartCard title={t("adminPropertyClicks.charts.propertyTypes", "By property type")} height={300}>
                    <BarChartView
                        layout="vertical"
                        data={translateChart(charts.propertyTypes, "propertyTypes")}
                        bars={[{ key: "clicks", name: t("adminPropertyClicks.charts.clicks", "Views"), color: "#2563EB" }]}
                        locale={locale}
                        labelWidth={95}
                    />
                </ChartCard>

                <ChartCard title={t("adminPropertyClicks.charts.listingTypes", "Sale vs rent")} height={300}>
                    <DonutChart
                        data={translateChart(charts.listingTypes, "listingTypes")}
                        valueKey="clicks"
                        locale={locale}
                    />
                </ChartCard>

                <ChartCard title={t("adminPropertyClicks.charts.cities", "By city")} height={300}>
                    <BarChartView
                        layout="vertical"
                        data={translateCityRows(t, i18n.language, charts.cities || [])}
                        bars={[{ key: "clicks", name: t("adminPropertyClicks.charts.clicks", "Views"), color: "#16A34A" }]}
                        locale={locale}
                        labelWidth={95}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartCard
                title={t("adminPropertyClicks.topProperties", "Top properties in this period")}
                subtitle={t(
                    "adminPropertyClicks.topPropertiesDescription",
                    "Most viewed listings with their contact conversion"
                )}
                height={null}
            >
                <RankedList
                    items={(data?.topProperties || []).map((item) => ({
                        key: item.propertyId,
                        primary: item.title || t("adminPropertyClicks.properties.untitled", "Untitled property"),
                        secondary: [
                            item.city && translateCity(t, i18n.language, item.city),
                            translateValue(t, "adminPropertyClicks.propertyTypes", item.propertyType),
                            translateValue(t, "adminPropertyClicks.listingTypes", item.listingType),
                        ]
                            .filter(Boolean)
                            .join(" · "),
                        value: item.clicks,
                        valueLabel: t("adminPropertyClicks.viewsCount", "{{count}} views", {
                            count: formatNumber(item.clicks, locale),
                        }),
                        extra: t("adminPropertyClicks.contactsConversion", "{{contacts}} contacts · {{rate}}", {
                            contacts: formatNumber(item.contacts, locale),
                            rate: formatPercent(item.conversionRate, locale),
                        }),
                        onClick: () => navigate(`/properties/${item.propertyId}`),
                    }))}
                />
            </ChartCard>

            {/* All tracked properties */}
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                >
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {t("adminPropertyClicks.properties.title", "All tracked properties")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("adminPropertyClicks.properties.subtitle", "Lifetime counters with views in the selected period")}
                        </Typography>
                    </Box>

                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={sort}
                        onChange={(_event, value) => value && setSort(value)}
                    >
                        <ToggleButton value="recent">
                            {t("adminPropertyClicks.sort.recent", "Recently viewed")}
                        </ToggleButton>
                        <ToggleButton value="clicks">
                            {t("adminPropertyClicks.sort.clicks", "Most viewed")}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {properties.length === 0 ? (
                    <EmptyState
                        message={t(
                            "adminPropertyClicks.empty.description",
                            "No property views have been recorded yet."
                        )}
                    />
                ) : (
                    <Grid container spacing={2.5}>
                        {properties.map((property) => (
                            <Grid key={property.propertyId} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <PropertyClickCard property={property} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {pagination.totalPages > 1 && (
                    <Stack spacing={1} sx={{ alignItems: "center", pt: 1 }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("adminPropertyClicks.pagination.showing", "Showing {{from}}–{{to}} of {{total}}", {
                                from: (page - 1) * ITEMS_PER_PAGE + 1,
                                to: (page - 1) * ITEMS_PER_PAGE + properties.length,
                                total: formatNumber(pagination.total, locale),
                            })}
                        </Typography>

                        <Pagination
                            count={pagination.totalPages}
                            page={page}
                            onChange={(_event, value) => setPage(value)}
                            color="primary"
                            shape="rounded"
                        />
                    </Stack>
                )}
            </Stack>
        </Stack>
    );
}
