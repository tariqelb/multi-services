// src/Apps/DailyWorker/List/WorkersPage.jsx
//
// /daily-worker — find a worker. One card per trade offer (a worker with
// 3 trades appears under each of them). Filters live in the address
// (?trade=plumber&city=Agadir&available=true...), so a search can be shared.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Autocomplete, Box, Button, Collapse, Pagination, Skeleton, Stack, TextField, Typography } from "@mui/material";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterChips, FilterField, FilterGrid, FilterPanel, FilterSearch, FilterSelect, filterFieldSx } from "../../../Components/ui/FilterKit";
import moroccanCities from "../../../data/moroccanCities";
import { labelOf, langOf, tradeFilter, tradeOf, useWorkerOptions } from "../workerOptions";
import { languageLabel } from "../workerFormat";
import WorkerOfferCard from "./WorkerOfferCard";
import PublishWorkerFab from "../Components/PublishWorkerFab";

const PAGE_SIZE = 12;
const FILTER_KEYS = ["q", "trade", "specialty", "city", "available", "urgent", "team", "workplace", "night", "gender", "language", "priceType", "maxPrice", "minExperience", "noDeposit"];
const QUICK_KEYS = ["available", "urgent", "night", "noDeposit", "team", "workplace"];

const readFilters = (params) => Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) || ""]));

const writeParams = (filters, extra = {}) => {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) if (filters[key]) params.set(key, filters[key]);
    for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
    return params;
};

const countActive = (filters) => FILTER_KEYS.filter((key) => key !== "q" && filters[key]).length;

export default function WorkersPage() {
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const { options } = useWorkerOptions();

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

    const [moreOpen, setMoreOpen] = useState(false);
    const [data, setData] = useState({ workers: [], pagination: { total: 0, totalPages: 1 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const query = Object.fromEntries(new URLSearchParams(queryString));
                const response = await axiosInstance.get("/workers", { params: { ...query, page, limit: PAGE_SIZE } });
                if (!cancelled) setData(response.data);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("workersApp.list.error", "Unable to load workers."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [queryString, page, t]);

    const edit = (key, value) => setDraft((current) => ({ ...current, [key]: value, ...(key === "trade" ? { specialty: "" } : {}) }));
    const apply = (next = draft) => setParams(writeParams(next, { sort: sort !== "newest" ? sort : "" }));
    const reset = () => setParams(sort !== "newest" ? { sort } : {});
    const changePage = (_, next) => {
        setParams(writeParams(applied, { sort: sort !== "newest" ? sort : "", page: next > 1 ? String(next) : "" }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const changeSort = (value) => setParams(writeParams(applied, { sort: value !== "newest" ? value : "" }));
    // Quick chips apply at once.
    const changeQuick = (values) => {
        const next = { ...draft, ...Object.fromEntries(QUICK_KEYS.map((key) => [key, values.includes(key) ? (key === "team" ? "team" : "true") : ""])) };
        setDraft(next);
        apply(next);
    };

    // Trade picker: every trade of the list, grouped, plus "Other".
    const tradeOptions = useMemo(() => {
        if (!options) return [];
        const groups = new Map((options.groups || []).map((group) => [group.id, labelOf(group, lang)]));
        return [
            ...(options.trades || []).map((trade) => ({ id: trade.id, label: labelOf(trade, lang), group: groups.get(trade.group) || "" })),
            { id: options.other, label: t("workersApp.trade.otherTrades", "Other trades"), group: t("workersApp.trade.otherGroup", "Other") },
        ];
    }, [options, lang, t]);
    const tradeValue = tradeOptions.find((option) => option.id === draft.trade) || null;
    const specialtyOptions = (tradeOf(options, draft.trade)?.specialties || []).map((specialty) => ({ value: specialty.id, label: labelOf(specialty, lang) }));

    const cityOption = moroccanCities.find((city) => city.en === draft.city) || null;
    const { workers, pagination } = data;
    const activeCount = countActive(applied);
    const quickValue = QUICK_KEYS.filter((key) => applied[key]);

    return (
        <Box component="main" sx={{ flex: 1, minWidth: 0, width: "100%", bgcolor: "#F5F7FB", minHeight: "calc(100vh - 4rem)", overflowX: "clip" }}>
            <Box sx={pagePaddingSx}>
                <PageHeader
                    icon={<EngineeringOutlinedIcon />}
                    title={t("workersApp.list.pageTitle", "Find a worker")}
                    subtitle={t("workersApp.list.pageSubtitle", "Artisans and day workers across Morocco: plumbers, electricians, painters, cleaners and more.")}
                />

                <FilterPanel title={t("workersApp.filters.title", "Find a worker")} activeCount={activeCount} onClear={reset} clearLabel={t("workersApp.filters.clear", "Clear")}>
                    <FilterSearch
                        value={draft.q}
                        onChange={(value) => edit("q", value)}
                        onSubmit={() => apply()}
                        submitLabel={t("workersApp.filters.search", "Search")}
                        placeholder={t("workersApp.filters.searchPlaceholder", "Trade, specialty, name… e.g. plombier, zellige")}
                        inputProps={{ maxLength: 80 }}
                    />

                    <FilterGrid min={190}>
                        <Autocomplete
                            size="small"
                            options={tradeOptions}
                            filterOptions={tradeFilter(options)}
                            groupBy={(option) => option.group}
                            value={tradeValue}
                            onChange={(_, option) => edit("trade", option?.id || "")}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(props) => <TextField {...props} label={t("workersApp.filters.trade", "Trade")} sx={filterFieldSx} />}
                        />
                        <Autocomplete
                            size="small"
                            options={moroccanCities}
                            value={cityOption}
                            onChange={(_, option) => edit("city", option?.en || "")}
                            getOptionLabel={(option) => (lang === "ar" ? option.ar || option.en : option.en)}
                            isOptionEqualToValue={(option, value) => option.en === value.en}
                            renderInput={(props) => <TextField {...props} label={t("workersApp.filters.city", "City")} sx={filterFieldSx} />}
                        />
                        <FilterSelect
                            label={t("workersApp.filters.priceType", "Price")}
                            value={draft.priceType}
                            onChange={(value) => edit("priceType", value)}
                            options={[
                                { value: "", label: t("workersApp.filters.any", "Any") },
                                { value: "day", label: t("workersApp.priceTypes.day", "Per day") },
                                { value: "task", label: t("workersApp.priceTypes.task", "Per job") },
                                { value: "hour", label: t("workersApp.priceTypes.hour", "Per hour") },
                                { value: "m2", label: t("workersApp.priceTypes.m2", "Per m²") },
                                { value: "quote", label: t("workersApp.priceTypes.quote", "On quote") },
                            ]}
                        />
                        <FilterField type="number" label={t("workersApp.filters.maxPrice", "Max price (MAD)")} value={draft.maxPrice} onChange={(value) => edit("maxPrice", value)} />
                    </FilterGrid>

                    <FilterChips
                        multiple
                        options={[
                            { value: "available", label: t("workersApp.filters.available", "Available now") },
                            { value: "urgent", label: t("workersApp.filters.urgent", "Urgent jobs") },
                            { value: "night", label: t("workersApp.filters.night", "Works at night") },
                            { value: "noDeposit", label: t("workersApp.filters.noDeposit", "No deposit") },
                            { value: "team", label: t("workersApp.filters.team", "Works with a team") },
                            { value: "workplace", label: t("workersApp.filters.workplace", "Has a workshop or shop") },
                        ]}
                        value={quickValue}
                        onChange={changeQuick}
                    />

                    <Collapse in={moreOpen || Boolean(applied.specialty || applied.language || applied.minExperience || applied.gender)} unmountOnExit>
                        <Stack spacing={2}>
                            <FilterGrid min={190}>
                                <FilterField
                                    type="number"
                                    label={t("workersApp.filters.minExperience", "Min. years of experience")}
                                    value={draft.minExperience}
                                    onChange={(value) => edit("minExperience", value)}
                                />
                                <FilterSelect
                                    label={t("workersApp.filters.language", "Language")}
                                    value={draft.language}
                                    onChange={(value) => edit("language", value)}
                                    options={[{ value: "", label: t("workersApp.filters.any", "Any") }, ...["ar", "fr", "en"].map((value) => ({ value, label: languageLabel(t, value) }))]}
                                />
                                <FilterSelect
                                    label={t("workersApp.filters.gender", "Worker")}
                                    value={draft.gender}
                                    onChange={(value) => edit("gender", value)}
                                    options={[
                                        { value: "", label: t("workersApp.filters.any", "Any") },
                                        { value: "male", label: t("workersApp.gender.male", "Man") },
                                        { value: "female", label: t("workersApp.gender.female", "Woman") },
                                    ]}
                                />
                            </FilterGrid>
                            {specialtyOptions.length > 0 && (
                                <FilterChips
                                    label={t("workersApp.filters.specialty", "Specialty")}
                                    options={[{ value: "", label: t("workersApp.filters.all", "All") }, ...specialtyOptions]}
                                    value={draft.specialty}
                                    onChange={(value) => edit("specialty", value)}
                                />
                            )}
                        </Stack>
                    </Collapse>

                    <Stack direction="row" spacing={1}>
                        <Button startIcon={<TuneRoundedIcon />} onClick={() => setMoreOpen((open) => !open)}>
                            {moreOpen ? t("workersApp.filters.less", "Fewer filters") : t("workersApp.filters.more", "More filters")}
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        <Button variant="contained" onClick={() => apply()}>
                            {t("workersApp.filters.apply", "Show results")}
                        </Button>
                    </Stack>
                </FilterPanel>

                <Stack direction="row" sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mt: { xs: 2.5, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A", fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.5rem" } }}>
                            {applied.trade && tradeValue ? tradeValue.label : t("workersApp.list.title", "Workers")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B" }}>
                            {t("workersApp.list.count", "{{count}} offers", { count: pagination.total || 0 })}
                        </Typography>
                    </Box>
                    <Box sx={{ minWidth: 200 }}>
                        <FilterSelect
                            label={t("workersApp.sort.label", "Sort by")}
                            value={sort}
                            onChange={changeSort}
                            options={[
                                { value: "newest", label: t("workersApp.sort.newest", "Newest") },
                                { value: "available", label: t("workersApp.sort.available", "Available first") },
                                { value: "experience", label: t("workersApp.sort.experience", "Most experienced") },
                                { value: "priceAsc", label: t("workersApp.sort.priceAsc", "Price: low to high") },
                                { value: "priceDesc", label: t("workersApp.sort.priceDesc", "Price: high to low") },
                            ]}
                        />
                    </Box>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                        gap: { xs: 2, sm: 2.5, md: 3 },
                        alignItems: "stretch",
                        "& > *": { minWidth: 0 },
                    }}
                >
                    {loading
                        ? Array.from({ length: 6 }, (_, index) => <Skeleton key={index} variant="rounded" height={280} sx={{ borderRadius: 4 }} />)
                        : workers.map((worker) => (
                              <WorkerOfferCard
                                  key={`${worker.id}-${worker.offerId}`}
                                  worker={worker}
                                  options={options}
                                  onClick={() => navigate(`/daily-worker/${worker.id}?offer=${worker.offerId}`)}
                              />
                          ))}
                </Box>

                {!loading && !error && workers.length === 0 && (
                    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 8, color: "text.secondary" }}>
                        <SearchOffRoundedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
                        <Typography variant="h6" sx={{ color: "text.primary" }}>
                            {t("workersApp.list.empty", "No worker matches these filters")}
                        </Typography>
                        <Typography>{t("workersApp.list.emptyHint", "Try another trade or city, or remove some filters.")}</Typography>
                        {activeCount > 0 && <Button onClick={reset}>{t("workersApp.filters.clear", "Clear")}</Button>}
                    </Stack>
                )}

                {pagination.totalPages > 1 && (
                    <Stack sx={{ alignItems: "center", mt: 4, mb: 8 }}>
                        <Pagination count={pagination.totalPages} page={Math.min(page, pagination.totalPages)} onChange={changePage} color="primary" shape="rounded" />
                    </Stack>
                )}
            </Box>

            <PublishWorkerFab />
        </Box>
    );
}
