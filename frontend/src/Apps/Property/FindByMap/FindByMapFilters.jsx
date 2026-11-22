import React from "react";
import { useTranslation } from "react-i18next";

import {
    FilterField,
    FilterGrid,
    FilterPanel,
    FilterSelect,
} from "../../../Components/ui/FilterKit";

const ESTABLISHMENT_TYPES = [
    "Hotel",
    "Riad",
    "Guesthouse",
    "Hostel",
    "Aparthotel",
    "Other",
];

export default function FindByMapFilters({
    filters,
    setFilters,
    cities,
    propertyTypes,
}) {
    const { t } = useTranslation();

    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const handleChange = (field, value) => {
        setFilters((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleListingChange = (value) => {
        setFilters((previous) => ({
            ...previous,
            listingType: value,
            rentalType:
                value === "For Rent"
                    ? previous.rentalType || "All"
                    : "All",
        }));
    };

    const defaults = {
        city: "All",
        propertyType: "All",
        accommodationType: "All",
        listingType: "All",
        rentalType: "All",
        maxPrice: "",
    };

    const activeCount = Object.keys(defaults).filter(
        (key) => (filters[key] ?? defaults[key]) !== defaults[key]
    ).length;

    return (
        <FilterPanel
            activeCount={activeCount}
            onClear={() => setFilters((previous) => ({ ...previous, ...defaults }))}
            sx={{ mb: 0 }}
        >
            <FilterGrid min={170}>
                <FilterSelect
                    label={translate("findMap.filters.city", "City")}
                    value={filters.city}
                    onChange={(value) => handleChange("city", value)}
                    options={[
                        { value: "All", label: translate("findMap.filters.allMorocco", "All Morocco") },
                        ...cities.map((city) => ({ value: city, label: city })),
                    ]}
                />

                <FilterSelect
                    label={translate("findMap.filters.propertyType", "Property type")}
                    value={filters.propertyType}
                    onChange={(value) => handleChange("propertyType", value)}
                    options={[
                        { value: "All", label: translate("findMap.filters.allTypes", "All types") },
                        ...propertyTypes.map((type) => ({
                            value: type,
                            label: t(`findMap.propertyTypes.${type.toLowerCase()}`, { defaultValue: type }),
                        })),
                    ]}
                />

                <FilterSelect
                    label={translate("findMap.filters.establishmentType", "Establishment type")}
                    value={filters.accommodationType || "All"}
                    onChange={(value) => handleChange("accommodationType", value)}
                    options={[
                        { value: "All", label: translate("findMap.filters.allEstablishments", "All establishments") },
                        ...ESTABLISHMENT_TYPES.map((type) => ({
                            value: type,
                            label: t(`findMap.accommodationTypes.${type.toLowerCase()}`, { defaultValue: type }),
                        })),
                    ]}
                />

                <FilterSelect
                    label={translate("findMap.filters.listing", "Listing")}
                    value={filters.listingType}
                    onChange={handleListingChange}
                    options={[
                        { value: "All", label: translate("findMap.filters.allListings", "All listings") },
                        { value: "For Sale", label: translate("findMap.filters.forSale", "For Sale") },
                        { value: "For Rent", label: translate("findMap.filters.forRent", "For Rent") },
                    ]}
                />

                {filters.listingType === "For Rent" && (
                    <FilterSelect
                        label={translate("findMap.filters.rentalType", "Rental type")}
                        value={filters.rentalType || "All"}
                        onChange={(value) => handleChange("rentalType", value)}
                        options={[
                            { value: "All", label: translate("findMap.filters.allRentals", "All rentals") },
                            { value: "Property", label: translate("findMap.filters.regularRental", "Regular rent") },
                            { value: "Roommate", label: translate("findMap.filters.roommate", "Roommate") },
                        ]}
                    />
                )}

                <FilterField
                    type="number"
                    label={translate("findMap.filters.maximumPrice", "Maximum price (MAD)")}
                    value={filters.maxPrice}
                    onChange={(value) => handleChange("maxPrice", value)}
                />
            </FilterGrid>
        </FilterPanel>
    );
}
