
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";

import {
    BookmarkOutlined,
    PeopleAltOutlined,
    HomeWorkOutlined,
    FavoriteBorderOutlined,
} from "@mui/icons-material";

import axiosInstance from "../../../../api/axiosInstance";

const COLORS = [
    "#2563EB",
    "#16A34A",
    "#F59E0B",
    "#9333EA",
    "#EC4899",
    "#0891B2",
    "#EA580C",
    "#64748B",
];

const RANGE_OPTIONS = [
    { value: "7d", key: "last7Days", fallback: "Last 7 days" },
    { value: "30d", key: "last30Days", fallback: "Last 30 days" },
    { value: "90d", key: "last90Days", fallback: "Last 90 days" },
    { value: "all", key: "allTime", fallback: "All time" },
];

const getLocale = (language) => {
    const lang = language?.split("-")[0];

    const locales = {
        en: "en-GB",
        fr: "fr-FR",
        ar: "ar-MA",
    };

    return locales[lang] || "en-GB";
};

const formatNumber = (value, locale) =>
    new Intl.NumberFormat(locale).format(value || 0);

const formatDate = (date, locale) => {
    if (!date) return "—";

    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));
};

function SummaryCard({
    title,
    value,
    description,
    icon,
    color,
    locale,
}) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Box minWidth={0}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={600}
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{ mt: 1 }}
                        >
                            {formatNumber(value, locale)}
                        </Typography>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {description}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 2.5,
                            bgcolor: color,
                            color: "#fff",
                            "& svg": { fontSize: 26 },
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, subtitle, children, height = 340 }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                width: "100%",
                minWidth: 0,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2, md: 2.5 },
                    "&:last-child": {
                        pb: { xs: 2, md: 2.5 },
                    },
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight={750}
                    sx={{ overflowWrap: "anywhere" }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mt: 0.5,
                        mb: 2,
                        overflowWrap: "anywhere",
                    }}
                >
                    {subtitle}
                </Typography>

                <Box sx={{ width: "100%", height, minWidth: 0 }}>
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
}

function normalizeCity(city) {
    return String(city || "Unknown").trim().toLowerCase();
}

function translateListingType(value, t) {
    if (value === "For Sale") {
        return t("savedDemand.forSale", "For Sale");
    }

    if (value === "For Rent") {
        return t("savedDemand.forRent", "For Rent");
    }

    return value || t("savedDemand.unknown", "Unknown");
}

export default function SavedPropertyDemandSection({
    alertCities = [],
}) {
    const { t, i18n } = useTranslation();

    const locale = getLocale(i18n.language);

    const isArabic = i18n.language?.startsWith("ar");

    const [range, setRange] = useState("30d");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(
                "/dashboard/saved-property-demand",
                {
                    params: { range },
                }
            );

            setData(response.data);
        } catch (err) {
            console.error("Saved property analytics error:", err);

            setError(
                err.response?.data?.message ||
                t(
                    "savedDemand.loadError",
                    "Failed to load saved property analytics."
                )
            );
        } finally {
            setLoading(false);
        }
    }, [range, t]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const summary = data?.summary || {};

    const comparisonData = useMemo(() => {
        const grouped = new Map();

        (alertCities || []).forEach((item) => {
            const key = normalizeCity(item.city);

            grouped.set(key, {
                city: item.city,
                alerts: item.requests || 0,
                saves: 0,
            });
        });

        (data?.topCities || []).forEach((item) => {
            const key = normalizeCity(item.name);

            if (!grouped.has(key)) {
                grouped.set(key, {
                    city: item.name,
                    alerts: 0,
                    saves: 0,
                });
            }

            grouped.get(key).saves = item.requests || 0;
        });

        return Array.from(grouped.values())
            .sort(
                (a, b) =>
                    b.alerts + b.saves - (a.alerts + a.saves)
            )
            .slice(0, 10);
    }, [alertCities, data]);

    const typeData = data?.propertyTypes || [];

    const listingData = useMemo(
        () =>
            (data?.listingTypes || []).map((item) => ({
                ...item,
                translatedName: translateListingType(item.name, t),
            })),
        [data, t]
    );

    const topProperties = data?.topSavedProperties || [];
    const trendData = data?.demandTrend || [];
    const recentSaves = data?.recentSaves || [];

    const translatedComparisonData = useMemo(
        () =>
            comparisonData.map((item) => ({
                ...item,
                alertsLabel: t(
                    "savedDemand.activeAlerts",
                    "Active alerts"
                ),
                savesLabel: t(
                    "savedDemand.savedListings",
                    "Saved listings"
                ),
            })),
        [comparisonData, t]
    );

    const translatedTrendData = useMemo(
        () =>
            trendData.map((item) => ({
                ...item,
                dateLabel: new Intl.DateTimeFormat(locale, {
                    month: "short",
                    day: "numeric",
                }).format(new Date(`${item.date}T12:00:00`)),
            })),
        [trendData, locale]
    );

    if (loading && !data) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={250}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Stack spacing={3} dir={isArabic ? "rtl" : "ltr"}>
            {/* Section heading */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
            >
                <Box>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                    >
                        <BookmarkOutlined color="primary" />

                        <Typography variant="h5" fontWeight={800}>
                            {t(
                                "savedDemand.title",
                                "Saved Properties Analytics"
                            )}
                        </Typography>
                    </Stack>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        {t(
                            "savedDemand.subtitle",
                            "Understand which actual listings attract user interest."
                        )}
                    </Typography>
                </Box>

                <Box
                    component="select"
                    value={range}
                    aria-label={t(
                        "savedDemand.dateRange",
                        "Analytics date range"
                    )}
                    onChange={(event) => setRange(event.target.value)}
                    sx={{
                        minWidth: 160,
                        height: 40,
                        px: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        color: "text.primary",
                        fontFamily: "inherit",
                    }}
                >
                    {RANGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {t(
                                `savedDemand.ranges.${option.key}`,
                                option.fallback
                            )}
                        </option>
                    ))}
                </Box>
            </Stack>

            {error && (
                <Alert severity="error">
                    {error}
                </Alert>
            )}

            {/* Summary */}
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
                <SummaryCard
                    title={t("savedDemand.totalSaves", "Total saves")}
                    value={summary.totalSaves}
                    description={t(
                        "savedDemand.totalSavesDescription",
                        "All saved-property actions"
                    )}
                    icon={<BookmarkOutlined />}
                    color="#2563EB"
                    locale={locale}
                />

                <SummaryCard
                    title={t(
                        "savedDemand.uniqueUsers",
                        "Interested users"
                    )}
                    value={summary.uniqueUsers}
                    description={t(
                        "savedDemand.uniqueUsersDescription",
                        "Users who saved properties"
                    )}
                    icon={<PeopleAltOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <SummaryCard
                    title={t(
                        "savedDemand.uniqueProperties",
                        "Saved listings"
                    )}
                    value={summary.uniqueProperties}
                    description={t(
                        "savedDemand.uniquePropertiesDescription",
                        "Different properties saved"
                    )}
                    icon={<HomeWorkOutlined />}
                    color="#9333EA"
                    locale={locale}
                />
            </Box>

            {/* Explicit demand compared with actual listing interest */}
            <ChartCard
                title={t(
                    "savedDemand.alertsVsSaves",
                    "Search demand vs listing interest"
                )}
                subtitle={t(
                    "savedDemand.alertsVsSavesDescription",
                    "Compare active property alerts with saved listings by city"
                )}
                height={390}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={translatedComparisonData}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 35,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="city"
                            angle={-20}
                            textAnchor="end"
                            interval={0}
                            tick={{ fontSize: 11 }}
                        />

                        <YAxis allowDecimals={false} />

                        <Tooltip
                            formatter={(value, name) => [
                                formatNumber(value, locale),
                                name === "alerts"
                                    ? t(
                                        "savedDemand.activeAlerts",
                                        "Active alerts"
                                    )
                                    : t(
                                        "savedDemand.savedListings",
                                        "Saved listings"
                                    ),
                            ]}
                        />

                        <Legend
                            formatter={(value) =>
                                value === "alerts"
                                    ? t(
                                        "savedDemand.activeAlerts",
                                        "Active alerts"
                                    )
                                    : t(
                                        "savedDemand.savedListings",
                                        "Saved listings"
                                    )
                            }
                        />

                        <Bar
                            dataKey="alerts"
                            name="alerts"
                            fill="#2563EB"
                            radius={[5, 5, 0, 0]}
                        />

                        <Bar
                            dataKey="saves"
                            name="saves"
                            fill="#16A34A"
                            radius={[5, 5, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Saved property trends */}
            <ChartCard
                title={t(
                    "savedDemand.trend",
                    "Saved-property activity over time"
                )}
                subtitle={t(
                    "savedDemand.trendDescription",
                    "Number of save actions during the selected period"
                )}
                height={330}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={translatedTrendData}
                        margin={{
                            top: 10,
                            right: 15,
                            left: 0,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 11 }}
                            tickMargin={10}
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11 }}
                        />

                        <Tooltip
                            formatter={(value) => [
                                formatNumber(value, locale),
                                t("savedDemand.saves", "Saves"),
                            ]}
                        />

                        <Line
                            type="monotone"
                            dataKey="saves"
                            name={t("savedDemand.saves", "Saves")}
                            stroke="#16A34A"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Type and listing preferences */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "minmax(0, 1fr)",
                        lg: "minmax(0, 1.4fr) minmax(0, 1fr)",
                    },
                    gap: 2,
                    alignItems: "stretch",
                }}
            >
                <ChartCard
                    title={t(
                        "savedDemand.propertyTypes",
                        "Most saved property types"
                    )}
                    subtitle={t(
                        "savedDemand.propertyTypesDescription",
                        "Property categories attracting the most saves"
                    )}
                    height={360}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={typeData}
                            layout="vertical"
                            margin={{
                                top: 5,
                                right: 20,
                                left: 15,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                            />

                            <XAxis
                                type="number"
                                allowDecimals={false}
                            />

                            <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
                                tick={{ fontSize: 11 }}
                            />

                            <Tooltip
                                formatter={(value) => [
                                    formatNumber(value, locale),
                                    t("savedDemand.saves", "Saves"),
                                ]}
                            />

                            <Bar
                                dataKey="requests"
                                name={t("savedDemand.saves", "Saves")}
                                fill="#2563EB"
                                radius={[0, 6, 6, 0]}
                                barSize={26}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title={t(
                        "savedDemand.listingTypes",
                        "Buy vs rent interest"
                    )}
                    subtitle={t(
                        "savedDemand.listingTypesDescription",
                        "Listing types users save most often"
                    )}
                    height={360}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={listingData}
                                dataKey="requests"
                                nameKey="translatedName"
                                cx="50%"
                                cy="45%"
                                innerRadius={65}
                                outerRadius={110}
                                paddingAngle={4}
                                label
                            >
                                {listingData.map((item, index) => (
                                    <Cell
                                        key={item.name}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                formatter={(value) =>
                                    formatNumber(value, locale)
                                }
                            />

                            <Legend
                                verticalAlign="bottom"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </Box>

            {/* Most saved properties */}
            <ChartCard
                title={t(
                    "savedDemand.topProperties",
                    "Most saved properties"
                )}
                subtitle={t(
                    "savedDemand.topPropertiesDescription",
                    "Listings that attracted the most user interest"
                )}
                height={Math.max(280, topProperties.length * 66)}
            >
                {topProperties.length ? (
                    <Stack spacing={1.5}>
                        {topProperties.map((property, index) => (
                            <Box
                                key={property.propertyId}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: "action.hover",
                                    minWidth: 0,
                                }}
                            >
                                <Avatar
                                    variant="rounded"
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        bgcolor: "primary.main",
                                        fontWeight: 800,
                                    }}
                                >
                                    {formatNumber(index + 1, locale)}
                                </Avatar>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        fontWeight={700}
                                        noWrap
                                    >
                                        {property.title}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {property.city} · {property.propertyType} · {translateListingType(property.listingType, t)}
                                    </Typography>
                                </Box>

                                <Chip
                                    icon={<FavoriteBorderOutlined />}
                                    label={t(
                                        "savedDemand.saveCount",
                                        "{{count}} saves",
                                        {
                                            count: formatNumber(
                                                property.saves,
                                                locale
                                            ),
                                        }
                                    )}
                                    color="success"
                                    variant="outlined"
                                />
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Alert severity="info">
                        {t(
                            "savedDemand.noTopProperties",
                            "No saved properties found for this period."
                        )}
                    </Alert>
                )}
            </ChartCard>

            {/* Recent saves */}
            <Card
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                }}
            >
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Typography variant="h6" fontWeight={750} mb={2}>
                        {t(
                            "savedDemand.recentSaves",
                            "Recent saved properties"
                        )}
                    </Typography>

                    {recentSaves.length ? (
                        <Stack spacing={1.5}>
                            {recentSaves.map((record) => {
                                const userName = [
                                    record.user?.firstName,
                                    record.user?.lastName,
                                ]
                                    .filter(Boolean)
                                    .join(" ");

                                return (
                                    <Box
                                        key={record._id}
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: 2,
                                            p: 1.5,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography fontWeight={700}>
                                                {record.property?.title}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {userName ||
                                                    record.user?.email ||
                                                    t(
                                                        "savedDemand.unknownUser",
                                                        "Unknown user"
                                                    )}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {record.property?.city} · {record.property?.propertyType} · {translateListingType(record.property?.listingType, t)}
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                textAlign: {
                                                    xs: "left",
                                                    sm: "right",
                                                },
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                            >
                                                {formatDate(
                                                    record.createdAt,
                                                    locale
                                                )}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {record.property?.price
                                                    ? `${formatNumber(
                                                        record.property.price,
                                                        locale
                                                    )} ${t(
                                                        "savedDemand.currency",
                                                        "MAD"
                                                    )}`
                                                    : t(
                                                        "savedDemand.priceUnavailable",
                                                        "Price unavailable"
                                                    )}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    ) : (
                        <Alert severity="info">
                            {t(
                                "savedDemand.noRecentSaves",
                                "No saved-property activity found for this period."
                            )}
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
