import React, { useState, useEffect } from "react";
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

export default function ProfilePropertyList({
    refreshTrigger = 0,
    onSelectProperty,
    listRef,
}) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] =
        useState("All Properties");

    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    // Fetch properties from the backend.
    // Fetch properties published by the logged-in user from the backend.
    useEffect(() => {
        let cancelled = false;

        const fetchUserProperties = async () => {
            setLoading(true);
            setError(null);

            try {
                // Updated endpoint to fetch only the logged-in user's properties
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
                        "Failed to fetch your properties"
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
    }, [refreshTrigger]);

    const handleDeleteProperty = async (propertyId) => {
        try {
            // Matches the router.delete("/:id", ...) route
            await axiosInstance.delete(`/property/deleteProperty/${propertyId}`);

            // Or if using Option B: await axiosInstance.delete(`/property/deleteProperty/${propertyId}`);

            setProperties((prev) =>
                prev.filter((p) => (p._id || p.id) !== propertyId)
            );
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Failed to delete the property publication."
            );
        }
    };

    // Filter properties by category.
    const filteredProperties =
        selectedCategory === "All Properties"
            ? properties
            : properties.filter(
                (property) =>
                    property.propertyType?.toLowerCase() ===
                    selectedCategory.toLowerCase()
            );

    // Change category and reset pagination WITHOUT jumping to top
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
        // Removed scrollIntoView call to keep screen position locked
    };

    // Handle pagination WITHOUT jumping to top
    const handlePageChange = (event, value) => {
        setPage(value);
        // Removed scrollIntoView call to prevent page snapping to top
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
                scrollMarginTop: "0px",
                maxWidth: "100%",
                mx: "auto",
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
                        ? "My Property Publications"
                        : `${selectedCategory} Publications`}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", fontWeight: 600 }}
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
                        You haven't published any listings in this category yet.
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
                    {/* Vertical Column Stack of Horizontal User Profile Cards */}
                    <Stack spacing={2.5}>
                        {displayedProperties.map((property) => (
                            <UserProfilePropertyCard
                                key={property._id || property.id}
                                property={property}
                                onViewDetails={(prop) =>
                                    onSelectProperty?.(prop)
                                }
                                onDelete={handleDeleteProperty}
                            />
                        ))}
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