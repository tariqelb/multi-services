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

import axiosInstance from "../../api/axiosInstance";

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
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
                sx={{ mb: 4, width: "100%" }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        color="#0B2E5C"
                    >
                        {t("establishments.title")}
                    </Typography>

                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {t("establishments.subtitle")}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate("/establishments/publish")}
                    sx={{
                        bgcolor: "#0B2E5C",
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        alignSelf: { xs: "flex-start", sm: "center" },
                        ml: { sm: "auto" },
                        "&:hover": {
                            bgcolor: "#16477f",
                        },
                    }}
                >
                    {t("establishments.publish")}
                </Button>
            </Stack>

            {/* Filters */}
            <Card
                elevation={0}
                sx={{
                    border: "1px solid #e5e7eb",
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

                    <Typography variant="h6" fontWeight={700}>
                        {t("establishments.empty.title")}
                    </Typography>

                    <Typography color="text.secondary" sx={{ mt: 1 }}>
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
                                    <Card
                                        onClick={() =>
                                            handleOpenEstablishment(
                                                establishment._id
                                            )
                                        }
                                        sx={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            borderRadius: 3,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            border: "1px solid #e5e7eb",
                                            transition:
                                                "transform 0.2s, box-shadow 0.2s",
                                            "&:hover": {
                                                transform: "translateY(-4px)",
                                                boxShadow:
                                                    "0 10px 25px rgba(0,0,0,0.10)",
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: "relative",
                                                height: 220,
                                                bgcolor: "#e2e8f0",
                                            }}
                                        >
                                            {coverImage ? (
                                                <CardMedia
                                                    component="img"
                                                    image={coverImage}
                                                    alt={establishment.name}
                                                    sx={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "contain",
                                                        display: "block",
                                                        bgcolor: "#e2e8f0",
                                                    }}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        height: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Hotel
                                                        sx={{
                                                            fontSize: 65,
                                                            color: "#94a3b8",
                                                        }}
                                                    />
                                                </Box>
                                            )}

                                            <Chip
                                                label={
                                                    establishment.accommodationType
                                                        ? t(
                                                            `establishments.types.${establishment.accommodationType.toLowerCase()}`,
                                                            {
                                                                defaultValue:
                                                                    establishment.accommodationType,
                                                            }
                                                        )
                                                        : t("establishments.accommodation")
                                                }
                                                size="small"
                                                sx={{
                                                    position: "absolute",
                                                    top: 12,
                                                    left: 12,
                                                    bgcolor: "white",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </Box>

                                        <CardContent
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                flex: 1,
                                                p: 2.5,
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                fontWeight={800}
                                                color="#0B2E5C"
                                                sx={{
                                                    mb: 1,
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {establishment.name}
                                            </Typography>

                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={0.5}
                                                sx={{ mb: 1 }}
                                            >
                                                <LocationOn
                                                    fontSize="small"
                                                    color="action"
                                                />

                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {[
                                                        establishment.location
                                                            ?.neighborhood,
                                                        establishment.location
                                                            ?.city,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ") ||
                                                        t("establishments.locationNotSpecified")}
                                                </Typography>
                                            </Stack>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    minHeight: 40,
                                                }}
                                            >
                                                {establishment.shortDescription ||
                                                    t("establishments.descriptionFallback")}
                                            </Typography>

                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                flexWrap="wrap"
                                                useFlexGap
                                                sx={{ mb: 2 }}
                                            >
                                                {establishment.numberOfRooms ? (
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        label={t(
                                                            "establishments.rooms",
                                                            {
                                                                count: establishment.numberOfRooms,
                                                            }
                                                        )}
                                                    />
                                                ) : null}

                                                {establishment.officialClassification ? (
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        label={
                                                            establishment.officialClassification
                                                        }
                                                    />
                                                ) : null}
                                            </Stack>

                                            <Box sx={{ flex: 1 }} />

                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                sx={{ width: "100%" }}
                                            >
                                                <Box>
                                                    {startingPrice !== null ? (
                                                        <>
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={800}
                                                                color="#0B2E5C"
                                                            >
                                                                {startingPrice.toLocaleString()} MAD
                                                            </Typography>

                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {t("establishments.startingPrice")}
                                                            </Typography>
                                                        </>
                                                    ) : (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {t("establishments.contactForPrices")}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "#0B2E5C",
                                                        ml: "auto",
                                                        flexShrink: 0,
                                                        "&:hover": {
                                                            bgcolor: "#16477f",
                                                        },
                                                    }}
                                                >
                                                    {t("establishments.viewDetails")}
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {totalPages > 1 && (
                        <Stack
                            alignItems="center"
                            sx={{ mt: 5 }}
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