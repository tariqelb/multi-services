// admin/components/ExternalListingsClicks/ExternalClicksSection.jsx

import { useEffect, useState } from "react";
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
    HomeWorkOutlined,
    LanguageOutlined,
    LocationCityOutlined,
    LoginOutlined,
    OpenInNewOutlined,
    PeopleAltOutlined,
    QueryStatsOutlined,
} from "@mui/icons-material";

import ExternalListingClickCard from "./ExternalListingClickCard";

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

const API_URL = "/property/external-listings/analytics";
const ITEMS_PER_PAGE = 6;

const ExternalClicksSection = () => {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);

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
    const listings = data?.listings || [];
    const pagination = data?.pagination || { total: 0, totalPages: 0 };

    const clicksLabel = t("adminExternalClicks.charts.clicks", "Clicks");

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<OpenInNewOutlined />}
                title={t("adminExternalClicks.title", "External listing clicks")}
                subtitle={t(
                    "adminExternalClicks.subtitle",
                    "Traffic you send to partner websites and what visitors look for."
                )}
            >
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid>
                <StatCard
                    title={t("adminExternalClicks.summary.clicksInRange", "Clicks in period")}
                    value={formatNumber(summary.clicksInRange, locale)}
                    change={summary.clicksChange}
                    icon={<OpenInNewOutlined />}
                    color="#EA580C"
                    locale={locale}
                />

                <StatCard
                    title={t("adminExternalClicks.summary.uniqueVisitors", "Unique visitors")}
                    value={formatNumber(summary.uniqueVisitors, locale)}
                    description={t("adminExternalClicks.summary.perVisitor", "{{value}} clicks each", {
                        value: formatDecimal(summary.clicksPerVisitor, locale),
                    })}
                    icon={<PeopleAltOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <StatCard
                    title={t("adminExternalClicks.summary.clickedListings", "Listings clicked")}
                    value={formatNumber(summary.clickedListings, locale)}
                    description={t("adminExternalClicks.summary.trackedTotal", "{{count}} tracked overall", {
                        count: formatNumber(summary.totalListings, locale),
                    })}
                    icon={<HomeWorkOutlined />}
                    color="#9333EA"
                    locale={locale}
                />

                <StatCard
                    title={t("adminExternalClicks.summary.registeredShare", "Signed-in clicks")}
                    value={formatPercent(summary.registeredShare, locale)}
                    icon={<LoginOutlined />}
                    color="#2563EB"
                    locale={locale}
                />

                <StatCard
                    title={t("adminExternalClicks.summary.totalClicks", "Lifetime clicks")}
                    value={formatNumber(summary.totalClicks, locale)}
                    icon={<QueryStatsOutlined />}
                    color="#64748B"
                    locale={locale}
                />

                <StatCard
                    title={t("adminExternalClicks.summary.websites", "Partner websites")}
                    value={formatNumber(summary.totalWebsites, locale)}
                    icon={<LanguageOutlined />}
                    color="#0891B2"
                    locale={locale}
                />

                <StatCard
                    title={t("adminExternalClicks.summary.cities", "Cities")}
                    value={formatNumber(summary.totalCities, locale)}
                    icon={<LocationCityOutlined />}
                    color="#EC4899"
                    locale={locale}
                />

                <StatCard
                    title={t("adminExternalClicks.summary.topWebsite", "Top website")}
                    value={charts.websites?.[0]?.name || "—"}
                    description={
                        charts.websites?.[0]
                            ? t("adminExternalClicks.summary.topWebsiteShare", "{{share}} of clicks", {
                                share: formatPercent(charts.websites[0].share, locale),
                            })
                            : undefined
                    }
                    icon={<LanguageOutlined />}
                    color="#EA580C"
                    locale={locale}
                />
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("adminExternalClicks.charts.trend", "Clicks over time")}
                    subtitle={t("adminExternalClicks.charts.trendDescription", "Clicks and unique visitors")}
                    height={320}
                >
                    <TrendChart
                        data={data?.trend || []}
                        locale={locale}
                        series={[
                            { key: "clicks", name: clicksLabel, color: "#EA580C" },
                            { key: "uniqueVisitors", name: t("adminExternalClicks.summary.uniqueVisitors", "Unique visitors"), color: "#16A34A" },
                        ]}
                    />
                </ChartCard>

                <ChartCard
                    title={t("adminExternalClicks.charts.websites", "Clicks by website")}
                    subtitle={t("adminExternalClicks.charts.websitesDescription", "Share of traffic per partner")}
                    height={320}
                >
                    <DonutChart data={charts.websites || []} valueKey="clicks" locale={locale} />
                </ChartCard>
            </ChartGrid>

            <ChartGrid template="1fr 1fr 1fr">
                <ChartCard title={t("adminExternalClicks.charts.propertyTypes", "By property type")} height={300}>
                    <BarChartView
                        layout="vertical"
                        data={(charts.propertyTypes || []).map((row) => ({
                            ...row,
                            name: translateValue(t, "adminExternalClicks.propertyTypes", row.name),
                        }))}
                        bars={[{ key: "clicks", name: clicksLabel, color: "#EA580C" }]}
                        locale={locale}
                        labelWidth={95}
                    />
                </ChartCard>

                <ChartCard title={t("adminExternalClicks.charts.cities", "By city")} height={300}>
                    <BarChartView
                        layout="vertical"
                        data={translateCityRows(t, i18n.language, charts.cities || [])}
                        bars={[{ key: "clicks", name: clicksLabel, color: "#2563EB" }]}
                        locale={locale}
                        labelWidth={95}
                    />
                </ChartCard>

                <ChartCard title={t("adminExternalClicks.charts.hourly", "Clicks by hour")} height={300}>
                    <HourlyChart
                        data={data?.hourly || []}
                        valueKey="clicks"
                        name={clicksLabel}
                        color="#EA580C"
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard
                    title={t("adminExternalClicks.topListings", "Top external listings")}
                    subtitle={t("adminExternalClicks.topListingsDescription", "Most clicked in the selected period")}
                    height={null}
                >
                    <RankedList
                        color="#EA580C"
                        items={(data?.topListings || []).map((item) => ({
                            key: item.externalListingId,
                            primary: item.title || t("adminExternalClicks.card.untitled", "Untitled listing"),
                            secondary: [item.sourceName || item.sourceDomain, item.city && translateCity(t, i18n.language, item.city)]
                                .filter(Boolean)
                                .join(" · "),
                            value: item.clicks,
                            valueLabel: formatNumber(item.clicks, locale),
                            extra: t("adminExternalClicks.visitorsCount", "{{count}} visitors", {
                                count: formatNumber(item.uniqueVisitors, locale),
                            }),
                        }))}
                    />
                </ChartCard>

                <ChartCard
                    title={t("adminExternalClicks.websiteTable", "Website performance")}
                    subtitle={t("adminExternalClicks.websiteTableDescription", "Clicks, visitors and listings per partner")}
                    height={null}
                >
                    <RankedList
                        showRank={false}
                        color="#0891B2"
                        items={(charts.websites || []).map((item) => ({
                            key: item.domain,
                            primary: item.name,
                            secondary: t("adminExternalClicks.websiteDetails", "{{visitors}} visitors · {{listings}} listings", {
                                visitors: formatNumber(item.uniqueVisitors, locale),
                                listings: formatNumber(item.listings, locale),
                            }),
                            value: item.clicks,
                            valueLabel: formatNumber(item.clicks, locale),
                            extra: formatPercent(item.share, locale),
                        }))}
                    />
                </ChartCard>
            </ChartGrid>

            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                >
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {t("adminExternalClicks.listings.title", "Tracked external listings")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("adminExternalClicks.listings.subtitle", "Lifetime counters with clicks in the selected period")}
                        </Typography>
                    </Box>

                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={sort}
                        onChange={(_event, value) => value && setSort(value)}
                    >
                        <ToggleButton value="recent">
                            {t("adminExternalClicks.sort.recent", "Recently clicked")}
                        </ToggleButton>
                        <ToggleButton value="clicks">
                            {t("adminExternalClicks.sort.clicks", "Most clicked")}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {listings.length === 0 ? (
                    <EmptyState
                        message={t("adminExternalClicks.listings.empty", "No external clicks recorded yet.")}
                    />
                ) : (
                    <Grid container spacing={2.5}>
                        {listings.map((listing) => (
                            <Grid key={listing._id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <ExternalListingClickCard
                                    listing={listing}
                                    color="#2563EB"
                                    locale={locale}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {pagination.totalPages > 1 && (
                    <Stack spacing={1} sx={{ alignItems: "center", pt: 1 }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("adminExternalClicks.pagination.showing", "Showing {{from}}–{{to}} of {{total}}", {
                                from: (page - 1) * ITEMS_PER_PAGE + 1,
                                to: (page - 1) * ITEMS_PER_PAGE + listings.length,
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
};

export default ExternalClicksSection;
