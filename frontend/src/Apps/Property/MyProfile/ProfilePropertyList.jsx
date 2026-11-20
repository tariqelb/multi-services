// /home/tariq/multi-services/app/frontend/src/components/MyProfile/ProfilePropertyList.jsx

import PageHeader from "../../../Components/ui/PageHeader";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
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
    Tabs,
    Tab,
} from "@mui/material";

import HomeWorkIcon from "@mui/icons-material/HomeWork";
import PeopleIcon from "@mui/icons-material/People";
import HotelIcon from "@mui/icons-material/Hotel";

import PropertyCategoryBar from "../properties/PropertyCategoryBar";
import axiosInstance from "../../../api/axiosInstance";

import UserProfilePropertyCard from "./UserProfilePropertyCard";
import UserProfileRoommateCard from "../roommate/UserProfileRoommateCard";
import UserProfileEstablishmentCard from "./UserProfileEstablishmentCard";

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

export default function ProfilePropertyList({
    refreshTrigger = 0,
    onSelectProperty,
    listRef,
    activeTab: controlledActiveTab,
    onTabChange,
    onStatisticsChange,
    showTabs = true,
}) {
    const { t } = useTranslation();

    // Publications
    const [properties, setProperties] = useState([]);
    const [roommates, setRoommates] = useState([]);
    const [establishments, setEstablishments] = useState([]);

    // Loading and errors
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roommateError, setRoommateError] = useState(null);
    const [establishmentError, setEstablishmentError] = useState(null);

    // Internal and controlled tab state
    const [internalActiveTab, setInternalActiveTab] = useState("properties");

    const activeTab = controlledActiveTab ?? internalActiveTab;

    // Property filters
    const [selectedCategory, setSelectedCategory] = useState("All Properties");
    const [selectedListingType, setSelectedListingType] = useState("All");
    const [selectedRentalPeriod, setSelectedRentalPeriod] = useState("All");
    const [selectedCity, setSelectedCity] = useState("All Cities");

    // Pagination
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    // Fetch all user publications
    useEffect(() => {
        let cancelled = false;

        const fetchPublications = async () => {
            setLoading(true);
            setError(null);
            setRoommateError(null);
            setEstablishmentError(null);

            const [
                propertyResult,
                roommateResult,
                establishmentResult,
            ] = await Promise.allSettled([
                axiosInstance.get("/property/user-listings"),
                axiosInstance.get("/roommates/my-listings"),
                axiosInstance.get("/establishments/my-establishments"),
            ]);

            if (cancelled) return;

            // Properties
            if (propertyResult.status === "fulfilled") {
                const data = propertyResult.value.data;

                const propertyList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.properties)
                        ? data.properties
                        : [];

                setProperties(propertyList);
            } else {
                setError(
                    propertyResult.reason?.response?.data?.message ||
                    propertyResult.reason?.message ||
                    t("properties.profileList.fetchError")
                );
            }

            // Roommate publications
            if (roommateResult.status === "fulfilled") {
                const data = roommateResult.value.data;

                const roommateList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.listings)
                        ? data.listings
                        : [];

                setRoommates(roommateList);
            } else {
                setRoommateError(
                    roommateResult.reason?.response?.data?.message ||
                    roommateResult.reason?.message ||
                    t("profileRoommate.fetchError", {
                        defaultValue: "Unable to load your roommate publications.",
                    })
                );
            }

            // Establishments
            if (establishmentResult.status === "fulfilled") {
                const data = establishmentResult.value.data;

                const establishmentList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.establishments)
                        ? data.establishments
                        : [];

                setEstablishments(establishmentList);
            } else {
                setEstablishmentError(
                    establishmentResult.reason?.response?.data?.message ||
                    establishmentResult.reason?.message ||
                    t("profileEstablishment.fetchError", {
                        defaultValue: "Unable to load your establishments.",
                    })
                );
            }

            setPage(1);
            setLoading(false);
        };

        fetchPublications();

        return () => {
            cancelled = true;
        };
    }, [refreshTrigger, t]);

    // Publication statistics
    useEffect(() => {
        if (!onStatisticsChange) return;

        const availableProperties = properties.filter(
            (property) =>
                String(property.status || "").toLowerCase() === "available"
        ).length;

        onStatisticsChange({
            totalProperties: properties.length,
            availableProperties,
            totalRoommates: roommates.length,
            totalEstablishments: establishments.length,
        });
    }, [
        properties,
        roommates,
        establishments,
        onStatisticsChange,
    ]);

    // Switch publication tabs
    const handleTabChange = (_event, newValue) => {
        setInternalActiveTab(newValue);
        onTabChange?.(newValue);
        setPage(1);
    };

    // Delete property
    const handleDeleteProperty = async (propertyId) => {
        try {
            await axiosInstance.delete(
                `/property/deleteProperty/${propertyId}`
            );

            setProperties((prev) =>
                prev.filter(
                    (property) =>
                        String(property._id || property.id) !== String(propertyId)
                )
            );

            setPage(1);
        } catch (err) {
            alert(
                err.response?.data?.message ||
                t("properties.profileList.deleteError")
            );
        }
    };

    // Delete roommate publication
    const handleDeleteRoommate = async (roommateId) => {
        try {
            await axiosInstance.delete(`/roommates/${roommateId}`);

            setRoommates((prev) =>
                prev.filter(
                    (roommate) =>
                        String(roommate._id || roommate.id) !== String(roommateId)
                )
            );

            setPage(1);
        } catch (err) {
            alert(
                err.response?.data?.message ||
                t("profileRoommate.deleteError", {
                    defaultValue: "Unable to delete this roommate announcement.",
                })
            );
        }
    };

    // Delete establishment
    const handleDeleteEstablishment = async (establishmentId) => {
        if (!establishmentId) {
            console.error("Cannot delete establishment: missing ID.");
            return;
        }

        try {
            await axiosInstance.delete(
                `/establishments/${establishmentId}`
            );

            setEstablishments((prev) =>
                prev.filter(
                    (establishment) =>
                        String(establishment._id || establishment.id) !==
                        String(establishmentId)
                )
            );

            setPage(1);
        } catch (err) {
            alert(
                err.response?.data?.message ||
                t("profileEstablishment.deleteError", {
                    defaultValue: "Unable to delete this establishment.",
                })
            );

            throw err;
        }
    };

    // Update roommate publication status
    const handleUpdateRoommateStatus = async (roommateId, status) => {
        try {
            await axiosInstance.patch(
                `/roommates/${roommateId}/status`,
                { status }
            );

            setRoommates((prev) =>
                prev.map((roommate) =>
                    String(roommate._id || roommate.id) === String(roommateId)
                        ? { ...roommate, status }
                        : roommate
                )
            );

            return true;
        } catch (err) {
            alert(
                err.response?.data?.message ||
                t("profileRoommate.statusUpdateError", {
                    defaultValue: "Unable to update publication status.",
                })
            );

            return false;
        }
    };

    // Category filter
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    // Transaction filter
    const handleListingTypeChange = (listingType) => {
        setSelectedListingType(listingType);

        if (listingType !== "For Rent") {
            setSelectedRentalPeriod("All");
        }

        setPage(1);
    };

    // Rental period filter
    const handleRentalPeriodChange = (rentalPeriod) => {
        setSelectedRentalPeriod(rentalPeriod);
        setPage(1);
    };

    // City filter
    const handleCityChange = (city) => {
        setSelectedCity(city);
        setPage(1);
    };

    // Filter properties
    const filteredProperties = properties.filter((property) => {
        const matchesCategory =
            selectedCategory === "All Properties" ||
            normalize(property.propertyType) === normalize(selectedCategory);

        const matchesListingType =
            selectedListingType === "All" ||
            normalize(property.listingType) === normalize(selectedListingType);

        const matchesRentalPeriod =
            selectedListingType !== "For Rent" ||
            selectedRentalPeriod === "All" ||
            normalize(property.rentalPeriod) === normalize(selectedRentalPeriod);

        const matchesCity =
            selectedCity === "All Cities" ||
            normalizeCity(property.city) === normalizeCity(selectedCity);

        return (
            matchesCategory &&
            matchesListingType &&
            matchesRentalPeriod &&
            matchesCity
        );
    });

    // Filter roommate publications
    const filteredRoommates = roommates.filter((roommate) => {
        const matchesCategory =
            selectedCategory === "All Properties" ||
            normalize(roommate.propertyType) === normalize(selectedCategory);

        const matchesListingType =
            selectedListingType === "All" ||
            selectedListingType === "For Rent";

        const matchesRentalPeriod =
            selectedRentalPeriod === "All" ||
            normalize(roommate.rentalPeriod) === normalize(selectedRentalPeriod);

        const matchesCity =
            selectedCity === "All Cities" ||
            normalizeCity(roommate.city) === normalizeCity(selectedCity);

        return (
            matchesCategory &&
            matchesListingType &&
            matchesRentalPeriod &&
            matchesCity
        );
    });

    // Clear all filters
    const handleClearFilters = () => {
        setSelectedCategory("All Properties");
        setSelectedListingType("All");
        setSelectedRentalPeriod("All");
        setSelectedCity("All Cities");
        setPage(1);
    };

    const hasActiveFilters =
        selectedCategory !== "All Properties" ||
        selectedListingType !== "All" ||
        selectedRentalPeriod !== "All" ||
        selectedCity !== "All Cities";

    // Pagination
    const handlePageChange = (_event, value) => {
        setPage(value);

        if (listRef?.current) {
            listRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    // Current tab data
    const currentPublications =
        activeTab === "properties"
            ? filteredProperties
            : activeTab === "roommates"
                ? filteredRoommates
                : establishments;

    const totalPages = Math.ceil(
        currentPublications.length / itemsPerPage
    );

    const displayedPublications = currentPublications.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Translate property category labels
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

    const categoryLabel = getCategoryLabel(selectedCategory);

    // Empty state
    const isEmpty = currentPublications.length === 0;

    const isCompletelyEmpty =
        properties.length === 0 &&
        roommates.length === 0 &&
        establishments.length === 0 &&
        !error &&
        !roommateError &&
        !establishmentError;

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

    return (
        <Box
            ref={listRef}
            sx={{
                scrollMarginTop: "0px",
                width: "100%",
                maxWidth: "100%",
                mx: "auto",
                p: showTabs
                    ? { xs: 2, md: 4 }
                    : { xs: 0, md: 0 },
            }}
        >
            {showTabs && (
                <PageHeader
                    icon={<LibraryBooksOutlinedIcon />}
                    title={t("topbar.myPublication", "My publications")}
                    subtitle={t("properties.profileList.pageSubtitle", "Manage your properties, roommate announcements and establishments.")}
                />
            )}

            {/* Property filters */}
            {activeTab !== "establishments" && (
                <Box sx={{ mt: showTabs ? 0 : 1 }}>
                    <PropertyCategoryBar
                        properties={properties}
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                        selectedListingType={selectedListingType}
                        onListingTypeChange={handleListingTypeChange}
                        selectedRentalPeriod={selectedRentalPeriod}
                        onRentalPeriodChange={handleRentalPeriodChange}
                        selectedCity={selectedCity}
                        onCityChange={handleCityChange}
                    />
                </Box>
            )}

            {/* Publication tabs */}
            {showTabs && (
                <Box
                    sx={{
                        mt: 3,
                        mb: 3,
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            "& .MuiTab-root": {
                                minHeight: 52,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: { xs: 13, sm: 15 },
                            },
                        }}
                    >
                        <Tab
                            value="properties"
                            icon={<HomeWorkIcon />}
                            iconPosition="start"
                            label={t("profileRoommate.myProperties", "My Properties")}
                        />

                        <Tab
                            value="roommates"
                            icon={<PeopleIcon />}
                            iconPosition="start"
                            label={t(
                                "profileRoommate.myRoommatePublications",
                                "My Roommate Publications"
                            )}
                        />

                        <Tab
                            value="establishments"
                            icon={<HotelIcon />}
                            iconPosition="start"
                            label={t(
                                "profileEstablishment.myEstablishments",
                                "My Establishments"
                            )}
                        />
                    </Tabs>
                </Box>
            )}

            {/* Property fetch error */}
            {error && activeTab === "properties" && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Roommate fetch error */}
            {roommateError && activeTab === "roommates" && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {roommateError}
                </Alert>
            )}

            {/* Establishment fetch error */}
            {establishmentError && activeTab === "establishments" && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {establishmentError}
                </Alert>
            )}

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
                    {activeTab === "properties"
                        ? selectedCategory === "All Properties"
                            ? t("properties.profileList.myPublications")
                            : t("properties.profileList.categoryPublications", {
                                category: categoryLabel,
                            })
                        : activeTab === "roommates"
                            ? t(
                                "profileRoommate.myRoommatePublications",
                                "My Roommate Publications"
                            )
                            : t(
                                "profileEstablishment.myEstablishments",
                                "My Establishments"
                            )}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: "#64748B",
                        fontWeight: 600,
                    }}
                >
                    {activeTab === "properties"
                        ? t("properties.list.propertyCount", {
                            count: filteredProperties.length,
                        })
                        : activeTab === "roommates"
                            ? t("profileRoommate.publicationCount", {
                                count: filteredRoommates.length,
                                defaultValue: "{{count}} roommate publications",
                            })
                            : t("profileEstablishment.publicationCount", {
                                count: establishments.length,
                                defaultValue: "{{count}} establishments",
                            })}
                </Typography>
            </Box>

            {/* Empty state */}
            {isEmpty ? (
                <Box
                    sx={{
                        py: 6,
                        px: 2,
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
                        {activeTab === "properties"
                            ? isCompletelyEmpty
                                ? t("properties.profileList.noProperties")
                                : hasActiveFilters
                                    ? t("properties.list.emptyTitle")
                                    : t("properties.profileList.noProperties")
                            : activeTab === "roommates"
                                ? t(
                                    "profileRoommate.noPublications",
                                    "You haven't published any roommate announcements yet."
                                )
                                : t(
                                    "profileEstablishment.noEstablishments",
                                    "You haven't published any establishments yet."
                                )}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#64748B",
                            mb: 2,
                        }}
                    >
                        {activeTab === "establishments"
                            ? t(
                                "profileEstablishment.emptySubtitle",
                                "Your published hotels and riads will appear here."
                            )
                            : t("properties.profileList.emptySubtitle")}
                    </Typography>

                    {hasActiveFilters && activeTab !== "establishments" && (
                        <Button
                            variant="outlined"
                            onClick={handleClearFilters}
                            sx={{ textTransform: "none" }}
                        >
                            {t("properties.filter.clearFilters")}
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    {/* Publication cards */}
                    <Stack spacing={2.5}>
                        {displayedPublications.map((publication) => {
                            const publicationId = String(
                                publication?._id ||
                                publication?.id ||
                                ""
                            );

                            if (activeTab === "properties") {
                                const formattedProperty = {
                                    ...publication,
                                    rentalPeriod: publication.rentalPeriod || null,
                                    furnishingStatus:
                                        publication.furnishingStatus || null,
                                };

                                return (
                                    <UserProfilePropertyCard
                                        key={publicationId || `property-${Math.random()}`}
                                        property={formattedProperty}
                                        onViewDetails={
                                            onSelectProperty
                                                ? (property) => onSelectProperty(property)
                                                : undefined
                                        }
                                        onDelete={handleDeleteProperty}
                                    />
                                );
                            }

                            if (activeTab === "roommates") {
                                return (
                                    <UserProfileRoommateCard
                                        key={publicationId || `roommate-${Math.random()}`}
                                        roommate={publication}
                                        onDelete={handleDeleteRoommate}
                                        onStatusChange={handleUpdateRoommateStatus}
                                    />
                                );
                            }

                            if (activeTab === "establishments") {
                                if (!publicationId) {
                                    console.error(
                                        "Establishment has no valid ID:",
                                        publication
                                    );

                                    return null;
                                }

                                return (
                                    <UserProfileEstablishmentCard
                                        key={publicationId}
                                        establishment={{
                                            ...publication,
                                            _id: publicationId,
                                        }}
                                        onDelete={handleDeleteEstablishment}
                                    />
                                );
                            }

                            return null;
                        })}
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
