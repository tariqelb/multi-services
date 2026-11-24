
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import PageHeader from "../../../Components/ui/PageHeader";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

import axiosInstance from "../../../api/axiosInstance";
import SavedPropertyCard from "./SavedPropertyCard";
import PropertyCategoryBar from "../properties/PropertyCategoryBar";

// embedded: inside the Saved page tabs (no page header, smaller empty state).
export default function SavedPropertiesList({ onViewDetails, embedded = false }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);

    const [selectedCategory, setSelectedCategory] =
        useState("All Properties");
    const [page, setPage] = useState(1);

    const itemsPerPage = 5;

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
                t("properties.savedList.fetchError")
            );
        } finally {
            setLoading(false);
        }
    }, [t]);

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
                t("properties.savedList.removeError")
            );
        } finally {
            setRemovingId(null);
        }
    };

    const handleViewDetails = (property) => {
        const propertyId = property?._id || property?.id;

        if (!propertyId) {
            console.error("Property ID is missing:", property);
            return;
        }

        // The public page (contact + "Saved" button), not the owner's view.
        navigate(`/properties/${propertyId}`, {
            state: {
                property,
                from: "/saved",
            },
        });
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

    const getCategoryLabel = (category) => {
        if (category === "All Properties") {
            return t("properties.savedList.allProperties");
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

    const totalPages = Math.ceil(
        filteredSavedRecords.length / itemsPerPage
    );

    const displayedSavedRecords = filteredSavedRecords.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: embedded ? 240 : "100vh",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <CircularProgress sx={{ color: "#2563EB" }} />
            </Box>
        );
    }

    if (!error && validSavedRecords.length === 0) {
        return (
            <Box
                sx={{
                    minHeight: embedded ? 0 : "100vh",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    px: 3,
                    py: 6,
                    backgroundColor: embedded ? "#F5F7FB" : "#ffffff",
                    ...(embedded && { border: "1px dashed #CBD5E1", borderRadius: "16px" }),
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
                        color: "#0F172A",
                        mb: 1,
                    }}
                >
                    {t("properties.savedList.emptyTitle")}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: "#64748B",
                        maxWidth: 420,
                        mb: 3,
                    }}
                >
                    {t("properties.savedList.emptySubtitle")}
                </Typography>

                <Button
                    variant="contained"
                    onClick={() => navigate("/properties")}
                    sx={{
                        backgroundColor: "#2563EB",
                        textTransform: "none",
                        fontWeight: 600,
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        "&:hover": {
                            backgroundColor: "#1D4ED8",
                        },
                    }}
                >
                    {t("properties.savedList.explore")}
                </Button>
            </Box>
        );
    }

    const categoryLabel = getCategoryLabel(selectedCategory);

    return (
        <Box
            sx={embedded ? undefined : {
                ...pagePaddingSx,
            }}
        >
            {!embedded && (
                <PageHeader
                    icon={<BookmarkBorderRoundedIcon />}
                    title={t("topbar.saved", "Saved")}
                    subtitle={t("properties.savedList.pageSubtitle", "Properties you bookmarked to compare and contact later.")}
                />
            )}

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
                        color: "#0F172A",
                    }}
                >
                    {selectedCategory === "All Properties"
                        ? t("properties.savedList.title")
                        : t("properties.savedList.categoryTitle", {
                            category: categoryLabel,
                        })}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#64748B", fontWeight: 600 }}
                >
                    {filteredSavedRecords.length}{" "}
                    {filteredSavedRecords.length === 1
                        ? t("properties.savedList.property")
                        : t("properties.savedList.properties")}
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
                            {t("properties.savedList.retry")}
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
                        border: "1px dashed #CBD5E1",
                        borderRadius: "16px",
                        backgroundColor: "#F5F7FB",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#334155",
                            mb: 1,
                        }}
                    >
                        {t("properties.savedList.noCategoryProperties")}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#64748B", mb: 2 }}
                    >
                        {t("properties.savedList.noCategorySubtitle")}
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={() =>
                            handleCategoryChange("All Properties")
                        }
                        sx={{ textTransform: "none" }}
                    >
                        {t("properties.savedList.viewAll")}
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
