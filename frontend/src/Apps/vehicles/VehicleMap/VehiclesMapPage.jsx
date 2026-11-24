// src/Apps/vehicles/VehicleMap/VehiclesMapPage.jsx
// /vehicles/map — cars and motos & bikes on a map, same page as the property
// "Find by map": header with the count, filters, map.
// One request loads every available vehicle; filters run in the browser.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterField, FilterGrid, FilterPanel, FilterSelect } from "../../../Components/ui/FilterKit";
import moroccanCities from "../../../data/moroccanCities";

import { BODY_TYPES, MOTO_TYPES, PUBLISHER_TYPES } from "../vehicleOptions";
import { optionLabel } from "../vehicleFormat";
import VehicleMap from "./VehicleMap";

const ALL = "all";
const DEFAULT_FILTERS = { category: ALL, type: ALL, listingType: ALL, city: ALL, publisherType: ALL, maxPrice: "" };

const sameCity = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

export default function VehiclesMapPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isArabic = String(i18n.language).startsWith("ar");

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get("/vehicles/map");
                if (!cancelled) setVehicles(Array.isArray(data?.vehicles) ? data.vehicles : []);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("vehiclesApp.map.loadError", "Unable to load the vehicles map."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    const set = (field, value) =>
        setFilters((current) => ({
            ...current,
            [field]: value,
            // The type list depends on the section.
            ...(field === "category" ? { type: ALL } : {}),
        }));

    // Cities that have at least one vehicle on the map.
    const cities = useMemo(() => {
        const names = [...new Set(vehicles.map((vehicle) => vehicle.city).filter(Boolean))];
        return names
            .map((name) => {
                const known = moroccanCities.find((city) => sameCity(city.en, name));
                return { value: name, label: isArabic && known?.ar ? known.ar : name };
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [vehicles, isArabic]);

    const typeOptions =
        filters.category === "moto"
            ? MOTO_TYPES.map((value) => ({ value, label: optionLabel(t, "motoType", value) }))
            : filters.category === "car"
              ? BODY_TYPES.map((value) => ({ value, label: optionLabel(t, "bodyType", value) }))
              : [];

    const shown = useMemo(
        () =>
            vehicles.filter((vehicle) => {
                const isMoto = vehicle.category === "moto";
                if (filters.category === "moto" && !isMoto) return false;
                if (filters.category === "car" && isMoto) return false;
                if (filters.type !== ALL && (isMoto ? vehicle.motoType : vehicle.bodyType) !== filters.type) return false;
                if (filters.listingType !== ALL && vehicle.listingType !== filters.listingType) return false;
                if (filters.city !== ALL && !sameCity(vehicle.city, filters.city)) return false;
                if (filters.publisherType !== ALL && vehicle.publisherType !== filters.publisherType) return false;
                if (filters.maxPrice !== "" && Number(vehicle.price) > Number(filters.maxPrice)) return false;
                return true;
            }),
        [vehicles, filters],
    );

    const activeCount = Object.keys(DEFAULT_FILTERS).filter((key) => filters[key] !== DEFAULT_FILTERS[key]).length;
    const openVehicle = useCallback((vehicle) => navigate(`/vehicles/${vehicle._id}`), [navigate]);

    return (
        <Box className="find-map-page" sx={pagePaddingSx}>
            <PageHeader
                icon={<TravelExploreOutlinedIcon />}
                title={t("vehiclesApp.map.title", "Find vehicles on the map")}
                subtitle={t("vehiclesApp.map.subtitle", "Cars, motos and bikes for sale or rent near you. Hover a marker to preview it.")}
                action={
                    <Chip
                        color="primary"
                        variant="outlined"
                        label={t("vehiclesApp.map.count", "{{count}} on the map", { count: shown.length })}
                        sx={{ fontWeight: 700 }}
                    />
                }
                sx={{ mb: 0 }}
            />

            <FilterPanel activeCount={activeCount} onClear={() => setFilters(DEFAULT_FILTERS)} sx={{ mb: 0 }}>
                <FilterGrid min={170}>
                    <FilterSelect
                        label={t("vehiclesApp.map.section", "Section")}
                        value={filters.category}
                        onChange={(value) => set("category", value)}
                        options={[
                            { value: ALL, label: t("vehiclesApp.map.allSections", "Cars, motos & bikes") },
                            { value: "car", label: t("vehiclesApp.map.cars", "Cars") },
                            { value: "moto", label: t("vehiclesApp.map.motos", "Motos & bikes") },
                        ]}
                    />
                    {typeOptions.length > 0 && (
                        <FilterSelect
                            label={t("vehiclesApp.map.type", "Type")}
                            value={filters.type}
                            onChange={(value) => set("type", value)}
                            options={[{ value: ALL, label: t("vehiclesApp.map.allTypes", "All types") }, ...typeOptions]}
                        />
                    )}
                    <FilterSelect
                        label={t("vehiclesApp.map.offer", "Offer")}
                        value={filters.listingType}
                        onChange={(value) => set("listingType", value)}
                        options={[
                            { value: ALL, label: t("vehiclesApp.map.allOffers", "Sale and rent") },
                            { value: "sale", label: optionLabel(t, "listingType", "sale") },
                            { value: "rent", label: optionLabel(t, "listingType", "rent") },
                        ]}
                    />
                    <FilterSelect
                        label={t("vehiclesApp.map.city", "City")}
                        value={filters.city}
                        onChange={(value) => set("city", value)}
                        options={[{ value: ALL, label: t("vehiclesApp.map.allCities", "All Morocco") }, ...cities]}
                    />
                    <FilterSelect
                        label={t("vehiclesApp.map.publisher", "Publisher")}
                        value={filters.publisherType}
                        onChange={(value) => set("publisherType", value)}
                        options={[
                            { value: ALL, label: t("vehiclesApp.map.allPublishers", "Everyone") },
                            ...PUBLISHER_TYPES.map((value) => ({ value, label: optionLabel(t, "publisherType", value) })),
                        ]}
                    />
                    <FilterField
                        type="number"
                        label={t("vehiclesApp.map.maxPrice", "Maximum price (MAD)")}
                        value={filters.maxPrice}
                        onChange={(value) => set("maxPrice", value)}
                    />
                </FilterGrid>
            </FilterPanel>

            {loading ? (
                <Box className="find-map-loading">
                    <CircularProgress />
                    <Typography sx={{ color: "text.secondary" }}>{t("vehiclesApp.map.loading", "Loading vehicles...")}</Typography>
                </Box>
            ) : error ? (
                <Box className="find-map-message">
                    <Alert severity="error">{error}</Alert>
                </Box>
            ) : shown.length === 0 ? (
                <Box className="find-map-message">
                    <Typography sx={{ fontWeight: 600 }}>{t("vehiclesApp.map.emptyTitle", "No vehicle on the map")}</Typography>
                    <Typography sx={{ color: "text.secondary" }}>
                        {t("vehiclesApp.map.emptySubtitle", "Try another section, city or price.")}
                    </Typography>
                </Box>
            ) : (
                <VehicleMap vehicles={shown} onVehicleClick={openVehicle} />
            )}
        </Box>
    );
}
