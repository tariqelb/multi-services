// admin/components/PropertyDemand/SavedPropertyDemandSection.jsx
// Saved-property interest. Uses the parent's range when `range` is passed.

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
} from "@mui/material";

import {
    BookmarkOutlined,
    BookmarkRemoveOutlined,
    FavoriteBorderOutlined,
    HomeWorkOutlined,
    PeopleAltOutlined,
    PriceCheckOutlined,
} from "@mui/icons-material";

import {
    BarChartView,
    ChartCard,
    ChartGrid,
    DonutChart,
    EmptyState,
    ErrorBanner,
    KpiGrid,
    LoadingState,
    RangeSelect,
    RankedList,
    SectionHeader,
    StatCard,
    TrendChart,
    useAnalyticsData,
} from "../shared/AnalyticsUI";

import {
    formatDateTime,
    formatDecimal,
    formatNumber,
    formatPercent,
    formatPrice,
    getFullName,
    getLocale,
    translateValue,
} from "../shared/analyticsUtils";

const normalizeCity = (city) => String(city || "Unknown").trim().toLowerCase();

export default function SavedPropertyDemandSection({
    alertCities = [],
    range: parentRange,
}) {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);

    const [ownRange, setOwnRange] = useState("30d");
    const range = parentRange || ownRange;

    const { data, loading, error } = useAnalyticsData(
        "/dashboard/saved-property-demand",
        { range }
    );

    const listingLabel = (value) =>
        translateValue(t, "savedDemand.listingTypes", value);

    // Explicit demand (alerts) vs real interest (saves), by city.
    const comparisonData = useMemo(() => {
        const grouped = new Map();

        alertCities.forEach((item) => {
            grouped.set(normalizeCity(item.city), {
                city: item.city,
                alerts: item.requests || 0,
                saves: 0,
            });
        });

        (data?.topCities || []).forEach((item) => {
            const key = normalizeCity(item.name);

            if (!grouped.has(key)) {
                grouped.set(key, { city: item.name, alerts: 0, saves: 0 });
            }

            grouped.get(key).saves = item.requests || 0;
        });

        return Array.from(grouped.values())
            .sort((a, b) => b.alerts + b.saves - (a.alerts + a.saves))
            .slice(0, 10);
    }, [alertCities, data]);

    if (loading && !data) return <LoadingState minHeight={250} />;

    const summary = data?.summary || {};
    const recentSaves = data?.recentSaves || [];

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<BookmarkOutlined />}
                title={t("savedDemand.title", "Saved properties")}
                subtitle={t(
                    "savedDemand.subtitle",
                    "Which real listings attract interest, and whether it lasts."
                )}
            >
                {!parentRange && <RangeSelect value={ownRange} onChange={setOwnRange} />}
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid columns={3}>
                <StatCard
                    title={t("savedDemand.totalSaves", "Saves")}
                    value={formatNumber(summary.totalSaves, locale)}
                    change={summary.savesChange}
                    description={t("savedDemand.netSaves", "{{count}} net after removals", {
                        count: formatNumber(summary.netSaves, locale),
                    })}
                    icon={<BookmarkOutlined />}
                    locale={locale}
                />

                <StatCard
                    title={t("savedDemand.uniqueUsers", "Interested users")}
                    value={formatNumber(summary.uniqueUsers, locale)}
                    description={t("savedDemand.savesPerUser", "{{value}} saves per user", {
                        value: formatDecimal(summary.savesPerUser, locale),
                    })}
                    icon={<PeopleAltOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <StatCard
                    title={t("savedDemand.uniqueProperties", "Listings saved")}
                    value={formatNumber(summary.uniqueProperties, locale)}
                    description={t("savedDemand.activeSaved", "{{count}} saved right now", {
                        count: formatNumber(summary.activeSavedProperties, locale),
                    })}
                    icon={<HomeWorkOutlined />}
                    color="#9333EA"
                    locale={locale}
                />

                <StatCard
                    title={t("savedDemand.retentionRate", "Still saved")}
                    value={formatPercent(summary.retentionRate, locale)}
                    description={t("savedDemand.retentionDescription", "Of saves made in this period")}
                    icon={<FavoriteBorderOutlined />}
                    color="#EC4899"
                    locale={locale}
                />

                <StatCard
                    title={t("savedDemand.unsaves", "Removed from saved")}
                    value={formatNumber(summary.unsaves, locale)}
                    icon={<BookmarkRemoveOutlined />}
                    color="#F59E0B"
                    locale={locale}
                />

                <StatCard
                    title={t("savedDemand.topCity", "Top city")}
                    value={data?.topCities?.[0]?.name || "—"}
                    description={
                        data?.topCities?.[0]
                            ? t("savedDemand.saveCount", "{{count}} saves", {
                                count: formatNumber(data.topCities[0].requests, locale),
                            })
                            : undefined
                    }
                    icon={<HomeWorkOutlined />}
                    color="#0891B2"
                    locale={locale}
                />
            </KpiGrid>

            <ChartGrid>
                <ChartCard
                    title={t("savedDemand.alertsVsSaves", "Search demand vs listing interest")}
                    subtitle={t(
                        "savedDemand.alertsVsSavesDescription",
                        "Active alerts compared with saves by city"
                    )}
                    height={340}
                >
                    <BarChartView
                        nameKey="city"
                        data={comparisonData}
                        bars={[
                            { key: "alerts", name: t("savedDemand.activeAlerts", "Active alerts"), color: "#2563EB" },
                            { key: "saves", name: t("savedDemand.savedListings", "Saves"), color: "#16A34A" },
                        ]}
                        locale={locale}
                    />
                </ChartCard>

                <ChartCard
                    title={t("savedDemand.trend", "Saves over time")}
                    subtitle={t("savedDemand.trendDescription", "Saves and removals in the selected period")}
                    height={340}
                >
                    <TrendChart
                        data={data?.demandTrend || []}
                        locale={locale}
                        series={[
                            { key: "saves", name: t("savedDemand.saves", "Saves"), color: "#16A34A" },
                            { key: "unsaves", name: t("savedDemand.unsaves", "Removed"), color: "#F59E0B" },
                        ]}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("savedDemand.propertyTypes", "Most saved property types")}
                    height={320}
                >
                    <BarChartView
                        layout="vertical"
                        data={(data?.propertyTypes || []).map((row) => ({
                            ...row,
                            name: translateValue(t, "savedDemand.propertyTypeNames", row.name),
                        }))}
                        bars={[{ key: "requests", name: t("savedDemand.saves", "Saves"), color: "#2563EB" }]}
                        locale={locale}
                    />
                </ChartCard>

                <ChartCard
                    title={t("savedDemand.listingTypes", "Buy vs rent interest")}
                    height={320}
                >
                    <DonutChart
                        data={(data?.listingTypes || []).map((row) => ({
                            name: listingLabel(row.name),
                            value: row.requests,
                        }))}
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            {/* Price insight */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                        <PriceCheckOutlined color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 750 }}>
                            {t("savedDemand.priceInsight", "Price of saved properties")}
                        </Typography>
                    </Stack>

                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                        {t(
                            "savedDemand.priceInsightDescription",
                            "The budget range users actually save, by listing type"
                        )}
                    </Typography>

                    {!data?.priceByListingType?.length ? (
                        <EmptyState height={110} />
                    ) : (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, minmax(0, 1fr))",
                                    lg: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 2,
                            }}
                        >
                            {data.priceByListingType.map((row) => (
                                <Box
                                    key={row.name}
                                    sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}
                                >
                                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        {listingLabel(row.name)}
                                    </Typography>

                                    <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                                        {formatPrice(row.avgPrice, locale, t("savedDemand.currency", "MAD"))}
                                    </Typography>

                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {t("savedDemand.priceRange", "Average · {{min}} – {{max}} · {{count}} saves", {
                                            min: formatPrice(row.minPrice, locale, ""),
                                            max: formatPrice(row.maxPrice, locale, ""),
                                            count: formatNumber(row.saves, locale),
                                        })}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>

            <ChartGrid>
                <ChartCard
                    title={t("savedDemand.topProperties", "Most saved properties")}
                    subtitle={t("savedDemand.topPropertiesDescription", "Listings with the strongest interest")}
                    height={null}
                >
                    <RankedList
                        color="#16A34A"
                        items={(data?.topSavedProperties || []).map((property) => ({
                            key: property.propertyId,
                            primary: property.title,
                            secondary: [
                                property.city,
                                translateValue(t, "savedDemand.propertyTypeNames", property.propertyType),
                                listingLabel(property.listingType),
                            ]
                                .filter(Boolean)
                                .join(" · "),
                            value: property.saves,
                            valueLabel: t("savedDemand.saveCount", "{{count}} saves", {
                                count: formatNumber(property.saves, locale),
                            }),
                            extra: property.unsaves
                                ? t("savedDemand.removedCount", "{{count}} removed", {
                                    count: formatNumber(property.unsaves, locale),
                                })
                                : formatPrice(property.price, locale, t("savedDemand.currency", "MAD")),
                        }))}
                        emptyMessage={t("savedDemand.noTopProperties", "No saved properties found for this period.")}
                    />
                </ChartCard>

                <ChartCard
                    title={t("savedDemand.recentSaves", "Recent saves")}
                    height={null}
                >
                    {recentSaves.length === 0 ? (
                        <EmptyState
                            height={160}
                            message={t("savedDemand.noRecentSaves", "No saved-property activity found for this period.")}
                        />
                    ) : (
                        <Stack spacing={1.25}>
                            {recentSaves.map((record) => (
                                <Stack
                                    key={record._id}
                                    direction="row"
                                    spacing={1.5}
                                    sx={{ justifyContent: "space-between",
                                        p: 1.25,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                            {record.property?.title}
                                        </Typography>

                                        <Typography variant="caption" component="div" noWrap sx={{ color: "text.secondary" }}>
                                            {getFullName(record.user) ||
                                                record.user?.email ||
                                                t("savedDemand.unknownUser", "Unknown user")}
                                            {" · "}
                                            {record.property?.city}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ textAlign: "end", flexShrink: 0 }}>
                                        <Typography variant="caption" component="div" sx={{ fontWeight: 600 }}>
                                            {formatDateTime(record.createdAt, locale)}
                                        </Typography>

                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {formatPrice(record.property?.price, locale, t("savedDemand.currency", "MAD"))}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                </ChartCard>
            </ChartGrid>
        </Stack>
    );
}
