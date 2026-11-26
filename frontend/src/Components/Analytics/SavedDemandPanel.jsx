// src/Components/Analytics/SavedDemandPanel.jsx
//
// "Saved demand" of one kind of listing (roommate announcements, hotels &
// riads, vehicles, motos, spare parts...): saves in the period, people who
// saved, listings still saved, most saved listings and their cities.
// The endpoint answers:
//   { summary: { saves, unsaves, uniqueUsers, activeSaved, savesChange, keepRate },
//     trend: [{ date, saves }], topListings: [{ id, title, city, saves, link }],
//     cities: [{ name, count }] }

import { useTranslation } from "react-i18next";
import { BookmarkAddedOutlined, BookmarkBorderOutlined, PeopleAltOutlined, TaskAltOutlined } from "@mui/icons-material";

import {
    BarChartView,
    ChartCard,
    ChartGrid,
    ErrorBanner,
    KpiGrid,
    LoadingState,
    RankedList,
    StatCard,
    TrendChart,
    useAnalyticsData,
} from "./AnalyticsUI";
import { formatNumber, formatPercent, getLocale } from "./analyticsUtils";

export default function SavedDemandPanel({ url, params = {}, color = "#EC4899" }) {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const { data, loading, error } = useAnalyticsData(url, params);

    if (loading && !data) return <LoadingState />;

    const summary = data?.summary || {};

    return (
        <>
            <ErrorBanner error={error} />

            <KpiGrid>
                <StatCard
                    title={t("savedStats.saves", "Saves")}
                    value={formatNumber(summary.saves, locale)}
                    change={summary.savesChange}
                    icon={<BookmarkBorderOutlined />}
                    color={color}
                    locale={locale}
                />
                <StatCard
                    title={t("savedStats.uniqueUsers", "People who saved")}
                    value={formatNumber(summary.uniqueUsers, locale)}
                    icon={<PeopleAltOutlined />}
                    color="#9333EA"
                    locale={locale}
                />
                <StatCard
                    title={t("savedStats.activeSaved", "Still saved")}
                    value={formatNumber(summary.activeSaved, locale)}
                    description={t("savedStats.activeSavedDescription", "Listings in someone's saved list now")}
                    icon={<BookmarkAddedOutlined />}
                    color="#0891B2"
                    locale={locale}
                />
                <StatCard
                    title={t("savedStats.keepRate", "Kept")}
                    value={formatPercent(summary.keepRate, locale)}
                    description={t("savedStats.unsaves", "{{count}} removed again", { count: formatNumber(summary.unsaves, locale) })}
                    icon={<TaskAltOutlined />}
                    color="#16A34A"
                    locale={locale}
                />
            </KpiGrid>

            <ChartCard title={t("savedStats.trend", "Saves over time")} height={280}>
                <TrendChart data={data?.trend || []} locale={locale} series={[{ key: "saves", name: t("savedStats.saves", "Saves"), color }]} />
            </ChartCard>

            <ChartGrid template="7fr 5fr">
                <ChartCard title={t("savedStats.topListings", "Most saved")} height={null}>
                    <RankedList
                        color={color}
                        emptyMessage={t("savedStats.empty", "Nothing saved in this period.")}
                        items={(data?.topListings || []).map((item) => ({
                            key: item.id,
                            primary: item.title,
                            secondary: item.city,
                            value: item.saves,
                            onClick: item.link ? () => window.open(item.link, "_blank", "noopener") : undefined,
                        }))}
                    />
                </ChartCard>
                <ChartCard title={t("savedStats.cities", "Cities of the saved listings")} height={300}>
                    <BarChartView
                        data={data?.cities || []}
                        bars={[{ key: "count", name: t("savedStats.saves", "Saves"), color }]}
                        layout="vertical"
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>
        </>
    );
}
