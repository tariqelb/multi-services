
import React from "react";
import { useTranslation } from "react-i18next";

import {
    FilterChips,
    FilterGrid,
    FilterPanel,
    FilterSearch,
    FilterSelect,
} from "../../../Components/ui/FilterKit";

import cities from "../../../data/moroccanCities";

const purposes = [
    "All",
    "Share My Property",
    "Find a Room",
    "Rent Together",
];

const propertyTypes = [
    "All",
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Other",
];

const rentalPeriods = ["All", "Daily", "Monthly"];

export default function RoommateCategoryBar({
    selectedPurpose,
    onPurposeChange,
    selectedPropertyType,
    onPropertyTypeChange,
    selectedRentalPeriod,
    onRentalPeriodChange,
    city,
    onCityChange,
    search,
    onSearchChange,
    onClearFilters,
}) {
    const { t, i18n } = useTranslation();

    const isArabic = i18n.language?.startsWith("ar");

    const getPurposeLabel = (purpose) => {
        if (purpose === "All") {
            return t("roommates.filters.allPurposes", {
                defaultValue: "All announcements",
            });
        }

        const purposeKeys = {
            "Share My Property": "shareMyProperty",
            "Find a Room": "findARoom",
            "Rent Together": "rentTogether",
        };

        return t(
            `roommates.purpose.${purposeKeys[purpose] || purpose}`,
            { defaultValue: purpose }
        );
    };

    const getPropertyTypeLabel = (type) => {
        if (type === "All") {
            return t("roommates.filters.allPropertyTypes", {
                defaultValue: "All property types",
            });
        }

        return t(`roommates.properties.types.${type.toLowerCase()}`, {
            defaultValue: type,
        });
    };

    const orAll = (value) => (value ? value : "All");
    const isSet = (value) => Boolean(value) && value !== "All";

    const activeCount =
        [selectedPurpose, selectedPropertyType, selectedRentalPeriod, city].filter(isSet).length +
        (search?.trim() ? 1 : 0);

    return (
        <FilterPanel
            title={t("ui.filters.title", "Filters")}
            activeCount={activeCount}
            onClear={onClearFilters}
            clearLabel={t("roommates.filters.clear", { defaultValue: "Clear filters" })}
        >
            <FilterSearch
                value={search}
                onChange={(value) => onSearchChange(value)}
                placeholder={t("roommates.filters.search", { defaultValue: "Search announcements..." })}
            />

            <FilterChips
                label={t("roommates.filters.purpose", { defaultValue: "Announcement type" })}
                value={orAll(selectedPurpose)}
                onChange={(value) => onPurposeChange(value)}
                options={purposes.map((purpose) => ({ value: purpose, label: getPurposeLabel(purpose) }))}
            />

            <FilterGrid>
                <FilterSelect
                    label={t("roommates.filters.propertyType", { defaultValue: "Property type" })}
                    value={orAll(selectedPropertyType)}
                    onChange={(value) => onPropertyTypeChange(value)}
                    options={propertyTypes.map((type) => ({ value: type, label: getPropertyTypeLabel(type) }))}
                />

                <FilterSelect
                    label={t("roommates.filters.rentalPeriod", { defaultValue: "Rental period" })}
                    value={orAll(selectedRentalPeriod)}
                    onChange={(value) => onRentalPeriodChange(value)}
                    options={rentalPeriods.map((period) => ({
                        value: period,
                        label:
                            period === "All"
                                ? t("roommates.filters.allPeriods", { defaultValue: "All periods" })
                                : t(`roommates.properties.rentalPeriod.${period.toLowerCase()}`, {
                                    defaultValue: period,
                                }),
                    }))}
                />

                <FilterSelect
                    label={t("roommates.filters.city", { defaultValue: "City" })}
                    value={city || ""}
                    onChange={(value) => onCityChange(value)}
                    options={[
                        { value: "", label: t("roommates.filters.allCities", { defaultValue: "All cities" }) },
                        ...cities.map((cityItem) => ({
                            value: cityItem.en,
                            label: isArabic ? cityItem.ar : cityItem.en,
                        })),
                    ]}
                />
            </FilterGrid>
        </FilterPanel>
    );
}
