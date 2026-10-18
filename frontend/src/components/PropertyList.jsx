
// import React, { useState, useEffect } from "react";
// import {
//     Box,
//     Typography,
//     CircularProgress,
//     Alert,
//     Pagination,
//     Button,
// } from "@mui/material";

// import PropertyCard from "./PropertyCard";
// import axiosInstance from "../api/axiosInstance";

// const PROPERTY_CATEGORIES = [
//     "All Properties",
//     "Apartment",
//     "House",
//     "Villa",
//     "Studio",
//     "Room",
//     "Store",
//     "Office",
//     "Land",
//     "Warehouse",
// ];

// export default function PropertyList({
//     refreshTrigger = 0,
//     onSelectProperty,
//     listRef,
// }) {
//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const [selectedCategory, setSelectedCategory] =
//         useState("All Properties");

//     const [page, setPage] = useState(1);
//     const itemsPerPage = 6;

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
//                         err.message ||
//                         "Failed to fetch properties"
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

//     // Filter properties by the selected category.
//     const filteredProperties =
//         selectedCategory === "All Properties"
//             ? properties
//             : properties.filter(
//                 (property) =>
//                     property.propertyType?.toLowerCase() ===
//                     selectedCategory.toLowerCase()
//             );

//     // Reset pagination when the category changes.
//     const handleCategoryChange = (category) => {
//         setSelectedCategory(category);
//         setPage(1);
//     };

//     const handlePageChange = (event, value) => {
//         setPage(value);

//         if (listRef?.current) {
//             listRef.current.scrollIntoView({
//                 behavior: "smooth",
//                 block: "start",
//             });
//         }
//     };

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
//             {/* Category filter bar */}
//             <Box
//                 sx={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 1.2,
//                     overflowX: "auto",
//                     pb: 1.5,
//                     mb: 3,
//                     borderBottom: "1px solid #e5e7eb",
//                     scrollbarWidth: "thin",
//                     "&::-webkit-scrollbar": {
//                         height: "5px",
//                     },
//                     "&::-webkit-scrollbar-thumb": {
//                         backgroundColor: "#d1d5db",
//                         borderRadius: "10px",
//                     },
//                 }}
//             >
//                 {PROPERTY_CATEGORIES.map((category) => {
//                     const isSelected =
//                         selectedCategory === category;

//                     const categoryCount =
//                         category === "All Properties"
//                             ? properties.length
//                             : properties.filter(
//                                 (property) =>
//                                     property.propertyType?.toLowerCase() ===
//                                     category.toLowerCase()
//                             ).length;

//                     return (
//                         <Button
//                             key={category}
//                             onClick={() =>
//                                 handleCategoryChange(category)
//                             }
//                             variant={
//                                 isSelected ? "contained" : "outlined"
//                             }
//                             disableElevation
//                             sx={{
//                                 flexShrink: 0,
//                                 textTransform: "none",
//                                 whiteSpace: "nowrap",
//                                 borderRadius: "10px",
//                                 px: 2,
//                                 py: 1,
//                                 fontWeight: 600,
//                                 fontSize: "0.875rem",
//                                 borderColor: isSelected
//                                     ? "#2563eb"
//                                     : "#e5e7eb",
//                                 backgroundColor: isSelected
//                                     ? "#2563eb"
//                                     : "#fff",
//                                 color: isSelected
//                                     ? "#fff"
//                                     : "#374151",
//                                 "&:hover": {
//                                     borderColor: "#2563eb",
//                                     backgroundColor: isSelected
//                                         ? "#1d4ed8"
//                                         : "#eff6ff",
//                                 },
//                             }}
//                         >
//                             {category}
//                             <Box
//                                 component="span"
//                                 sx={{
//                                     ml: 1,
//                                     fontSize: "0.75rem",
//                                     fontWeight: 700,
//                                     opacity: isSelected ? 0.9 : 0.7,
//                                 }}
//                             >
//                                 {categoryCount}
//                             </Box>
//                         </Button>
//                     );
//                 })}
//             </Box>

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
//                         No {selectedCategory === "All Properties"
//                             ? ""
//                             : selectedCategory.toLowerCase() + " "}
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
//                                         imagePath.startsWith("/")
//                                             ? ""
//                                             : "/"
//                                     }${imagePath}`
//                                 : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500";

//                             const formattedProperty = {
//                                 ...property,
//                                 title: property.title,
//                                 price:
//                                     property.price != null
//                                         ? `${Number(
//                                             property.price
//                                         ).toLocaleString()} MAD`
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
//                                         property.createdAt
//                                     ).toLocaleDateString("en-GB")
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
//                                         onClick={(e) =>
//                                             onSelectProperty?.(
//                                                 property,
//                                                 e.currentTarget
//                                             )
//                                         }
//                                     />
//                                 </Box>
//                             );
//                         })}
//                     </Box>

//                     {/* Pagination for filtered results */}
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
import React, { useState, useEffect } from "react";
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

export default function PropertyList({
    refreshTrigger = 0,
    onSelectProperty,
    listRef,
    selectedCategory: externalCategory,
    onCategoryChange: externalOnCategoryChange,
}) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [internalCategory, setInternalCategory] = useState("All Properties");

    // Use external category state if provided, otherwise fall back to internal
    const selectedCategory = externalCategory !== undefined ? externalCategory : internalCategory;

    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

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

    // Filter properties by category.
    const filteredProperties =
        selectedCategory === "All Properties"
            ? properties
            : properties.filter(
                (property) =>
                    property.propertyType?.toLowerCase() ===
                    selectedCategory.toLowerCase()
            );

    // Change category and reset pagination.
    const handleCategoryChange = (category) => {
        if (externalOnCategoryChange) {
            externalOnCategoryChange(category);
        } else {
            setInternalCategory(category);
        }
        setPage(1);
    };

    // Handle pagination.
    const handlePageChange = (event, value) => {
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

    return (
        <Box
            ref={listRef}
            sx={{
                p: { xs: 2, md: 4 },
                scrollMarginTop: "24px",
            }}
        >
            {/* Property category filter */}
            <PropertyCategoryBar
                properties={properties}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
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
                        No{" "}
                        {selectedCategory === "All Properties"
                            ? ""
                            : `${selectedCategory.toLowerCase()} `}
                        properties found
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#6b7280", mb: 2 }}
                    >
                        Try another category or check back later.
                    </Typography>

                    {selectedCategory !== "All Properties" && (
                        <Button
                            variant="outlined"
                            onClick={() =>
                                handleCategoryChange("All Properties")
                            }
                            sx={{ textTransform: "none" }}
                        >
                            View all properties
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
                                        ? `${Number(property.price).toLocaleString()} MAD`
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
                                    ? new Date(property.createdAt).toLocaleDateString("en-GB")
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
                                        onClick={(e) =>
                                            onSelectProperty?.(
                                                property,
                                                e.currentTarget
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
                                mt: 5,
                            }}
                        >
                            <Pagination
                                count={totalPages}
                                page={page}
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