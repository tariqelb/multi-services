// src/Apps/Property/externalListings/ExternalPropertySearch.jsx
//
// "Find a property from external websites" (logged-in users).
// The user picks a city, a property type, sale or rent, a maximum price and,
// optionally, websites to search only / to leave out. The websites are
// searched NOW (their own results pages, or the search engine for those that
// cannot be read): up to 200 listings are shown and a card opens the listing
// on its website. Websites whose robots.txt forbids visiting them are
// skipped. Under the results, what happened on each website. The search is kept in the address (?city=...), so coming back
// from a website shows the same results.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    InputAdornment,
    MenuItem,
    Pagination,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import BathtubOutlinedIcon from "@mui/icons-material/BathtubOutlined";

import axiosInstance from "../../../api/axiosInstance";
import ListingCard, { CardBadge } from "../../../Components/ui/ListingCard";
import cities from "../../../data/moroccanCities";

const API = "/property/external-listings";
const PER_PAGE = 24;

// Same names as the backend classifier, labels from externalListings.propertyTypes.
const PROPERTY_TYPES = [
    ["Apartment", "apartment"],
    ["House", "house"],
    ["Villa", "villa"],
    ["Studio", "studio"],
    ["Room", "room"],
    ["Land", "land"],
    ["Store", "store"],
    ["Office", "office"],
    ["Warehouse", "warehouse"],
    ["Commercial space", "commercialSpace"],
    ["Garage", "garage"],
];

// "all": every city / type / offer. Always sent, so the fields show their choice.
const ALL = "all";
const EMPTY_FORM = { city: ALL, propertyType: ALL, listingType: ALL, maxPrice: "", sites: [], siteMode: "include" };

/** Address (?city=..&sites=a,b) <-> form */
function formFromParams(params) {
    return {
        city: params.get("city") || ALL,
        propertyType: params.get("propertyType") || ALL,
        listingType: params.get("listingType") || ALL,
        maxPrice: params.get("maxPrice") || "",
        sites: (params.get("sites") || "").split(",").filter(Boolean),
        siteMode: params.get("siteMode") === "exclude" ? "exclude" : "include",
    };
}

function paramsFromForm(form) {
    const params = { tab: "search", city: form.city || ALL };
    if (form.propertyType !== ALL) params.propertyType = form.propertyType;
    if (form.listingType !== ALL) params.listingType = form.listingType;
    if (form.maxPrice) params.maxPrice = String(form.maxPrice);
    if (form.sites.length) {
        params.sites = form.sites.join(",");
        params.siteMode = form.siteMode;
    }
    return params;
}

const sectionTitleSx = { fontWeight: 700, fontSize: 13, color: "text.secondary", mb: 1 };

export default function ExternalPropertySearch() {
    const { t, i18n } = useTranslation();
    const isArabic = String(i18n.language).startsWith("ar");
    const locale = isArabic ? "ar-MA" : String(i18n.language).startsWith("fr") ? "fr-FR" : "en-GB";
    const [params, setParams] = useSearchParams();

    const [form, setForm] = useState(() => formFromParams(params));
    const [websites, setWebsites] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

    // A search was made when the address has a city (a city or "all").
    const searchKey = params.get("city") ? params.toString() : "";

    // Websites of the picker.
    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`${API}/search/websites`)
            .then(({ data }) => !cancelled && setWebsites(data.websites || []))
            .catch(() => !cancelled && setWebsites([]));
        return () => {
            cancelled = true;
        };
    }, []);

    // Run the search written in the address.
    useEffect(() => {
        if (!searchKey) return undefined;
        let cancelled = false;
        const query = Object.fromEntries(new URLSearchParams(searchKey));
        delete query.tab;

        (async () => {
            setLoading(true);
            setError("");
            try {
                const { data } = await axiosInstance.get(`${API}/search`, { params: query });
                if (!cancelled) {
                    setResult(data);
                    setPage(1);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setResult(null);
                    setError(requestError.response?.data?.message || t("externalSearch.errors.failed", "The search failed. Please try again."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [searchKey, t]);

    const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const submit = (event) => {
        event.preventDefault();
        setParams(paramsFromForm(form));
    };

    const reset = () => {
        setForm(EMPTY_FORM);
        setResult(null);
        setError("");
        setParams({ tab: "search" });
    };

    const allCitiesOption = useMemo(() => ({ en: ALL, ar: ALL }), []);
    const cityOptions = useMemo(
        () => [
            allCitiesOption,
            ...[...cities].sort((a, b) => (isArabic ? (a.ar || a.en).localeCompare(b.ar || b.en, "ar") : a.en.localeCompare(b.en))),
        ],
        [isArabic, allCitiesOption],
    );
    const cityLabel = useCallback(
        (city) => (city.en === ALL ? t("externalSearch.allCities", "All cities") : isArabic ? city.ar || city.en : city.en),
        [isArabic, t],
    );
    const selectedCity = form.city === ALL ? allCitiesOption : cities.find((city) => city.en === form.city) || allCitiesOption;

    const websiteByHost = useMemo(() => new Map(websites.map((website) => [website.hostname, website])), [websites]);
    const websiteName = (hostname) => websiteByHost.get(hostname)?.sourceName || hostname;

    const listings = useMemo(() => result?.listings || [], [result]);
    const totalPages = Math.max(1, Math.ceil(listings.length / PER_PAGE));
    const shown = listings.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // What happened on each website: found first, then the others.
    const STATUS_ORDER = { ok: 0, "no-results": 1, "offer-not-listed": 2, "not-supported": 3, failed: 4, blocked: 5 };
    const siteReports = useMemo(
        () => [...(result?.sites || [])].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || b.count - a.count),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [result],
    );
    const shownPerSite = useMemo(() => {
        const counts = new Map();
        for (const listing of listings) counts.set(listing.sourceDomain, (counts.get(listing.sourceDomain) || 0) + 1);
        return counts;
    }, [listings]);
    const reportLabel = (report) => {
        switch (report.status) {
            case "ok":
                return `${report.sourceName} · ${shownPerSite.get(report.hostname) || 0}`;
            case "blocked":
                return `${report.sourceName} · ${t("externalSearch.status.blocked", "robots.txt")}`;
            case "offer-not-listed":
                return `${report.sourceName} · ${t("externalSearch.status.offerNotListed", "does not list this offer")}`;
            case "not-supported":
                return `${report.sourceName} · ${t("externalSearch.status.notSupported", "cannot be searched")}`;
            case "failed":
                return `${report.sourceName} · ${t("externalSearch.status.failed", "did not answer")}`;
            default:
                return `${report.sourceName} · 0`;
        }
    };
    const reportHelp = (report) =>
        ({
            ok: report.method.includes("engine")
                ? t("externalSearch.statusHelp.engine", "Found through the search engine")
                : t("externalSearch.statusHelp.live", "Read now on the website's results page"),
            "no-results": t("externalSearch.statusHelp.noResults", "Searched, nothing matching"),
            blocked: t("externalSearch.statusHelp.blocked", "Skipped: its robots.txt does not allow visiting it"),
            "offer-not-listed": t("externalSearch.statusHelp.offerNotListed", "This website only lists the other offer (sale or rent)"),
            "not-supported": t("externalSearch.statusHelp.notSupported", "Its pages cannot be read automatically and the search engine is not set up"),
            failed: t("externalSearch.statusHelp.failed", "The website did not answer in time"),
        })[report.status] || "";
    const REPORT_COLORS = { ok: "success", "no-results": "default", blocked: "default", "offer-not-listed": "default", "not-supported": "warning", failed: "error" };

    const siteReportBox = siteReports.length > 0 && (
        <Box sx={{ mb: 3 }}>
            <Typography sx={sectionTitleSx}>{t("externalSearch.websitesSearched", "Websites searched")}</Typography>
            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 0.75 }}>
                {siteReports.map((report) => (
                    <Tooltip key={report.hostname} title={reportHelp(report)} arrow>
                        <Chip
                            size="small"
                            color={REPORT_COLORS[report.status] || "default"}
                            variant={report.status === "ok" ? "filled" : "outlined"}
                            icon={report.status === "blocked" ? <BlockRoundedIcon /> : report.method.includes("engine") ? <TravelExploreRoundedIcon /> : <LanguageRoundedIcon />}
                            label={reportLabel(report)}
                        />
                    </Tooltip>
                ))}
            </Stack>
        </Box>
    );

    const typeLabel = (value) => {
        const key = PROPERTY_TYPES.find(([name]) => name === value)?.[1];
        return key ? t(`externalListings.propertyTypes.${key}`, value) : value;
    };
    const offerLabel = (value) =>
        value === "For Sale"
            ? t("externalListings.listingTypes.forSale", "For Sale")
            : value === "For Rent"
              ? t("externalListings.listingTypes.forRent", "For Rent")
              : "";
    const formatPrice = (listing) => {
        if (listing.price === null || listing.price === undefined) return t("externalListings.priceOnRequest", "Price on request");
        return `${Number(listing.price).toLocaleString(locale)} ${listing.currency || "MAD"}`;
    };
    const cardCity = (listing) => {
        const known = cities.find((city) => city.en === listing.city);
        const name = known ? cityLabel(known) : listing.city;
        return [listing.neighborhood, name].filter(Boolean).join(", ");
    };

    const openListing = (listing) => {
        window.open(listing.sourceUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <Box>
            {/* Form */}
            <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", mb: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center", color: "primary.main", bgcolor: "rgba(37,99,235,.08)" }}>
                        <ManageSearchRoundedIcon />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 17 }}>{t("externalSearch.title", "Find a property on other websites")}</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("externalSearch.subtitle", "We look through Moroccan listing websites for you and show up to 200 matching properties.")}
                        </Typography>
                    </Box>
                </Stack>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Autocomplete
                            options={cityOptions}
                            value={selectedCity}
                            onChange={(_event, value) => set("city", value?.en || ALL)}
                            disableClearable
                            getOptionLabel={cityLabel}
                            isOptionEqualToValue={(option, value) => option.en === value.en}
                            renderInput={(inputProps) => (
                                <TextField {...inputProps} label={t("externalSearch.city", "City")} helperText=" " />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            label={t("externalSearch.propertyType", "Property type")}
                            value={form.propertyType}
                            onChange={(event) => set("propertyType", event.target.value)}
                            helperText=" "
                        >
                            <MenuItem value={ALL}>{t("externalSearch.anyType", "Any type")}</MenuItem>
                            {PROPERTY_TYPES.map(([value, key]) => (
                                <MenuItem key={value} value={value}>
                                    {t(`externalListings.propertyTypes.${key}`, value)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            label={t("externalSearch.transaction", "Transaction")}
                            value={form.listingType}
                            onChange={(event) => set("listingType", event.target.value)}
                            helperText=" "
                        >
                            <MenuItem value={ALL}>{t("externalSearch.saleOrRent", "Sale or rent")}</MenuItem>
                            <MenuItem value="For Sale">{t("externalListings.listingTypes.forSale", "For Sale")}</MenuItem>
                            <MenuItem value="For Rent">{t("externalListings.listingTypes.forRent", "For Rent")}</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label={t("externalSearch.maxPrice", "Maximum price")}
                            value={form.maxPrice}
                            onChange={(event) => set("maxPrice", event.target.value.replace(/[^\d]/g, ""))}
                            slotProps={{
                                htmlInput: { min: 0, inputMode: "numeric" },
                                input: { endAdornment: <InputAdornment position="end">{t("common.currency", "MAD")}</InputAdornment> },
                            }}
                            helperText={form.listingType === "For Rent" ? t("externalSearch.maxPriceRent", "Per month") : " "}
                        />
                    </Grid>

                    {/* Websites */}
                    <Grid size={12}>
                        <Typography sx={sectionTitleSx}>{t("externalSearch.websites", "Websites (optional)")}</Typography>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "flex-start" } }}>
                            <ToggleButtonGroup
                                exclusive
                                size="small"
                                color="primary"
                                value={form.siteMode}
                                onChange={(_event, value) => value && set("siteMode", value)}
                                sx={{ flexShrink: 0, "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 1.75, py: 1 } }}
                            >
                                <ToggleButton value="include">{t("externalSearch.onlyThese", "Only these websites")}</ToggleButton>
                                <ToggleButton value="exclude">{t("externalSearch.excludeThese", "All except these")}</ToggleButton>
                            </ToggleButtonGroup>
                            <Autocomplete
                                multiple
                                freeSolo
                                fullWidth
                                size="small"
                                options={websites.map((website) => website.hostname)}
                                value={form.sites}
                                onChange={(_event, value) =>
                                    set(
                                        "sites",
                                        [...new Set(value.map((item) => String(item).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")).filter(Boolean))],
                                    )
                                }
                                getOptionDisabled={(hostname) => Boolean(websiteByHost.get(hostname)?.blocked)}
                                renderOption={(props, hostname) => {
                                    const { key, ...rest } = props;
                                    const website = websiteByHost.get(hostname);
                                    return (
                                        <Box component="li" key={key} {...rest} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                            <LanguageRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {website?.sourceName || hostname}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    {hostname}
                                                </Typography>
                                            </Box>
                                            {website?.blocked ? (
                                                <Chip size="small" icon={<BlockRoundedIcon />} label={t("externalSearch.robotsBlocked", "Not allowed (robots.txt)")} />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    {website?.searchMethod === "website"
                                                        ? t("externalSearch.method.website", "Searched on the website")
                                                        : website?.searchMethod === "search-engine"
                                                          ? t("externalSearch.method.engine", "Via search engine")
                                                          : t("externalSearch.method.none", "Cannot be searched")}
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                }}
                                renderValue={(value, getItemProps) =>
                                    value.map((hostname, index) => {
                                        const { key, ...itemProps } = getItemProps({ index });
                                        const known = websiteByHost.has(hostname);
                                        return (
                                            <Chip
                                                key={key}
                                                size="small"
                                                label={websiteName(hostname)}
                                                color={known ? (form.siteMode === "exclude" ? "default" : "primary") : "warning"}
                                                variant={known ? "filled" : "outlined"}
                                                {...itemProps}
                                            />
                                        );
                                    })
                                }
                                renderInput={(inputProps) => (
                                    <TextField
                                        {...inputProps}
                                        placeholder={form.sites.length ? "" : t("externalSearch.websitesPlaceholder", "Type or pick a website, e.g. agenz.ma")}
                                        helperText={
                                            form.siteMode === "include"
                                                ? t("externalSearch.includeHelp", "Empty: every website is searched.")
                                                : t("externalSearch.excludeHelp", "These websites will be left out.")
                                        }
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end", mt: 2 }}>
                    <Button type="button" onClick={reset} startIcon={<RestartAltRoundedIcon />} sx={{ textTransform: "none", fontWeight: 600 }}>
                        {t("externalSearch.reset", "Reset")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchRoundedIcon />}
                        sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
                    >
                        {t("externalSearch.search", "Search")}
                    </Button>
                </Stack>
            </Paper>

            {/* Messages */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {result?.unknownSites?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {t("externalSearch.unknownSites", "Not in our list of websites, ignored: {{sites}}", { sites: result.unknownSites.join(", ") })}
                </Alert>
            )}
            {/* Results */}
            {loading ? (
                <Stack spacing={2} sx={{ alignItems: "center", py: 8 }}>
                    <CircularProgress />
                    <Typography sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {t("externalSearch.searching", "Searching {{count}} websites now...", { count: websites.filter((website) => !website.blocked).length || 19 })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {t("externalSearch.searchingHelp", "Each website is opened live: this takes 20 to 40 seconds.")}
                    </Typography>
                </Stack>
            ) : !result ? (
                !error && (
                    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 6, color: "text.secondary" }}>
                        <HomeWorkOutlinedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
                        <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{t("externalSearch.start", "Fill in what you are looking for and search")}</Typography>
                        <Typography variant="body2">
                            {t("externalSearch.startHelp", "{{count}} Moroccan websites are searched live: Agenz, Hespress Immo, Masaken...", { count: websites.filter((website) => !website.blocked).length || 19 })}
                        </Typography>
                    </Stack>
                )
            ) : listings.length === 0 ? (
                <>
                {siteReportBox}
                <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 6, px: 2, border: "1px dashed", borderColor: "divider", borderRadius: "16px" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("externalSearch.emptyTitle", "No property found")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {t("externalSearch.emptyHelp", "Try a higher price, another property type, or search every website.")}
                    </Typography>
                </Stack>
                </>
            ) : (
                <>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 750 }}>
                            {t("externalSearch.found", "{{count}} properties found", { count: listings.length })}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("externalSearch.searchedOn", "on {{count}} websites", { count: new Set(listings.map((listing) => listing.sourceDomain)).size })}
                        </Typography>
                    </Stack>
                    {siteReportBox}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                            gap: { xs: 2, sm: 2.5, md: 3 },
                            "& > *": { minWidth: 0 },
                        }}
                    >
                        {shown.map((listing) => (
                            <ListingCard
                                key={listing._id}
                                onClick={() => openListing(listing)}
                                image={listing.imageUrl}
                                // Some websites refuse to show their pictures on other sites.
                                imageReferrerPolicy="no-referrer"
                                imageAlt={listing.title}
                                emptyIcon={<HomeWorkOutlinedIcon />}
                                topBadges={
                                    <>
                                        {listing.listingType !== "Unknown" && (
                                            <CardBadge tone={listing.listingType === "For Rent" ? "info" : "primary"} label={offerLabel(listing.listingType)} />
                                        )}
                                        {listing.propertyType && <CardBadge tone="dark" label={typeLabel(listing.propertyType)} />}
                                    </>
                                }
                                bottomBadges={
                                    <CardBadge
                                        tone="light"
                                        icon={listing.foundWith === "search-engine" ? <TravelExploreRoundedIcon /> : <LanguageRoundedIcon />}
                                        label={listing.sourceName}
                                    />
                                }
                                meta={
                                    listing.foundWith === "search-engine"
                                        ? t("externalSearch.viaEngine", "Via search engine")
                                        : listing.publishedAt && !Number.isNaN(new Date(listing.publishedAt).getTime())
                                          ? new Date(listing.publishedAt).toLocaleDateString(locale)
                                          : listing.sourceDomain
                                }
                                metaEnd={
                                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "primary.main", flexShrink: 0 }} title={listing.sourceDomain}>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap>
                                            {t("externalSearch.open", "Open")}
                                        </Typography>
                                        <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
                                    </Stack>
                                }
                                title={listing.title}
                                location={cardCity(listing)}
                                features={[
                                    listing.surface && { icon: <SquareFootRoundedIcon />, label: `${listing.surface} m²` },
                                    listing.rooms && { icon: <BedOutlinedIcon />, label: t("externalListings.details.rooms", { value: listing.rooms, count: Number(listing.rooms) }) },
                                    listing.bathrooms && { icon: <BathtubOutlinedIcon />, label: t("externalListings.details.bathrooms", { value: listing.bathrooms, count: Number(listing.bathrooms) }) },
                                ].filter(Boolean)}
                                featureRows={1}
                                price={formatPrice(listing)}
                                priceNote={listing.exactMatch ? " " : t("externalSearch.partialMatch", "Some details not stated on the website")}
                            />
                        ))}
                    </Box>

                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
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
