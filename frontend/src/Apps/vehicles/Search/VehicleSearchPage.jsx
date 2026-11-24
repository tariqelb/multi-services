// src/Apps/vehicles/Search/VehicleSearchPage.jsx
//
// /vehicles/search — one search for cars, motos & bikes and spare parts
// (same design and behaviour as the property search page).
//   criteria  -> kept in the address (shareable, back button works)
//   results   -> numbered cards
//   map       -> same numbers, tooltip on hover, side panel on click

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Chip, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterSelect } from "../../../Components/ui/FilterKit";
import VehicleSearchFilters from "./VehicleSearchFilters";
import { EMPTY_CRITERIA, SERVICES } from "./vehicleSearchCriteria";
import VehicleSearchResultCard from "./VehicleSearchResultCard";
import VehicleSearchResultsMap from "./VehicleSearchResultsMap";
import { KIND_COLORS, formatCity } from "./vehicleSearchFormat";
import "./vehicleSearch.css";

const PAGE_SIZE = 12;
const FIELDS = Object.keys(EMPTY_CRITERIA);

// Address <-> criteria
function criteriaFromParams(params) {
    const criteria = { ...EMPTY_CRITERIA };

    FIELDS.forEach((field) => {
        const value = params.get(field);
        if (value === null) return;

        criteria[field] =
            field === "services"
                ? value.split(",").filter((service) => SERVICES.includes(service))
                : value;
    });

    return criteria;
}

function paramsFromCriteria(criteria, page = 1) {
    const params = new URLSearchParams();

    FIELDS.forEach((field) => {
        const value = field === "services" ? criteria.services.join(",") : String(criteria[field] ?? "");
        if (value && value !== EMPTY_CRITERIA[field]) params.set(field, value);
    });

    if (page > 1) params.set("page", String(page));
    return params;
}

export default function VehicleSearchPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    const applied = useMemo(() => criteriaFromParams(params), [params]);
    const page = Math.max(1, Number(params.get("page")) || 1);

    const [draft, setDraft] = useState(applied);
    const [data, setData] = useState({ results: [], pagination: { total: 0, totalPages: 1 }, counts: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeId, setActiveId] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const resultsTopRef = useRef(null);
    const mapSectionRef = useRef(null);

    // Back / forward: the form follows the address.
    const [draftSource, setDraftSource] = useState(applied);
    if (draftSource !== applied) {
        setDraftSource(applied);
        setDraft(applied);
    }

    // Search whenever the address changes.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const query = Object.fromEntries(paramsFromCriteria(applied, page));
                const response = await axiosInstance.get("/vehicles/search", { params: { ...query, page, limit: PAGE_SIZE } });

                if (!cancelled) {
                    setData(response.data);
                    setSelectedId(null);
                    setActiveId(null);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(requestError.response?.data?.message || t("vehiclesApp.search.failed", "Search failed. Please try again."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [applied, page, t]);

    const runSearch = (criteria = draft) => {
        setParams(paramsFromCriteria(criteria, 1));
    };

    const reset = () => {
        setDraft(EMPTY_CRITERIA);
        setParams(new URLSearchParams());
    };

    const changeSort = (sort) => {
        const next = { ...applied, sort };
        setDraft((previous) => ({ ...previous, sort }));
        setParams(paramsFromCriteria(next, 1));
    };

    const changePage = (_event, value) => {
        setParams(paramsFromCriteria(applied, value));
        resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const { results = [], pagination = {}, counts = {} } = data;
    const total = pagination.total || 0;

    const kindChips = [
        ["car", counts.car],
        ["moto", counts.moto],
        ["part", counts.part],
    ].filter(([, count]) => count > 0);

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<ManageSearchRoundedIcon />}
                title={t("vehiclesApp.search.title", "Search vehicles")}
                subtitle={t("vehiclesApp.search.subtitle", "Cars, motos & bikes and spare parts: one search, results on the map.")}
            />

            <VehicleSearchFilters draft={draft} onChange={setDraft} onSubmit={() => runSearch()} onReset={reset} />

            {/* Results header */}
            <Stack
                ref={resultsTopRef}
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: 3, mb: 2, alignItems: { sm: "center" }, justifyContent: "space-between", scrollMarginTop: 80 }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {loading && !total
                            ? t("vehiclesApp.search.searching", "Searching...")
                            : t("vehiclesApp.search.count", "{{count}} result(s)", { count: total })}
                    </Typography>
                    {kindChips.length > 1 && (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap", rowGap: 0.75 }}>
                            {kindChips.map(([kind, count]) => (
                                <Chip
                                    key={kind}
                                    size="small"
                                    label={`${t(`vehiclesApp.search.kinds.${kind}`)} · ${count}`}
                                    sx={{ bgcolor: `${KIND_COLORS[kind]}14`, color: KIND_COLORS[kind], fontWeight: 700 }}
                                />
                            ))}
                        </Stack>
                    )}
                </Box>

                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {/* Long result lists: jump to the map */}
                    {results.length > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<MapOutlinedIcon />}
                            onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                            sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, height: 40 }}
                        >
                            {t("vehiclesApp.search.mapJump", "Map")}
                        </Button>
                    )}
                <Box sx={{ minWidth: 180, flex: 1 }}>
                    <FilterSelect
                        label={t("vehiclesApp.search.sort.label", "Sort by")}
                        value={applied.sort}
                        onChange={changeSort}
                        options={[
                            { value: "mixed", label: t("vehiclesApp.search.sort.mixed", "Mixed: all types") },
                            { value: "newest", label: t("vehiclesApp.search.sort.newest", "Newest") },
                            { value: "priceAsc", label: t("vehiclesApp.search.sort.priceAsc", "Price: low to high") },
                            { value: "priceDesc", label: t("vehiclesApp.search.sort.priceDesc", "Price: high to low") },
                        ]}
                    />
                </Box>
                </Stack>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading && !results.length ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : !results.length && !error ? (
                <Stack spacing={1} sx={{ alignItems: "center", py: 8, color: "text.secondary", textAlign: "center" }}>
                    <SearchOffRoundedIcon sx={{ fontSize: 48 }} />
                    <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                        {t("vehiclesApp.search.emptyTitle", "No listing matches these criteria")}
                    </Typography>
                    <Typography variant="body2">
                        {t("vehiclesApp.search.emptyText", "Try another city, another make, a wider price range or fewer criteria.")}
                    </Typography>
                </Stack>
            ) : (
                <>
                    {/* Cards */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
                            gap: 2,
                            opacity: loading ? 0.55 : 1,
                            transition: "opacity .2s",
                        }}
                    >
                        {results.map((result, position) => (
                            <VehicleSearchResultCard
                                key={`${result.kind}-${result.id}`}
                                result={result}
                                index={position + 1}
                                active={activeId === result.id || selectedId === result.id}
                                onHover={setActiveId}
                                onOpen={(item) => navigate(item.link)}
                            />
                        ))}
                    </Box>

                    {pagination.totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                            <Pagination color="primary" page={page} count={pagination.totalPages} onChange={changePage} />
                        </Box>
                    )}

                    {/* Map of this page's results */}
                    <Stack ref={mapSectionRef} direction="row" spacing={1} sx={{ alignItems: "center", mt: 4, mb: 1.5, scrollMarginTop: 80 }}>
                        <MapOutlinedIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {applied.city
                                ? t("vehiclesApp.search.mapTitleCity", "Results on the map: {{city}}", {
                                    city: formatCity({ city: applied.city }, i18n.language),
                                })
                                : t("vehiclesApp.search.mapTitle", "Results on the map")}
                        </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                        {t("vehiclesApp.search.mapHelp", "Hover a number to preview a listing, click it for details.")}
                    </Typography>

                    <VehicleSearchResultsMap
                        results={results}
                        city={applied.city}
                        activeId={activeId}
                        onActiveChange={setActiveId}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                </>
            )}
        </Box>
    );
}
