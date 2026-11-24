// admin/components/PropertyDemand/PropertyDemandSection.jsx

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import {
    ArchiveOutlined,
    HomeWorkOutlined,
    NotificationsActiveOutlined,
    PeopleAltOutlined,
    QueryStatsOutlined,
    TrendingUpOutlined,
} from "@mui/icons-material";

import SavedPropertyDemandSection from "./SavedPropertyDemandSection";

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
    RefreshButton,
    SectionHeader,
    StatCard,
    TrendChart,
    useAnalyticsData,
} from "../shared/AnalyticsUI";

import {
    formatDate,
    formatDecimal,
    formatNumber,
    formatPercent,
    getFullName,
    getLocale,
    translateValue,
} from "../shared/analyticsUtils";

// demand per available listing
const getGapLevel = (row) => {
    if (!row.supply) return "noSupply";
    if (row.demandPerListing >= 2) return "high";
    if (row.demandPerListing >= 0.5) return "balanced";
    return "low";
};

const GAP_STYLES = {
    noSupply: { color: "error", label: "No supply" },
    high: { color: "warning", label: "Under-supplied" },
    balanced: { color: "success", label: "Balanced" },
    low: { color: "default", label: "Over-supplied" },
};

export default function PropertyDemandSection() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);

    const [range, setRange] = useState("30d");

    const { data, loading, error, reload } = useAnalyticsData(
        "/property/dashboard/property-demand",
        { range }
    );

    const listingLabel = (value) =>
        translateValue(t, "propertyDemand.listingTypes", value);

    const cityListingData = useMemo(() => {
        const grouped = new Map();

        (data?.cityListingTypes || []).forEach((item) => {
            const key = String(item.city || "").toLowerCase();

            if (!grouped.has(key)) {
                grouped.set(key, { city: item.city, forSale: 0, forRent: 0 });
            }

            const row = grouped.get(key);

            if (item.listingType === "For Sale") row.forSale += item.requests;
            if (item.listingType === "For Rent") row.forRent += item.requests;
        });

        return Array.from(grouped.values())
            .sort((a, b) => b.forSale + b.forRent - (a.forSale + a.forRent))
            .slice(0, 8);
    }, [data]);

    if (loading && !data) return <LoadingState />;

    const summary = data?.summary || {};
    const demandVsSupply = data?.demandVsSupply || [];

    const underserved = demandVsSupply.filter((row) =>
        ["noSupply", "high"].includes(getGapLevel(row))
    );

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<QueryStatsOutlined />}
                title={t("propertyDemand.title", "Property demand")}
                subtitle={t(
                    "propertyDemand.subtitle",
                    "What users search for, compared with the listings you have."
                )}
            >
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid columns={3}>
                <StatCard
                    title={t("propertyDemand.totalAlerts", "Alerts created")}
                    value={formatNumber(summary.totalAlerts, locale)}
                    change={summary.totalAlertsChange}
                    description={t("propertyDemand.totalAlertsDescription", "Including archived alerts")}
                    icon={<NotificationsActiveOutlined />}
                    locale={locale}
                />

                <StatCard
                    title={t("propertyDemand.activeAlerts", "Active demand")}
                    value={formatNumber(summary.activeAlerts, locale)}
                    description={t("propertyDemand.activeAlertsDescription", "Alerts still running")}
                    icon={<TrendingUpOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <StatCard
                    title={t("propertyDemand.uniqueUsers", "Searching users")}
                    value={formatNumber(summary.uniqueUsers, locale)}
                    change={summary.uniqueUsersChange}
                    description={t("propertyDemand.alertsPerUser", "{{value}} alerts per user", {
                        value: formatDecimal(summary.alertsPerUser, locale),
                    })}
                    icon={<PeopleAltOutlined />}
                    color="#9333EA"
                    locale={locale}
                />

                <StatCard
                    title={t("propertyDemand.archivedAlerts", "Archived alerts")}
                    value={formatNumber(summary.archivedAlerts, locale)}
                    description={t("propertyDemand.archiveRate", "{{rate}} archive rate", {
                        rate: formatPercent(summary.archiveRate, locale),
                    })}
                    icon={<ArchiveOutlined />}
                    color="#F59E0B"
                    locale={locale}
                />

                <StatCard
                    title={t("propertyDemand.availableListings", "Available listings")}
                    value={formatNumber(summary.availableListings, locale)}
                    description={t("propertyDemand.availableListingsDescription", "Current supply")}
                    icon={<HomeWorkOutlined />}
                    color="#0891B2"
                    locale={locale}
                />

                <StatCard
                    title={t("propertyDemand.underservedCities", "Under-supplied cities")}
                    value={formatNumber(underserved.length, locale)}
                    description={
                        underserved.length
                            ? underserved.slice(0, 3).map((row) => row.city).join(", ")
                            : t("propertyDemand.noUnderserved", "Supply covers demand")
                    }
                    icon={<QueryStatsOutlined />}
                    color="#DC2626"
                    locale={locale}
                />
            </KpiGrid>

            <ChartCard
                title={t("propertyDemand.trend", "Alerts over time")}
                subtitle={t("propertyDemand.trendDescription", "New alerts and how many were later archived")}
                height={320}
            >
                <TrendChart
                    data={data?.demandTrend || []}
                    locale={locale}
                    series={[
                        { key: "active", name: t("propertyDemand.activeAlerts", "Active demand"), color: "#2563EB" },
                        { key: "archived", name: t("propertyDemand.archivedAlerts", "Archived alerts"), color: "#F59E0B" },
                    ]}
                />
            </ChartCard>

            {/* Demand vs supply */}
            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("propertyDemand.demandVsSupply", "Demand vs supply by city")}
                    subtitle={t(
                        "propertyDemand.demandVsSupplyDescription",
                        "Active alerts compared with available listings"
                    )}
                    height={360}
                >
                    <BarChartView
                        nameKey="city"
                        data={demandVsSupply}
                        bars={[
                            { key: "demand", name: t("propertyDemand.demand", "Active alerts"), color: "#2563EB" },
                            { key: "supply", name: t("propertyDemand.supply", "Available listings"), color: "#16A34A" },
                        ]}
                        locale={locale}
                    />
                </ChartCard>

                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 750 }}>
                            {t("propertyDemand.opportunities", "Market opportunities")}
                        </Typography>

                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                            {t(
                                "propertyDemand.opportunitiesDescription",
                                "Alerts per available listing. Higher means owners should publish there."
                            )}
                        </Typography>

                        {demandVsSupply.length === 0 ? (
                            <EmptyState height={160} />
                        ) : (
                            <Stack divider={<Divider flexItem />} spacing={1.25}>
                                {demandVsSupply.map((row) => {
                                    const level = getGapLevel(row);

                                    return (
                                        <Stack
                                            key={row.city}
                                            direction="row"
                                            spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                                    {row.city}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    {t("propertyDemand.gapDetails", "{{demand}} alerts · {{supply}} listings", {
                                                        demand: formatNumber(row.demand, locale),
                                                        supply: formatNumber(row.supply, locale),
                                                    })}
                                                </Typography>
                                            </Box>

                                            <Chip
                                                size="small"
                                                variant={level === "low" ? "outlined" : "filled"}
                                                color={GAP_STYLES[level].color}
                                                label={
                                                    row.demandPerListing === null
                                                        ? t(`propertyDemand.gap.${level}`, GAP_STYLES[level].label)
                                                        : `${formatDecimal(row.demandPerListing, locale, 2)} · ${t(
                                                            `propertyDemand.gap.${level}`,
                                                            GAP_STYLES[level].label
                                                        )}`
                                                }
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        )}
                    </CardContent>
                </Card>
            </ChartGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("propertyDemand.propertyTypes", "Property types: demand vs supply")}
                    subtitle={t("propertyDemand.propertyTypesDescription", "Active alerts and available listings by type")}
                    height={340}
                >
                    <BarChartView
                        layout="vertical"
                        nameKey="label"
                        data={(data?.propertyTypes || []).map((row) => ({
                            ...row,
                            label: translateValue(t, "propertyDemand.propertyTypeNames", row.type),
                        }))}
                        bars={[
                            { key: "requests", name: t("propertyDemand.demand", "Active alerts"), color: "#2563EB" },
                            { key: "supply", name: t("propertyDemand.supply", "Available listings"), color: "#16A34A" },
                        ]}
                        locale={locale}
                    />
                </ChartCard>

                <ChartCard
                    title={t("propertyDemand.listingPreferences", "Buy vs rent")}
                    subtitle={t("propertyDemand.listingPreferencesDescription", "Active alert preferences")}
                    height={340}
                >
                    <DonutChart
                        data={(data?.listingTypes || []).map((row) => ({
                            name: listingLabel(row.type),
                            value: row.requests,
                        }))}
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartCard
                title={t("propertyDemand.cityComparison", "Buying vs renting by city")}
                subtitle={t("propertyDemand.cityComparisonDescription", "Active sale and rental demand across cities")}
                height={340}
            >
                <BarChartView
                    nameKey="city"
                    data={cityListingData}
                    bars={[
                        { key: "forSale", name: listingLabel("For Sale"), color: "#2563EB", stackId: "listing" },
                        { key: "forRent", name: listingLabel("For Rent"), color: "#F59E0B", stackId: "listing" },
                    ]}
                    locale={locale}
                />
            </ChartCard>

            {/* Recent alerts */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Typography variant="h6" sx={{ fontWeight: 750, mb: 2 }}>
                        {t("propertyDemand.recentAlerts", "Recent property alerts")}
                    </Typography>

                    {!data?.recentAlerts?.length ? (
                        <EmptyState
                            height={140}
                            message={t("propertyDemand.noAlerts", "No property alerts found for this period.")}
                        />
                    ) : (
                        <TableContainer>
                            <Table size="small" sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t("propertyDemand.table.city", "City")}</TableCell>
                                        <TableCell>{t("propertyDemand.table.user", "User")}</TableCell>
                                        <TableCell>{t("propertyDemand.table.propertyTypes", "Property types")}</TableCell>
                                        <TableCell>{t("propertyDemand.table.listing", "Listing")}</TableCell>
                                        <TableCell>{t("propertyDemand.table.created", "Created")}</TableCell>
                                        <TableCell>{t("propertyDemand.table.status", "Status")}</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {data.recentAlerts.map((alert) => (
                                        <TableRow key={alert._id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{alert.city}</TableCell>

                                            <TableCell>
                                                {getFullName(alert.user) ||
                                                    alert.user?.email ||
                                                    t("propertyDemand.unknownUser", "Unknown user")}
                                            </TableCell>

                                            <TableCell>
                                                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                                                    {(alert.propertyTypes || []).map((type) => (
                                                        <Chip
                                                            key={type}
                                                            size="small"
                                                            variant="outlined"
                                                            label={translateValue(t, "propertyDemand.propertyTypeNames", type)}
                                                        />
                                                    ))}
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                                                    {(alert.listingTypes || []).map((type) => (
                                                        <Chip
                                                            key={type}
                                                            size="small"
                                                            color={type === "For Sale" ? "primary" : "warning"}
                                                            label={listingLabel(type)}
                                                        />
                                                    ))}
                                                </Stack>
                                            </TableCell>

                                            <TableCell>{formatDate(alert.createdAt, locale)}</TableCell>

                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    color={alert.isArchived ? "default" : "success"}
                                                    label={
                                                        alert.isArchived
                                                            ? t("propertyDemand.archived", "Archived")
                                                            : t("propertyDemand.active", "Active")
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            <Divider />

            <SavedPropertyDemandSection
                range={range}
                alertCities={data?.topCities || []}
            />
        </Stack>
    );
}
