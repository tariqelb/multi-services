
import PageHeader from "../../../Components/ui/PageHeader";
import React, { useCallback, useEffect, useState } from "react";
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

import {
    Article,
    CalendarMonth,
} from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";
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

    const fetchPublications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(
                "/property/admin-listings",
                {
                    params: { period },
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
            console.error(
                "Failed to fetch publications:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                    t("adminPublications.errors.load")
            );
        } finally {
            setLoading(false);
        }
    }, [period, t]);

    useEffect(() => {
        fetchPublications();
    }, [fetchPublications]);

    const handlePeriodChange = (event) => {
        setPeriod(event.target.value);
    };

    return (
        <Box sx={{ width: "100%", minWidth: 0, boxSizing: "border-box", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
            {/* Heading and date filter */}
            <PageHeader
                icon={<Article />}
                title={t("adminPublications.title")}
                subtitle={t("adminPublications.subtitle")}
                action={
                <FormControl
                    size="small"
                    sx={{
                        minWidth: {
                            xs: "100%",
                            sm: 190,
                        },
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
                                {t(
                                    `adminPublications.periods.${filter.label}`
                                )}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                }
            />

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
                        variant="body2" sx={{ color: "#475569", fontWeight: 600 }}
                    >
                        {t("adminPublications.count")}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#64748b", mt: 0.5 }}
                    >
                        {t(`adminPublications.periods.${period}`)}
                    </Typography>
                </Box>

                <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "#2563EB",
                        fontVariantNumeric: "tabular-nums",
                    }}
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
                <Alert
                    severity="error"
                    action={
                        <button
                            type="button"
                            onClick={fetchPublications}
                        >
                            {t("adminPublications.retry", {
                                defaultValue: "Retry",
                            })}
                        </button>
                    }
                >
                    {error}
                </Alert>
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
                        variant="h6" sx={{ fontWeight: 700, color: "#334155" }}
                    >
                        {t("adminPublications.empty.title")}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#64748b", mt: 0.5 }}
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
                            key={property._id || property.id}
                            property={property}
                            onDeleted={fetchPublications}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}
