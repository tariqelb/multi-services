// src/Apps/vehicles/externalListings/VehicleExternalListingsPage.jsx
//
// Vehicles > External listing (/vehicles/external), like the property
// "External listing" page:
//   - "Find a vehicle": live search on the websites (ExternalVehicleSearch)
//   - "All listings": vehicles collected by the administrators, with filters
//     (category, offer, make, city, website, price, year, km) and pages.
// A card opens the listing on its website (the click is counted).

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Alert, Box, Button, CircularProgress, Pagination, Stack, Tab, Tabs, Typography } from "@mui/material";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import ViewModuleRoundedIcon from "@mui/icons-material/ViewModuleRounded";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocalGasStationOutlinedIcon from "@mui/icons-material/LocalGasStationOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import axiosInstance from "../../../api/axiosInstance";
import PageLayout from "../../../Components/Home/PageLayout";
import ListingCard, { CardBadge } from "../../../Components/ui/ListingCard";
import { FilterField, FilterGrid, FilterPanel, FilterSearch, FilterSelect } from "../../../Components/ui/FilterKit";
import cities from "../../../data/moroccanCities";
import { formatCity, formatNumber, optionLabel } from "../vehicleFormat";
import ExternalVehicleSearch from "./ExternalVehicleSearch";
import { API, CATEGORIES, LISTING_TYPES, SORTS } from "./externalOptions";

const PER_PAGE = 12;
const FILTER_KEYS = ["q", "category", "listingType", "make", "city", "source", "minPrice", "maxPrice", "minYear", "maxMileage", "sort"];

/** Filters of the "All listings" tab, kept in the address (?tab=all&make=Dacia...). */
const filtersFromParams = (params) => Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) || ""]));

function AllListings() {
    const { t, i18n } = useTranslation();
    const isArabic = String(i18n.language).startsWith("ar");
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => filtersFromParams(params), [params]);
    const page = Math.max(1, Number(params.get("page")) || 1);
    // The text search is applied on Enter / button, not on each key.
    const [text, setText] = useState(filters.q);

    const [data, setData] = useState({ listings: [], pagination: { total: 0, pages: 1 }, facets: { sources: [], makes: [], cities: [] } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        (async () => {
            setLoading(true);
            setError("");
            try {
                const { data: body } = await axiosInstance.get(API, { params: { ...query, page, limit: PER_PAGE } });
                if (!cancelled) setData(body);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("vehicleExternal.list.loadFailed", "Could not load the listings."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [filters, page, reloadKey, t]);

    const update = (changes) => {
        const next = { ...filters, ...changes };
        const query = { tab: "all", ...Object.fromEntries(Object.entries(next).filter(([, value]) => value)) };
        setParams(query);
    };
    const clear = () => {
        setText("");
        setParams({ tab: "all" });
    };
    const activeCount = FILTER_KEYS.filter((key) => key !== "sort" && filters[key]).length;

    const cityName = useCallback(
        (city) => {
            const known = cities.find((item) => item.en.toLowerCase() === String(city).toLowerCase());
            return known && isArabic ? known.ar || known.en : city;
        },
        [isArabic],
    );
    const categoryLabel = (value) => (value ? t(`requests.categories.${value}`, value) : "");
    const priceOf = (listing) => {
        if (listing.price === null || listing.price === undefined) return t("vehiclesApp.price.onRequest", "Price on request");
        const amount = `${formatNumber(listing.price, i18n.language)} ${t("vehiclesApp.price.currency", "MAD")}`;
        return listing.listingType === "rent" ? t("vehiclesApp.price.perDay", "{{amount}} / day", { amount }) : amount;
    };

    const open = (listing) => {
        // Counting must never stop the visitor.
        axiosInstance.post(`${API}/${listing._id}/click`).catch(() => {});
        window.open(listing.sourceUrl, "_blank", "noopener,noreferrer");
    };

    const { listings, pagination, facets } = data;

    return (
        <>
            <FilterPanel title={t("vehicleExternal.list.filters", "Filter the listings")} activeCount={activeCount} onClear={clear} clearLabel={t("vehicleExternal.list.clear", "Clear")}>
                <FilterSearch
                    value={text}
                    onChange={setText}
                    onSubmit={() => update({ q: text.trim() })}
                    submitLabel={t("vehicleExternal.list.searchButton", "Search")}
                    placeholder={t("vehicleExternal.list.searchPlaceholder", "Make, model, city...")}
                />
                <FilterGrid>
                    <FilterSelect
                        label={t("vehicleExternal.search.category", "Car, moto or part")}
                        value={filters.category || "all"}
                        onChange={(value) => update({ category: value === "all" ? "" : value })}
                        options={[{ value: "all", label: t("vehicleExternal.search.anyCategory", "Cars, motos and parts") }, ...CATEGORIES.map((value) => ({ value, label: categoryLabel(value) }))]}
                    />
                    <FilterSelect
                        label={t("externalSearch.transaction", "Transaction")}
                        value={filters.listingType || "all"}
                        onChange={(value) => update({ listingType: value === "all" ? "" : value })}
                        options={[{ value: "all", label: t("externalSearch.saleOrRent", "Sale or rent") }, ...LISTING_TYPES.map((value) => ({ value, label: optionLabel(t, "listingType", value) }))]}
                    />
                    <FilterSelect
                        label={t("vehicleExternal.search.make", "Make")}
                        value={filters.make || "all"}
                        onChange={(value) => update({ make: value === "all" ? "" : value })}
                        options={[{ value: "all", label: t("vehicleExternal.search.anyMake", "Any make") }, ...facets.makes.map((value) => ({ value, label: value }))]}
                    />
                    <FilterSelect
                        label={t("externalSearch.city", "City")}
                        value={filters.city || "all"}
                        onChange={(value) => update({ city: value === "all" ? "" : value })}
                        options={[{ value: "all", label: t("externalSearch.allCities", "All cities") }, ...facets.cities.map((value) => ({ value, label: cityName(value) }))]}
                    />
                    <FilterSelect
                        label={t("vehicleExternal.list.website", "Website")}
                        value={filters.source || "all"}
                        onChange={(value) => update({ source: value === "all" ? "" : value })}
                        options={[
                            { value: "all", label: t("vehicleExternal.list.allWebsites", "All websites") },
                            ...facets.sources.map((source) => ({ value: source.hostname, label: `${source.sourceName} (${source.count})` })),
                        ]}
                    />
                    <FilterField label={t("vehicleExternal.list.minPrice", "Min price")} type="number" value={filters.minPrice} onChange={(value) => update({ minPrice: value })} />
                    <FilterField label={t("vehicleExternal.list.maxPrice", "Max price")} type="number" value={filters.maxPrice} onChange={(value) => update({ maxPrice: value })} />
                    <FilterField label={t("vehicleExternal.list.minYear", "From year")} type="number" value={filters.minYear} onChange={(value) => update({ minYear: value })} />
                    <FilterField label={t("vehicleExternal.list.maxMileage", "Max km")} type="number" value={filters.maxMileage} onChange={(value) => update({ maxMileage: value })} />
                    <FilterSelect
                        label={t("vehicleExternal.list.sort", "Sort by")}
                        value={filters.sort || "newest"}
                        onChange={(value) => update({ sort: value === "newest" ? "" : value })}
                        options={SORTS.map((value) => ({ value, label: t(`vehicleExternal.list.sorts.${value}`, value) }))}
                    />
                </FilterGrid>
            </FilterPanel>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                        <Button color="inherit" size="small" onClick={() => setReloadKey((key) => key + 1)}>
                            {t("vehicleExternal.list.retry", "Retry")}
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 750 }}>
                    {activeCount ? t("vehicleExternal.list.filtered", "Matching listings") : t("vehicleExternal.list.title", "Listings from other websites")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {t("vehicleExternal.list.count", "{{count}} listings", { count: pagination.total || 0 })}
                </Typography>
            </Stack>

            {loading ? (
                <Stack spacing={2} sx={{ alignItems: "center", py: 10 }}>
                    <CircularProgress />
                </Stack>
            ) : listings.length === 0 ? (
                <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 8, px: 2, border: "1px dashed", borderColor: "divider", borderRadius: "16px" }}>
                    <DirectionsCarOutlinedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("vehicleExternal.list.emptyTitle", "No listing yet")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {activeCount
                            ? t("vehicleExternal.list.emptyFiltered", "Try other filters, or search the websites now in “Find a vehicle”.")
                            : t("vehicleExternal.list.empty", "Search the websites now in “Find a vehicle”.")}
                    </Typography>
                    {activeCount > 0 && (
                        <Button variant="outlined" onClick={clear} sx={{ textTransform: "none", mt: 1 }}>
                            {t("vehicleExternal.list.clear", "Clear")}
                        </Button>
                    )}
                </Stack>
            ) : (
                <>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                            gap: { xs: 2, sm: 2.5, md: 3 },
                            "& > *": { minWidth: 0 },
                        }}
                    >
                        {listings.map((listing) => (
                            <ListingCard
                                key={listing._id}
                                onClick={() => open(listing)}
                                image={listing.imageUrl}
                                imageReferrerPolicy="no-referrer"
                                imageAlt={listing.title}
                                emptyIcon={<DirectionsCarOutlinedIcon />}
                                topBadges={
                                    <>
                                        {LISTING_TYPES.includes(listing.listingType) && (
                                            <CardBadge tone={listing.listingType === "rent" ? "info" : "primary"} label={optionLabel(t, "listingType", listing.listingType)} />
                                        )}
                                        {listing.category && <CardBadge tone="dark" label={categoryLabel(listing.category)} />}
                                    </>
                                }
                                bottomBadges={<CardBadge tone="light" icon={<LanguageRoundedIcon />} label={listing.sourceName || listing.sourceDomain} />}
                                meta={listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString(i18n.language) : listing.sourceDomain}
                                metaEnd={
                                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "primary.main", flexShrink: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap>
                                            {t("externalSearch.open", "Open")}
                                        </Typography>
                                        <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
                                    </Stack>
                                }
                                title={listing.title || [listing.make, listing.model].filter(Boolean).join(" ")}
                                location={formatCity(listing, i18n.language)}
                                features={[
                                    listing.make && { icon: <DirectionsCarOutlinedIcon />, label: [listing.make, listing.model].filter(Boolean).join(" ") },
                                    listing.year && { icon: <CalendarMonthOutlinedIcon />, label: String(listing.year) },
                                    listing.mileage !== null && listing.mileage !== undefined && { icon: <SpeedOutlinedIcon />, label: `${formatNumber(listing.mileage, i18n.language)} km` },
                                    listing.fuel && { icon: <LocalGasStationOutlinedIcon />, label: optionLabel(t, "fuel", listing.fuel) },
                                    listing.transmission && { icon: <SettingsOutlinedIcon />, label: optionLabel(t, "transmission", listing.transmission) },
                                ].filter(Boolean)}
                                featureRows={2}
                                price={priceOf(listing)}
                            />
                        ))}
                    </Box>

                    {pagination.pages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination
                                count={pagination.pages}
                                page={Math.min(page, pagination.pages)}
                                onChange={(_event, value) => {
                                    const next = new URLSearchParams(params);
                                    next.set("page", String(value));
                                    setParams(next);
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
    );
}

export default function VehicleExternalListingsPage() {
    const { t } = useTranslation();
    const [params, setParams] = useSearchParams();
    const tab = params.get("tab") === "all" ? "all" : "search";

    return (
        <PageLayout
            icon={<TravelExploreOutlinedIcon />}
            title={t("vehicleExternal.title", "External listings")}
            subtitle={t("vehicleExternal.subtitle", "Vehicles, motos and spare parts published on other Moroccan websites. A card opens the listing on its website.")}
        >
            <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={tab}
                    onChange={(_event, value) => setParams(value === "all" ? { tab: "all" } : {})}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{ "& .MuiTab-root": { minHeight: 52, textTransform: "none", fontWeight: 600, fontSize: { xs: 13, sm: 15 } } }}
                >
                    <Tab value="search" icon={<ManageSearchRoundedIcon />} iconPosition="start" label={t("vehicleExternal.searchTab", "Find a vehicle")} />
                    <Tab value="all" icon={<ViewModuleRoundedIcon />} iconPosition="start" label={t("externalSearch.allTab", "All listings")} />
                </Tabs>
            </Box>

            {tab === "search" ? <ExternalVehicleSearch /> : <AllListings key="all" />}
        </PageLayout>
    );
}

