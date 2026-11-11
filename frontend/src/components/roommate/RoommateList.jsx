
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    CircularProgress,
    Pagination,
    Typography,
} from "@mui/material";

import axiosInstance from "../../api/axiosInstance";

import RoommateCard from "./RoommateCard";
import RoommateCategoryBar from "./RoommateCategoryBar";

const ITEMS_PER_PAGE = 9;

export default function RoommateList() {
    const { t } = useTranslation();

    const listTopRef = useRef(null);

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedPurpose, setSelectedPurpose] = useState("All");
    const [selectedPropertyType, setSelectedPropertyType] = useState("All");
    const [selectedRentalPeriod, setSelectedRentalPeriod] = useState("All");
    const [city, setCity] = useState("");
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalListings, setTotalListings] = useState(0);

    const fetchRoommateListings = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit: ITEMS_PER_PAGE,
            };

            if (selectedPurpose !== "All") {
                params.purpose = selectedPurpose;
            }

            if (selectedPropertyType !== "All") {
                params.propertyType = selectedPropertyType;
            }

            if (selectedRentalPeriod !== "All") {
                params.rentalPeriod = selectedRentalPeriod;
            }

            if (city.trim()) {
                params.city = city.trim();
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await axiosInstance.get("/roommates", {
                params,
            });

            const data = response.data;

            setListings(
                Array.isArray(data.listings)
                    ? data.listings
                    : []
            );

            setTotalPages(
                Math.max(1, data.pagination?.totalPages || 1)
            );

            setTotalListings(
                data.pagination?.totalListings || 0
            );
        } catch (err) {
            console.error(
                "[RoommateList] Failed to fetch announcements:",
                err
            );

            setListings([]);
            setTotalPages(1);
            setTotalListings(0);

            setError(
                err.response?.data?.message ||
                t("roommates.errors.loadFailed", {
                    defaultValue:
                        "Unable to load roommate announcements. Please try again.",
                })
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoommateListings();
    }, [
        page,
        selectedPurpose,
        selectedPropertyType,
        selectedRentalPeriod,
        city,
        search,
    ]);

    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSelectedPurpose("All");
        setSelectedPropertyType("All");
        setSelectedRentalPeriod("All");
        setCity("");
        setSearch("");
        setPage(1);
    };

    const handlePageChange = (_, value) => {
        setPage(value);

        requestAnimationFrame(() => {
            listTopRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    return (
        <Box>
            <RoommateCategoryBar
                selectedPurpose={selectedPurpose}
                onPurposeChange={handleFilterChange(setSelectedPurpose)}
                selectedPropertyType={selectedPropertyType}
                onPropertyTypeChange={handleFilterChange(
                    setSelectedPropertyType
                )}
                selectedRentalPeriod={selectedRentalPeriod}
                onRentalPeriodChange={handleFilterChange(
                    setSelectedRentalPeriod
                )}
                city={city}
                onCityChange={handleFilterChange(setCity)}
                search={search}
                onSearchChange={handleFilterChange(setSearch)}
                onClearFilters={handleClearFilters}
            />

            <Box ref={listTopRef} sx={{ scrollMarginTop: 100 }}>
                {/* Results count */}
                {!loading && !error && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        {totalListings}{" "}
                        {t("roommates.results", {
                            defaultValue: "announcements found",
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
                            minHeight: 300,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {/* Error */}
                {!loading && error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2, borderRadius: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Empty state */}
                {!loading && !error && listings.length === 0 && (
                    <Box
                        sx={{
                            minHeight: 280,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            px: 2,
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            gutterBottom
                        >
                            {t("roommates.empty.title", {
                                defaultValue:
                                    "No roommate announcements found",
                            })}
                        </Typography>

                        <Typography color="text.secondary">
                            {t("roommates.empty.description", {
                                defaultValue:
                                    "Try changing your filters or search for another city.",
                            })}
                        </Typography>
                    </Box>
                )}

                {/* Listings */}
                {!loading && !error && listings.length > 0 && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: { xs: 2, sm: 2.5, md: 3 },
                            alignItems: "stretch",
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

                {/* Pagination */}
                {!loading &&
                    !error &&
                    totalPages > 1 && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
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
                            />
                        </Box>
                    )}
            </Box>
        </Box>
    );
}
