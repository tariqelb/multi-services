
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    CircularProgress,
    Pagination,
    Typography,
} from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";
import RoommateCard from "./RoommateCard";
import RoommateCategoryBar from "./RoommateCategoryBar";

const ITEMS_PER_PAGE = 9;

const RoommateList = () => {
    const { t } = useTranslation();
    const listTopRef = useRef(null);

    // Announcements
    const [listings, setListings] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [selectedPurpose, setSelectedPurpose] = useState("");
    const [selectedPropertyType, setSelectedPropertyType] = useState("");
    const [selectedRentalPeriod, setSelectedRentalPeriod] = useState("");
    const [city, setCity] = useState("");
    const [search, setSearch] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalListings, setTotalListings] = useState(0);

    // Fetch roommate announcements
    const fetchRoommateListings = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit: ITEMS_PER_PAGE,
            };

            if (selectedPurpose && selectedPurpose !== "All") {
                params.purpose = selectedPurpose;
            }

            if (selectedPropertyType && selectedPropertyType !== "All") {
                params.propertyType = selectedPropertyType;
            }

            if (selectedRentalPeriod && selectedRentalPeriod !== "All") {
                params.rentalPeriod = selectedRentalPeriod;
            }

            if (city?.trim()) {
                params.city = city.trim();
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await axiosInstance.get("/property/roommates", {
                params,
            });

            const data = response.data;

            setListings(
                Array.isArray(data.listings) ? data.listings : []
            );

            setTotalPages(data.pagination?.totalPages || 1);
            setTotalListings(data.pagination?.totalListings || 0);
        } catch (err) {
            console.error("Error fetching roommate announcements:", err);

            setListings([]);
            setTotalPages(1);
            setTotalListings(0);

            setError(
                t("roommates.errors.loadFailed", {
                    defaultValue:
                        "Unable to load roommate announcements. Please try again.",
                })
            );
        } finally {
            setLoading(false);
        }
    }, [
        page,
        selectedPurpose,
        selectedPropertyType,
        selectedRentalPeriod,
        city,
        search,
        t,
    ]);

    useEffect(() => {
        fetchRoommateListings();
    }, [fetchRoommateListings]);

    // Reset pagination when filters change
    const handleFilterChange = (setter, value) => {
        setter(value);
        setPage(1);
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSelectedPurpose("");
        setSelectedPropertyType("");
        setSelectedRentalPeriod("");
        setCity("");
        setSearch("");
        setPage(1);
    };

    // Change page
    const handlePageChange = (event, newPage) => {
        setPage(newPage);

        listTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    return (
        <Box sx={{ width: "100%" }}>
            {/* Filters */}
            <RoommateCategoryBar
                selectedPurpose={selectedPurpose}
                onPurposeChange={(value) =>
                    handleFilterChange(setSelectedPurpose, value)
                }
                selectedPropertyType={selectedPropertyType}
                onPropertyTypeChange={(value) =>
                    handleFilterChange(setSelectedPropertyType, value)
                }
                selectedRentalPeriod={selectedRentalPeriod}
                onRentalPeriodChange={(value) =>
                    handleFilterChange(setSelectedRentalPeriod, value)
                }
                city={city}
                onCityChange={(value) =>
                    handleFilterChange(setCity, value)
                }
                search={search}
                onSearchChange={(value) =>
                    handleFilterChange(setSearch, value)
                }
                onClearFilters={handleClearFilters}
            />

            {/* Scroll target */}
            <Box ref={listTopRef} sx={{ scrollMarginTop: "100px" }} />

            {/* Results count */}
            {!loading && !error && (
                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mb: 2 }}
                >
                    {t("roommates.pagination.results", {
                        count: totalListings,
                        defaultValue: `${totalListings} announcements found`,
                    })}
                </Typography>
            )}

            {/* Loading */}
            {loading && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 250,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}

            {/* Error */}
            {!loading && error && (
                <Alert severity="error" sx={{ my: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Announcements */}
            {!loading && !error && listings.length > 0 && (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                            md: "repeat(3, 1fr)",
                        },
                        gap: 3,
                    }}
                >
                    {listings.map((listing) => (
                        <RoommateCard
                            key={listing._id || listing.id}
                            listing={listing}
                        />
                    ))}
                </Box>
            )}

            {/* Empty state */}
            {!loading && !error && listings.length === 0 && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        py: 8,
                        px: 2,
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom sx={{ fontWeight: 600 }}
                    >
                        {t("roommates.empty.title", {
                            defaultValue:
                                "No roommate announcements found",
                        })}
                    </Typography>

                    <Typography
                        variant="body2" sx={{ color: "text.secondary" }}
                    >
                        {t("roommates.empty.description", {
                            defaultValue:
                                "Try changing your filters or search for another city.",
                        })}
                    </Typography>
                </Box>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.5,
                        mt: 4,
                        mb: 2,
                    }}
                >
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        size="large"
                        showFirstButton
                        showLastButton
                        aria-label={t(
                            "roommates.pagination.label",
                            {
                                defaultValue:
                                    "Roommate announcements pages",
                            }
                        )}
                        getItemAriaLabel={(type, pageNumber, selected) => {
                            if (type === "first") {
                                return t("roommates.pagination.first", {
                                    defaultValue: "First page",
                                });
                            }

                            if (type === "last") {
                                return t("roommates.pagination.last", {
                                    defaultValue: "Last page",
                                });
                            }

                            if (type === "next") {
                                return t("roommates.pagination.next", {
                                    defaultValue: "Next page",
                                });
                            }

                            if (type === "previous") {
                                return t("roommates.pagination.previous", {
                                    defaultValue: "Previous page",
                                });
                            }

                            return t("roommates.pagination.goToPage", {
                                page: pageNumber,
                                defaultValue: `Go to page ${pageNumber}`,
                            });
                        }}
                    />

                    <Typography
                        variant="caption" sx={{ color: "text.secondary" }}
                    >
                        {t("roommates.pagination.pageInfo", {
                            current: page,
                            total: totalPages,
                            defaultValue: `Page ${page} of ${totalPages}`,
                        })}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default RoommateList;
