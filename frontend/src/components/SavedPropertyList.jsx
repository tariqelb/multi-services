import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Pagination,
} from "@mui/material";
import { BookmarkRemove } from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";
import SavedPropertyCard from "./SavedPropertyCard";
import PropertyCategoryBar from "./PropertyCategoryBar";

export default function SavedPropertiesList({ onViewDetails }) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);

    const [selectedCategory, setSelectedCategory] =
        useState("All Properties");
    const [page, setPage] = useState(1);

    const itemsPerPage = 5;
    const navigate = useNavigate();

    const fetchSavedProperties = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get("/property/saved");
            const data = response.data;

            const savedProperties = Array.isArray(data)
                ? data
                : data?.savedProperties || [];

            setProperties(savedProperties);
            setPage(1);
        } catch (err) {
            console.error(
                "Failed to fetch saved properties:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Failed to load saved properties. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSavedProperties();
    }, [fetchSavedProperties]);

    const validSavedRecords = properties.filter(
        (record) =>
            record.propertyId &&
            typeof record.propertyId === "object"
    );

    const savedPropertyObjects = validSavedRecords.map(
        (record) => record.propertyId
    );

    const handleRemoveSaved = async (property) => {
        const propertyId = property._id || property.id;

        if (!propertyId || removingId) return;

        try {
            setRemovingId(propertyId);
            setError("");

            await axiosInstance.delete(
                `/property/unsave/${propertyId}`
            );

            setProperties((previous) =>
                previous.filter((record) => {
                    const savedPropertyId =
                        record.propertyId?._id ||
                        record.propertyId?.id;

                    return String(savedPropertyId) !== String(propertyId);
                })
            );
        } catch (err) {
            console.error(
                "Failed to remove saved property:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Failed to remove this property from your saved list."
            );
        } finally {
            setRemovingId(null);
        }
    };

    const handleViewDetails = (property) => {
        const propertyId = property?._id || property?.id;

        if (!propertyId) {
            console.error("Property ID is missing.");
            return;
        }

        if (onViewDetails) {
            onViewDetails(property);
            return;
        }

        navigate(`/properties/${propertyId}`);
    };

    const filteredSavedRecords =
        selectedCategory === "All Properties"
            ? validSavedRecords
            : validSavedRecords.filter((record) => {
                const property = record.propertyId;

                return (
                    property.propertyType?.toLowerCase() ===
                    selectedCategory.toLowerCase()
                );
            });

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const totalPages = Math.ceil(
        filteredSavedRecords.length / itemsPerPage
    );

    const displayedSavedRecords = filteredSavedRecords.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Loading state
    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <CircularProgress sx={{ color: "#059669" }} />
            </Box>
        );
    }

    // Full-page empty state
    if (!error && validSavedRecords.length === 0) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    px: 3,
                    py: 6,
                    backgroundColor: "#ffffff",
                }}
            >
                <BookmarkRemove
                    sx={{
                        fontSize: { xs: 65, md: 85 },
                        color: "#94a3b8",
                        mb: 2,
                    }}
                />

                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "#1f2937",
                        mb: 1,
                    }}
                >
                    No saved properties found
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: "#6b7280",
                        maxWidth: 420,
                        mb: 3,
                    }}
                >
                    You haven't saved any properties yet. Explore our
                    property listings and bookmark the ones you like.
                </Typography>

                <Button
                    variant="contained"
                    onClick={() => navigate("/properties")}
                    sx={{
                        backgroundColor: "#059669",
                        textTransform: "none",
                        fontWeight: 600,
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        "&:hover": {
                            backgroundColor: "#047857",
                        },
                    }}
                >
                    Explore properties
                </Button>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "100%",
                mx: "auto",
                p: { xs: 2, md: 4 },
            }}
        >
            {validSavedRecords.length > 0 && (
                <PropertyCategoryBar
                    properties={savedPropertyObjects}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                />
            )}

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
                        ? "Saved Properties"
                        : `${selectedCategory} Saved Properties`}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", fontWeight: 600 }}
                >
                    {filteredSavedRecords.length}{" "}
                    {filteredSavedRecords.length === 1
                        ? "property"
                        : "properties"}
                </Typography>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3, borderRadius: 2 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={fetchSavedProperties}
                        >
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {!error && filteredSavedRecords.length === 0 ? (
                <Box
                    sx={{
                        width: "100%",
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
                        No saved properties in this category
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#6b7280", mb: 2 }}
                    >
                        You haven't saved any listings in this category yet.
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={() =>
                            handleCategoryChange("All Properties")
                        }
                        sx={{ textTransform: "none" }}
                    >
                        View all properties
                    </Button>
                </Box>
            ) : (
                <>
                    <Stack spacing={2.5}>
                        {displayedSavedRecords.map((savedRecord) => {
                            const property = savedRecord.propertyId;
                            const propertyId = property._id || property.id;

                            return (
                                <SavedPropertyCard
                                    key={savedRecord._id || propertyId}
                                    property={property}
                                    onViewDetails={handleViewDetails}
                                    onRemove={handleRemoveSaved}
                                    removing={removingId === propertyId}
                                />
                            );
                        })}
                    </Stack>

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