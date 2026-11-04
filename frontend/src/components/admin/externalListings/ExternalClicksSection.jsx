// /home/tariq/multi-services/app/frontend/src/components/admin/externalListings/ExternalClicksSection.jsx
// /home/tariq/multi-services/app/frontend/src/components/admin/Dashboard.jsx

import { useCallback, useEffect, useState } from "react";

import {
    Alert,
    Box,
    CircularProgress,
    Grid,
    Pagination,
    Typography,
} from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";

import SummaryCard from "./SummaryCard";
import AnalyticsChart from "./AnalyticsChart";
import ExternalListingClickCard from "./ExternalListingClickCard";

import { formatNumber } from "./externalClicksUtils";

// This must match the path where the analytics router is mounted.
const API_URL = "/external-listings/analytics";

const ITEMS_PER_PAGE = 6;

const ExternalClicksSection = () => {
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
                },
            });

            console.log("response : ", response.data)
            setData(response.data);
        } catch (err) {
            console.error("External click analytics error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load external click analytics."
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const summary = data?.summary || {
        totalClicks: 0,
        totalListings: 0,
        totalWebsites: 0,
        totalCities: 0,
    };

    const charts = data?.charts || {};

    const listings = data?.listings || [];

    const pagination = data?.pagination || {
        page: 1,
        limit: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 0,
    };

    const handlePageChange = (_event, newPage) => {
        setPage(newPage);
    };

    if (loading && !data) {
        return (
            <Box
                minHeight={350}
                display="flex"
                alignItems="center"
                justifyContent="center"
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
                gap: 4,
                pb: 4,
            }}
        >
            {/* Header */}
            <Box mb={1}>
                <Typography variant="h5" fontWeight={700}>
                    External Listings Click Analytics
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                >
                    Track engagement with external listings published
                    on your platform.
                </Typography>
            </Box>

            {/* Error */}
            {error && (
                <Alert severity="error">
                    {error}
                </Alert>
            )}

            {/* Summary */}
            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title="Total Clicks"
                        value={summary.totalClicks}
                        icon="↗"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title="Tracked Listings"
                        value={summary.totalListings}
                        icon="⌂"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title="Websites"
                        value={summary.totalWebsites}
                        icon="🌐"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title="Cities"
                        value={summary.totalCities}
                        icon="📍"
                        color="#2563EB"
                    />
                </Grid>
            </Grid>

            {/* Charts */}
            <Box mt={2}>
                <Box mb={3}>
                    <Typography variant="h6" fontWeight={700}>
                        Click Statistics
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        Understand which property categories,
                        websites, and locations attract the most attention.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <AnalyticsChart
                            title="Clicks by Property Type"
                            description="Clicks grouped by property category."
                            data={charts.propertyTypes || []}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, lg: 6 }}>
                        <AnalyticsChart
                            title="Clicks by Website"
                            description="Compare engagement across external websites."
                            data={charts.websites || []}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <AnalyticsChart
                            title="Clicks by City"
                            description="Clicks grouped by property location."
                            data={charts.cities || []}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* External listings */}
            <Box mt={2}>
                <Box mb={3}>
                    <Typography variant="h6" fontWeight={700}>
                        Recently Clicked External Listings
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        All tracked external listings, ordered by their
                        latest click.
                    </Typography>
                </Box>

                {/* Loading during page changes */}
                {loading && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        py={4}
                    >
                        <CircularProgress
                            size={30}
                            color="primary"
                        />
                    </Box>
                )}

                {/* Empty state */}
                {!loading && listings.length === 0 && (
                    <Alert severity="info">
                        No external listing clicks have been recorded yet.
                    </Alert>
                )}

                {/* Listing cards */}
                {!loading && listings.length > 0 && (
                    <>
                        <Grid container spacing={2.5}>
                            {listings.map((listing) => (
                                <Grid
                                    key={listing._id}
                                    size={{
                                        xs: 12,
                                        sm: 6,
                                        lg: 4,
                                        xl: 3,
                                    }}
                                >
                                    <ExternalListingClickCard
                                        listing={listing}
                                        color="#2563EB"
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Pagination */}
                        <Box
                            sx={{
                                mt: 5,
                                pt: 3,
                                borderTop: "1px solid",
                                borderColor: "divider",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Showing{" "}
                                {(page - 1) * ITEMS_PER_PAGE + 1}
                                {" – "}
                                {(page - 1) * ITEMS_PER_PAGE +
                                    listings.length}
                                {" of "}
                                {formatNumber(pagination.total)}
                                {" tracked listings"}
                            </Typography>

                            {pagination.totalPages > 1 && (
                                <Pagination
                                    count={pagination.totalPages}
                                    page={page}
                                    onChange={handlePageChange}
                                    color="primary"
                                    shape="rounded"
                                    siblingCount={1}
                                    boundaryCount={1}
                                />
                            )}
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default ExternalClicksSection;