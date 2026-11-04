
import React, { useEffect, useState } from "react";
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
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
    { value: "year", label: "Last Year" },
    { value: "all", label: "All Time" },
];

export default function PublicationsReviewSection() {
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
                        "Failed to load publications. Please try again."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchPublications();

        return () => controller.abort();
    }, [period]);

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
                            Publications Review
                        </Typography>
                    </Stack>

                    <Typography variant="body2" color="#64748b">
                        Review property publications submitted by users.
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
                        Date Range
                    </InputLabel>

                    <Select
                        labelId="publication-period-label"
                        value={period}
                        label="Date Range"
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
                                {filter.label}
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
                        Publications
                    </Typography>

                    <Typography
                        variant="body2"
                        color="#64748b"
                        sx={{ mt: 0.5 }}
                    >
                        {DATE_FILTERS.find(
                            (filter) => filter.value === period
                        )?.label}
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
                        No publications found
                    </Typography>

                    <Typography
                        variant="body2"
                        color="#64748b"
                        sx={{ mt: 0.5 }}
                    >
                        There are no property publications for this date range.
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
