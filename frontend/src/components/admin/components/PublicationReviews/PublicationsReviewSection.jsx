import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";
import { Article, CalendarMonth } from "@mui/icons-material";

import axiosInstance from "../../../../api/axiosInstance";
import PublicationReviewCard from "./PublicationReviewCard";

const DATE_FILTERS = [
    { value: "today", label: "today" },
    { value: "week", label: "week" },
    { value: "month", label: "month" },
    { value: "year", label: "year" },
    { value: "all", label: "all" },
];

export default function PublicationsReviewSection() {
    const { t } = useTranslation();

    const [period, setPeriod] = useState("today");
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const fetchPublications = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await axiosInstance.get(
                    "/property/admin-listings",
                    {
                        params: { period },
                        signal: controller.signal,
                    }
                );

                const data = response.data;

                const propertyList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.properties)
                      ? data.properties
                      : [];

                setProperties(propertyList);
            } catch (err) {
                if (err.code === "ERR_CANCELED") return;

                console.error(
                    "Failed to fetch publications:",
                    err.response?.data || err.message
                );

                setError(
                    err.response?.data?.message ||
                        t("adminPublications.errors.load")
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchPublications();

        return () => controller.abort();
    }, [period, t]);

    const handlePeriodChange = (event) => {
        setPeriod(event.target.value);
    };

    return (
        <Box sx={{ width: "100%" }}>
            {/* Heading and date filter */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                    >
                        <Article sx={{ color: "#2563EB" }} />
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="#0F172A"
                        >
                            {t("adminPublications.title")}
                        </Typography>
                    </Stack>

                    <Typography variant="body2" color="#64748b">
                        {t("adminPublications.subtitle")}
                    </Typography>
                </Box>

                <FormControl
                    size="small"
                    sx={{
                        minWidth: { xs: "100%", sm: 190 },
                        bgcolor: "#fff",
                    }}
                >
                    <InputLabel id="publication-period-label">
                        {t("adminPublications.dateRange")}
                    </InputLabel>

                    <Select
                        labelId="publication-period-label"
                        value={period}
                        label={t("adminPublications.dateRange")}
                        onChange={handlePeriodChange}
                        startAdornment={
                            <CalendarMonth
                                sx={{
                                    mr: 1,
                                    color: "#64748b",
                                    fontSize: 20,
                                }}
                            />
                        }
                    >
                        {DATE_FILTERS.map((filter) => (
                            <MenuItem
                                key={filter.value}
                                value={filter.value}
                            >
                                {t(`adminPublications.periods.${filter.label}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Publication count */}
            <Box
                sx={{
                    p: 2.5,
                    mb: 3,
                    border: "1px solid #DBEAFE",
                    borderRadius: "14px",
                    bgcolor: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography
                        variant="body2"
                        color="#475569"
                        fontWeight={600}
                    >
                        {t("adminPublications.count")}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="#64748b"
                        sx={{ mt: 0.5 }}
                    >
                        {t(`adminPublications.periods.${period}`)}
                    </Typography>
                </Box>

                <Typography
                    variant="h4"
                    fontWeight={800}
                    color="#2563EB"
                    sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {loading ? "—" : properties.length}
                </Typography>
            </Box>

            {/* Loading */}
            {loading && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 8,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}

            {/* Error */}
            {!loading && error && (
                <Alert severity="error">{error}</Alert>
            )}

            {/* Empty state */}
            {!loading && !error && properties.length === 0 && (
                <Box
                    sx={{
                        py: 7,
                        px: 2,
                        textAlign: "center",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "16px",
                        bgcolor: "#F8FAFC",
                    }}
                >
                    <Article
                        sx={{
                            fontSize: 42,
                            color: "#94a3b8",
                            mb: 1,
                        }}
                    />

                    <Typography
                        variant="h6"
                        fontWeight={700}
                        color="#334155"
                    >
                        {t("adminPublications.empty.title")}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="#64748b"
                        sx={{ mt: 0.5 }}
                    >
                        {t("adminPublications.empty.description")}
                    </Typography>
                </Box>
            )}

            {/* Publications list */}
            {!loading && !error && properties.length > 0 && (
                <Stack spacing={2.5}>
                    {properties.map((property) => (
                        <PublicationReviewCard
                            key={property._id}
                            property={property}
                            onDeleted={() => fetchPublications()}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}