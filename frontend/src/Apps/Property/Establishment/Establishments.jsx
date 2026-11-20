import React, { useEffect, useState } from "react";
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
    const { t } = useTranslation();

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
                "/establishments",
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
        <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 }, px: { xs: 2, sm: 3 } }}>
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
            <Card
                elevation={0}
                sx={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 3,
                    mb: 4,
                }}
            >
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                fullWidth
                                label={t("establishments.filters.search")}
                                placeholder={t("establishments.filters.searchPlaceholder")}
                                value={search}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <Search
                                            sx={{
                                                mr: 1,
                                                color: "text.secondary",
                                            }}
                                        />
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                fullWidth
                                label={t("establishments.filters.city")}
                                placeholder={t("establishments.filters.cityPlaceholder")}
                                value={city}
                                onChange={handleFilterChange(setCity)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth>
                                <InputLabel>
                                    {t("establishments.filters.accommodationType")}
                                </InputLabel>

                                <Select
                                    value={accommodationType}
                                    label={t("establishments.filters.accommodationType")}
                                    onChange={handleFilterChange(
                                        setAccommodationType
                                    )}
                                >
                                    {ACCOMMODATION_TYPES.map((type) => (
                                        <MenuItem
                                            key={type}
                                            value={type}
                                        >
                                            {type === "All"
                                                ? t("establishments.filters.allTypes")
                                                : t(
                                                    `establishments.types.${type.toLowerCase()}`,
                                                    { defaultValue: type }
                                                )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

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
        </Container>
    );
}