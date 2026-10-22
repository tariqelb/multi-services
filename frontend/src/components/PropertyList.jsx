

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Box,
//     Typography,
//     CircularProgress,
//     Alert,
//     Pagination,
//     Button,
// } from "@mui/material";

// import PropertyCard from "./PropertyCard";
// import PropertyCategoryBar from "./PropertyCategoryBar";
// import axiosInstance from "../api/axiosInstance";
// import { useLocation } from "react-router-dom";

// export default function PropertyList({
//     refreshTrigger = 0,
//     onSelectProperty,
//     listRef,
//     selectedCategory: externalCategory,
//     onCategoryChange: externalOnCategoryChange,
// }) {
//     const navigate = useNavigate();

//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const [internalCategory, setInternalCategory] =
//         useState("All Properties");

//     // Use external category state if provided, otherwise fall back to internal.
//     const selectedCategory =
//         externalCategory !== undefined
//             ? externalCategory
//             : internalCategory;

//     const [page, setPage] = useState(1);
//     const itemsPerPage = 9;

//     const location = useLocation();

// useEffect(() => {
//     if (location.state?.scrollToTop) {
//         window.scrollTo({
//             top: 0,
//             behavior: "auto",
//         });

//         navigate(location.pathname, {
//             replace: true,
//             state: null,
//         });
//     }
// }, [location, navigate]);

//     // Fetch properties from the backend.
//     useEffect(() => {
//         let cancelled = false;

//         const fetchProperties = async () => {
//             setLoading(true);
//             setError(null);

//             try {
//                 const response = await axiosInstance.get(
//                     "/property/getlist"
//                 );

//                 const data = response.data;

//                 const propertyList = Array.isArray(data)
//                     ? data
//                     : Array.isArray(data?.properties)
//                         ? data.properties
//                         : [];

//                 if (!cancelled) {
//                     setProperties(propertyList);
//                     setPage(1);
//                 }
//             } catch (err) {
//                 if (!cancelled) {
//                     setError(
//                         err.response?.data?.message ||
//                             err.message ||
//                             "Failed to fetch properties"
//                     );
//                 }
//             } finally {
//                 if (!cancelled) {
//                     setLoading(false);
//                 }
//             }
//         };

//         fetchProperties();

//         return () => {
//             cancelled = true;
//         };
//     }, [refreshTrigger]);

//     // Filter properties by category.
//     const filteredProperties =
//         selectedCategory === "All Properties"
//             ? properties
//             : properties.filter(
//                   (property) =>
//                       property.propertyType?.toLowerCase() ===
//                       selectedCategory.toLowerCase()
//               );

//     // Change category and reset pagination.
//     const handleCategoryChange = (category) => {
//         if (externalOnCategoryChange) {
//             externalOnCategoryChange(category);
//         } else {
//             setInternalCategory(category);
//         }

//         setPage(1);
//     };

//     // Handle pagination.
//     const handlePageChange = (event, value) => {
//         setPage(value);

//         if (listRef?.current) {
//             listRef.current.scrollIntoView({
//                 behavior: "smooth",
//                 block: "start",
//             });
//         }
//     };

//     // Navigate to the selected property's details page.
//    const handleSelectProperty = (property) => {
//     if (!property) return;

//     onSelectProperty?.(property);
// };

//     const totalPages = Math.ceil(
//         filteredProperties.length / itemsPerPage
//     );

//     const displayedProperties = filteredProperties.slice(
//         (page - 1) * itemsPerPage,
//         page * itemsPerPage
//     );

//     if (loading) {
//         return (
//             <Box
//                 sx={{
//                     display: "flex",
//                     justifyContent: "center",
//                     py: 8,
//                 }}
//             >
//                 <CircularProgress />
//             </Box>
//         );
//     }

//     if (error) {
//         return (
//             <Box sx={{ p: 4 }}>
//                 <Alert severity="error">{error}</Alert>
//             </Box>
//         );
//     }

//     return (
//         <Box
//             ref={listRef}
//             sx={{
//                 p: { xs: 2, md: 4 },
//                 scrollMarginTop: "24px",
//             }}
//         >
//             {/* Property category filter */}
//             <PropertyCategoryBar
//                 properties={properties}
//                 selectedCategory={selectedCategory}
//                 onCategoryChange={handleCategoryChange}
//             />

//             {/* Listings heading */}
//             <Box
//                 sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     flexWrap: "wrap",
//                     gap: 1,
//                     mb: 3,
//                 }}
//             >
//                 <Typography
//                     variant="h5"
//                     sx={{
//                         fontWeight: 700,
//                         color: "#1f2937",
//                     }}
//                 >
//                     {selectedCategory === "All Properties"
//                         ? "Property Listings"
//                         : `${selectedCategory} Listings`}
//                 </Typography>

//                 <Typography
//                     variant="body2"
//                     sx={{ color: "#6b7280" }}
//                 >
//                     {filteredProperties.length}{" "}
//                     {filteredProperties.length === 1
//                         ? "property"
//                         : "properties"}
//                 </Typography>
//             </Box>

//             {/* Empty state */}
//             {filteredProperties.length === 0 ? (
//                 <Box
//                     sx={{
//                         py: 6,
//                         textAlign: "center",
//                         border: "1px dashed #d1d5db",
//                         borderRadius: 3,
//                         backgroundColor: "#fafafa",
//                     }}
//                 >
//                     <Typography
//                         variant="h6"
//                         sx={{
//                             fontWeight: 600,
//                             color: "#374151",
//                             mb: 1,
//                         }}
//                     >
//                         No{" "}
//                         {selectedCategory === "All Properties"
//                             ? ""
//                             : `${selectedCategory.toLowerCase()} `}
//                         properties found
//                     </Typography>

//                     <Typography
//                         variant="body2"
//                         sx={{ color: "#6b7280", mb: 2 }}
//                     >
//                         Try another category or check back later.
//                     </Typography>

//                     {selectedCategory !== "All Properties" && (
//                         <Button
//                             variant="outlined"
//                             onClick={() =>
//                                 handleCategoryChange("All Properties")
//                             }
//                             sx={{ textTransform: "none" }}
//                         >
//                             View all properties
//                         </Button>
//                     )}
//                 </Box>
//             ) : (
//                 <>
//                     {/* Property cards */}
//                     <Box
//                         sx={{
//                             display: "grid",
//                             gridTemplateColumns: {
//                                 xs: "1fr",
//                                 sm: "repeat(2, minmax(0, 1fr))",
//                                 lg: "repeat(3, minmax(0, 1fr))",
//                             },
//                             gap: { xs: 3, md: 4 },
//                             width: "100%",
//                             alignItems: "stretch",
//                         }}
//                     >
//                         {displayedProperties.map((property) => {
//                             const imagePath =
//                                 property.images?.[0]?.path;

//                             const fullImageUrl = imagePath
//                                 ? /^https?:\/\//i.test(imagePath)
//                                     ? imagePath
//                                     : `http://localhost:3000${
//                                           imagePath.startsWith("/")
//                                               ? ""
//                                               : "/"
//                                       }${imagePath}`
//                                 : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500";

//                             const formattedProperty = {
//                                 ...property,
//                                 title: property.title,
//                                 status: property.status || "Available",
//                                 price:
//                                     property.price != null
//                                         ? `${Number(
//                                               property.price
//                                           ).toLocaleString()} MAD`
//                                         : "0 MAD",
//                                 image: fullImageUrl,
//                                 listingType: property.listingType,
//                                 propertyType: property.propertyType,
//                                 referenceCode: property._id
//                                     ? `#${property._id.slice(-4)}`
//                                     : "#48",
//                                 city: property.city,
//                                 neighborhood: property.neighborhood,
//                                 surface: property.surface,
//                                 rooms: property.rooms,
//                                 salons: property.salons,
//                                 bathrooms: property.bathrooms,
//                                 createdDate: property.createdAt
//                                     ? new Date(
//                                           property.createdAt
//                                       ).toLocaleDateString("en-GB")
//                                     : "",
//                             };

//                             return (
//                                 <Box
//                                     key={property._id}
//                                     sx={{
//                                         minWidth: 0,
//                                         display: "flex",
//                                         justifyContent: "center",
//                                         "& > *": {
//                                             width: "100%",
//                                             minWidth: 0,
//                                         },
//                                     }}
//                                 >
//                                     <PropertyCard
//                                         property={formattedProperty}
//                                         onClick={() =>
//                                             handleSelectProperty(property)
//                                         }
//                                     />
//                                 </Box>
//                             );
//                         })}
//                     </Box>

//                     {/* Pagination */}
//                     {totalPages > 1 && (
//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 justifyContent: "center",
//                                 mt: 5,
//                             }}
//                         >
//                             <Pagination
//                                 count={totalPages}
//                                 page={page}
//                                 onChange={handlePageChange}
//                                 color="primary"
//                                 size="large"
//                                 showFirstButton
//                                 showLastButton
//                             />
//                         </Box>
//                     )}
//                 </>
//             )}
//         </Box>
//     );
// }

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

    // Change property type category.
    const handleCategoryChange = (category) => {
        if (externalOnCategoryChange) {
            externalOnCategoryChange(category);
        } else {
            setInternalCategory(category);
        }

        setPage(1);
    };

    // Change transaction type.
    const handleListingTypeChange = (listingType) => {
        setSelectedListingType(listingType);
        setPage(1);
    };

    // Change city.
    const handleCityChange = (city) => {
        setSelectedCity(city);
        setPage(1);
    };

    // Reset pagination when the category changes externally.
    useEffect(() => {
        setPage(1);
    }, [externalCategory]);

    // Handle pagination.
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

    const hasActiveFilters =
        selectedCategory !== "All Properties" ||
        selectedListingType !== "All" ||
        selectedCity !== "All Cities";

    const clearFilters = () => {
        handleCategoryChange("All Properties");
        handleListingTypeChange("All");
        handleCityChange("All Cities");
    };

    return (
        <Box
            ref={listRef}
            sx={{
                p: { xs: 2, md: 4 },
                scrollMarginTop: "24px",
            }}
        >
            {/* Property type, transaction type, and city filters */}
            <PropertyCategoryBar
                properties={properties}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                selectedListingType={selectedListingType}
                onListingTypeChange={handleListingTypeChange}
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
                        color: "#1f2937",
                    }}
                >
                    {selectedCategory === "All Properties"
                        ? "Property Listings"
                        : `${selectedCategory} Listings`}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#6b7280" }}
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
                        py: 6,
                        px: 2,
                        textAlign: "center",
                        border: "1px dashed #d1d5db",
                        borderRadius: 3,
                        backgroundColor: "#fafafa",
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
                        No properties found
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#6b7280", mb: 2 }}
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
                    {/* Property cards */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: { xs: 3, md: 4 },
                            width: "100%",
                            alignItems: "stretch",
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
                                        display: "flex",
                                        justifyContent: "center",
                                        "& > *": {
                                            width: "100%",
                                            minWidth: 0,
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
