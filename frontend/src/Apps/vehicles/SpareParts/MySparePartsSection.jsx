// src/Apps/vehicles/SpareParts/MySparePartsSection.jsx
// "Spare parts" tab of My Publication and of My profile: my parts with
// filters and the same horizontal cards (Edit · Edit status · View · Delete).
// onPartsChange receives the loaded parts (profile statistics, tab count).

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import axiosInstance from "../../../api/axiosInstance";
import { FilterGrid, FilterPanel, FilterSelect } from "../../../Components/ui/FilterKit";

import { formatNumber, optionLabel } from "../vehicleFormat";
import MyVehicleCard from "../MyVehicles/MyVehicleCard";
import { PART_CATEGORIES, PART_CATEGORY_STYLES, PART_STATUSES, compatibilityLabel } from "./sparePartOptions";

const PER_PAGE = 5;
const ALL = "all";
const DEFAULT_FILTERS = { partCategory: ALL, status: ALL, city: ALL };

export default function MySparePartsSection({ onPartsChange }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/vehicles/parts/mine")
            .then(({ data }) => !cancelled && setParts(data.parts || []))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("vehiclesApp.parts.mineError", "Unable to load your spare parts.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [t]);

    useEffect(() => {
        if (!loading) onPartsChange?.(parts);
    }, [parts, loading, onPartsChange]);

    const cities = useMemo(() => [...new Set(parts.map((part) => part.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [parts]);
    const filtered = parts.filter(
        (part) =>
            (filters.partCategory === ALL || part.partCategory === filters.partCategory) &&
            (filters.status === ALL || (part.status || "Available") === filters.status) &&
            (filters.city === ALL || part.city === filters.city),
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const shown = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    const activeCount = Object.keys(DEFAULT_FILTERS).filter((key) => filters[key] !== DEFAULT_FILTERS[key]).length;
    const setFilter = (field, value) => {
        setFilters((previous) => ({ ...previous, [field]: value }));
        setPage(1);
    };

    const changeStatus = async (part, status) => {
        setError("");
        try {
            await axiosInstance.patch(`/vehicles/parts/${part._id}/status`, { status });
            setParts((list) => list.map((item) => (item._id === part._id ? { ...item, status } : item)));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("vehiclesApp.mine.statusError", "Unable to change the status."));
        }
    };
    const deletePart = async (part) => {
        setError("");
        try {
            await axiosInstance.delete(`/vehicles/parts/${part._id}`);
            setParts((list) => list.filter((item) => item._id !== part._id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("vehiclesApp.parts.deleteError", "Unable to delete this spare part."));
        }
    };

    const factsOf = (part) =>
        [
            { label: t("vehiclesApp.parts.fits", "Fits"), value: compatibilityLabel(part, t) },
            { label: t("vehiclesApp.filters.condition", "Condition"), value: optionLabel(t, "partCondition", part.condition) },
            { label: t("vehiclesApp.parts.form.brand", "Part brand"), value: part.brand },
            { label: t("vehiclesApp.parts.form.quantity", "Quantity"), value: part.quantity > 1 ? formatNumber(part.quantity, i18n.language) : null },
        ].filter((fact) => fact.value);

    return (
        <Box>
            {parts.length > 0 && (
                <FilterPanel activeCount={activeCount} onClear={() => setFilters(DEFAULT_FILTERS)} sx={{ mb: 3 }}>
                    <FilterGrid min={180}>
                        <FilterSelect
                            label={t("vehiclesApp.parts.form.category", "Category")}
                            value={filters.partCategory}
                            onChange={(value) => setFilter("partCategory", value)}
                            options={[{ value: ALL, label: t("vehiclesApp.parts.allParts", "All parts") }, ...PART_CATEGORIES.map((value) => ({ value, label: optionLabel(t, "partCategory", value) }))]}
                        />
                        <FilterSelect
                            label={t("vehiclesApp.mine.status", "Status")}
                            value={filters.status}
                            onChange={(value) => setFilter("status", value)}
                            options={[{ value: ALL, label: t("vehiclesApp.mine.allStatuses", "All statuses") }, ...PART_STATUSES.map((value) => ({ value, label: t(`vehiclesApp.status.${value}`, value) }))]}
                        />
                        <FilterSelect
                            label={t("vehiclesApp.map.city", "City")}
                            value={filters.city}
                            onChange={(value) => setFilter("city", value)}
                            options={[{ value: ALL, label: t("vehiclesApp.mine.allCities", "All cities") }, ...cities.map((city) => ({ value: city, label: city }))]}
                        />
                    </FilterGrid>
                </FilterPanel>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A" }}>
                    {t("vehiclesApp.parts.myTitle", "My spare parts")}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 600 }}>
                    {t("vehiclesApp.mine.count", "{{count}} listings", { count: filtered.length })}
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Box sx={{ py: 6, px: 2, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: "16px", bgcolor: "#F5F7FB" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155", mb: 1 }}>
                        {parts.length > 0 ? t("vehiclesApp.mine.noMatch", "No listing matches these filters") : t("vehiclesApp.parts.mineEmpty", "You have not published a spare part yet")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                        {t("vehiclesApp.mine.emptySubtitle", "Your listings will appear here once published.")}
                    </Typography>
                    {parts.length > 0 ? (
                        <Button variant="outlined" onClick={() => setFilters(DEFAULT_FILTERS)} sx={{ textTransform: "none" }}>
                            {t("vehiclesApp.mine.clearFilters", "Clear filters")}
                        </Button>
                    ) : (
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/vehicles/parts/publish")} sx={{ textTransform: "none" }}>
                            {t("vehiclesApp.sidebar.publishPart", "Publish a spare part")}
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    <Stack spacing={2.5}>
                        {shown.map((part) => {
                            const Icon = (PART_CATEGORY_STYLES[part.partCategory] || PART_CATEGORY_STYLES.other).icon;
                            return (
                                <MyVehicleCard
                                    key={part._id}
                                    vehicle={part}
                                    basePath="/vehicles/parts"
                                    typeLabel={optionLabel(t, "partCategory", part.partCategory)}
                                    offer={{ label: optionLabel(t, "partVehicleType", part.vehicleType || "car"), color: "#2563EB" }}
                                    facts={factsOf(part)}
                                    statuses={PART_STATUSES}
                                    emptyIcon={<Icon />}
                                    onStatusChange={changeStatus}
                                    onDelete={deletePart}
                                />
                            );
                        })}
                    </Stack>
                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                            <Pagination count={totalPages} page={currentPage} onChange={(_event, value) => setPage(value)} color="primary" shape="rounded" />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}
