import React, { useCallback, useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Chip,
    Divider,
    Grid,
    Pagination,
    Stack,
    Typography,
    TextField,
    MenuItem,
    InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import BathtubOutlinedIcon from "@mui/icons-material/BathtubOutlined";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";

import { useTranslation } from "react-i18next";

import axiosInstance from "../../../api/axiosInstance";
import PageLayout from "../../PageLayout";
import cities from "../../../data/moroccanCities";

const API_URL = "/external-listings";
const ITEMS_PER_PAGE = 9;

const initialFilters = {
    search: "",
    listingType: "All",
    propertyType: "All",
    city: "All",
    source: "All",
    minPrice: "",
    maxPrice: "",
};

const propertyTypeKeys = {
    Apartment: "apartment",
    House: "house",
    Villa: "villa",
    Studio: "studio",
    Room: "room",
    Store: "store",
    Office: "office",
    Land: "land",
    Warehouse: "warehouse",
    "Commercial space": "commercialSpace",
    "Commercial store": "commercialStore",
    Garage: "garage",
    Other: "other",
};

function getLocale(language) {
    const lang = (language || "en").split("-")[0].split("_")[0];

    const locales = {
        en: "en-GB",
        fr: "fr-FR",
        ar: "ar-MA",
    };

    return locales[lang] || "en-GB";
}

function getListings(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.listings)) return data.listings;
    if (Array.isArray(data?.data?.listings)) return data.data.listings;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;

    return [];
}

function cleanText(value) {
    if (typeof value !== "string") return "";

    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;|&#160;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeFilter(value) {
    return String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function getPropertyImage(listing) {
    const candidates = [
        ...(Array.isArray(listing.imageUrls) ? listing.imageUrls : []),
        listing.imageUrl,
    ];

    for (const candidate of candidates) {
        const value =
            typeof candidate === "string" ? candidate : candidate?.url;

        if (!value) continue;

        try {
            const url = new URL(value, listing.sourceUrl);

            if (!["https:", "http:"].includes(url.protocol)) continue;

            const imagePath = url.pathname.toLowerCase();

            if (
                /logo|favicon|placeholder|no-image|default-image|avatar/.test(
                    imagePath
                )
            ) {
                continue;
            }

            return url.href;
        } catch {
            continue;
        }
    }

    return "";
}

function formatPrice(listing, locale, t) {
    if (listing.price == null || listing.price === "") {
        return t("externalListings.priceOnRequest");
    }

    const price = Number(listing.price);

    const formatted = Number.isFinite(price)
        ? price.toLocaleString(locale, {
              maximumFractionDigits: 2,
          })
        : cleanText(String(listing.price));

    const currency = listing.currency || "MAD";

    const suffix =
        listing.priceUnit === "monthly"
            ? ` ${t("externalListings.priceUnits.month")}`
            : listing.priceUnit === "per_m2"
              ? ` ${t("externalListings.priceUnits.perSquareMeter")}`
              : "";

    return `${formatted} ${currency}${suffix}`;
}

function getLocation(listing) {
    return [
        cleanText(listing.neighborhood),
        cleanText(listing.city),
    ]
        .filter(Boolean)
        .join(", ");
}

function getListingType(listing, t) {
    if (listing.listingType === "For Sale") {
        return t("externalListings.listingTypes.forSale");
    }

    if (listing.listingType === "For Rent") {
        return t("externalListings.listingTypes.forRent");
    }

    return t("externalListings.listingTypes.property");
}

function getPropertyTypeLabel(propertyType, t) {
    const value = cleanText(propertyType);

    const key = propertyTypeKeys[value];

    return key
        ? t(`externalListings.propertyTypes.${key}`)
        : value;
}

/* -------------------------------------------------------
   Property image
------------------------------------------------------- */

function PropertyImage({ listing, t }) {
    const [failed, setFailed] = useState(false);

    const image = getPropertyImage(listing);

    useEffect(() => {
        setFailed(false);
    }, [image]);

    return (
        <Box
            sx={{
                height: { xs: 210, sm: 225 },
                bgcolor: "grey.100",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {image && !failed ? (
                <Box
                    component="img"
                    src={image}
                    alt={cleanText(listing.title) || t("externalListings.property")}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    sx={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "cover",
                        transition: "transform 0.3s",
                        "&:hover": {
                            transform: "scale(1.04)",
                        },
                    }}
                />
            ) : (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    sx={{
                        width: "100%",
                        height: "100%",
                        color: "text.secondary",
                    }}
                >
                    <Box
                        component="svg"
                        viewBox="0 0 64 64"
                        sx={{ width: 58, height: 58 }}
                    >
                        <path
                            d="M7 29 32 8l25 21M14 25v30h36V25M25 55V37h14v18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Box>

                    <Typography variant="body2">
                        {t("externalListings.imageUnavailable")}
                    </Typography>
                </Stack>
            )}

            <Chip
                label={getListingType(listing, t)}
                size="small"
                color={
                    listing.listingType === "For Rent"
                        ? "info"
                        : "success"
                }
                sx={{
                    position: "absolute",
                    top: 12,
                    insetInlineStart: 12,
                    fontWeight: 700,
                    boxShadow: 1,
                }}
            />
        </Box>
    );
}

/* -------------------------------------------------------
   Property card
------------------------------------------------------- */

function PropertyCard({ listing, onTrackClick, t, locale }) {
    const title =
        cleanText(listing.title) || t("externalListings.propertyListing");

    const description = cleanText(listing.description);
    const location = getLocation(listing);
    const sourceUrl = listing.sourceUrl;

    const details = [
        listing.surface != null && listing.surface !== ""
            ? {
                  icon: <SquareFootOutlinedIcon fontSize="small" />,
                  label: t("externalListings.details.surface", {
                      value: listing.surface,
                  }),
              }
            : null,

        listing.rooms != null && listing.rooms !== ""
            ? {
                  icon: <BedOutlinedIcon fontSize="small" />,
                  label: t("externalListings.details.rooms", {
                      value: listing.rooms,
                  }),
              }
            : null,

        listing.bathrooms != null && listing.bathrooms !== ""
            ? {
                  icon: <BathtubOutlinedIcon fontSize="small" />,
                  label: t("externalListings.details.bathrooms", {
                      value: listing.bathrooms,
                  }),
              }
            : null,
    ].filter(Boolean);

    return (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                overflow: "hidden",
                bgcolor: "background.paper",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                },
            }}
        >
            <PropertyImage listing={listing} t={t} />

            <CardContent
                sx={{
                    p: 2.25,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    flexGrow: 1,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontSize: "1.05rem",
                        fontWeight: 750,
                        lineHeight: 1.5,
                        minHeight: "3em",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        textAlign: "start",
                    }}
                    title={title}
                >
                    {title}
                </Typography>

                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "success.dark",
                        fontSize: "1.3rem",
                        textAlign: "start",
                    }}
                >
                    {formatPrice(listing, locale, t)}
                </Typography>

                <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                >
                    <LocationOnOutlinedIcon
                        fontSize="small"
                        color="action"
                    />

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            overflowWrap: "anywhere",
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                        }}
                    >
                        {location || t("externalListings.locationNotSpecified")}
                    </Typography>
                </Stack>

                {details.length > 0 && (
                    <>
                        <Divider />

                        <Stack
                            direction="row"
                            gap={1.5}
                            flexWrap="wrap"
                            alignItems="center"
                        >
                            {details.map((detail) => (
                                <Stack
                                    key={detail.label}
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                    sx={{ color: "text.secondary" }}
                                >
                                    {detail.icon}

                                    <Typography variant="body2">
                                        {detail.label}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </>
                )}

                {listing.propertyType && (
                    <Box>
                        <Chip
                            size="small"
                            variant="outlined"
                            label={getPropertyTypeLabel(
                                listing.propertyType,
                                t
                            )}
                        />
                    </Box>
                )}

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            lineHeight: 1.7,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 4,
                            overflow: "hidden",
                            overflowWrap: "anywhere",
                        }}
                        title={description}
                    >
                        {description}
                    </Typography>
                )}

                <Box sx={{ flexGrow: 1, minHeight: 4 }} />

                <Divider />

                <Typography variant="caption" color="text.secondary">
                    {t("externalListings.source")}:{" "}
                    {listing.sourceName || t("externalListings.externalListing")}
                </Typography>

                {sourceUrl && (
                    <Button
                        component="a"
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        fullWidth
                        endIcon={<OpenInNewIcon />}
                        onClick={() => onTrackClick(listing)}
                    >
                        {t("externalListings.viewOriginal")}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------
   Filters
------------------------------------------------------- */

function ExternalListingFilters({
    listings,
    filters,
    onFilterChange,
    onClear,
    activeFilterCount,
    t,
}) {
    const propertyTypes = [
        ...new Set(
            listings
                .map((item) => cleanText(item.propertyType))
                .filter(Boolean)
        ),
    ].sort();

    const sources = [
        ...new Set(
            listings
                .map((item) => cleanText(item.sourceName))
                .filter(Boolean)
        ),
    ].sort();

    const listingTypes = [
        "For Sale",
        "For Rent",
        "Unknown",
    ];

    const handleChange = (field) => (event) => {
        onFilterChange(field, event.target.value);
    };

    const getListingTypeLabel = (type) => {
        if (type === "For Sale") {
            return t("externalListings.listingTypes.forSale");
        }

        if (type === "For Rent") {
            return t("externalListings.listingTypes.forRent");
        }

        return t("externalListings.listingTypes.unknown");
    };

    return (
        <Box
            sx={{
                mb: 3,
                p: { xs: 2, sm: 2.5 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                bgcolor: "background.paper",
                boxShadow: 1,
            }}
        >
            {/* Filter heading */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
                sx={{ mb: 2.5 }}
            >
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                >
                    <FilterAltOutlinedIcon color="action" />

                    <Typography fontWeight={750}>
                        {t("externalListings.filters.title")}
                    </Typography>

                    {activeFilterCount > 0 && (
                        <Chip
                            label={t("externalListings.filters.active", {
                                count: activeFilterCount,
                            })}
                            color="primary"
                            size="small"
                        />
                    )}
                </Stack>

                {activeFilterCount > 0 && (
                    <Button
                        size="small"
                        color="inherit"
                        startIcon={<ClearIcon />}
                        onClick={onClear}
                        sx={{ textTransform: "none" }}
                    >
                        {t("externalListings.filters.clear")}
                    </Button>
                )}
            </Stack>

            {/* Search */}
            <TextField
                fullWidth
                size="small"
                placeholder={t("externalListings.filters.searchPlaceholder")}
                value={filters.search}
                onChange={handleChange("search")}
                sx={{ mb: 2 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />

            {/* Select filters */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label={t("externalListings.filters.listingType")}
                        value={filters.listingType}
                        onChange={handleChange("listingType")}
                    >
                        <MenuItem value="All">
                            {t("externalListings.filters.allListingTypes")}
                        </MenuItem>

                        {listingTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {getListingTypeLabel(type)}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label={t("externalListings.filters.propertyType")}
                        value={filters.propertyType}
                        onChange={handleChange("propertyType")}
                    >
                        <MenuItem value="All">
                            {t("externalListings.filters.allPropertyTypes")}
                        </MenuItem>

                        {propertyTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {getPropertyTypeLabel(type, t)}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label={t("externalListings.filters.city")}
                        value={filters.city}
                        onChange={handleChange("city")}
                    >
                        <MenuItem value="All">
                            {t("externalListings.filters.allCities")}
                        </MenuItem>

                        {cities.map((city) => (
                            <MenuItem key={city.en} value={city.en}>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{
                                        width: "100%",
                                        columnGap: 2,
                                    }}
                                >
                                    <span>{city.en}</span>

                                    <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                        dir="rtl"
                                    >
                                        {city.ar}
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label={t("externalListings.filters.source")}
                        value={filters.source}
                        onChange={handleChange("source")}
                    >
                        <MenuItem value="All">
                            {t("externalListings.filters.allSources")}
                        </MenuItem>

                        {sources.map((source) => (
                            <MenuItem key={source} value={source}>
                                {source}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* Price range */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={t("externalListings.filters.minimumPrice")}
                        value={filters.minPrice}
                        onChange={handleChange("minPrice")}
                        slotProps={{
                            htmlInput: { min: 0 },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={t("externalListings.filters.maximumPrice")}
                        value={filters.maxPrice}
                        onChange={handleChange("maxPrice")}
                        slotProps={{
                            htmlInput: { min: 0 },
                        }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

/* -------------------------------------------------------
   Main component
------------------------------------------------------- */

export default function ExternalListings() {
    const { t, i18n } = useTranslation();

    const currentLanguage = (
        i18n.resolvedLanguage ||
        i18n.language ||
        "en"
    )
        .split("-")[0]
        .split("_")[0];

    const isRTL = currentLanguage === "ar";
    const locale = getLocale(currentLanguage);

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState(initialFilters);

    const handleTrackClick = useCallback(async (listing) => {
        try {
            await axiosInstance.post(
                `${API_URL}/${listing._id}/click`
            );
        } catch (error) {
            // Tracking should never prevent visitors
            // from opening the original property.
            console.error(
                "Unable to track external listing click:",
                error.message
            );
        }
    }, []);

    const loadListings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const firstResponse = await axiosInstance.get(API_URL, {
                params: {
                    page: 1,
                    limit: 50,
                },
            });

            const firstListings = getListings(firstResponse.data);

            const pagination =
                firstResponse.data?.pagination ||
                firstResponse.data?.data?.pagination;

            const totalPages = pagination?.totalPages || 1;

            let allListings = [...firstListings];

            // Fetch remaining backend pages.
            if (totalPages > 1) {
                const requests = [];

                for (
                    let currentPage = 2;
                    currentPage <= totalPages;
                    currentPage++
                ) {
                    requests.push(
                        axiosInstance.get(API_URL, {
                            params: {
                                page: currentPage,
                                limit: 50,
                            },
                        })
                    );
                }

                const responses = await Promise.all(requests);

                responses.forEach((response) => {
                    allListings.push(...getListings(response.data));
                });
            }

            setListings(allListings);
            setPage(1);
        } catch (err) {
            console.error("Failed to load external listings:", err);

            setError(
                err.response?.data?.message ||
                    t("externalListings.errors.loadFailed")
            );
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const handleFilterChange = (field, value) => {
        setFilters((current) => ({
            ...current,
            [field]: value,
        }));

        setPage(1);
    };

    const clearFilters = () => {
        setFilters(initialFilters);
        setPage(1);
    };

    const activeFilterCount = Object.entries(filters).filter(
        ([key, value]) => {
            return (
                value !== "" &&
                value !== "All"
            );
        }
    ).length;

    // Apply all filters together.
    const filteredListings = listings.filter((listing) => {
        const search = normalizeFilter(filters.search);

        const searchableText = normalizeFilter(
            [
                listing.title,
                listing.description,
                listing.city,
                listing.neighborhood,
                listing.propertyType,
                listing.sourceName,
            ].join(" ")
        );

        const matchesSearch =
            !search || searchableText.includes(search);

        const matchesListingType =
            filters.listingType === "All" ||
            normalizeFilter(listing.listingType) ===
                normalizeFilter(filters.listingType);

        const matchesPropertyType =
            filters.propertyType === "All" ||
            normalizeFilter(listing.propertyType) ===
                normalizeFilter(filters.propertyType);

        const selectedCity = cities.find(
            (city) => city.en === filters.city
        );

        const matchesCity =
            filters.city === "All" ||
            normalizeFilter(listing.city) ===
                normalizeFilter(selectedCity?.en) ||
            normalizeFilter(listing.city) ===
                normalizeFilter(selectedCity?.ar);

        const matchesSource =
            filters.source === "All" ||
            normalizeFilter(listing.sourceName) ===
                normalizeFilter(filters.source);

        const price = Number(listing.price);

        const hasPrice =
            listing.price !== null &&
            listing.price !== undefined &&
            listing.price !== "" &&
            Number.isFinite(price);

        const minPrice =
            filters.minPrice === ""
                ? null
                : Number(filters.minPrice);

        const maxPrice =
            filters.maxPrice === ""
                ? null
                : Number(filters.maxPrice);

        const matchesMinPrice =
            minPrice === null ||
            (hasPrice && price >= minPrice);

        const matchesMaxPrice =
            maxPrice === null ||
            (hasPrice && price <= maxPrice);

        return (
            matchesSearch &&
            matchesListingType &&
            matchesPropertyType &&
            matchesCity &&
            matchesSource &&
            matchesMinPrice &&
            matchesMaxPrice
        );
    });

    const totalPages = Math.ceil(
        filteredListings.length / ITEMS_PER_PAGE
    );

    const paginatedListings = filteredListings.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    return (
        <Box dir={isRTL ? "rtl" : "ltr"} sx={{ width: "100%" }}>
            <PageLayout
                title={t("externalListings.title")}
                subtitle={t("externalListings.subtitle")}
                maxWidth={1280}
            >
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={loadListings}
                            >
                                {t("externalListings.retry")}
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Stack
                        alignItems="center"
                        justifyContent="center"
                        spacing={2}
                        sx={{ py: 10 }}
                    >
                        <CircularProgress />

                        <Typography color="text.secondary">
                            {t("externalListings.loading")}
                        </Typography>
                    </Stack>
                ) : (
                    <>
                        {/* Property filters */}
                        <ExternalListingFilters
                            listings={listings}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClear={clearFilters}
                            activeFilterCount={activeFilterCount}
                            t={t}
                        />

                        {/* Results heading */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            flexWrap="wrap"
                            gap={1}
                            sx={{ mb: 3 }}
                        >
                            <Typography
                                variant="h6"
                                fontWeight={750}
                            >
                                {filters.search || activeFilterCount > 0
                                    ? t("externalListings.filteredProperties")
                                    : t("externalListings.propertyListings")}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {t("externalListings.resultsCount", {
                                    count: filteredListings.length,
                                })}
                            </Typography>
                        </Stack>

                        {/* Empty state */}
                        {filteredListings.length === 0 ? (
                            <Box
                                sx={{
                                    py: 8,
                                    px: 2,
                                    textAlign: "center",
                                    border: 1,
                                    borderColor: "divider",
                                    borderRadius: "16px",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                >
                                    {t("externalListings.empty.title")}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    sx={{ mt: 1, mb: 2 }}
                                >
                                    {t("externalListings.empty.description")}
                                </Typography>

                                {activeFilterCount > 0 && (
                                    <Button
                                        variant="outlined"
                                        onClick={clearFilters}
                                        sx={{ textTransform: "none" }}
                                    >
                                        {t("externalListings.filters.clear")}
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <>
                                <Grid container spacing={3}>
                                    {paginatedListings.map(
                                        (listing, index) => (
                                            <Grid
                                                key={
                                                    listing._id ||
                                                    listing.sourceUrl ||
                                                    index
                                                }
                                                size={{
                                                    xs: 12,
                                                    sm: 6,
                                                    lg: 4,
                                                }}
                                            >
                                                <PropertyCard
                                                    listing={listing}
                                                    onTrackClick={handleTrackClick}
                                                    t={t}
                                                    locale={locale}
                                                />
                                            </Grid>
                                        )
                                    )}
                                </Grid>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            mt: 5,
                                        }}
                                    >
                                        <Pagination
                                            count={totalPages}
                                            page={Math.min(page, totalPages)}
                                            onChange={handlePageChange}
                                            color="primary"
                                            size="large"
                                            showFirstButton
                                            showLastButton
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}
            </PageLayout>
        </Box>
    );
}