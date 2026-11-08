///home/tariq/multi-services/app/frontend/src/components/admin/components/PropertyClicks/PropertyClicksSection.jsx

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Pagination,
} from "@mui/material";

import {
    Visibility,
    HomeWork,
    LocationCity,
} from "@mui/icons-material";

import axiosInstance from "../../../../api/axiosInstance";

import SummaryCard from "./SummaryCard";
import AnalyticsChart from "./AnalyticsChart";
import PropertyClickCard from "./PropertyClickCard";

import { formatNumber } from "./propertyClickUtils";

const API_URL = "/property/clicks";
const ITEMS_PER_PAGE = 6;

const PropertyClicksSection = () => {
    const { t, i18n } = useTranslation();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

    const locale = i18n.language?.startsWith("ar")
        ? "ar"
        : i18n.language?.startsWith("fr")
            ? "fr-FR"
            : "en-US";

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(API_URL, {
                params: {
                    page,
                    limit: ITEMS_PER_PAGE,
                },
            });

            setData(response.data);
        } catch (err) {
            console.error("Property click analytics error:", err);

            setError(
                err.response?.data?.message ||
                t("adminPropertyClicks.errors.load")
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
        totalProperties: 0,
        totalCities: 0,
    };

    const charts = data?.charts || {};
    const properties = data?.properties || [];

    const pagination = data?.pagination || {
        total: 0,
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalPages: 0,
    };

    const handlePageChange = (_event, newPage) => {
        setPage(newPage);
    };

    if (loading && !data) {
        return (
            <Box
                sx={{
                    minHeight: 350,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%" }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                    {t("adminPropertyClicks.title")}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    {t("adminPropertyClicks.subtitle")}
                </Typography>
            </Box>

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Loading during pagination */}
            {loading && data && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 3,
                    }}
                >
                    <CircularProgress size={25} />
                </Box>
            )}

            {/* Summary cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <SummaryCard
                        title={t("adminPropertyClicks.summary.totalClicks")}
                        value={formatNumber(summary.totalClicks, locale)}
                        icon={<Visibility />}
                        color="#2563EB"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <SummaryCard
                        title={t("adminPropertyClicks.summary.trackedProperties")}
                        value={formatNumber(summary.totalProperties, locale)}
                        icon={<HomeWork />}
                        color="#2563EB"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <SummaryCard
                        title={t("adminPropertyClicks.summary.cities")}
                        value={formatNumber(summary.totalCities, locale)}
                        icon={<LocationCity />}
                        color="#2563EB"
                    />
                </Grid>
            </Grid>

            {/* Charts */}
            <Box sx={{ mb: 5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                    {t("adminPropertyClicks.charts.title")}
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <AnalyticsChart
                            title={t("adminPropertyClicks.charts.propertyTypes")}
                            data={charts.propertyTypes || []}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <AnalyticsChart
                            title={t("adminPropertyClicks.charts.listingTypes")}
                            data={charts.listingTypes || []}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <AnalyticsChart
                            title={t("adminPropertyClicks.charts.cities")}
                            data={charts.cities || []}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* All tracked properties */}
            <Box>
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="h6" fontWeight={700}>
                        {t("adminPropertyClicks.properties.title")}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        {t("adminPropertyClicks.properties.subtitle")}
                    </Typography>
                </Box>

                {properties.length > 0 ? (
                    <>
                        <Grid container spacing={3}>
                            {properties.map((property) => (
                                <Grid
                                    key={property.propertyId}
                                    size={{
                                        xs: 12,
                                        sm: 6,
                                        lg: 4,
                                        xl: 3,
                                    }}
                                >
                                    <PropertyClickCard property={property} />
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
                            <Typography variant="body2" color="text.secondary">
                                {t("adminPropertyClicks.pagination.showing", {
                                    from: (page - 1) * ITEMS_PER_PAGE + 1,
                                    to:
                                        (page - 1) * ITEMS_PER_PAGE +
                                        properties.length,
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
                ) : (
                    <Box
                        sx={{
                            minHeight: 220,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px dashed",
                            borderColor: "divider",
                            borderRadius: "16px",
                            p: 3,
                        }}
                    >
                        <Visibility
                            sx={{
                                fontSize: 45,
                                color: "text.disabled",
                                mb: 1.5,
                            }}
                        />

                        <Typography variant="h6" fontWeight={600}>
                            {t("adminPropertyClicks.empty.title")}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                        >
                            {t("adminPropertyClicks.empty.description")}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default PropertyClicksSection;
