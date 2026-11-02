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
} from "@mui/material";
import {
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
import axiosInstance from "../../../api/axiosInstance";

const API_URL = "/external-listings";
const ITEMS_PER_PAGE = 9;

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

function formatPrice(listing) {
    if (listing.price == null || listing.price === "") {
        return "Price on request";
    }

    const price = Number(listing.price);

    const formatted = Number.isFinite(price)
        ? price.toLocaleString(undefined, {
              maximumFractionDigits: 2,
          })
        : cleanText(String(listing.price));

    const currency = listing.currency || "MAD";

    const suffix =
        listing.priceUnit === "monthly"
            ? " / month"
            : listing.priceUnit === "per_m2"
              ? " / m²"
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

function getListingType(listing) {
    if (["For Sale", "For Rent"].includes(listing.listingType)) {
        return listing.listingType;
    }

    return "Property";
}

function PropertyImage({ listing }) {
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
                    alt={cleanText(listing.title) || "Property"}
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
                        Property image unavailable
                    </Typography>
                </Stack>
            )}

            <Chip
                label={getListingType(listing)}
                size="small"
                color={
                    listing.listingType === "For Rent"
                        ? "info"
                        : "success"
                }
                sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    fontWeight: 700,
                    boxShadow: 1,
                }}
            />
        </Box>
    );
}

function PropertyCard({ listing }) {
    const title = cleanText(listing.title) || "Property listing";
    const description = cleanText(listing.description);
    const location = getLocation(listing);
    const sourceUrl = listing.sourceUrl;

    const details = [
        listing.surface != null && listing.surface !== ""
            ? {
                  icon: <SquareFootOutlinedIcon fontSize="small" />,
                  label: `${listing.surface} m²`,
              }
            : null,
        listing.rooms != null && listing.rooms !== ""
            ? {
                  icon: <BedOutlinedIcon fontSize="small" />,
                  label: `${listing.rooms} rooms`,
              }
            : null,
        listing.bathrooms != null && listing.bathrooms !== ""
            ? {
                  icon: <BathtubOutlinedIcon fontSize="small" />,
                  label: `${listing.bathrooms} bathrooms`,
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
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "background.paper",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                },
            }}
        >
            <PropertyImage listing={listing} />

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
                    }}
                    title={title}
                >
                    {title}
                </Typography>

                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 800,
                        color: "success.dark",
                        fontSize: "1.3rem",
                    }}
                >
                    {formatPrice(listing)}
                </Typography>

                <Stack direction="row" spacing={0.75} alignItems="center">
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
                        {location || "Location not specified"}
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
                            label={cleanText(listing.propertyType)}
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
                    Source: {listing.sourceName || "External listing"}
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
                    >
                        View original listing
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

const moroccanCities = [
    { en: "Agadir", ar: "أكادير" },
    { en: "Ain Harrouda", ar: "عين حرودة" },
    { en: "Aït Melloul", ar: "أيت ملول" },
    { en: "Ait Ourir", ar: "أيت أورير" },
    { en: "Al Hoceima", ar: "الحسيمة" },
    { en: "Azrou", ar: "أزرو" },
    { en: "Benguerir", ar: "بن جرير" },
    { en: "Beni Ansar", ar: "بني أنصار" },
    { en: "Beni Mellal", ar: "بني ملال" },
    { en: "Benslimane", ar: "بن سليمان" },
    { en: "Berrechid", ar: "برشيد" },
    { en: "Berkane", ar: "بركان" },
    { en: "Biougra", ar: "بيوكرى" },
    { en: "Bni Yakhlef", ar: "بني يخلف" },
    { en: "Bouskoura", ar: "بوسكورة" },
    { en: "Bouznika", ar: "بوزنيقة" },
    { en: "Casablanca", ar: "الدار البيضاء" },
    { en: "Dcheira El Jihadia", ar: "الدشيرة الجهادية" },
    { en: "Dar Bouazza (Tamaris)", ar: "دار بوعزة" },
    { en: "Drargua", ar: "الدراركة" },
    { en: "Ech-challalate", ar: "الشلالات" },
    { en: "El Jadida", ar: "الجديدة" },
    { en: "El Kelaa Des Sraghna", ar: "قلعة السراغنة" },
    { en: "Essaouira", ar: "الصويرة" },
    { en: "Errachidia", ar: "الرشيدية" },
    { en: "Fez", ar: "فاس" },
    { en: "Fquih Ben Salah", ar: "الفقيه بن صالح" },
    { en: "Fnideq", ar: "الفنيدق" },
    { en: "Guelmim", ar: "كلميم" },
    { en: "Guercif", ar: "جرسيف" },
    { en: "Inezgane", ar: "إنزكان" },
    { en: "Kenitra", ar: "القنيطرة" },
    { en: "Khemisset", ar: "الخميسات" },
    { en: "Khenifra", ar: "خنيفرة" },
    { en: "Khouribga", ar: "خريبكة" },
    { en: "Ksar El Kebir", ar: "القصر الكبير" },
    { en: "Lahraouyine", ar: "الهراويين" },
    { en: "Larache", ar: "العرائش" },
    { en: "Lqliaa", ar: "القليعة" },
    { en: "M'diq", ar: "المضيق" },
    { en: "Marrakesh", ar: "مراكش" },
    { en: "Martil", ar: "مرتيل" },
    { en: "Mehdya", ar: "المهدية" },
    { en: "Meknes", ar: "مكناس" },
    { en: "Midelt", ar: "ميدلت" },
    { en: "Mohammedia", ar: "المحمدية" },
    { en: "Nador", ar: "الناظور" },
    { en: "Ouarzazate", ar: "ورزازات" },
    { en: "Oued Zem", ar: "وادي زم" },
    { en: "Oujda", ar: "وجدة" },
    { en: "Oulad Teima", ar: "أولاد تايمة" },
    { en: "Ouazzane", ar: "وزان" },
    { en: "Rabat", ar: "الرباط" },
    { en: "Salé", ar: "سلا" },
    { en: "Safi", ar: "آسفي" },
    { en: "Sefrou", ar: "صفرو" },
    { en: "Settat", ar: "سطات" },
    { en: "Skhirat", ar: "الصخيرات" },
    { en: "Sidi Bennour", ar: "سيدي بنور" },
    { en: "Sidi Kacem", ar: "سيدي قاسم" },
    { en: "Sidi Slimane", ar: "سيدي سليمان" },
    { en: "Sidi Taibi", ar: "سيدي الطيبي" },
    { en: "Souk El Arbaa", ar: "سوق الأربعاء" },
    { en: "Souk Sebt Ouled Nemma", ar: "سوق السبت أولاد النمة" },
    { en: "Taourirt", ar: "تاوريرت" },
    { en: "Tamensourte", ar: "تامنصورت" },
    { en: "Tan-Tan", ar: "طانطان" },
    { en: "Tanger", ar: "طنجة" },
    { en: "Taza", ar: "تازة" },
    { en: "Temara", ar: "تمارة" },
    { en: "Tetouan", ar: "تطوان" },
    { en: "Tifelt", ar: "تيفلت" },
    { en: "Tit Mellil", ar: "تيط مليل" },
    { en: "Tiznit", ar: "تيزنيت" },
    { en: "Youssoufia", ar: "اليوسفية" },
].sort((a, b) => a.en.localeCompare(b.en, "en"));

function ExternalListingFilters({
    listings,
    filters,
    onFilterChange,
    onClear,
    activeFilterCount,
}) {
   const cities = moroccanCities;

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

    return (
        <Box
            sx={{
                mb: 3,
                p: { xs: 2, sm: 2.5 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
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
                <Stack direction="row" spacing={1} alignItems="center">
                    <FilterAltOutlinedIcon color="action" />

                    <Typography fontWeight={750}>
                        Filter Properties
                    </Typography>

                    {activeFilterCount > 0 && (
                        <Chip
                            label={`${activeFilterCount} active`}
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
                        Clear filters
                    </Button>
                )}
            </Stack>

            {/* Search */}
            <TextField
                fullWidth
                size="small"
                placeholder="Search by title, description, or neighborhood..."
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
                        label="Listing Type"
                        value={filters.listingType}
                        onChange={handleChange("listingType")}
                    >
                        <MenuItem value="All">
                            All Listing Types
                        </MenuItem>

                        {listingTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Property Type"
                        value={filters.propertyType}
                        onChange={handleChange("propertyType")}
                    >
                        <MenuItem value="All">
                            All Property Types
                        </MenuItem>

                        {propertyTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                    select
                    fullWidth
                    size="small"
                    label="City"
                    value={filters.city}
                    onChange={handleChange("city")}
                >
                    <MenuItem value="All">
                        All Cities / جميع المدن
                    </MenuItem>

                    {cities.map((city) => (
                        <MenuItem key={city.en} value={city.en}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ width: "100%" }}
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
                        label="Source Website"
                        value={filters.source}
                        onChange={handleChange("source")}
                    >
                        <MenuItem value="All">
                            All Sources
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
                        label="Minimum Price (MAD)"
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
                        label="Maximum Price (MAD)"
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


export default function ExternalListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

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

    const [filters, setFilters] = useState(initialFilters);

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

            for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
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
                "Unable to load property listings. Please try again later."
        );
    } finally {
        setLoading(false);
    }
}, []);

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
            return value !== "" &&
                value !== "All" &&
                value !== "All Cities";
        }
    ).length;

    // Apply all filters together.
    const filteredListings = listings.filter((listing) => {
        const search = normalizeFilter(filters.search);

        const searchableText = normalizeFilter([
            listing.title,
            listing.description,
            listing.city,
            listing.neighborhood,
            listing.propertyType,
            listing.sourceName,
        ].join(" "));

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

        const selectedCity = moroccanCities.find(
            (city) => city.en === filters.city
        );
            
        const matchesCity =
            filters.city === "All" ||
            normalizeFilter(listing.city) === normalizeFilter(selectedCity?.en) ||
            normalizeFilter(listing.city) === normalizeFilter(selectedCity?.ar);

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
        <Box
            sx={{
                width: "100%",
                maxWidth: 1600,
                mx: "auto",
                p: { xs: 2, md: 3 },
            }}
        >
            {/* Page heading */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.6rem", md: "2rem" },
                    }}
                >
                    Discover Properties
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    Explore properties published on external real estate websites.
                </Typography>
            </Box>

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
                            Retry
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
                        Loading properties...
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
                            {filters.search ||
                            activeFilterCount > 0
                                ? "Filtered Properties"
                                : "Property Listings"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {filteredListings.length}{" "}
                            {filteredListings.length === 1
                                ? "property"
                                : "properties"}
                            {" "}found
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
                                borderRadius: 3,
                            }}
                        >
                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                No properties found
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 1, mb: 2 }}
                            >
                                Try changing your search or filters.
                            </Typography>

                            {activeFilterCount > 0 && (
                                <Button
                                    variant="outlined"
                                    onClick={clearFilters}
                                    sx={{ textTransform: "none" }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <>
                            <Grid container spacing={3}>
                                {paginatedListings.map((listing, index) => (
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
                                        <PropertyCard listing={listing} />
                                    </Grid>
                                ))}
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
        </Box>
    );
}

// Normalize text for consistent filtering.
function normalizeFilter(value) {
    return String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
