
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Autocomplete,
    Box,
    Button,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";

import cities from "../data/moroccanCities";

const moroccanCities = cities;

const categories = [
    { value: "All Properties", key: "all" },
    { value: "Apartment", key: "apartment" },
    { value: "House", key: "house" },
    { value: "Villa", key: "villa" },
    { value: "Studio", key: "studio" },
    { value: "Room", key: "room" },
    { value: "Store", key: "store" },
    { value: "Office", key: "office" },
    { value: "Land", key: "land" },
    { value: "Warehouse", key: "warehouse" },
    { value: "Commercial space", key: "commercialSpace" },
    { value: "Commercial store", key: "commercialStore" },
    { value: "Garage", key: "garage" },
    { value: "other", key: "other" },
];

const transactionTypes = [
    { value: "All", key: "allTransactions" },
    { value: "For Sale", key: "forSale" },
    { value: "For Rent", key: "forRent" },
];

const rentalPeriods = [
    { value: "All", key: "allRentalPeriods" },
    { value: "Daily", key: "daily" },
    { value: "Monthly", key: "monthly" },
];

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const normalizeCity = (value) => {
    const city = normalize(value);

    if (city === "tanger") return "tangier";
    if (city === "marrakech") return "marrakesh";
    if (city === "fes") return "fez";

    return city;
};

export default function PropertyCategoryBar({
    properties = [],
    selectedCategory = "All Properties",
    onCategoryChange,
    selectedListingType = "All",
    onListingTypeChange,
    selectedRentalPeriod = "All",
    onRentalPeriodChange,
    selectedCity = "All Cities",
    onCityChange,
}) {
    const { t, i18n } = useTranslation();

    const isForRent = selectedListingType === "For Rent";

    const getCategoryCount = (category) => {
        return properties.filter((property) => {
            const matchesCategory =
                category === "All Properties" ||
                normalize(property.propertyType) === normalize(category);

            const matchesTransaction =
                selectedListingType === "All" ||
                normalize(property.listingType) ===
                    normalize(selectedListingType);

            const matchesRentalPeriod =
                !isForRent ||
                selectedRentalPeriod === "All" ||
                normalize(property.rentalPeriod) ===
                    normalize(selectedRentalPeriod);

            const matchesCity =
                selectedCity === "All Cities" ||
                normalizeCity(property.city) === normalizeCity(selectedCity);

            return (
                matchesCategory &&
                matchesTransaction &&
                matchesRentalPeriod &&
                matchesCity
            );
        }).length;
    };

    const getCityLabel = (city) => {
        if (city === "All Cities") {
            return t("properties.filter.allCities");
        }

        return i18n.resolvedLanguage === "ar"
            ? city.ar
            : city.en;
    };

    const filterFieldSx = {
        minWidth: 0,
        width: "100%",
        "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            backgroundColor: "#fff",
        },
    };

    const handleClearFilters = () => {
        onListingTypeChange?.("All");
        onRentalPeriodChange?.("All");
        onCityChange?.("All Cities");
        onCategoryChange?.("All Properties");
    };

    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                    pb: 2,
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
            >
                {t("properties.filter.title")}
            </Typography>

            <Box
                sx={{
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                    mb: 3,
                    px: { xs: 1.5, sm: 2.5, md: 3 },
                    py: { xs: 1.5, sm: 2 },
                    border: 1,
                    borderRadius: "16px",
                    borderColor: "#E2E8F0",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    bgcolor: "#fff",
                }}
            >
                <Box
                    component="nav"
                    aria-label={t("properties.filter.categoriesAriaLabel")}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                            md: "repeat(4, minmax(0, 1fr))",
                            lg: "repeat(5, minmax(0, 1fr))",
                            xl: "repeat(7, minmax(0, 1fr))",
                        },
                        gap: { xs: 1, sm: 1.5 },
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        py: 1.5,
                        px: { xs: 0, sm: 0.5 },
                    }}
                >
                    {categories.map((category) => {
                        const active =
                            selectedCategory === category.value;

                        const categoryCount =
                            getCategoryCount(category.value);

                        return (
                            <Button
                                key={category.value}
                                variant={active ? "contained" : "outlined"}
                                disableElevation
                                onClick={() =>
                                    onCategoryChange?.(category.value)
                                }
                                sx={{
                                    minWidth: 0,
                                    width: "100%",
                                    minHeight: { xs: 42, sm: 44 },
                                    px: { xs: 0.75, sm: 1.5 },
                                    py: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.75,
                                    whiteSpace: "normal",
                                    overflowWrap: "anywhere",
                                    textAlign: "center",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: {
                                        xs: "0.72rem",
                                        sm: "0.85rem",
                                    },
                                    lineHeight: 1.3,
                                    borderRadius: "999px",
                                    color: active ? "#fff" : "#334155",
                                    backgroundColor: active
                                        ? "#2563EB"
                                        : "#fff",
                                    borderColor: active
                                        ? "#2563EB"
                                        : "#D5DCE8",
                                    boxShadow: active
                                        ? "0 4px 12px rgba(37, 99, 235, 0.2)"
                                        : "none",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: active
                                            ? "#1D4ED8"
                                            : "#f8fafc",
                                        borderColor: active
                                            ? "#1D4ED8"
                                            : "#94a3b8",
                                    },
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        minWidth: 0,
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {t(
                                        `properties.categories.${category.key}`
                                    )}
                                </Box>

                                <Box
                                    component="span"
                                    sx={{
                                        display: "inline-flex",
                                        flexShrink: 0,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: 22,
                                        height: 22,
                                        px: 0.6,
                                        borderRadius: "6px",
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        backgroundColor: active
                                            ? "rgba(255, 255, 255, 0.2)"
                                            : "#f1f5f9",
                                        color: active ? "#fff" : "#5B6577",
                                    }}
                                >
                                    {categoryCount}
                                </Box>
                            </Button>
                        );
                    })}
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: { xs: 2, sm: 3, md: 5 },
                        mt: 1.5,
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: "16px",
                        backgroundColor: "#F4F7FB",
                        boxSizing: "border-box",
                        width: "100%",
                        minWidth: 0,
                    }}
                >
                    {/* Transaction type */}
                    <TextField
                        select
                        label={t("properties.filter.transactionType")}
                        value={selectedListingType}
                        onChange={(event) =>
                            onListingTypeChange?.(event.target.value)
                        }
                        size="medium"
                        sx={{
                            ...filterFieldSx,
                            flex: {
                                xs: "1 1 100%",
                                sm: "1 1 190px",
                            },
                        }}
                    >
                        {transactionTypes.map((type) => (
                            <MenuItem
                                key={type.value}
                                value={type.value}
                            >
                                {t(`properties.filter.${type.key}`)}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Rental period: only available for rental properties */}
                    {isForRent && (
                        <TextField
                            select
                            label={t("properties.filter.rentalPeriod")}
                            value={selectedRentalPeriod}
                            onChange={(event) =>
                                onRentalPeriodChange?.(event.target.value)
                            }
                            size="medium"
                            sx={{
                                ...filterFieldSx,
                                flex: {
                                    xs: "1 1 100%",
                                    sm: "1 1 190px",
                                },
                            }}
                        >
                            {rentalPeriods.map((period) => (
                                <MenuItem
                                    key={period.value}
                                    value={period.value}
                                >
                                    {t(`properties.filter.${period.key}`)}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    {/* City */}
                    <Autocomplete
                        options={[
                            { en: "All Cities", ar: "جميع المدن" },
                            ...moroccanCities,
                        ]}
                        value={
                            moroccanCities.find(
                                (city) => city.en === selectedCity
                            ) || {
                                en: "All Cities",
                                ar: "جميع المدن",
                            }
                        }
                        onChange={(_event, newValue) =>
                            onCityChange?.(newValue?.en || "All Cities")
                        }
                        getOptionLabel={getCityLabel}
                        isOptionEqualToValue={(option, value) =>
                            option.en === value.en
                        }
                        fullWidth
                        sx={{
                            ...filterFieldSx,
                            flex: {
                                xs: "1 1 100%",
                                sm: "1 1 220px",
                            },
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t("properties.filter.city")}
                                placeholder={t("properties.filter.searchCity")}
                            />
                        )}
                    />

                    {/* Clear filters */}
                    <Button
                        variant="outlined"
                        onClick={handleClearFilters}
                        sx={{
                            minHeight: 56,
                            minWidth: { xs: 0, sm: "auto" },
                            width: { xs: "100%", sm: "auto" },
                            px: 2.5,
                            borderRadius: "10px",
                            borderColor: "#D5DCE8",
                            color: "#475569",
                            fontWeight: 700,
                            textTransform: "none",
                            flexShrink: 0,
                        }}
                    >
                        {t("properties.filter.clearFilters")}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
