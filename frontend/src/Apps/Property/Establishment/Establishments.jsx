import React, { useEffect, useState } from "react";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    Add,
    Hotel,
    LocationOn,
    Search,
} from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { FilterGrid, FilterPanel, FilterSearch, FilterSelect } from "../../../Components/ui/FilterKit";
import moroccanCities from "../../../data/moroccanCities";
import EstablishmentCard from "./EstablishmentCard";

const ACCOMMODATION_TYPES = [
    "All",
    "Hotel",
    "Riad",
    "Guesthouse",
    "Hostel",
    "Aparthotel",
    "Other",
];

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

function getImageUrl(image) {
    if (!image) return "";

    const imagePath =
        typeof image === "string"
            ? image
            : image.path || image.url || image.filename || "";

    if (!imagePath) return "";

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
}

function getStartingPrice(rooms = []) {
    const prices = rooms
        .map((room) => Number(room.pricePerNight))
        .filter((price) => Number.isFinite(price) && price > 0);

    return prices.length ? Math.min(...prices) : null;
}

export default function Establishments() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [city, setCity] = useState("");
    const [accommodationType, setAccommodationType] = useState("All");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchEstablishments = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit: 12,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (city.trim()) {
                params.city = city.trim();
            }

            if (accommodationType !== "All") {
                params.accommodationType = accommodationType;
            }

            const response = await axiosInstance.get(
                "/property/establishments",
                { params }
            );

            const data = response.data;

            setEstablishments(data.establishments || []);
            setTotalPages(
                Math.max(1, data.pagination?.totalPages || 1)
            );
        } catch (err) {
            console.error("Fetch establishments error:", err);

            setError(
                err.response?.data?.message ||
                    t("establishments.errors.fetch")
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstablishments();
    }, [page, search, city, accommodationType]);

    const handleFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setPage(1);
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);
    };

    const handleOpenEstablishment = (id) => {
        navigate(`/establishments/${id}`);
    };

    return (
        <Box sx={pagePaddingSx}>
            {/* Header */}
            <PageHeader
                icon={<Hotel />}
                title={t("establishments.title")}
                subtitle={t("establishments.subtitle")}
                action={
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate("/establishments/publish")}
                    >
                        {t("establishments.publish")}
                    </Button>
                }
            />

            {/* Filters */}
            <FilterPanel
                activeCount={(search.trim() ? 1 : 0) + (city ? 1 : 0) + (accommodationType !== "All" ? 1 : 0)}
                onClear={() => {
                    setSearch("");
                    setCity("");
                    setAccommodationType("All");
                    setPage(1);
                }}
                clearLabel={t("establishments.empty.clearFilters")}
            >
                <FilterSearch
                    value={search}
                    onChange={(value) => handleSearchChange({ target: { value } })}
                    placeholder={t("establishments.filters.searchPlaceholder", {
                        defaultValue: t("establishments.filters.search", "Search establishments"),
                    })}
                />

                <FilterGrid>
                    <FilterSelect
                        label={t("establishments.filters.city")}
                        value={city}
                        onChange={(value) => handleFilterChange(setCity)({ target: { value } })}
                        options={[
                            { value: "", label: t("properties.filter.allCities", "All cities") },
                            ...moroccanCities.map((item) => ({
                                value: item.en,
                                label: i18n.resolvedLanguage === "ar" ? item.ar : item.en,
                            })),
                        ]}
                    />

                    <FilterSelect
                        label={t("establishments.filters.accommodationType")}
                        value={accommodationType}
                        onChange={(value) => handleFilterChange(setAccommodationType)({ target: { value } })}
                        options={ACCOMMODATION_TYPES.map((type) => ({
                            value: type,
                            label:
                                type === "All"
                                    ? t("establishments.filters.allTypes")
                                    : t(`establishments.types.${type.toLowerCase()}`, { defaultValue: type }),
                        }))}
                    />
                </FilterGrid>
            </FilterPanel>

            {/* Results */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 8,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : establishments.length === 0 ? (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 8,
                        px: 2,
                        bgcolor: "#f8fafc",
                        borderRadius: 3,
                    }}
                >
                    <Hotel
                        sx={{
                            fontSize: 55,
                            color: "#94a3b8",
                            mb: 2,
                        }}
                    />

                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("establishments.empty.title")}
                    </Typography>

                    <Typography sx={{ color: "text.secondary", mt: 1 }}>
                        {t("establishments.empty.subtitle")}
                    </Typography>

                    <Button
                        sx={{ mt: 2 }}
                        onClick={() => {
                            setSearch("");
                            setCity("");
                            setAccommodationType("All");
                            setPage(1);
                        }}
                    >
                        {t("establishments.empty.clearFilters")}
                    </Button>
                </Box>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {establishments.map((establishment) => {
                            const coverImage = getImageUrl(
                                establishment.media?.coverPhoto
                            );

                            const startingPrice = getStartingPrice(
                                establishment.rooms
                            );

                            return (
                                <Grid
                                    key={establishment._id}
                                    size={{ xs: 12, sm: 6, lg: 4 }}
                                >
                                    <EstablishmentCard
                                        establishment={establishment}
                                        image={coverImage}
                                        startingPrice={startingPrice}
                                        onClick={() => handleOpenEstablishment(establishment._id)}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>

                    {totalPages > 1 && (
                        <Stack
                            sx={{ alignItems: "center", mt: 5 }}
                        >
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, value) => {
                                    setPage(value);
                                    window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                    });
                                }}
                                color="primary"
                                size="large"
                            />
                        </Stack>
                    )}
                </>
            )}
        </Box>
    );
}