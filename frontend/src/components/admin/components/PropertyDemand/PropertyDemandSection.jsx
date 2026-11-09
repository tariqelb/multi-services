
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SavedPropertyDemandSection from "./SavedPropertyDemandSection";

import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";

import {
    NotificationsActiveOutlined,
    PeopleAltOutlined,
    ArchiveOutlined,
    TrendingUpOutlined,
} from "@mui/icons-material";

import axiosInstance from "../../../../api/axiosInstance";

const CHART_COLORS = [
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
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All time" },
];

const formatNumber = (value) =>
    new Intl.NumberFormat().format(value || 0);

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString();
};

function StatCard({ title, value, icon, description }) {
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
                            color="text.secondary"
                            variant="body2"
                            fontWeight={600}
                            gutterBottom
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{ letterSpacing: "-1px" }}
                        >
                            {formatNumber(value)}
                        </Typography>

                        {description && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {description}
                            </Typography>
                        )}
                    </Box>

                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "action.hover",
                            color: "primary.main",
                            "& svg": {
                                fontSize: 26,
                            },
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, subtitle, children, minHeight = 330 }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2, md: 2.5 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    "&:last-child": {
                        pb: { xs: 2, md: 2.5 },
                    },
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight={750}
                    sx={{
                        overflowWrap: "anywhere",
                    }}
                >
                    {title}
                </Typography>

                {subtitle && (
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
                )}

                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        height: minHeight,
                        position: "relative",
                    }}
                >
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
}

export default function PropertyDemandSection() {
    const { t } = useTranslation();

    const [range, setRange] = useState("30d");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(
                "/dashboard/property-demand",
                {
                    params: { range },
                }
            );

            setData(response.data);
        } catch (err) {
            console.error(
                "Property demand analytics error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load property demand analytics."
            );
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const summary = data?.summary || {};

    const trendData = useMemo(
        () =>
            (data?.demandTrend || []).map((item) => ({
                ...item,
                label: item.date,
            })),
        [data]
    );

    const cityData = useMemo(
        () => data?.topCities || [],
        [data]
    );

    const typeData = useMemo(
        () => data?.propertyTypes || [],
        [data]
    );

    const listingData = useMemo(
        () => data?.listingTypes || [],
        [data]
    );

    const cityListingData = useMemo(() => {
        const grouped = new Map();

        (data?.cityListingTypes || []).forEach((item) => {
            if (!grouped.has(item.city)) {
                grouped.set(item.city, {
                    city: item.city,
                    "For Sale": 0,
                    "For Rent": 0,
                });
            }

            grouped.get(item.city)[item.listingType] =
                item.requests;
        });

        return Array.from(grouped.values()).slice(0, 8);
    }, [data]);

    if (loading && !data) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={350}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error && !data) {
        return (
            <Alert severity="error">
                {error}
            </Alert>
        );
    }

    return (
        <Stack spacing={3}>
            {/* Header and date filter */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                spacing={2}
            >
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        {t(
                            "propertyDemand.title",
                            "Property Demand Analytics"
                        )}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {t(
                            "propertyDemand.subtitle",
                            "Understand what your users want to buy or rent."
                        )}
                    </Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                        value={range}
                        onChange={(event) =>
                            setRange(event.target.value)
                        }
                    >
                        {RANGE_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.value}
                                value={option.value}
                            >
                                {t(
                                    `propertyDemand.ranges.${option.value}`,
                                    option.label
                                )}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

            {error && (
                <Alert severity="warning">
                    {error}
                </Alert>
            )}

            {/* Summary cards */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title={t(
                            "propertyDemand.totalAlerts",
                            "Total alerts"
                        )}
                        value={summary.totalAlerts}
                        icon={<NotificationsActiveOutlined />}
                        description="Including archived alerts"
                    />
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title={t(
                            "propertyDemand.activeAlerts",
                            "Active demand"
                        )}
                        value={summary.activeAlerts}
                        icon={<TrendingUpOutlined />}
                        description="Currently active alerts"
                    />
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title={t(
                            "propertyDemand.uniqueUsers",
                            "Interested users"
                        )}
                        value={summary.uniqueUsers}
                        icon={<PeopleAltOutlined />}
                        description="Users who created alerts"
                    />
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title={t(
                            "propertyDemand.archivedAlerts",
                            "Archived alerts"
                        )}
                        value={summary.archivedAlerts}
                        icon={<ArchiveOutlined />}
                        description="Preserved for historical analysis"
                    />
                </Grid>
            </Grid>

            {/* Demand trend */}
            <ChartCard
                title={t(
                    "propertyDemand.trend",
                    "Demand over time"
                )}
                subtitle="New alerts created during the selected period"
                minHeight={350}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={trendData}
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
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            tickMargin={10}
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11 }}
                        />

                        <Tooltip />
                        <Legend />

                        <Line
                            type="monotone"
                            dataKey="active"
                            name="Active alerts"
                            stroke="#2563EB"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />

                        <Line
                            type="monotone"
                            dataKey="archived"
                            name="Archived alerts"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Property type and listing preferences */}
            {/* Property type and listing preferences */}

            {/* Property type and listing preferences */}
            <Box
                sx={{
                    width: "100%",
                    minWidth: 0,
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "minmax(0, 1fr)",
                        lg: "minmax(0, 7fr) minmax(0, 5fr)",
                    },
                    gap: 2,
                    alignItems: "stretch",
                }}
            >
                {/* Most requested property types */}
                <Box sx={{ minWidth: 0, display: "flex" }}>
                    <ChartCard
                        title={t(
                            "propertyDemand.propertyTypes",
                            "Most requested property types"
                        )}
                        subtitle="Active alerts by property type"
                        minHeight={350}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={typeData}
                                layout="vertical"
                                margin={{
                                    top: 5,
                                    right: 20,
                                    left: 20,
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
                                    dataKey="type"
                                    width={120}
                                    tick={{ fontSize: 11 }}
                                />

                                <Tooltip />

                                <Bar
                                    dataKey="requests"
                                    name="Requests"
                                    fill="#2563EB"
                                    radius={[0, 6, 6, 0]}
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Box>

                {/* Buy vs rent preferences */}
                <Box sx={{ minWidth: 0, display: "flex" }}>
                    <ChartCard
                        title={t(
                            "propertyDemand.listingPreferences",
                            "Buy vs rent preferences"
                        )}
                        subtitle="Active listing preferences"
                        minHeight={350}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={listingData}
                                    dataKey="requests"
                                    nameKey="type"
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={65}
                                    outerRadius={105}
                                    paddingAngle={4}
                                    label
                                >
                                    {listingData.map((item, index) => (
                                        <Cell
                                            key={item.type}
                                            fill={
                                                CHART_COLORS[
                                                    index % CHART_COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>

                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Box>
            </Box>


            {/* City demand */}
            <ChartCard
                title={t(
                    "propertyDemand.topCities",
                    "Most requested cities"
                )}
                subtitle="Cities with the highest number of active alerts"
                minHeight={350}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={cityData}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 30,
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
                        <Tooltip />
                        <Legend />

                        <Bar
                            dataKey="requests"
                            name="Active alerts"
                            fill="#16A34A"
                            radius={[6, 6, 0, 0]}
                            barSize={36}
                        />

                        <Bar
                            dataKey="uniqueUsers"
                            name="Unique users"
                            fill="#93C5FD"
                            radius={[6, 6, 0, 0]}
                            barSize={36}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* City sale/rent comparison */}
            <ChartCard
                title={t(
                    "propertyDemand.cityComparison",
                    "Buying vs renting by city"
                )}
                subtitle="Compare active sale and rental demand across cities"
                minHeight={350}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={cityListingData}
                        margin={{
                            top: 10,
                            right: 15,
                            left: 0,
                            bottom: 25,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="city"
                            angle={-15}
                            textAnchor="end"
                            interval={0}
                            tick={{ fontSize: 11 }}
                        />

                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />

                        <Bar
                            dataKey="For Sale"
                            fill="#2563EB"
                            radius={[5, 5, 0, 0]}
                        />

                        <Bar
                            dataKey="For Rent"
                            fill="#F59E0B"
                            radius={[5, 5, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>



            {/* Recent alerts */}
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
                            "propertyDemand.recentAlerts",
                            "Recent property alerts"
                        )}
                    </Typography>

                    <Box sx={{ overflowX: "auto" }}>
                        <Box sx={{ minWidth: 650 }}>
                            <Grid
                                container
                                sx={{
                                    py: 1.5,
                                    px: 1,
                                    bgcolor: "action.hover",
                                    borderRadius: 1,
                                }}
                            >
                                {[
                                    "City",
                                    "User",
                                    "Property types",
                                    "Listing",
                                    "Created",
                                    "Status",
                                ].map((heading) => (
                                    <Grid item xs={heading === "Property types" ? 3 : heading === "User" ? 2.5 : heading === "Listing" ? 1.5 : heading === "Created" ? 1.5 : 1.5} key={heading}>
                                        <Typography
                                            variant="caption"
                                            fontWeight={750}
                                            color="text.secondary"
                                        >
                                            {heading}
                                        </Typography>
                                    </Grid>
                                ))}
                            </Grid>

                            {(data?.recentAlerts || []).map((alert) => {
                                const userName = alert.user
                                    ? `${alert.user.firstName || ""} ${alert.user.lastName || ""}`.trim()
                                    : "Unknown user";

                                return (
                                    <Grid
                                        container
                                        key={alert._id}
                                        alignItems="center"
                                        sx={{
                                            py: 1.5,
                                            px: 1,
                                            borderBottom: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Grid item xs={1.5}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {alert.city}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={2.5}>
                                            <Typography variant="body2">
                                                {userName || alert.user?.email || "Unknown"}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={3}>
                                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                {(alert.propertyTypes || []).map((type) => (
                                                    <Chip
                                                        key={type}
                                                        label={type}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Grid>

                                        <Grid item xs={1.5}>
                                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                {(alert.listingTypes || []).map((type) => (
                                                    <Chip
                                                        key={type}
                                                        label={type}
                                                        size="small"
                                                        color={type === "For Sale" ? "primary" : "warning"}
                                                    />
                                                ))}
                                            </Stack>
                                        </Grid>

                                        <Grid item xs={1.5}>
                                            <Typography variant="caption">
                                                {formatDate(alert.createdAt)}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={1.5}>
                                            <Chip
                                                size="small"
                                                label={alert.isArchived ? "Archived" : "Active"}
                                                color={alert.isArchived ? "default" : "success"}
                                                variant="outlined"
                                            />
                                        </Grid>
                                    </Grid>
                                );
                            })}

                            {!data?.recentAlerts?.length && (
                                <Typography
                                    color="text.secondary"
                                    textAlign="center"
                                    py={4}
                                >
                                    No property alerts found for this period.
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <SavedPropertyDemandSection alertCities={cityData} />

        </Stack>
    );
}