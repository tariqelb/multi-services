// src/Apps/vehicles/MyVehicles/MyVehiclesPage.jsx
// /vehicles/mine — same page as the property "My publications":
// one tab for vehicles (cars) and one for motos & bikes, filters,
// horizontal cards with Edit · Edit status · View details · Delete.
// ?section=motos opens the motos & bikes tab, ?section=parts the spare parts.
//
// Also used inside My profile (/vehicles/profile), like the property
// "My publications": embedded hides the page header and the section tabs,
// section picks the list, onVehiclesChange receives the loaded vehicles
// (for the profile statistics).

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Pagination, Stack, Tab, Tabs, Typography } from "@mui/material";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterGrid, FilterPanel, FilterSelect } from "../../../Components/ui/FilterKit";

import { optionLabel } from "../vehicleFormat";
import MyVehicleCard from "./MyVehicleCard";
import MySparePartsSection from "../SpareParts/MySparePartsSection";
import VehicleRequestsList from "../Requests/VehicleRequestsList";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";

const PER_PAGE = 5;
const ALL = "all";
const DEFAULT_FILTERS = { listingType: ALL, status: ALL, city: ALL };
const STATUSES = ["Available", "Sold", "Rented", "Inactive"];
const SECTIONS = ["vehicles", "motos", "parts", "requests"];
const PUBLISH = {
    vehicles: { path: "/vehicles/publish", key: "vehiclesApp.sidebar.publish", label: "Publish a vehicle" },
    motos: { path: "/motos/publish", key: "vehiclesApp.sidebar.publishMoto", label: "Publish a moto or bike" },
    parts: { path: "/vehicles/parts/publish", key: "vehiclesApp.sidebar.publishPart", label: "Publish a spare part" },
    requests: { path: "/vehicles/requests/new", key: "requests.post", label: "Post a request" },
};

export default function MyVehiclesPage({ embedded = false, section: sectionProp, onVehiclesChange, onPartsChange } = {}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requested = searchParams.get("section");
    const section = sectionProp || (SECTIONS.includes(requested) ? requested : "vehicles");
    const [partsCount, setPartsCount] = useState(null);

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get("/vehicles/mine");
                if (!cancelled) setVehicles(data.vehicles || []);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("vehiclesApp.mine.error", "Unable to load your vehicles."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    // Spare parts count for the tab label (the parts list loads in its own section).
    useEffect(() => {
        if (embedded) return undefined;
        let cancelled = false;
        axiosInstance
            .get("/vehicles/parts/mine")
            .then(({ data }) => !cancelled && setPartsCount((data.parts || []).length))
            .catch(() => !cancelled && setPartsCount(0));
        return () => {
            cancelled = true;
        };
    }, [embedded]);

    useEffect(() => {
        if (!loading) onVehiclesChange?.(vehicles);
    }, [vehicles, loading, onVehiclesChange]);

    const cars = useMemo(() => vehicles.filter((vehicle) => vehicle.category !== "moto"), [vehicles]);
    const motos = useMemo(() => vehicles.filter((vehicle) => vehicle.category === "moto"), [vehicles]);
    const current = section === "motos" ? motos : cars;

    const cities = useMemo(
        () => [...new Set(current.map((vehicle) => vehicle.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [current],
    );

    const filtered = current.filter(
        (vehicle) =>
            (filters.listingType === ALL || vehicle.listingType === filters.listingType) &&
            (filters.status === ALL || (vehicle.status || "Available") === filters.status) &&
            (filters.city === ALL || vehicle.city === filters.city),
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

    const changeStatus = async (vehicle, status) => {
        setError("");
        try {
            await axiosInstance.patch(`/vehicles/${vehicle._id}/status`, { status });
            setVehicles((list) => list.map((item) => (item._id === vehicle._id ? { ...item, status } : item)));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("vehiclesApp.mine.statusError", "Unable to change the status."));
        }
    };

    const deleteVehicle = async (vehicle) => {
        setError("");
        try {
            await axiosInstance.delete(`/vehicles/${vehicle._id}`);
            setVehicles((list) => list.filter((item) => item._id !== vehicle._id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("vehiclesApp.mine.deleteError", "Unable to delete this vehicle."));
        }
    };

    const isMotos = section === "motos";
    const isParts = section === "parts";
    const isRequests = section === "requests";
    const publish = PUBLISH[section];
    const publishPath = publish.path;
    const handlePartsChange = (parts) => {
        setPartsCount(parts.length);
        onPartsChange?.(parts);
    };

    return (
        <Box sx={embedded ? undefined : pagePaddingSx}>
            {!embedded && (
                <PageHeader
                    icon={<LibraryBooksOutlinedIcon />}
                    title={t("topbar.myPublication", "My Publication")}
                    subtitle={t("vehiclesApp.mine.pageSubtitle", "Manage your vehicles, your motos & bikes and your spare parts: edit them, change their status or delete them.")}
                    action={
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate(publishPath)} sx={{ textTransform: "none", fontWeight: 700 }}>
                            {t(publish.key, publish.label)}
                        </Button>
                    }
                />
            )}

            {/* Sections */}
            {!embedded && (
                <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={section}
                        onChange={changeSection}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{ "& .MuiTab-root": { minHeight: 52, textTransform: "none", fontWeight: 600, fontSize: { xs: 13, sm: 15 } } }}
                    >
                        <Tab
                            value="vehicles"
                            icon={<DirectionsCarIcon />}
                            iconPosition="start"
                            label={t("vehiclesApp.mine.tabVehicles", "My vehicles ({{count}})", { count: cars.length })}
                        />
                        <Tab
                            value="motos"
                            icon={<TwoWheelerIcon />}
                            iconPosition="start"
                            label={t("vehiclesApp.mine.tabMotos", "My motos & bikes ({{count}})", { count: motos.length })}
                        />
                        <Tab
                            value="parts"
                            icon={<BuildOutlinedIcon />}
                            iconPosition="start"
                            label={t("vehiclesApp.mine.tabParts", "My spare parts ({{count}})", { count: partsCount ?? 0 })}
                        />
                        <Tab
                            value="requests"
                            icon={<CampaignOutlinedIcon />}
                            iconPosition="start"
                            label={t("requests.nav.mine", "My requests")}
                        />
                    </Tabs>
                </Box>
            )}

            {isRequests ? (
                <VehicleRequestsList mode="mine" showPost={embedded} />
            ) : isParts ? (
                <MySparePartsSection onPartsChange={handlePartsChange} />
            ) : (
                <>
                {current.length > 0 && (
                    <FilterPanel activeCount={activeCount} onClear={() => setFilters(DEFAULT_FILTERS)} sx={{ mb: 3 }}>
                        <FilterGrid min={180}>
                            <FilterSelect
                                label={t("vehiclesApp.map.offer", "Offer")}
                                value={filters.listingType}
                                onChange={(value) => setFilter("listingType", value)}
                                options={[
                                    { value: ALL, label: t("vehiclesApp.map.allOffers", "Sale and rent") },
                                    { value: "sale", label: optionLabel(t, "listingType", "sale") },
                                    { value: "rent", label: optionLabel(t, "listingType", "rent") },
                                ]}
                            />
                            <FilterSelect
                                label={t("vehiclesApp.mine.status", "Status")}
                                value={filters.status}
                                onChange={(value) => setFilter("status", value)}
                                options={[
                                    { value: ALL, label: t("vehiclesApp.mine.allStatuses", "All statuses") },
                                    ...STATUSES.map((value) => ({ value, label: t(`vehiclesApp.status.${value}`, value) })),
                                ]}
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
                        {isMotos ? t("vehiclesApp.mine.motosTitle", "My motos & bikes") : t("vehiclesApp.mine.vehiclesTitle", "My vehicles")}
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
                            {current.length > 0
                                ? t("vehiclesApp.mine.noMatch", "No listing matches these filters")
                                : isMotos
                                  ? t("vehiclesApp.mine.emptyMotos", "You have not published a moto or bike yet")
                                  : t("vehiclesApp.mine.empty", "You have not published a vehicle yet")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                            {t("vehiclesApp.mine.emptySubtitle", "Your listings will appear here once published.")}
                        </Typography>
                        {current.length > 0 ? (
                            <Button variant="outlined" onClick={() => setFilters(DEFAULT_FILTERS)} sx={{ textTransform: "none" }}>
                                {t("vehiclesApp.mine.clearFilters", "Clear filters")}
                            </Button>
                        ) : (
                            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate(publishPath)} sx={{ textTransform: "none" }}>
                                {isMotos ? t("vehiclesApp.sidebar.publishMoto", "Publish a moto or bike") : t("vehiclesApp.sidebar.publish", "Publish a vehicle")}
                            </Button>
                        )}
                    </Box>
                ) : (
                    <>
                        <Stack spacing={2.5}>
                            {shown.map((vehicle) => (
                                <MyVehicleCard key={vehicle._id} vehicle={vehicle} onStatusChange={changeStatus} onDelete={deleteVehicle} />
                            ))}
                        </Stack>
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
                </>
            )}
        </Box>
    );
}
