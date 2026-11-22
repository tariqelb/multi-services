import React, { useEffect, useState } from "react";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import getImageUrl from "../../../utils/getImageUrl";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Pagination,
    Button,
} from "@mui/material";

import PropertyCard from "./PropertyCard";
import PropertyCategoryBar, { DEFAULT_FURNISHING, DEFAULT_STATUS } from "./PropertyCategoryBar";
import axiosInstance from "../../../api/axiosInstance";

// Keep internal category values unchanged.
// Only their displayed labels are translated.
const categoryTranslationKeys = {
    "All Properties": "all",
    Apartment: "apartment",
    House: "house",
    Villa: "villa",
    Studio: "studio",
    Room: "room",
    Store: "store",
    Office: "office",
    Land: "land",
    Warehouse: "warehouse",
    "Commercial space": "commercialSpace",
    "Commercial store": "commercialStore",
    Garage: "garage",
    other: "other",
};

export default function PropertyList({
    refreshTrigger = 0,
    onSelectProperty,
    listRef,
    selectedCategory: externalCategory,
    onCategoryChange: externalOnCategoryChange,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [internalCategory, setInternalCategory] =
        useState("All Properties");

    const [selectedListingType, setSelectedListingType] =
        useState("All");

    const [selectedRentalPeriod, setSelectedRentalPeriod] =
        useState("All");

    const [selectedCity, setSelectedCity] =
        useState("All Cities");

    // Unfurnished by default; furnished rentals have their own page.
    const [selectedFurnishing, setSelectedFurnishing] =
        useState(DEFAULT_FURNISHING);

    // Available by default (sold / rented on demand, inactive never).
    const [selectedStatus, setSelectedStatus] = useState(DEFAULT_STATUS);

    const [page, setPage] = useState(1);

    const itemsPerPage = 9;

    const selectedCategory =
        externalCategory !== undefined
            ? externalCategory
            : internalCategory;

    const categoryKey =
        categoryTranslationKeys[selectedCategory];

    const translatedCategory = categoryKey
        ? t(`properties.categories.${categoryKey}`)
        : selectedCategory;

    const currentLanguage =
        i18n.resolvedLanguage || "en";

    const localeMap = {
        en: "en-GB",
        fr: "fr-FR",
        ar: "ar-MA",
    };

    const currentLocale =
        localeMap[currentLanguage] || "en-GB";

    // Handle navigation back to the top of the listing page.
    useEffect(() => {
        if (location.state?.scrollToTop) {
            window.scrollTo({
                top: 0,
                behavior: "auto",
            });

            navigate(location.pathname, {
                replace: true,
                state: null,
            });
        }
    }, [location, navigate]);

    const [total, setTotal] = useState(0);
    const [serverTotalPages, setServerTotalPages] = useState(0);
    const [typeCounts, setTypeCounts] = useState(null);

    // One page at a time, filtered by the server.
    // Furnished rentals are shown on their own page.
    useEffect(() => {
        let cancelled = false;

        const fetchProperties = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axiosInstance.get("/property/getlist", {
                    params: {
                        page,
                        limit: itemsPerPage,
                        furnishing: selectedFurnishing,
                        status: selectedStatus,
                        propertyType: selectedCategory,
                        listingType: selectedListingType,
                        rentalPeriod: selectedListingType === "For Rent" ? selectedRentalPeriod : "All",
                        city: selectedCity,
                    },
                });

                const data = response.data;

                const propertyList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.properties)
                      ? data.properties
                      : [];

                if (!cancelled) {
                    setProperties(propertyList);
                    setTotal(data?.pagination?.total ?? propertyList.length);
                    setServerTotalPages(data?.pagination?.totalPages ?? 1);
                    setTypeCounts(data?.typeCounts || null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            err.message ||
                            null
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchProperties();

        return () => {
            cancelled = true;
        };
    }, [refreshTrigger, page, selectedCategory, selectedListingType, selectedRentalPeriod, selectedCity, selectedFurnishing, selectedStatus]);

    // Already filtered and paged by the server.
    const generalProperties = properties;
    const filteredProperties = properties;

    const handleCategoryChange = (category) => {
        if (externalOnCategoryChange) {
            externalOnCategoryChange(category);
        } else {
            setInternalCategory(category);
        }

        setPage(1);
    };

    const handleListingTypeChange = (listingType) => {
        setSelectedListingType(listingType);

        // Rental period is only applicable to rental listings.
        if (listingType !== "For Rent") {
            setSelectedRentalPeriod("All");
        }

        setPage(1);
    };

    const handleRentalPeriodChange = (rentalPeriod) => {
        setSelectedRentalPeriod(rentalPeriod);
        setPage(1);
    };

    const handleCityChange = (city) => {
        setSelectedCity(city);
        setPage(1);
    };

    const handleFurnishingChange = (furnishing) => {
        setSelectedFurnishing(furnishing);
        setPage(1);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setPage(1);
    };

    useEffect(() => {
        setPage(1);
    }, [externalCategory]);

    const handlePageChange = (_event, value) => {
        setPage(value);

        if (listRef?.current) {
            listRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const handleSelectProperty = (property) => {
        if (!property) return;

        const propertyId = property._id || property.id;

        // Send click statistics without delaying navigation.
        if (propertyId) {
            axiosInstance
                .post(`/property/${propertyId}/click`)
                .catch((error) => {
                    console.error(
                        "Unable to track property click:",
                        error.message
                    );
                });
        }

        onSelectProperty?.(property);
    };

    const totalPages = serverTotalPages;
    const displayedProperties = filteredProperties;

    const hasActiveFilters =
        selectedCategory !== "All Properties" ||
        selectedListingType !== "All" ||
        selectedRentalPeriod !== "All" ||
        selectedCity !== "All Cities" ||
        selectedFurnishing !== DEFAULT_FURNISHING ||
        selectedStatus !== DEFAULT_STATUS;

    const clearFilters = () => {
        handleCategoryChange("All Properties");
        handleListingTypeChange("All");
        handleRentalPeriodChange("All");
        handleCityChange("All Cities");
        handleFurnishingChange(DEFAULT_FURNISHING);
        handleStatusChange(DEFAULT_STATUS);
    };

    // Loading state (first load only: later pages keep the filters visible).
    if (loading && typeCounts === null) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    py: { xs: 5, sm: 8 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                }}
            >
                <CircularProgress />

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {t("properties.list.loading")}
                </Typography>
            </Box>
        );
    }

    // Error state.
    if (error !== null) {
        return (
            <Box
                sx={{
                    p: { xs: 2, sm: 4 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                }}
            >
                <Alert severity="error">
                    {error || t("properties.list.fetchError")}
                </Alert>
            </Box>
        );
    }

    return (
        <Box
            ref={listRef}
            sx={{
                ...pagePaddingSx,
                overflowX: "clip",
                scrollMarginTop: "80px",
            }}
        >
            {/* Property filters */}
            <Box
                sx={{
                    width: "100%",
                    minWidth: 0,
                    mb: { xs: 2.5, sm: 3 },
                }}
            >
                <PropertyCategoryBar
                    properties={generalProperties}
                    typeCounts={typeCounts}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    selectedListingType={selectedListingType}
                    onListingTypeChange={handleListingTypeChange}
                    selectedRentalPeriod={selectedRentalPeriod}
                    onRentalPeriodChange={handleRentalPeriodChange}
                    selectedCity={selectedCity}
                    onCityChange={handleCityChange}
                    selectedFurnishing={selectedFurnishing}
                    onFurnishingChange={handleFurnishingChange}
                    selectedStatus={selectedStatus}
                    onStatusChange={handleStatusChange}
                />
            </Box>

            {/* Listings heading */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: {
                        xs: "flex-start",
                        sm: "center",
                    },
                    flexWrap: "wrap",
                    gap: 1,
                    mb: { xs: 2, sm: 3 },
                    minWidth: 0,
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "#0F172A",
                        fontSize: {
                            xs: "1.2rem",
                            sm: "1.4rem",
                            md: "1.5rem",
                        },
                        overflowWrap: "anywhere",
                    }}
                >
                    {selectedCategory === "All Properties"
                        ? t("properties.list.title")
                        : t("properties.list.categoryTitle", {
                              category: translatedCategory,
                          })}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: "#64748B",
                        flexShrink: 0,
                    }}
                >
                    {t("properties.list.propertyCount", {
                        count: total,
                    })}
                </Typography>
            </Box>

            {/* Empty state */}
            {filteredProperties.length === 0 ? (
                <Box
                    sx={{
                        py: { xs: 4, sm: 6 },
                        px: { xs: 1.5, sm: 2 },
                        textAlign: "center",
                        border: "1px dashed #CBD5E1",
                        borderRadius: "16px",
                        backgroundColor: "#F5F7FB",
                        width: "100%",
                        boxSizing: "border-box",
                        overflowWrap: "anywhere",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#334155",
                            mb: 1,
                            fontSize: {
                                xs: "1rem",
                                sm: "1.25rem",
                            },
                        }}
                    >
                        {t("properties.list.emptyTitle")}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#64748B",
                            mb: 2,
                        }}
                    >
                        {t("properties.list.emptyDescription")}
                    </Typography>

                    {hasActiveFilters && (
                        <Button
                            variant="outlined"
                            onClick={clearFilters}
                            sx={{ textTransform: "none" }}
                        >
                            {t("properties.list.clearFilters")}
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    {/* Responsive property cards */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "minmax(0, 1fr)",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: {
                                xs: 2,
                                sm: 2.5,
                                md: 3,
                                lg: 4,
                            },
                            width: "100%",
                            maxWidth: "100%",
                            minWidth: 0,
                            alignItems: "stretch",
                            boxSizing: "border-box",
                            // Dim while the next page loads.
                            opacity: loading ? 0.55 : 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        {displayedProperties.map((property) => {
                            const imagePath =
                                property.images?.[0]?.path;

                            const fullImageUrl = imagePath
                                ? getImageUrl(imagePath)
                                : "";

                            const formattedProperty = {
                                ...property,
                                _id: property._id || property.id,
                                id: property.id || property._id,
                                title: property.title,
                                status: property.status || "Available",
                                price:
                                    property.price != null
                                        ? `${Number(
                                              property.price
                                          ).toLocaleString(currentLocale)} MAD`
                                        : "0 MAD",
                                image: fullImageUrl,
                                listingType: property.listingType,
                                propertyType: property.propertyType,
                                rentalPeriod: property.rentalPeriod || "",
                                furnishingStatus:
                                    property.furnishingStatus || "",
                                referenceCode: property._id
                                    ? `#${property._id.slice(-4)}`
                                    : "#48",
                                city: property.city,
                                neighborhood: property.neighborhood,
                                surface: property.surface,
                                rooms: property.rooms,
                                salons: property.salons,
                                bathrooms: property.bathrooms,
                                createdDate: property.createdAt
                                    ? new Date(
                                          property.createdAt
                                      ).toLocaleDateString(currentLocale)
                                    : "",
                            };

                            return (
                                <Box
                                    key={property._id || property.id}
                                    sx={{
                                        minWidth: 0,
                                        width: "100%",
                                        maxWidth: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        boxSizing: "border-box",
                                        "& > *": {
                                            width: "100%",
                                            minWidth: 0,
                                            maxWidth: "100%",
                                        },
                                    }}
                                >
                                    <PropertyCard
                                        property={formattedProperty}
                                        onClick={() =>
                                            handleSelectProperty(
                                                formattedProperty
                                            )
                                        }
                                    />
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Responsive pagination */}
                    {totalPages > 1 && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                mt: { xs: 3, sm: 5 },
                                px: 0,
                                width: "100%",
                                minWidth: 0,
                                overflowX: "auto",
                                "& .MuiPagination-ul": {
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                },
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
                                siblingCount={0}
                                boundaryCount={1}
                                getItemAriaLabel={(
                                    type,
                                    pageNumber,
                                    selected
                                ) => {
                                    if (type === "first") {
                                        return t(
                                            "properties.list.pagination.first"
                                        );
                                    }

                                    if (type === "last") {
                                        return t(
                                            "properties.list.pagination.last"
                                        );
                                    }

                                    if (type === "next") {
                                        return t(
                                            "properties.list.pagination.next"
                                        );
                                    }

                                    if (type === "previous") {
                                        return t(
                                            "properties.list.pagination.previous"
                                        );
                                    }

                                    return t(
                                        "properties.list.pagination.page",
                                        {
                                            page: pageNumber,
                                            selected: selected
                                                ? t(
                                                      "properties.list.pagination.current"
                                                  )
                                                : "",
                                        }
                                    );
                                }}
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}