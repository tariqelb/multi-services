import React from "react";
import { useTranslation } from "react-i18next";

import { FilterChips, FilterPanel } from "../../../Components/ui/FilterKit";

import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import VillaOutlinedIcon from "@mui/icons-material/VillaOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

const categories = [
    {
        value: "All",
        key: "all",
        icon: HomeWorkOutlinedIcon,
    },
    {
        value: "Villa",
        key: "villa",
        icon: VillaOutlinedIcon,
    },
    {
        value: "Studio",
        key: "studio",
        icon: ApartmentOutlinedIcon,
    },
    {
        value: "Room",
        key: "room",
        icon: MeetingRoomOutlinedIcon,
    },
    {
        value: "Apartment",
        key: "apartment",
        icon: ApartmentOutlinedIcon,
    },
    {
        value: "House",
        key: "house",
        icon: HomeWorkOutlinedIcon,
    },
];

const rentalPeriods = [
    { value: "All", key: "allPeriods" },
    { value: "Daily", key: "daily" },
    { value: "Monthly", key: "monthly" },
];

export default function FurnishedCategoryBar({
    selectedCategory = "All",
    onCategoryChange,
    selectedRentalPeriod = "All",
    onRentalPeriodChange,
}) {
    const { t } = useTranslation();

    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const handleClearFilters = () => {
        onCategoryChange?.("All");
        onRentalPeriodChange?.("All");
    };

    const hasActiveFilters =
        selectedCategory !== "All" ||
        selectedRentalPeriod !== "All";

    const activeCount =
        (selectedCategory !== "All" ? 1 : 0) + (selectedRentalPeriod !== "All" ? 1 : 0);

    return (
        <FilterPanel
            title={translate("properties.furnished.filterTitle", "Find furnished accommodation")}
            activeCount={activeCount}
            onClear={hasActiveFilters ? handleClearFilters : handleClearFilters}
            clearLabel={translate("properties.filter.clearFilters", "Clear filters")}
        >
            <FilterChips
                label={translate("properties.furnished.propertyType", "Property type")}
                value={selectedCategory}
                onChange={(value) => onCategoryChange?.(value)}
                options={categories.map((category) => {
                    const Icon = category.icon;
                    return {
                        value: category.value,
                        icon: <Icon />,
                        label: translate(
                            `properties.categories.${category.key}`,
                            category.value === "All" ? "All" : category.value
                        ),
                    };
                })}
            />

            <FilterChips
                label={translate("properties.furnished.rentalPeriod", "Rental period")}
                value={selectedRentalPeriod}
                onChange={(value) => onRentalPeriodChange?.(value)}
                options={rentalPeriods.map((period) => ({
                    value: period.value,
                    icon: <CalendarMonthOutlinedIcon />,
                    label: translate(
                        `properties.furnished.${period.key}`,
                        period.value === "All" ? "All periods" : period.value
                    ),
                }))}
            />
        </FilterPanel>
    );
}
