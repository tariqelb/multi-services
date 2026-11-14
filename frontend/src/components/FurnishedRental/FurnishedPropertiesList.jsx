


import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Pagination,
    Stack,
    Typography,
} from "@mui/material";

import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";

import PropertyCard from "../properties/PropertyCard";
import FurnishedCategoryBar from "./FurnishedCategoryBar";
import axiosInstance from "../../api/axiosInstance";

const ITEMS_PER_PAGE = 9;

const ALLOWED_PROPERTY_TYPES = [
    "Villa",
    "Studio",
    "Room",
    "Apartment",
    "House",
];

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const isFurnished = (value) => {
    const furnishing = normalize(value);

    return [
        "furnished",
        "fully furnished",
        "furnished property",
    ].includes(furnishing);
};

export default function FurnishedPropertyList({
    refreshTrigger = 0,
    onSelectProperty,
    listRef,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] =
        useState("All");

    const [selectedRentalPeriod, setSelectedRentalPeriod] =
        useState("All");

    const [page, setPage] = useState(1);

    const translate = (key, fallback, options = {}) =>
        t(key, {
            ...options,
            defaultValue: fallback,
        });

    const currentLanguage = i18n.resolvedLanguage || "en";

    const localeMap = {
        en: "en-GB",
        fr: "fr-FR",
        ar: "ar-MA",
    };

    const currentLocale =
        localeMap[currentLanguage] || "en-GB";

    // Handle navigation back to the listing page.
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
                            translate(
                                "properties.list.fetchError",
                                "Unable to load properties."
                            )
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

    // Base collection: furnished properties for rent only.
    const furnishedProperties = useMemo(() => {
        return properties.filter((property) => {
            const isForRent =
                normalize(property.listingType) === "for rent";

            const hasAllowedType =
                ALLOWED_PROPERTY_TYPES.some(
                    (type) =>
                        normalize(type) ===
                        normalize(property.propertyType)
                );

            return (
                isForRent &&
                hasAllowedType &&
                isFurnished(property.furnishingStatus)
            );
        });
    }, [properties]);

    // Apply the selected property type and rental period.
    const filteredProperties = useMemo(() => {
        return furnishedProperties.filter((property) => {
            const matchesCategory =
                selectedCategory === "All" ||
                normalize(property.propertyType) ===
                    normalize(selectedCategory);

            const matchesRentalPeriod =
                selectedRentalPeriod === "All" ||
                normalize(property.rentalPeriod) ===
                    normalize(selectedRentalPeriod);

            return matchesCategory && matchesRentalPeriod;
        });
    }, [
        furnishedProperties,
        selectedCategory,
        selectedRentalPeriod,
    ]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    const handleRentalPeriodChange = (period) => {
        setSelectedRentalPeriod(period);
        setPage(1);
    };

    const clearFilters = () => {
        setSelectedCategory("All");
        setSelectedRentalPeriod("All");
        setPage(1);
    };

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
        filteredProperties.length / ITEMS_PER_PAGE
    );

    const displayedProperties = filteredProperties.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const hasActiveFilters =
        selectedCategory !== "All" ||
        selectedRentalPeriod !== "All";

    const getCategoryLabel = () => {
        if (selectedCategory === "All") {
            return translate(
                "properties.furnished.listingsTitle",
                "Available furnished properties"
            );
        }

        return translate(
            "properties.list.categoryTitle",
            "{{category}} rentals",
            {
                category: translate(
                    `properties.categories.${selectedCategory.toLowerCase()}`,
                    selectedCategory
                ),
            }
        );
    };

    // Loading state.
    if (loading) {
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

                <Typography variant="body2" color="text.secondary">
                    {translate(
                        "properties.list.loading",
                        "Loading properties..."
                    )}
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
            {/* Page heading */}
            <Box
                sx={{
                    mb: {
                        xs: 2.5,
                        sm: 3,
                    },
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                >
                    <Box
                        sx={{
                            width: 46,
                            height: 46,
                            flexShrink: 0,
                            borderRadius: "13px",
                            bgcolor: "#E8F1FF",
                            color: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <HomeWorkOutlinedIcon fontSize="medium" />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                color: "#0F172A",
                                fontSize: {
                                    xs: "1.3rem",
                                    sm: "1.55rem",
                                    md: "1.75rem",
                                },
                            }}
                        >
                            {translate(
                                "properties.furnished.title",
                                "Furnished Rentals"
                            )}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: "#64748B",
                                mt: 0.5,
                            }}
                        >
                            {translate(
                                "properties.furnished.subtitle",
                                "Find furnished villas, studios, rooms, apartments and houses for daily or monthly rent."
                            )}
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* New category bar */}
            <Box
                sx={{
                    width: "100%",
                    minWidth: 0,
                    mb: {
                        xs: 2.5,
                        sm: 3,
                    },
                }}
            >
                <FurnishedCategoryBar
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    selectedRentalPeriod={selectedRentalPeriod}
                    onRentalPeriodChange={handleRentalPeriodChange}
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
                    mb: {
                        xs: 2,
                        sm: 3,
                    },
                    minWidth: 0,
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            color: "#0F172A",
                            fontSize: {
                                xs: "1.15rem",
                                sm: "1.35rem",
                            },
                        }}
                    >
                        {getCategoryLabel()}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#64748B",
                            mt: 0.5,
                        }}
                    >
                        {translate(
                            "properties.list.propertyCount",
                            "{{count}} properties found",
                            {
                                count: filteredProperties.length,
                            }
                        )}
                    </Typography>
                </Box>

                {hasActiveFilters && (
                    <Button
                        size="small"
                        onClick={clearFilters}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        {translate(
                            "properties.list.clearFilters",
                            "Clear filters"
                        )}
                    </Button>
                )}
            </Box>

            {/* Empty state */}
            {filteredProperties.length === 0 ? (
                <Box
                    sx={{
                        py: { xs: 4, sm: 6 },
                        px: { xs: 1.5, sm: 2 },
                        textAlign: "center",
                        border: "1px dashed #D1D5DB",
                        borderRadius: "16px",
                        backgroundColor: "#FFFFFF",
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
                        {translate(
                            "properties.furnished.emptyTitle",
                            "No furnished rentals found"
                        )}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#64748B",
                            mb: 2,
                        }}
                    >
                        {translate(
                            "properties.furnished.emptyDescription",
                            "Try selecting another property type or rental period."
                        )}
                    </Typography>

                    {hasActiveFilters && (
                        <Button
                            variant="outlined"
                            onClick={clearFilters}
                            sx={{ textTransform: "none" }}
                        >
                            {translate(
                                "properties.list.clearFilters",
                                "Clear filters"
                            )}
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    {/* Property cards */}
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                mt: { xs: 3, sm: 5 },
                                width: "100%",
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