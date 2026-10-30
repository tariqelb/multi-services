import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Pagination,
    Button,
} from "@mui/material";

import PropertyCard from "./PropertyCard";
import PropertyCategoryBar from "./PropertyCategoryBar";
import axiosInstance from "../api/axiosInstance";

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

export default function PropertyList({
    refreshTrigger = 0,
    onSelectProperty,
    listRef,
    selectedCategory: externalCategory,
    onCategoryChange: externalOnCategoryChange,
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [internalCategory, setInternalCategory] =
        useState("All Properties");

    const [selectedListingType, setSelectedListingType] =
        useState("All");

    const [selectedCity, setSelectedCity] =
        useState("All Cities");

    const [page, setPage] = useState(1);

    const itemsPerPage = 9;

    const selectedCategory =
        externalCategory !== undefined
            ? externalCategory
            : internalCategory;

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

    // Fetch properties from the backend.
    useEffect(() => {
        let cancelled = false;

        const fetchProperties = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axiosInstance.get(
                    "/property/getlist"
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
                            "Failed to fetch properties"
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
    }, [refreshTrigger]);

    // Filter by property type, transaction type, and city.
    const filteredProperties = properties.filter((property) => {
        const matchesCategory =
            selectedCategory === "All Properties" ||
            normalize(property.propertyType) ===
                normalize(selectedCategory);

        const matchesListingType =
            selectedListingType === "All" ||
            normalize(property.listingType) ===
                normalize(selectedListingType);

        const matchesCity =
            selectedCity === "All Cities" ||
            normalizeCity(property.city) ===
                normalizeCity(selectedCity);

        return (
            matchesCategory &&
            matchesListingType &&
            matchesCity
        );
    });

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
        setPage(1);
    };

    const handleCityChange = (city) => {
        setSelectedCity(city);
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
        onSelectProperty?.(property);
    };

    const totalPages = Math.ceil(
        filteredProperties.length / itemsPerPage
    );

    const displayedProperties = filteredProperties.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    const hasActiveFilters =
        selectedCategory !== "All Properties" ||
        selectedListingType !== "All" ||
        selectedCity !== "All Cities";

    const clearFilters = () => {
        handleCategoryChange("All Properties");
        handleListingTypeChange("All");
        handleCityChange("All Cities");
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: { xs: 5, sm: 8 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    p: { xs: 2, sm: 4 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                }}
            >
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box
            ref={listRef}
            sx={{
                p: {
                    xs: 1.5,
                    sm: 2.5,
                    md: 4,
                },
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                boxSizing: "border-box",
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
                    properties={properties}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    selectedListingType={selectedListingType}
                    onListingTypeChange={handleListingTypeChange}
                    selectedCity={selectedCity}
                    onCityChange={handleCityChange}
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
                        color: "#1f2937",
                        fontSize: {
                            xs: "1.2rem",
                            sm: "1.4rem",
                            md: "1.5rem",
                        },
                        overflowWrap: "anywhere",
                    }}
                >
                    {selectedCategory === "All Properties"
                        ? "Property Listings"
                        : `${selectedCategory} Listings`}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: "#6b7280",
                        flexShrink: 0,
                    }}
                >
                    {filteredProperties.length}{" "}
                    {filteredProperties.length === 1
                        ? "property"
                        : "properties"}
                </Typography>
            </Box>

            {/* Empty state */}
            {filteredProperties.length === 0 ? (
                <Box
                    sx={{
                        py: { xs: 4, sm: 6 },
                        px: { xs: 1.5, sm: 2 },
                        textAlign: "center",
                        border: "1px dashed #d1d5db",
                        borderRadius: 3,
                        backgroundColor: "#fafafa",
                        width: "100%",
                        boxSizing: "border-box",
                        overflowWrap: "anywhere",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#374151",
                            mb: 1,
                            fontSize: {
                                xs: "1rem",
                                sm: "1.25rem",
                            },
                        }}
                    >
                        No properties found
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#6b7280",
                            mb: 2,
                        }}
                    >
                        Try changing the property type, transaction
                        type, or city.
                    </Typography>

                    {hasActiveFilters && (
                        <Button
                            variant="outlined"
                            onClick={clearFilters}
                            sx={{ textTransform: "none" }}
                        >
                            Clear Filters
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
                        }}
                    >
                        {displayedProperties.map((property) => {
                            const imagePath =
                                property.images?.[0]?.path;

                            const fullImageUrl = imagePath
                                ? /^https?:\/\//i.test(imagePath)
                                    ? imagePath
                                    : `http://localhost:3000${
                                          imagePath.startsWith("/")
                                              ? ""
                                              : "/"
                                      }${imagePath}`
                                : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500";

                            const formattedProperty = {
                                ...property,
                                title: property.title,
                                status: property.status || "Available",
                                price:
                                    property.price != null
                                        ? `${Number(
                                              property.price
                                          ).toLocaleString()} MAD`
                                        : "0 MAD",
                                image: fullImageUrl,
                                listingType: property.listingType,
                                propertyType: property.propertyType,
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
                                      ).toLocaleDateString("en-GB")
                                    : "",
                            };

                            return (
                                <Box
                                    key={property._id}
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
                                            handleSelectProperty(property)
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
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}