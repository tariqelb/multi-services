// /home/tariq/multi-services/app/frontend/src/components/admin/externalListings/ExternalClicksSection.jsx
// /home/tariq/multi-services/app/frontend/src/components/admin/Dashboard.jsx
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

const API_URL = "/external-listings/analytics";
const ITEMS_PER_PAGE = 6;

const ExternalClicksSection = () => {
    const { t, i18n } = useTranslation();

    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const locale =
        i18n.language?.startsWith("ar")
            ? "ar"
            : i18n.language?.startsWith("fr")
              ? "fr-FR"
              : "en-US";

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(API_URL, {
                params: { page },
            });

            setData(response.data);
        } catch (err) {
            console.error("External click analytics error:", err);

            setError(
                err.response?.data?.message ||
                    t("adminExternalClicks.errors.load")
            );
        } finally {
            setLoading(false);
        }
    }, [page, t]);

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
            <Box mb={1}>
                <Typography variant="h5" fontWeight={700}>
                    {t("adminExternalClicks.title")}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                >
                    {t("adminExternalClicks.subtitle")}
                </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title={t("adminExternalClicks.summary.totalClicks")}
                        value={summary.totalClicks}
                        icon="↗"
                        locale={locale}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title={t("adminExternalClicks.summary.trackedListings")}
                        value={summary.totalListings}
                        icon="⌂"
                        locale={locale}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title={t("adminExternalClicks.summary.websites")}
                        value={summary.totalWebsites}
                        icon="🌐"
                        locale={locale}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SummaryCard
                        title={t("adminExternalClicks.summary.cities")}
                        value={summary.totalCities}
                        icon="📍"
                        color="#2563EB"
                        locale={locale}
                    />
                </Grid>
            </Grid>

            <Box mt={2}>
                <Box mb={3}>
                    <Typography variant="h6" fontWeight={700}>
                        {t("adminExternalClicks.charts.title")}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        {t("adminExternalClicks.charts.subtitle")}
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <AnalyticsChart
                            title={t("adminExternalClicks.charts.propertyTypes")}
                            description={t("adminExternalClicks.charts.propertyTypesDescription")}
                            data={charts.propertyTypes || []}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, lg: 6 }}>
                        <AnalyticsChart
                            title={t("adminExternalClicks.charts.websites")}
                            description={t("adminExternalClicks.charts.websitesDescription")}
                            data={charts.websites || []}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <AnalyticsChart
                            title={t("adminExternalClicks.charts.cities")}
                            description={t("adminExternalClicks.charts.citiesDescription")}
                            data={charts.cities || []}
                        />
                    </Grid>
                </Grid>
            </Box>

            <Box mt={2}>
                <Box mb={3}>
                    <Typography variant="h6" fontWeight={700}>
                        {t("adminExternalClicks.listings.title")}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        {t("adminExternalClicks.listings.subtitle")}
                    </Typography>
                </Box>

                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={30} color="primary" />
                    </Box>
                )}

                {!loading && listings.length === 0 && (
                    <Alert severity="info">
                        {t("adminExternalClicks.listings.empty")}
                    </Alert>
                )}

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
                                        locale={locale}
                                    />
                                </Grid>
                            ))}
                        </Grid>

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
                                {t("adminExternalClicks.pagination.showing", {
                                    from: (page - 1) * ITEMS_PER_PAGE + 1,
                                    to:
                                        (page - 1) * ITEMS_PER_PAGE +
                                        listings.length,
                                    total: formatNumber(pagination.total, locale),
                                })}
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