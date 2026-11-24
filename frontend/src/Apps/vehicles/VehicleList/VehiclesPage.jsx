// src/Apps/vehicles/VehicleList/VehiclesPage.jsx
//
// /vehicles (cars) and /motos (motorcycles, scooters, bicycles, kick scooters,
// tricycles) — for sale and for rent. Filters live in the address
// (?listingType=rent&make=Dacia&page=2...), so a search can be shared.

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Collapse,
    Pagination,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

import axiosInstance from "../../../api/axiosInstance";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import {
    FilterChips,
    FilterField,
    FilterGrid,
    FilterPanel,
    FilterSearch,
    FilterSelect,
    filterFieldSx,
} from "../../../Components/ui/FilterKit";
import moroccanCities from "../../../data/moroccanCities";

import { BODY_TYPES, FUELS, MOTO_TYPES, PUBLISHER_TYPES, TRANSMISSIONS, makesFor, modelsForMake } from "../vehicleOptions";
import { optionLabel, optionList } from "../vehicleFormat";
import VehicleCard from "./VehicleCard";
import VehiclesBanner from "./VehiclesBanner";
import VehicleCategories from "./VehicleCategories";
import PublishVehicleFab from "./PublishVehicleFab";

const PAGE_SIZE = 12;

// Filters kept in the address. Lists are comma separated.
const FILTER_KEYS = [
    "q", "listingType", "make", "model", "city", "minPrice", "maxPrice", "minYear", "maxYear",
    "maxMileage", "fuel", "transmission", "bodyType", "motoType", "minSeats", "publisherType", "condition", "withDriver", "insurance",
];
const LIST_KEYS = ["fuel", "transmission", "bodyType", "motoType", "publisherType"];
const MOTO_FILTER_FUELS = ["petrol", "electric", "none"];

const readFilters = (params) =>
    Object.fromEntries(FILTER_KEYS.map((key) => [key, LIST_KEYS.includes(key) ? (params.get(key) || "").split(",").filter(Boolean) : params.get(key) || ""]));

const writeParams = (filters, extra = {}) => {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
        const value = LIST_KEYS.includes(key) ? (filters[key] || []).join(",") : filters[key];
        if (value) params.set(key, value);
    }
    for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
    return params;
};

const countActive = (filters) =>
    FILTER_KEYS.filter((key) => key !== "q" && (LIST_KEYS.includes(key) ? filters[key]?.length : filters[key])).length;

/** category: "car" (/vehicles) or "moto" (/motos). */
export default function VehiclesPage({ category = "car" }) {
    const isMoto = category === "moto";
    // The strip filters on body type (cars) or moto type (motos).
    const typeKey = isMoto ? "motoType" : "bodyType";
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    const applied = readFilters(params);
    const page = Math.max(1, Number(params.get("page")) || 1);
    const sort = params.get("sort") || "newest";
    const queryString = params.toString();

    // Draft follows the address (back / forward), edited until "Search".
    const [draft, setDraft] = useState(applied);
    const [draftSource, setDraftSource] = useState(queryString);
    if (draftSource !== queryString) {
        setDraftSource(queryString);
        setDraft(applied);
    }

    const listRef = useRef(null);
    const [moreOpen, setMoreOpen] = useState(false);
    const [data, setData] = useState({ vehicles: [], pagination: { total: 0, totalPages: 1 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const query = Object.fromEntries(new URLSearchParams(queryString));
                const response = await axiosInstance.get("/vehicles", { params: { ...query, category, page, limit: PAGE_SIZE } });
                if (!cancelled) setData(response.data);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("vehiclesApp.list.error", "Unable to load vehicles."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [queryString, page, category, t]);

    const edit = (key, value) => setDraft((current) => ({ ...current, [key]: value, ...(key === "make" ? { model: "" } : {}) }));
    const apply = (next = draft) => setParams(writeParams(next, { sort: sort !== "newest" ? sort : "" }));
    const reset = () => setParams(sort !== "newest" ? { sort } : {});
    const changePage = (_, next) => {
        setParams(writeParams(applied, { sort: sort !== "newest" ? sort : "", page: next > 1 ? String(next) : "" }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const changeSort = (value) => setParams(writeParams(applied, { sort: value !== "newest" ? value : "" }));
    // Offer chips apply at once: it is the first choice people make.
    const changeOffer = (value) => {
        const next = { ...draft, listingType: value || "" };
        setDraft(next);
        apply(next);
    };

    const isArabic = String(i18n.language).startsWith("ar");
    const cityOption = moroccanCities.find((city) => city.en === draft.city) || null;
    const { vehicles, pagination } = data;
    const activeCount = countActive(applied);

    // Category strip: one type at once, applied right away.
    const selectedCategory = applied[typeKey].length === 1 ? applied[typeKey][0] : "";
    const chooseCategory = (key) => {
        const next = { ...draft, [typeKey]: key ? [key] : [] };
        setDraft(next);
        apply(next);
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <Box
            component="main"
            sx={{ flex: 1, minWidth: 0, width: "100%", boxSizing: "border-box", bgcolor: "#F5F7FB", minHeight: "calc(100vh - 4rem)", overflowX: "clip" }}
        >
            <VehiclesBanner category={category} />
            <VehicleCategories category={category} selected={selectedCategory} onSelect={chooseCategory} />

            <Box ref={listRef} sx={{ ...pagePaddingSx, scrollMarginTop: 80 }}>

            <FilterPanel title={isMoto ? t("vehiclesApp.filters.motoTitle", "Find a moto") : t("vehiclesApp.filters.title", "Find a vehicle")} activeCount={activeCount} onClear={reset} clearLabel={t("vehiclesApp.filters.clear", "Clear")}>
                <FilterChips
                    options={[{ value: "", label: t("vehiclesApp.filters.all", "All") }, ...optionList(t, "listingType", ["sale", "rent"])]}
                    value={applied.listingType}
                    onChange={changeOffer}
                />

                <FilterSearch
                    value={draft.q}
                    onChange={(value) => edit("q", value)}
                    onSubmit={() => apply()}
                    submitLabel={t("vehiclesApp.filters.search", "Search")}
                    placeholder={t("vehiclesApp.filters.searchPlaceholder", "Make, model, agency…")}
                    inputProps={{ maxLength: 60 }}
                />

                <FilterGrid min={180}>
                    <Autocomplete
                        freeSolo
                        size="small"
                        options={makesFor(category)}
                        value={draft.make}
                        onInputChange={(_, value) => {
                            if (value !== draft.make) edit("make", value);
                        }}
                        renderInput={(props) => <TextField {...props} label={t("vehiclesApp.filters.make", "Make")} sx={filterFieldSx} />}
                    />
                    <Autocomplete
                        freeSolo
                        size="small"
                        options={modelsForMake(draft.make, category)}
                        value={draft.model}
                        onInputChange={(_, value) => {
                            if (value !== draft.model) edit("model", value);
                        }}
                        renderInput={(props) => <TextField {...props} label={t("vehiclesApp.filters.model", "Model")} sx={filterFieldSx} />}
                    />
                    <Autocomplete
                        size="small"
                        options={moroccanCities}
                        value={cityOption}
                        onChange={(_, option) => edit("city", option?.en || "")}
                        getOptionLabel={(option) => (isArabic ? option.ar || option.en : option.en)}
                        isOptionEqualToValue={(option, value) => option.en === value.en}
                        renderInput={(props) => <TextField {...props} label={t("vehiclesApp.filters.city", "City")} sx={filterFieldSx} />}
                    />
                    <FilterField type="number" label={t("vehiclesApp.filters.minPrice", "Min price")} value={draft.minPrice} onChange={(value) => edit("minPrice", value)} />
                    <FilterField type="number" label={t("vehiclesApp.filters.maxPrice", "Max price")} value={draft.maxPrice} onChange={(value) => edit("maxPrice", value)} />
                </FilterGrid>

                <Collapse in={moreOpen || activeCount > 3} unmountOnExit>
                    <Stack spacing={2}>
                        <FilterGrid min={160}>
                            <FilterField type="number" label={t("vehiclesApp.filters.minYear", "Year from")} value={draft.minYear} onChange={(value) => edit("minYear", value)} />
                            <FilterField type="number" label={t("vehiclesApp.filters.maxYear", "Year to")} value={draft.maxYear} onChange={(value) => edit("maxYear", value)} />
                            <FilterField type="number" label={t("vehiclesApp.filters.maxMileage", "Max km")} value={draft.maxMileage} onChange={(value) => edit("maxMileage", value)} />
                            {!isMoto && (
                                <FilterField type="number" label={t("vehiclesApp.filters.minSeats", "Min seats")} value={draft.minSeats} onChange={(value) => edit("minSeats", value)} />
                            )}
                            <FilterSelect
                                label={t("vehiclesApp.filters.condition", "Condition")}
                                value={draft.condition}
                                onChange={(value) => edit("condition", value)}
                                options={[{ value: "", label: t("vehiclesApp.filters.any", "Any") }, ...optionList(t, "condition", ["used", "new"])]}
                            />
                        </FilterGrid>
                        <FilterChips
                            label={isMoto ? t("vehiclesApp.form.moto.power", "Power") : t("vehiclesApp.filters.fuel", "Fuel")}
                            multiple
                            options={optionList(t, "fuel", isMoto ? MOTO_FILTER_FUELS : FUELS)}
                            value={draft.fuel}
                            onChange={(value) => edit("fuel", value)}
                        />
                        <FilterChips
                            label={t("vehiclesApp.filters.transmission", "Gearbox")}
                            multiple
                            options={optionList(t, "transmission", TRANSMISSIONS)}
                            value={draft.transmission}
                            onChange={(value) => edit("transmission", value)}
                        />
                        {isMoto ? (
                            <FilterChips label={t("vehiclesApp.form.moto.type", "Type")} multiple options={optionList(t, "motoType", MOTO_TYPES)} value={draft.motoType} onChange={(value) => edit("motoType", value)} />
                        ) : (
                            <FilterChips label={t("vehiclesApp.filters.bodyType", "Body type")} multiple options={optionList(t, "bodyType", BODY_TYPES)} value={draft.bodyType} onChange={(value) => edit("bodyType", value)} />
                        )}
                        <FilterChips
                            label={t("vehiclesApp.filters.publisherType", "Published by")}
                            multiple
                            options={optionList(t, "publisherType", PUBLISHER_TYPES)}
                            value={draft.publisherType}
                            onChange={(value) => edit("publisherType", value)}
                        />
                        {draft.listingType === "rent" && (
                            <FilterChips
                                label={t("vehiclesApp.filters.rentOptions", "Rental options")}
                                multiple
                                options={[
                                    { value: "withDriver", label: t("vehiclesApp.filters.withDriver", "With driver") },
                                    { value: "comprehensive", label: t("vehiclesApp.filters.comprehensive", "Comprehensive insurance") },
                                ]}
                                value={[draft.withDriver === "true" && "withDriver", draft.insurance === "comprehensive" && "comprehensive"].filter(Boolean)}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        withDriver: value.includes("withDriver") ? "true" : "",
                                        insurance: value.includes("comprehensive") ? "comprehensive" : "",
                                    }))
                                }
                            />
                        )}
                    </Stack>
                </Collapse>

                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-start" }}>
                    <Button startIcon={<TuneRoundedIcon />} onClick={() => setMoreOpen((open) => !open)} disabled={activeCount > 3}>
                        {moreOpen || activeCount > 3 ? t("vehiclesApp.filters.less", "Fewer filters") : t("vehiclesApp.filters.more", "More filters")}
                    </Button>
                </Stack>
            </FilterPanel>

            <Stack direction="row" sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mt: { xs: 2.5, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A", fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.5rem" } }}>
                        {selectedCategory
                            ? t("vehiclesApp.list.categoryTitle", "{{category}} Listings", { category: optionLabel(t, typeKey, selectedCategory) })
                            : isMoto
                              ? t("vehiclesApp.list.motoTitle", "Moto Listings")
                              : t("vehiclesApp.list.title", "Vehicle Listings")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B" }}>
                        {isMoto
                            ? t("vehiclesApp.list.motoCount", "{{count}} motos", { count: pagination.total || 0 })
                            : t("vehiclesApp.list.count", "{{count}} vehicles", { count: pagination.total || 0 })}
                    </Typography>
                </Box>
                <Box sx={{ minWidth: 200 }}>
                    <FilterSelect
                        label={t("vehiclesApp.sort.label", "Sort by")}
                        value={sort}
                        onChange={changeSort}
                        options={[
                            { value: "newest", label: t("vehiclesApp.sort.newest", "Newest") },
                            { value: "priceAsc", label: t("vehiclesApp.sort.priceAsc", "Price: low to high") },
                            { value: "priceDesc", label: t("vehiclesApp.sort.priceDesc", "Price: high to low") },
                            { value: "yearDesc", label: t("vehiclesApp.sort.yearDesc", "Most recent year") },
                            { value: "mileageAsc", label: t("vehiclesApp.sort.mileageAsc", "Lowest mileage") },
                        ]}
                    />
                </Box>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Same grid as the property list: 1, 2 then 3 cards per row. */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                    gap: { xs: 2, sm: 2.5, md: 3, lg: 4 },
                    alignItems: "stretch",
                    "& > *": { minWidth: 0 },
                }}
            >
                {loading
                    ? Array.from({ length: 6 }, (_, index) => <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: 4 }} />)
                    : vehicles.map((vehicle) => <VehicleCard key={vehicle._id} vehicle={vehicle} onClick={() => navigate(`/vehicles/${vehicle._id}`)} />)}
            </Box>

            {!loading && !error && vehicles.length === 0 && (
                <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 8, color: "text.secondary" }}>
                    <SearchOffRoundedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
                    <Typography variant="h6" sx={{ color: "text.primary" }}>
                        {t("vehiclesApp.list.empty", "No vehicle matches these filters")}
                    </Typography>
                    <Typography>{t("vehiclesApp.list.emptyHint", "Try fewer filters, or another city.")}</Typography>
                    {activeCount > 0 && <Button onClick={reset}>{t("vehiclesApp.filters.clear", "Clear")}</Button>}
                </Stack>
            )}

            {pagination.totalPages > 1 && (
                <Stack sx={{ alignItems: "center", mt: 4 }}>
                    <Pagination count={pagination.totalPages} page={Math.min(page, pagination.totalPages)} onChange={changePage} color="primary" shape="rounded" />
                </Stack>
            )}
            </Box>

            <PublishVehicleFab category={category} />
        </Box>
    );
}
