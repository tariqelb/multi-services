
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Pagination,
    Button,
    Stack,
} from "@mui/material";

import PropertyCategoryBar from "./PropertyCategoryBar";
import axiosInstance from "../api/axiosInstance";
import UserProfilePropertyCard from "./UserProfilePropertyCard";

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

export default function ProfilePropertyList({
    refreshTrigger = 0,
    onSelectProperty,
    listRef,
}) {
    const { t } = useTranslation();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] =
        useState("All Properties");

    const [selectedListingType, setSelectedListingType] =
        useState("All");

    const [selectedRentalPeriod, setSelectedRentalPeriod] =
        useState("All");

    const [selectedCity, setSelectedCity] =
        useState("All Cities");

    const [page, setPage] = useState(1);

    const itemsPerPage = 5;

    // Fetch properties published by the logged-in user.
    useEffect(() => {
        let cancelled = false;

        const fetchUserProperties = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axiosInstance.get(
                    "/property/user-listings"
                );

                const data = response.data;

                const propertyList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.properties)
                        ? data.properties
                        : [];

                if (!cancelled) {
                    setProperties(propertyList);
                    setPage(1);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            err.message ||
                            t("properties.profileList.fetchError")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchUserProperties();

        return () => {
            cancelled = true;
        };
    }, [refreshTrigger, t]);

    // Delete a property.
    const handleDeleteProperty = async (propertyId) => {
        try {
            await axiosInstance.delete(
                `/property/deleteProperty/${propertyId}`
            );

            setProperties((prev) =>
                prev.filter(
                    (property) =>
                        (property._id || property.id) !== propertyId
                )
            );

            setPage(1);
        } catch (err) {
            alert(
                err.response?.data?.message ||
                    t("properties.profileList.deleteError")
            );
        }
    };

    // Category filter.
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    // Transaction filter.
    const handleListingTypeChange = (listingType) => {
        setSelectedListingType(listingType);

        // Rental period only applies to rental properties.
        if (listingType !== "For Rent") {
            setSelectedRentalPeriod("All");
        }

        setPage(1);
    };

    // Rental period filter.
    const handleRentalPeriodChange = (rentalPeriod) => {
        setSelectedRentalPeriod(rentalPeriod);
        setPage(1);
    };

    // City filter.
    const handleCityChange = (city) => {
        setSelectedCity(city);
        setPage(1);
    };

    // Apply all filters.
    const filteredProperties = properties.filter((property) => {
        const matchesCategory =
            selectedCategory === "All Properties" ||
            normalize(property.propertyType) ===
                normalize(selectedCategory);

        const matchesListingType =
            selectedListingType === "All" ||
            normalize(property.listingType) ===
                normalize(selectedListingType);

        const matchesRentalPeriod =
            selectedListingType !== "For Rent" ||
            selectedRentalPeriod === "All" ||
            normalize(property.rentalPeriod) ===
                normalize(selectedRentalPeriod);

        const matchesCity =
            selectedCity === "All Cities" ||
            normalizeCity(property.city) ===
                normalizeCity(selectedCity);

        return (
            matchesCategory &&
            matchesListingType &&
            matchesRentalPeriod &&
            matchesCity
        );
    });

    const handleClearFilters = () => {
        setSelectedCategory("All Properties");
        setSelectedListingType("All");
        setSelectedRentalPeriod("All");
        setSelectedCity("All Cities");
        setPage(1);
    };

    const hasActiveFilters =
        selectedCategory !== "All Properties" ||
        selectedListingType !== "All" ||
        selectedRentalPeriod !== "All" ||
        selectedCity !== "All Cities";

    const handlePageChange = (_event, value) => {
        setPage(value);

        if (listRef?.current) {
            listRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const totalPages = Math.ceil(
        filteredProperties.length / itemsPerPage
    );

    const displayedProperties = filteredProperties.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Translate category labels without changing stored values.
    const getCategoryLabel = (category) => {
        if (category === "All Properties") {
            return t("properties.profileList.allProperties");
        }

        const categoryKey = {
            "commercial space": "commercialSpace",
            "commercial store": "commercialStore",
        }[category.toLowerCase()] ||
            category
                .toLowerCase()
                .replace(/[^a-z0-9]+(.)/g, (_, char) =>
                    char.toUpperCase()
                );

        return t(`properties.categories.${categoryKey}`, {
            defaultValue: category,
        });
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 8,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const categoryLabel = getCategoryLabel(selectedCategory);

    return (
        <Box
            ref={listRef}
            sx={{
                scrollMarginTop: "0px",
                width: "100%",
                maxWidth: "100%",
                mx: "auto",
                p: { xs: 2, md: 4 },
            }}
        >
            {/* All property filters */}
            <PropertyCategoryBar
                properties={properties}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                selectedListingType={selectedListingType}
                onListingTypeChange={handleListingTypeChange}
                selectedRentalPeriod={selectedRentalPeriod}
                onRentalPeriodChange={handleRentalPeriodChange}
                selectedCity={selectedCity}
                onCityChange={handleCityChange}
            />

            {/* Listings heading */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 3,
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "#0F172A",
                    }}
                >
                    {selectedCategory === "All Properties"
                        ? t("properties.profileList.myPublications")
                        : t("properties.profileList.categoryPublications", {
                              category: categoryLabel,
                          })}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#5B6577", fontWeight: 600 }}
                >
                    {t("properties.list.propertyCount", {
                        count: filteredProperties.length,
                    })}
                </Typography>
            </Box>

            {/* Empty state */}
            {filteredProperties.length === 0 ? (
                <Box
                    sx={{
                        py: 6,
                        textAlign: "center",
                        border: "1px dashed #d1d5db",
                        borderRadius: "16px",
                        backgroundColor: "#F4F7FB",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#374151",
                            mb: 1,
                        }}
                    >
                        {selectedCategory === "All Properties" &&
                        selectedListingType === "All" &&
                        selectedRentalPeriod === "All" &&
                        selectedCity === "All Cities"
                            ? t("properties.profileList.noProperties")
                            : t("properties.list.emptyTitle")}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#5B6577", mb: 2 }}
                    >
                        {t("properties.profileList.emptySubtitle")}
                    </Typography>

                    {hasActiveFilters && (
                        <Button
                            variant="outlined"
                            onClick={handleClearFilters}
                            sx={{ textTransform: "none" }}
                        >
                            {t("properties.filter.clearFilters")}
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    <Stack spacing={2.5}>
                        {displayedProperties.map((property) => {
                            const formattedProperty = {
                                ...property,
                                rentalPeriod: property.rentalPeriod || null,
                                furnishingStatus:
                                    property.furnishingStatus || null,
                            };

                            return (
                                <UserProfilePropertyCard
                                    key={property._id || property.id}
                                    property={formattedProperty}
                                    onViewDetails={
                                        onSelectProperty
                                            ? (prop) => onSelectProperty(prop)
                                            : undefined
                                    }
                                    onDelete={handleDeleteProperty}
                                />
                            );
                        })}
                    </Stack>

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
        </Box>
    );
}
