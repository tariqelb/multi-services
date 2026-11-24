// src/Apps/vehicles/SpareParts/SparePartsPage.jsx
//
// /vehicles/parts — car and moto spare parts. Same page as the vehicle list:
// banner, category strip, filters kept in the address (?vehicleType=moto&
// partCategory=brakes&make=Dacia...), cards, pages, "Publish" button.

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Autocomplete, Box, Button, Collapse, Fab, Pagination, Skeleton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import AddIcon from "@mui/icons-material/Add";

import axiosInstance from "../../../api/axiosInstance";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterChips, FilterField, FilterGrid, FilterPanel, FilterSearch, FilterSelect, filterFieldSx } from "../../../Components/ui/FilterKit";
import moroccanCities from "../../../data/moroccanCities";

import { makesFor, modelsForMake } from "../vehicleOptions";
import { optionLabel, optionList } from "../vehicleFormat";
import VehiclesBanner from "../VehicleList/VehiclesBanner";
import SparePartCard from "./SparePartCard";
import PartCategories from "./PartCategories";
import { PART_CONDITIONS, PART_SELLER_TYPES } from "./sparePartOptions";

const PAGE_SIZE = 12;
const FILTER_KEYS = ["q", "vehicleType", "partCategory", "make", "model", "year", "city", "minPrice", "maxPrice", "condition", "sellerType", "delivery"];
const LIST_KEYS = ["condition", "sellerType"];

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
    FILTER_KEYS.filter((key) => !["q", "vehicleType", "partCategory"].includes(key) && (LIST_KEYS.includes(key) ? filters[key]?.length : filters[key])).length;

export default function SparePartsPage() {
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
    const [data, setData] = useState({ parts: [], pagination: { total: 0, totalPages: 1 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const query = Object.fromEntries(new URLSearchParams(queryString));
                const response = await axiosInstance.get("/vehicles/parts", { params: { ...query, page, limit: PAGE_SIZE } });
                if (!cancelled) setData(response.data);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("vehiclesApp.parts.listError", "Unable to load spare parts."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [queryString, page, t]);

    const sortValue = sort !== "newest" ? sort : "";
    const edit = (key, value) => setDraft((current) => ({ ...current, [key]: value, ...(key === "make" ? { model: "" } : {}) }));
    const apply = (next = draft) => setParams(writeParams(next, { sort: sortValue }));
    const reset = () => setParams(writeParams({ vehicleType: applied.vehicleType, partCategory: applied.partCategory }, { sort: sortValue }));
    const changePage = (_, next) => {
        setParams(writeParams(applied, { sort: sortValue, page: next > 1 ? String(next) : "" }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const changeSort = (value) => setParams(writeParams(applied, { sort: value !== "newest" ? value : "" }));
    // Car / moto parts and the category apply at once.
    const applyNow = (changes, scroll = false) => {
        const next = { ...draft, ...changes };
        setDraft(next);
        apply(next);
        if (scroll) listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const isArabic = String(i18n.language).startsWith("ar");
    const cityOption = moroccanCities.find((city) => city.en === draft.city) || null;
    const makeCategory = draft.vehicleType === "moto" ? "moto" : "car";
    const { parts = [], pagination } = data;
    const activeCount = countActive(applied);

    return (
        <Box component="main" sx={{ flex: 1, minWidth: 0, width: "100%", boxSizing: "border-box", bgcolor: "#F5F7FB", minHeight: "calc(100vh - 4rem)", overflowX: "clip" }}>
            <VehiclesBanner category="part" />
            <PartCategories selected={applied.partCategory} onSelect={(key) => applyNow({ partCategory: key }, true)} />

            <Box ref={listRef} sx={{ ...pagePaddingSx, scrollMarginTop: 80 }}>
                <FilterPanel title={t("vehiclesApp.parts.filtersTitle", "Find a spare part")} activeCount={activeCount} onClear={reset} clearLabel={t("vehiclesApp.filters.clear", "Clear")}>
                    <FilterChips
                        options={[{ value: "", label: t("vehiclesApp.filters.all", "All") }, ...optionList(t, "partVehicleType", ["car", "moto"])]}
                        value={applied.vehicleType}
                        onChange={(value) => applyNow({ vehicleType: value || "", make: "", model: "" })}
                    />

                    <FilterSearch
                        value={draft.q}
                        onChange={(value) => edit("q", value)}
                        onSubmit={() => apply()}
                        submitLabel={t("vehiclesApp.filters.search", "Search")}
                        placeholder={t("vehiclesApp.parts.searchPlaceholder", "Part, brand, reference, make…")}
                        inputProps={{ maxLength: 60 }}
                    />

                    <FilterGrid min={180}>
                        <Autocomplete
                            freeSolo
                            size="small"
                            options={makesFor(makeCategory)}
                            value={draft.make}
                            onInputChange={(_, value) => {
                                if (value !== draft.make) edit("make", value);
                            }}
                            renderInput={(props) => <TextField {...props} label={t("vehiclesApp.parts.fitsMake", "For make")} sx={filterFieldSx} />}
                        />
                        <Autocomplete
                            freeSolo
                            size="small"
                            options={modelsForMake(draft.make, makeCategory)}
                            value={draft.model}
                            onInputChange={(_, value) => {
                                if (value !== draft.model) edit("model", value);
                            }}
                            renderInput={(props) => <TextField {...props} label={t("vehiclesApp.parts.fitsModel", "Model")} sx={filterFieldSx} />}
                        />
                        <FilterField type="number" label={t("vehiclesApp.parts.fitsYear", "Vehicle year")} value={draft.year} onChange={(value) => edit("year", value)} />
                        <Autocomplete
                            size="small"
                            options={moroccanCities}
                            value={cityOption}
                            onChange={(_, option) => edit("city", option?.en || "")}
                            getOptionLabel={(option) => (isArabic ? option.ar || option.en : option.en)}
                            isOptionEqualToValue={(option, value) => option.en === value.en}
                            renderInput={(props) => <TextField {...props} label={t("vehiclesApp.filters.city", "City")} sx={filterFieldSx} />}
                        />
                    </FilterGrid>

                    <Collapse in={moreOpen || activeCount > 3} unmountOnExit>
                        <Stack spacing={2}>
                            <FilterGrid min={160}>
                                <FilterField type="number" label={t("vehiclesApp.filters.minPrice", "Min price")} value={draft.minPrice} onChange={(value) => edit("minPrice", value)} />
                                <FilterField type="number" label={t("vehiclesApp.filters.maxPrice", "Max price")} value={draft.maxPrice} onChange={(value) => edit("maxPrice", value)} />
                            </FilterGrid>
                            <FilterChips
                                label={t("vehiclesApp.filters.condition", "Condition")}
                                multiple
                                options={optionList(t, "partCondition", PART_CONDITIONS)}
                                value={draft.condition}
                                onChange={(value) => edit("condition", value)}
                            />
                            <FilterChips
                                label={t("vehiclesApp.parts.soldBy", "Sold by")}
                                multiple
                                options={optionList(t, "sellerType", PART_SELLER_TYPES)}
                                value={draft.sellerType}
                                onChange={(value) => edit("sellerType", value)}
                            />
                            <FilterChips
                                label={t("vehiclesApp.parts.options", "Options")}
                                multiple
                                options={[{ value: "delivery", label: t("vehiclesApp.parts.delivery", "Delivery") }]}
                                value={draft.delivery === "true" ? ["delivery"] : []}
                                onChange={(value) => edit("delivery", value.includes("delivery") ? "true" : "")}
                            />
                        </Stack>
                    </Collapse>

                    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Button startIcon={<TuneRoundedIcon />} onClick={() => setMoreOpen((open) => !open)} disabled={activeCount > 3}>
                            {moreOpen || activeCount > 3 ? t("vehiclesApp.filters.less", "Fewer filters") : t("vehiclesApp.filters.more", "More filters")}
                        </Button>
                        <Button variant="contained" onClick={() => apply()} sx={{ textTransform: "none", fontWeight: 700 }}>
                            {t("vehiclesApp.filters.search", "Search")}
                        </Button>
                    </Stack>
                </FilterPanel>

                <Stack direction="row" sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mt: { xs: 2.5, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A", fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.5rem" } }}>
                            {applied.partCategory
                                ? t("vehiclesApp.list.categoryTitle", "{{category}} Listings", { category: optionLabel(t, "partCategory", applied.partCategory) })
                                : t("vehiclesApp.parts.listTitle", "Spare Part Listings")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B" }}>
                            {t("vehiclesApp.parts.count", "{{count}} parts", { count: pagination?.total || 0 })}
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
                            ]}
                        />
                    </Box>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                        : parts.map((part) => <SparePartCard key={part._id} part={part} onClick={() => navigate(`/vehicles/parts/${part._id}`)} />)}
                </Box>

                {!loading && !error && parts.length === 0 && (
                    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 8, color: "text.secondary" }}>
                        <SearchOffRoundedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
                        <Typography variant="h6" sx={{ color: "text.primary" }}>
                            {t("vehiclesApp.parts.empty", "No spare part matches these filters")}
                        </Typography>
                        <Typography>{t("vehiclesApp.list.emptyHint", "Try fewer filters, or another city.")}</Typography>
                        {(activeCount > 0 || applied.partCategory || applied.q) && (
                            <Button onClick={() => setParams(sortValue ? { sort } : {})}>{t("vehiclesApp.filters.clear", "Clear")}</Button>
                        )}
                    </Stack>
                )}

                {pagination?.totalPages > 1 && (
                    <Stack sx={{ alignItems: "center", mt: 4 }}>
                        <Pagination count={pagination.totalPages} page={Math.min(page, pagination.totalPages)} onChange={changePage} color="primary" shape="rounded" />
                    </Stack>
                )}
            </Box>

            {/* Same floating button as "Add vehicle". */}
            <Tooltip title={t("vehiclesApp.parts.fabTooltip", "Publish a spare part")} placement="left">
                <Fab
                    variant="extended"
                    color="primary"
                    aria-label={t("vehiclesApp.parts.fabLabel", "Add part")}
                    onClick={() => navigate("/vehicles/parts/publish")}
                    sx={{
                        position: "fixed !important",
                        bottom: { xs: 16, md: 32 },
                        insetInlineEnd: { xs: 16, md: 32 },
                        zIndex: 9999,
                        bgcolor: "#2563EB",
                        color: "#ffffff",
                        px: 3,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "0.95rem",
                        boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
                        "&:hover": { bgcolor: "#1D4ED8" },
                    }}
                >
                    <AddIcon sx={{ marginInlineEnd: 1, fontSize: 24 }} />
                    {t("vehiclesApp.parts.fabLabel", "Add part")}
                </Fab>
            </Tooltip>
        </Box>
    );
}
