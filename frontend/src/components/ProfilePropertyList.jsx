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

    const handleDeleteProperty = async (propertyId) => {
        try {
            await axiosInstance.delete(
                `/property/deleteProperty/${propertyId}`
            );

            setProperties((prev) =>
                prev.filter((p) => (p._id || p.id) !== propertyId)
            );
        } catch (err) {
            alert(
                err.response?.data?.message ||
                t("properties.profileList.deleteError")
            );
        }
    };

    // Filter properties using the original category values.
    const filteredProperties =
        selectedCategory === "All Properties"
            ? properties
            : properties.filter(
                (property) =>
                    property.propertyType?.toLowerCase() ===
                    selectedCategory.toLowerCase()
            );

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const totalPages = Math.ceil(
        filteredProperties.length / itemsPerPage
    );

    const displayedProperties = filteredProperties.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Translate category labels without changing their stored values.
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
                    {filteredProperties.length}{" "}
                    {filteredProperties.length === 1
                        ? t("properties.profileList.property")
                        : t("properties.profileList.properties")}
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
                        {selectedCategory === "All Properties"
                            ? t("properties.profileList.noProperties")
                            : t("properties.profileList.noCategoryProperties", {
                                category: categoryLabel.toLowerCase(),
                            })}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#5B6577", mb: 2 }}
                    >
                        {t("properties.profileList.emptySubtitle")}
                    </Typography>

                    {selectedCategory !== "All Properties" && (
                        <Button
                            variant="outlined"
                            onClick={() =>
                                handleCategoryChange("All Properties")
                            }
                            sx={{ textTransform: "none" }}
                        >
                            {t("properties.profileList.viewAll")}
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    <Stack spacing={2.5}>
                        {displayedProperties.map((property) => (
                            <UserProfilePropertyCard
                                key={property._id || property.id}
                                property={property}
                                onViewDetails={
                                    onSelectProperty
                                        ? (prop) => onSelectProperty(prop)
                                        : undefined
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