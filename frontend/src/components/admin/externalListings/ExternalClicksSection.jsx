
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Pagination,
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
} from "recharts";

import axiosInstance from "../../../api/axiosInstance";

const API_URL = "/external-listing-analytics";

const COLORS = {
    primary: "#064e3b",
    green: "#059669",
    lightGreen: "#d1fae5",
    border: "#e5e7eb",
    muted: "#64748b",
};

function SummaryCard({ title, value, icon }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                minWidth: 0,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 3,
                transition: "0.2s ease",
                "&:hover": {
                    borderColor: COLORS.green,
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                },
            }}
        >
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                >
                    <Typography
                        color="text.secondary"
                        fontWeight={600}
                        fontSize="0.9rem"
                    >
                        {title}
                    </Typography>

                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            backgroundColor: "#ecfdf5",
                            color: COLORS.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            fontWeight: 800,
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>

                <Typography
                    variant="h4"
                    fontWeight={900}
                    color={COLORS.primary}
                    mt={2}
                    sx={{
                        fontSize: { xs: "1.8rem", md: "2.1rem" },
                    }}
                >
                    {Number(value || 0).toLocaleString()}
                </Typography>
            </CardContent>
        </Card>
    );
}

function AnalyticsChart({ title, data, description }) {
    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                minWidth: 0,
                height: 390,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 3,
                overflow: "hidden",
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2, md: 3 },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:last-child": { pb: 3 },
                }}
            >
                <Box mb={2}>
                    <Typography
                        fontWeight={800}
                        fontSize="1rem"
                        color="#1e293b"
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                        fontSize="0.8rem"
                    >
                        {description}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    {data?.length ? (
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                        >
                            <BarChart
                                data={data}
                                margin={{
                                    top: 15,
                                    right: 15,
                                    left: -15,
                                    bottom: 35,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e2e8f0"
                                />

                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    height={65}
                                    tick={{
                                        fontSize: 11,
                                        fill: "#64748b",
                                    }}
                                    axisLine={{ stroke: "#cbd5e1" }}
                                    tickLine={false}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{
                                        fontSize: 11,
                                        fill: "#64748b",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />

                                <Tooltip
                                    cursor={{
                                        fill: "#f0fdf4",
                                    }}
                                    contentStyle={{
                                        borderRadius: 10,
                                        border: "1px solid #e5e7eb",
                                        boxShadow:
                                            "0 4px 15px rgba(0,0,0,0.08)",
                                        fontSize: "0.85rem",
                                    }}
                                    formatter={(value) => [
                                        `${value} clicks`,
                                        "Clicks",
                                    ]}
                                />

                                <Bar
                                    dataKey="clicks"
                                    fill={COLORS.green}
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={55}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box
                            height="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Typography
                                color="text.secondary"
                                fontSize="0.9rem"
                            >
                                No click data available yet.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

function ListingClickCard({ listing }) {
    const formatDate = (date) => {
        if (!date) return "Unknown";

        return new Date(date).toLocaleString();
    };

    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                minWidth: 0,
                height: "100%",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 3,
                transition: "0.2s ease",
                "&:hover": {
                    borderColor: COLORS.green,
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                },
            }}
        >
            <CardContent
                sx={{
                    p: 3,
                    "&:last-child": { pb: 3 },
                }}
            >
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                >
                    <Box minWidth={0} flex={1}>
                        <Typography
                            fontWeight={800}
                            fontSize="1rem"
                            color="#1e293b"
                            sx={{
                                overflowWrap: "anywhere",
                                lineHeight: 1.5,
                            }}
                        >
                            {listing.title || "Untitled listing"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={0.5}
                        >
                            {listing.sourceName || listing.sourceDomain}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            backgroundColor: COLORS.lightGreen,
                            color: "#065f46",
                            borderRadius: 2,
                            px: 1.5,
                            py: 1,
                            flexShrink: 0,
                            textAlign: "center",
                        }}
                    >
                        <Typography
                            fontWeight={800}
                            fontSize="0.85rem"
                            whiteSpace="nowrap"
                        >
                            {listing.clickCount} clicks
                        </Typography>
                    </Box>
                </Stack>

                <Box
                    sx={{
                        mt: 2.5,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.3,
                    }}
                >
                    {[
                        {
                            label: "Property type",
                            value:
                                listing.propertyType ||
                                listing.listingType ||
                                "Unknown",
                        },
                        {
                            label: "City",
                            value: listing.city || "Unknown",
                        },
                        {
                            label: "Website",
                            value: listing.sourceDomain || "Unknown",
                        },
                        {
                            label: "First click",
                            value: formatDate(listing.firstClickedAt),
                        },
                        {
                            label: "Last click",
                            value: formatDate(listing.lastClickedAt),
                        },
                    ].map((item) => (
                        <Stack
                            key={item.label}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={2}
                        >
                            <Typography
                                color="text.secondary"
                                fontSize="0.8rem"
                                flexShrink={0}
                            >
                                {item.label}
                            </Typography>

                            <Typography
                                fontWeight={600}
                                fontSize="0.8rem"
                                color="#334155"
                                textAlign="right"
                                sx={{ overflowWrap: "anywhere" }}
                            >
                                {item.value}
                            </Typography>
                        </Stack>
                    ))}
                </Box>

                <Box mt={2.5}>
                    <Typography
                        component="a"
                        href={listing.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.8,
                            color: "#047857",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            overflowWrap: "anywhere",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        View original listing ↗
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function ExternalClicksSection() {
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(API_URL, {
                params: {
                    page,
                    limit: 8,
                },
            });

            setData(response.data);
        } catch (err) {
            console.error("Analytics loading error:", err);

            setError(
                err.response?.data?.message ||
                    "Unable to load external listing analytics."
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const summary = data?.summary || {};
    const charts = data?.charts || {};
    const listings = data?.listings || [];
    const pagination = data?.pagination || {};

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

    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: { xs: 4, md: 5 },
                pb: 4,
            }}
        >
            {/* Header */}
            <Box>
                <Typography
                    variant="h5"
                    fontWeight={900}
                    color={COLORS.primary}
                    sx={{
                        fontSize: { xs: "1.35rem", md: "1.65rem" },
                    }}
                >
                    External Links Analytics
                </Typography>

                <Typography
                    color="text.secondary"
                    mt={1}
                    fontSize="0.95rem"
                >
                    Track clicks on external property listings across
                    websites and cities.
                </Typography>
            </Box>

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
                        xs: "repeat(2, minmax(0, 1fr))",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 2,
                    width: "100%",
                }}
            >
                <SummaryCard
                    title="Total clicks"
                    value={summary.totalClicks}
                    icon="↗"
                />

                <SummaryCard
                    title="Tracked listings"
                    value={summary.totalListings}
                    icon="⌂"
                />

                <SummaryCard
                    title="External websites"
                    value={summary.totalWebsites}
                    icon="◎"
                />

                <SummaryCard
                    title="Cities"
                    value={summary.totalCities}
                    icon="⌖"
                />
            </Box>

            {/* Charts */}
            <Box>
                <Box mb={2.5}>
                    <Typography
                        fontWeight={800}
                        fontSize="1.15rem"
                        color="#1e293b"
                    >
                        Click Statistics
                    </Typography>

                    <Typography
                        color="text.secondary"
                        fontSize="0.85rem"
                        mt={0.5}
                    >
                        Understand where visitors are clicking.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "minmax(0, 1fr)",
                            lg: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 3,
                        width: "100%",
                    }}
                >
                    <AnalyticsChart
                        title="Clicks by property type"
                        description="Number of clicks for each property category."
                        data={charts.propertyTypes}
                    />

                    <AnalyticsChart
                        title="Clicks by external website"
                        description="Number of clicks generated by each website."
                        data={charts.websites}
                    />

                    <Box
                        sx={{
                            gridColumn: {
                                xs: "auto",
                                lg: "1 / -1",
                            },
                            width: "100%",
                            minWidth: 0,
                        }}
                    >
                        <AnalyticsChart
                            title="Clicks by city"
                            description="Number of clicks from each property location."
                            data={charts.cities}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Listings */}
            <Box>
                <Box mb={3}>
                    <Typography
                        variant="h5"
                        fontWeight={900}
                        color={COLORS.primary}
                        sx={{
                            fontSize: { xs: "1.25rem", md: "1.5rem" },
                        }}
                    >
                        Most Recently Clicked Listings
                    </Typography>

                    <Typography
                        color="text.secondary"
                        mt={1}
                        fontSize="0.9rem"
                    >
                        Browse tracked external listings and their click
                        statistics.
                    </Typography>
                </Box>

                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={30} />
                    </Box>
                )}

                {!loading && listings.length === 0 && (
                    <Alert severity="info">
                        No external listing clicks have been recorded yet.
                    </Alert>
                )}

                {!loading && listings.length > 0 && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "minmax(0, 1fr)",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(3, minmax(0, 1fr))",
                                xl: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: 2.5,
                            width: "100%",
                        }}
                    >
                        {listings.map((listing) => (
                            <ListingClickCard
                                key={listing._id}
                                listing={listing}
                            />
                        ))}
                    </Box>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        mt={4}
                    >
                        <Pagination
                            count={pagination.totalPages}
                            page={page}
                            onChange={(_, value) => setPage(value)}
                            color="success"
                            shape="rounded"
                            size="large"
                        />
                    </Box>
                )}

                <Typography
                    color="text.secondary"
                    variant="body2"
                    textAlign="center"
                    mt={2}
                    fontSize="0.85rem"
                >
                    Showing {listings.length} of{" "}
                    {pagination.total || 0} tracked listings
                </Typography>
            </Box>
        </Box>
    );
}

