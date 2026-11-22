
import React from "react";
import { useTranslation } from "react-i18next";

import { Autocomplete, TextField } from "@mui/material";

import {
    FilterChips,
    FilterGrid,
    FilterPanel,
    FilterSelect,
    filterFieldSx,
} from "../../../Components/ui/FilterKit";

import cities from "../../../data/moroccanCities";

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

// "unfurnished" also covers land, stores... (no furnishing status).
export const DEFAULT_FURNISHING = "unfurnished";

// Available by default. Inactive listings are never shown.
export const DEFAULT_STATUS = "available";

const statusOptions = ["available", "sold", "rented", "all"];

const furnishingOptions = [
    { value: "unfurnished", key: "unfurnishedOnly" },
    { value: "furnished", key: "furnishedOnly" },
    { value: "all", key: "allFurnishing" },
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
    typeCounts = null,
    selectedCategory = "All Properties",
    onCategoryChange,
    selectedListingType = "All",
    onListingTypeChange,
    selectedRentalPeriod = "All",
    onRentalPeriodChange,
    selectedCity = "All Cities",
    onCityChange,
    selectedFurnishing = DEFAULT_FURNISHING,
    onFurnishingChange,
    selectedStatus = DEFAULT_STATUS,
    onStatusChange,
}) {
    const { t, i18n } = useTranslation();

    const isForRent = selectedListingType === "For Rent";

    const getCategoryCount = (category) => {
        // Counts from the server (same filters, all pages).
        if (typeCounts) {
            return category === "All Properties"
                ? typeCounts.all ?? 0
                : typeCounts[normalize(category)] ?? 0;
        }

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
        if (!city || city === "All Cities" || city.en === "All Cities") {
            return t("properties.filter.allCities");
        }

        return i18n.resolvedLanguage === "ar"
            ? city.ar
            : city.en;
    };

    const handleClearFilters = () => {
        onListingTypeChange?.("All");
        onRentalPeriodChange?.("All");
        onCityChange?.("All Cities");
        onCategoryChange?.("All Properties");
        onFurnishingChange?.(DEFAULT_FURNISHING);
        onStatusChange?.(DEFAULT_STATUS);
    };

    const activeCount =
        (selectedCategory !== "All Properties" ? 1 : 0) +
        (selectedListingType !== "All" ? 1 : 0) +
        (isForRent && selectedRentalPeriod !== "All" ? 1 : 0) +
        (selectedCity !== "All Cities" ? 1 : 0) +
        (onFurnishingChange && selectedFurnishing !== DEFAULT_FURNISHING ? 1 : 0) +
        (onStatusChange && selectedStatus !== DEFAULT_STATUS ? 1 : 0);

    const allCitiesOption = { en: "All Cities", ar: "جميع المدن" };

    return (
        <FilterPanel
            title={t("properties.filter.title")}
            activeCount={activeCount}
            onClear={handleClearFilters}
            clearLabel={t("properties.filter.clearFilters")}
        >
            <FilterChips
                label={t("properties.filter.categoriesAriaLabel", "Property type")}
                value={selectedCategory}
                onChange={(value) => onCategoryChange?.(value)}
                options={categories.map((category) => ({
                    value: category.value,
                    label: t(`properties.categories.${category.key}`),
                    count: getCategoryCount(category.value),
                }))}
            />

            <FilterGrid>
                <FilterSelect
                    label={t("properties.filter.transactionType")}
                    value={selectedListingType}
                    onChange={(value) => {
                        onListingTypeChange?.(value);
                        if (value !== "For Rent") onRentalPeriodChange?.("All");
                    }}
                    options={transactionTypes.map((type) => ({
                        value: type.value,
                        label: t(`properties.filter.${type.key}`),
                    }))}
                />

                {isForRent && (
                    <FilterSelect
                        label={t("properties.filter.rentalPeriod")}
                        value={selectedRentalPeriod}
                        onChange={(value) => onRentalPeriodChange?.(value)}
                        options={rentalPeriods.map((period) => ({
                            value: period.value,
                            label: t(`properties.filter.${period.key}`),
                        }))}
                    />
                )}

                {onStatusChange && (
                    <FilterSelect
                        label={t("properties.filter.status")}
                        value={selectedStatus}
                        onChange={(value) => onStatusChange(value)}
                        options={statusOptions.map((value) => ({
                            value,
                            label: t(`properties.filter.statuses.${value}`),
                        }))}
                    />
                )}

                {onFurnishingChange && (
                    <FilterSelect
                        label={t("properties.filter.furnishing")}
                        value={selectedFurnishing}
                        onChange={(value) => onFurnishingChange(value)}
                        options={furnishingOptions.map((option) => ({
                            value: option.value,
                            label: t(`properties.filter.${option.key}`),
                        }))}
                    />
                )}

                <Autocomplete
                    size="small"
                    options={[allCitiesOption, ...moroccanCities]}
                    value={moroccanCities.find((city) => city.en === selectedCity) || allCitiesOption}
                    onChange={(_event, newValue) => onCityChange?.(newValue?.en || "All Cities")}
                    getOptionLabel={getCityLabel}
                    isOptionEqualToValue={(option, value) => option.en === value.en}
                    sx={filterFieldSx}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t("properties.filter.city")}
                            placeholder={t("properties.filter.searchCity")}
                        />
                    )}
                />
            </FilterGrid>
        </FilterPanel>
    );
}
