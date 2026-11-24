// src/Apps/vehicles/Saved/SavedVehiclesPage.jsx
// /vehicles/saved — vehicles, motos and bikes I saved. Same idea as the
// saved properties, separate list: tabs for vehicles, motos & bikes and
// spare parts, offer and city filters, the usual cards, and "Remove" under
// each card. ?section=motos / ?section=parts opens a tab.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Pagination, Stack, Tab, Tabs, Typography } from "@mui/material";
import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import BookmarkRemoveOutlinedIcon from "@mui/icons-material/BookmarkRemoveOutlined";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterGrid, FilterPanel, FilterSelect } from "../../../Components/ui/FilterKit";

import VehicleCard from "../VehicleList/VehicleCard";
import SparePartCard from "../SpareParts/SparePartCard";
import { formatDate, optionLabel } from "../vehicleFormat";

const PER_PAGE = 9;
const ALL = "all";
const DEFAULT_FILTERS = { offer: ALL, city: ALL };
const SECTIONS = ["vehicles", "motos", "parts"];
// Items: { kind: "vehicle" | "part", listing, savedAt }.
const sectionOf = (item) => (item.kind === "part" ? "parts" : item.listing.category === "moto" ? "motos" : "vehicles");
// The "offer" filter: sale / rent for vehicles, car / moto for spare parts.
const offerOf = (item) => (item.kind === "part" ? item.listing.vehicleType || "car" : item.listing.listingType);

const gridSx = {
    display: "grid",
    gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
    gap: { xs: 2, sm: 2.5, md: 3 },
    alignItems: "stretch",
    "& > *": { minWidth: 0 },
};

export default function SavedVehiclesPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requested = searchParams.get("section");
    const section = SECTIONS.includes(requested) ? requested : "vehicles";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [vehicles, parts] = await Promise.allSettled([axiosInstance.get("/vehicles/saved"), axiosInstance.get("/vehicles/parts/saved")]);
            if (cancelled) return;
            const list = [];
            if (vehicles.status === "fulfilled") {
                (vehicles.value.data?.savedVehicles || []).forEach(({ vehicle, savedAt }) => vehicle && list.push({ kind: "vehicle", listing: vehicle, savedAt }));
            }
            if (parts.status === "fulfilled") {
                (parts.value.data?.savedParts || []).forEach(({ part, savedAt }) => part && list.push({ kind: "part", listing: part, savedAt }));
            }
            const failed = [vehicles, parts].find((result) => result.status === "rejected");
            if (failed) setError(failed.reason?.response?.data?.message || t("vehiclesApp.saved.loadError", "Unable to load your saved vehicles."));
            setItems(list);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    const counts = useMemo(() => {
        const result = { vehicles: 0, motos: 0, parts: 0 };
        items.forEach((item) => {
            result[sectionOf(item)] += 1;
        });
        return result;
    }, [items]);
    const isMotos = section === "motos";
    const isParts = section === "parts";
    const current = useMemo(() => items.filter((item) => sectionOf(item) === section), [items, section]);

    const cities = useMemo(
        () => [...new Set(current.map((item) => item.listing.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [current],
    );
    const filtered = current.filter(
        (item) =>
            (filters.offer === ALL || offerOf(item) === filters.offer) && (filters.city === ALL || item.listing.city === filters.city),
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const shown = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    const activeCount = Object.keys(DEFAULT_FILTERS).filter((key) => filters[key] !== DEFAULT_FILTERS[key]).length;

    const changeSection = (_event, value) => {
        setSearchParams(value === "vehicles" ? {} : { section: value }, { replace: true });
        setFilters(DEFAULT_FILTERS);
        setPage(1);
    };
    const setFilter = (field, value) => {
        setFilters((previous) => ({ ...previous, [field]: value }));
        setPage(1);
    };

    const remove = async (item) => {
        const id = item.listing._id;
        setRemovingId(id);
        setError("");
        try {
            await axiosInstance.delete(item.kind === "part" ? `/vehicles/parts/${id}/save` : `/vehicles/${id}/save`);
            setItems((list) => list.filter((entry) => entry.listing._id !== id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("vehiclesApp.saved.error", "Unable to update your saved vehicles."));
        } finally {
            setRemovingId(null);
        }
    };

    const browsePath = isParts ? "/vehicles/parts" : isMotos ? "/motos" : "/vehicles";
    const offerOptions = isParts
        ? [
              { value: ALL, label: t("vehiclesApp.parts.allVehicles", "Cars and motos") },
              { value: "car", label: optionLabel(t, "partVehicleType", "car") },
              { value: "moto", label: optionLabel(t, "partVehicleType", "moto") },
          ]
        : [
              { value: ALL, label: t("vehiclesApp.map.allOffers", "Sale and rent") },
              { value: "sale", label: optionLabel(t, "listingType", "sale") },
              { value: "rent", label: optionLabel(t, "listingType", "rent") },
          ];

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<BookmarksOutlinedIcon />}
                title={t("vehiclesApp.saved.title", "Saved vehicles")}
                subtitle={t("vehiclesApp.saved.subtitle", "The vehicles, motos, bikes and spare parts you saved, to compare them and find them again.")}
            />

            <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={section}
                    onChange={changeSection}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{ "& .MuiTab-root": { minHeight: 52, textTransform: "none", fontWeight: 600, fontSize: { xs: 13, sm: 15 } } }}
                >
                    <Tab value="vehicles" icon={<DirectionsCarIcon />} iconPosition="start" label={t("vehiclesApp.saved.tabVehicles", "Vehicles ({{count}})", { count: counts.vehicles })} />
                    <Tab value="motos" icon={<TwoWheelerIcon />} iconPosition="start" label={t("vehiclesApp.saved.tabMotos", "Motos & bikes ({{count}})", { count: counts.motos })} />
                    <Tab value="parts" icon={<BuildOutlinedIcon />} iconPosition="start" label={t("vehiclesApp.saved.tabParts", "Spare parts ({{count}})", { count: counts.parts })} />
                </Tabs>
            </Box>

            {current.length > 0 && (
                <FilterPanel activeCount={activeCount} onClear={() => setFilters(DEFAULT_FILTERS)} sx={{ mb: 3 }}>
                    <FilterGrid min={180}>
                        <FilterSelect
                            label={isParts ? t("vehiclesApp.parts.form.forVehicle", "For") : t("vehiclesApp.map.offer", "Offer")}
                            value={filters.offer}
                            onChange={(value) => setFilter("offer", value)}
                            options={offerOptions}
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

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Box sx={{ py: 6, px: 2, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: "16px", bgcolor: "#F5F7FB" }}>
                    <BookmarksOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155", mb: 1 }}>
                        {current.length > 0
                            ? t("vehiclesApp.mine.noMatch", "No listing matches these filters")
                            : isParts
                              ? t("vehiclesApp.saved.emptyParts", "No saved spare part yet")
                              : isMotos
                              ? t("vehiclesApp.saved.emptyMotos", "No saved moto or bike yet")
                              : t("vehiclesApp.saved.empty", "No saved vehicle yet")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                        {t("vehiclesApp.saved.emptyHint", "Open a listing and press “Save this vehicle” to keep it here.")}
                    </Typography>
                    {current.length > 0 ? (
                        <Button variant="outlined" onClick={() => setFilters(DEFAULT_FILTERS)} sx={{ textTransform: "none" }}>
                            {t("vehiclesApp.mine.clearFilters", "Clear filters")}
                        </Button>
                    ) : (
                        <Button variant="contained" startIcon={<SearchRoundedIcon />} onClick={() => navigate(browsePath)} sx={{ textTransform: "none" }}>
                            {isParts
                                ? t("vehiclesApp.sidebar.parts", "Spare parts")
                                : isMotos
                                  ? t("vehiclesApp.sidebar.browseMotos", "Motos & bikes")
                                  : t("vehiclesApp.sidebar.browse", "Find a vehicle")}
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    <Box sx={gridSx}>
                        {shown.map((item) => (
                            <Stack key={item.listing._id} spacing={1}>
                                {item.kind === "part" ? (
                                    <SparePartCard part={item.listing} onClick={() => navigate(`/vehicles/parts/${item.listing._id}`)} />
                                ) : (
                                    <VehicleCard vehicle={item.listing} onClick={() => navigate(`/vehicles/${item.listing._id}`)} />
                                )}
                                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {t("vehiclesApp.saved.savedOn", "Saved on {{date}}", { date: formatDate(item.savedAt, i18n.language) })}
                                    </Typography>
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={removingId === item.listing._id ? <CircularProgress size={14} color="inherit" /> : <BookmarkRemoveOutlinedIcon />}
                                        disabled={removingId === item.listing._id}
                                        onClick={() => remove(item)}
                                        sx={{ textTransform: "none", fontWeight: 600 }}
                                    >
                                        {t("vehiclesApp.saved.remove", "Remove")}
                                    </Button>
                                </Stack>
                            </Stack>
                        ))}
                    </Box>
                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(_event, value) => {
                                    setPage(value);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                color="primary"
                                shape="rounded"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}
