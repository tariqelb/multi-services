import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import {
    Alert,
    Box,
    CircularProgress,
    Typography,
    Chip,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../api/axiosInstance";

import PropertyMap from "./PropertyMap";
import FindByMapFilters from "./FindByMapFilters";

import "./findByMap.css";

const isLocatedInMorocco = (listing) => {
    const lat = Number(listing.location?.lat);
    const lng = Number(listing.location?.lng);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= 20 &&
        lat <= 36 &&
        lng >= -18 &&
        lng <= -0.5
    );
};

const getRoomPrice = (establishment) => {
    const prices = Array.isArray(establishment.rooms)
        ? establishment.rooms
            .map((room) => Number(room.pricePerNight))
            .filter((price) => Number.isFinite(price) && price >= 0)
        : [];

    return prices.length > 0 ? Math.min(...prices) : null;
};

const getEstablishmentsFromResponse = (data) => {
    if (Array.isArray(data)) return data;

    return (
        data?.establishments ||
        data?.data?.establishments ||
        data?.data ||
        []
    );
};

export default function FindByMap() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [properties, setProperties] = useState([]);
    const [roommates, setRoommates] = useState([]);
    const [establishments, setEstablishments] = useState([]);

    const [filters, setFilters] = useState({
        city: "All",
        propertyType: "All",
        accommodationType: "All",
        listingType: "All",
        rentalType: "All",
        maxPrice: "",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch properties, roommates and establishments.
    useEffect(() => {
        let isMounted = true;

        const fetchProperties = async () => {
            const response = await axiosInstance.get("/property/getlist");
            const data = response.data;

            return Array.isArray(data)
                ? data
                : data?.properties ||
                  data?.data ||
                  data?.results ||
                  [];
        };

        const fetchRoommates = async () => {
            const response = await axiosInstance.get("/property/roommates", {
                params: {
                    page: 1,
                    limit: 30,
                    includeFull: true,
                },
            });

            const data = response.data;

            const firstPageListings = Array.isArray(data)
                ? data
                : data?.listings ||
                  data?.roommates ||
                  data?.data ||
                  [];

            const pagination = data?.pagination;

            const totalPages = Math.max(
                1,
                Number(
                    pagination?.totalPages ??
                    pagination?.pages ??
                    1
                )
            );

            if (totalPages > 1) {
                const remainingRequests = [];

                for (let page = 2; page <= totalPages; page++) {
                    remainingRequests.push(
                        axiosInstance.get("/property/roommates", {
                            params: {
                                page,
                                limit: 30,
                                includeFull: true,
                            },
                        })
                    );
                }

                const remainingResponses =
                    await Promise.all(remainingRequests);

                const remainingListings = remainingResponses.flatMap(
                    (item) => {
                        const pageData = item.data;

                        if (Array.isArray(pageData)) return pageData;

                        return (
                            pageData?.listings ||
                            pageData?.roommates ||
                            pageData?.data ||
                            []
                        );
                    }
                );

                return [
                    ...firstPageListings,
                    ...remainingListings,
                ];
            }

            return firstPageListings;
        };

        const fetchEstablishments = async () => {
            const limit = 50;

            const firstResponse = await axiosInstance.get(
                "/property/establishments",
                {
                    params: {
                        page: 1,
                        limit,
                    },
                }
            );

            const firstData = firstResponse.data;
            const firstPage = getEstablishmentsFromResponse(firstData);

            const totalPages = Math.max(
                1,
                Number(firstData?.pagination?.totalPages || 1)
            );

            if (totalPages <= 1) {
                return firstPage;
            }

            const remainingRequests = [];

            for (let page = 2; page <= totalPages; page++) {
                remainingRequests.push(
                    axiosInstance.get("/property/establishments", {
                        params: {
                            page,
                            limit,
                        },
                    })
                );
            }

            const remainingResponses =
                await Promise.all(remainingRequests);

            return [
                ...firstPage,
                ...remainingResponses.flatMap((response) =>
                    getEstablishmentsFromResponse(response.data)
                ),
            ];
        };

        const loadMapListings = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    propertyResult,
                    roommateResult,
                    establishmentResult,
                ] = await Promise.allSettled([
                    fetchProperties(),
                    fetchRoommates(),
                    fetchEstablishments(),
                ]);

                if (!isMounted) return;

                if (propertyResult.status === "fulfilled") {
                    setProperties(
                        Array.isArray(propertyResult.value)
                            ? propertyResult.value
                            : []
                    );
                } else {
                    console.error(
                        "Failed to load properties:",
                        propertyResult.reason
                    );
                    setProperties([]);
                }

                if (roommateResult.status === "fulfilled") {
                    setRoommates(
                        Array.isArray(roommateResult.value)
                            ? roommateResult.value
                            : []
                    );
                } else {
                    console.error(
                        "Failed to load roommates:",
                        roommateResult.reason
                    );
                    setRoommates([]);
                }

                if (establishmentResult.status === "fulfilled") {
                    setEstablishments(
                        Array.isArray(establishmentResult.value)
                            ? establishmentResult.value
                            : []
                    );
                } else {
                    console.error(
                        "Failed to load establishments:",
                        establishmentResult.reason
                    );
                    setEstablishments([]);
                }

                if (
                    propertyResult.status === "rejected" &&
                    roommateResult.status === "rejected" &&
                    establishmentResult.status === "rejected"
                ) {
                    setError(
                        t("findMap.errors.allListings")
                    );
                }
            } catch (err) {
                console.error("Failed to load map listings:", err);

                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        t("findMap.errors.loadMap")
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadMapListings();

        return () => {
            isMounted = false;
        };
    }, [t]);

    // Keep listings with valid Moroccan coordinates.
    const locatedProperties = useMemo(
        () => properties.filter(isLocatedInMorocco),
        [properties]
    );

    const locatedRoommates = useMemo(
        () => roommates.filter(isLocatedInMorocco),
        [roommates]
    );

    const locatedEstablishments = useMemo(
        () => establishments.filter(isLocatedInMorocco),
        [establishments]
    );

    // Combine cities from all listing types.
    const cities = useMemo(() => {
        return [
            ...new Set([
                ...locatedProperties.map((item) => item.city),
                ...locatedRoommates.map((item) => item.city),
                ...locatedEstablishments.map(
                    (item) => item.location?.city
                ),
            ].filter(Boolean)),
        ].sort((a, b) => a.localeCompare(b));
    }, [
        locatedProperties,
        locatedRoommates,
        locatedEstablishments,
    ]);

    // Property types remain separate from accommodation types.
    const propertyTypes = useMemo(() => {
        return [
            ...new Set([
                ...locatedProperties.map((item) => item.propertyType),
                ...locatedRoommates.map((item) => item.propertyType),
            ].filter(Boolean)),
        ].sort((a, b) => a.localeCompare(b));
    }, [locatedProperties, locatedRoommates]);

    // Filter properties.
    const filteredProperties = useMemo(() => {
        return locatedProperties.filter((property) => {
            const matchesCity =
                filters.city === "All" ||
                property.city === filters.city;

            const matchesType =
                filters.propertyType === "All" ||
                property.propertyType === filters.propertyType;

            const matchesListing =
                filters.listingType === "All" ||
                property.listingType === filters.listingType;

            const matchesRentalType =
                filters.listingType !== "For Rent" ||
                filters.rentalType !== "Roommate";

            const matchesPrice =
                !filters.maxPrice ||
                Number(property.price) <= Number(filters.maxPrice);

            return (
                matchesCity &&
                matchesType &&
                matchesListing &&
                matchesRentalType &&
                matchesPrice
            );
        });
    }, [locatedProperties, filters]);

    // Filter roommates.
    const filteredRoommates = useMemo(() => {
        return locatedRoommates.filter((roommate) => {
            const matchesCity =
                filters.city === "All" ||
                roommate.city === filters.city;

            const matchesType =
                filters.propertyType === "All" ||
                roommate.propertyType === filters.propertyType;

            const matchesListing =
                filters.listingType === "All" ||
                filters.listingType === "For Rent";

            const matchesRentalType =
                filters.listingType !== "For Rent" ||
                filters.rentalType !== "Property";

            const roommatePrice = Number(
                roommate.rentPerPerson ??
                roommate.individualRoomPrice ??
                roommate.totalRent
            );

            const matchesPrice =
                !filters.maxPrice ||
                (
                    Number.isFinite(roommatePrice) &&
                    roommatePrice <= Number(filters.maxPrice)
                );

            return (
                matchesCity &&
                matchesType &&
                matchesListing &&
                matchesRentalType &&
                matchesPrice
            );
        });
    }, [locatedRoommates, filters]);

    // Filter establishments.
    const filteredEstablishments = useMemo(() => {
        return locatedEstablishments.filter((establishment) => {
            const matchesCity =
                filters.city === "All" ||
                establishment.location?.city === filters.city;

            const matchesAccommodationType =
                filters.accommodationType === "All" ||
                establishment.accommodationType ===
                    filters.accommodationType;

            const roomPrice = getRoomPrice(establishment);

            const matchesPrice =
                !filters.maxPrice ||
                (
                    roomPrice !== null &&
                    roomPrice <= Number(filters.maxPrice)
                );

            return (
                matchesCity &&
                matchesAccommodationType &&
                matchesPrice
            );
        });
    }, [locatedEstablishments, filters]);

    // Navigate to property details.
    const handlePropertyClick = (property) => {
        const propertyId = property?._id || property?.id;

        if (!propertyId) {
            console.error("Property ID is missing:", property);
            return;
        }

        navigate(`/properties/${propertyId}`, {
            state: { property },
        });
    };

    // Navigate to roommate details.
    const handleRoommateClick = (roommate) => {
        const roommateId = roommate?._id || roommate?.id;

        if (!roommateId) {
            console.error("Roommate ID is missing:", roommate);
            return;
        }

        navigate(`/roommates/${roommateId}`, {
            state: { roommate },
        });
    };

    // Navigate to establishment details.
    const handleEstablishmentClick = (establishment) => {
        const establishmentId =
            establishment?._id || establishment?.id;

        if (!establishmentId) {
            console.error(
                "Establishment ID is missing:",
                establishment
            );
            return;
        }

        navigate(`/establishments/${establishmentId}`, {
            state: { establishment },
        });
    };

    const totalDisplayed =
        filteredProperties.length +
        filteredRoommates.length +
        filteredEstablishments.length;

    return (
        <Box className="find-map-page" sx={pagePaddingSx}>
            {/* Header */}
            <PageHeader
                icon={<TravelExploreOutlinedIcon />}
                title={t("findMap.title")}
                subtitle={t("findMap.subtitle")}
                action={
                    <Chip
                        color="primary"
                        variant="outlined"
                        label={t("findMap.listingsOnMap", { count: totalDisplayed })}
                        sx={{ fontWeight: 700 }}
                    />
                }
                sx={{ mb: 0 }}
            />

            {/* Filters */}
            <FindByMapFilters
                filters={filters}
                setFilters={setFilters}
                cities={cities}
                propertyTypes={propertyTypes}
            />

            {/* Map content */}
            {loading ? (
                <Box className="find-map-loading">
                    <CircularProgress />

                    <Typography sx={{ color: "text.secondary" }}>
                        {t("findMap.loading")}
                    </Typography>
                </Box>
            ) : error ? (
                <Box className="find-map-message">
                    <Alert severity="error">
                        {error}
                    </Alert>
                </Box>
            ) : totalDisplayed === 0 ? (
                <Box className="find-map-message">
                    <Typography sx={{ fontWeight: 600 }}>
                        {t("findMap.empty.title")}
                    </Typography>

                    <Typography sx={{ color: "text.secondary" }}>
                        {t("findMap.empty.subtitle")}
                    </Typography>
                </Box>
            ) : (
                <PropertyMap
                    properties={filteredProperties}
                    roommates={filteredRoommates}
                    establishments={filteredEstablishments}
                    onPropertyClick={handlePropertyClick}
                    onRoommateClick={handleRoommateClick}
                    onEstablishmentClick={handleEstablishmentClick}
                />
            )}
        </Box>
    );
}
// import React, {
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import {
//     Alert,
//     Box,
//     CircularProgress,
//     Typography,
// } from "@mui/material";

// import { useNavigate } from "react-router-dom";

// import axiosInstance from "../../api/axiosInstance";

// import PropertyMap from "./PropertyMap";
// import FindByMapFilters from "./FindByMapFilters";

// import "./findByMap.css";

// const isLocatedInMorocco = (listing) => {
//     const lat = Number(listing.location?.lat);
//     const lng = Number(listing.location?.lng);

//     return (
//         Number.isFinite(lat) &&
//         Number.isFinite(lng) &&
//         lat >= 20 &&
//         lat <= 36 &&
//         lng >= -18 &&
//         lng <= -0.5
//     );
// };

// const getRoomPrice = (establishment) => {
//     const prices = Array.isArray(establishment.rooms)
//         ? establishment.rooms
//             .map((room) => Number(room.pricePerNight))
//             .filter((price) => Number.isFinite(price) && price >= 0)
//         : [];

//     return prices.length > 0 ? Math.min(...prices) : null;
// };

// const getEstablishmentsFromResponse = (data) => {
//     if (Array.isArray(data)) return data;

//     return (
//         data?.establishments ||
//         data?.data?.establishments ||
//         data?.data ||
//         []
//     );
// };

// export default function FindByMap() {
//     const navigate = useNavigate();

//     const [properties, setProperties] = useState([]);
//     const [roommates, setRoommates] = useState([]);
//     const [establishments, setEstablishments] = useState([]);

//     const [filters, setFilters] = useState({
//         city: "All",
//         propertyType: "All",
//         accommodationType: "All",
//         listingType: "All",
//         rentalType: "All",
//         maxPrice: "",
//     });

//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");

//     // Fetch properties, roommates and establishments.
//     useEffect(() => {
//         let isMounted = true;

//         const fetchProperties = async () => {
//             const response = await axiosInstance.get("/property/getlist");
//             const data = response.data;

//             return Array.isArray(data)
//                 ? data
//                 : data?.properties ||
//                   data?.data ||
//                   data?.results ||
//                   [];
//         };

//         const fetchRoommates = async () => {
//             const response = await axiosInstance.get("/roommates", {
//                 params: {
//                     page: 1,
//                     limit: 30,
//                     includeFull: true,
//                 },
//             });

//             const data = response.data;

//             const firstPageListings = Array.isArray(data)
//                 ? data
//                 : data?.listings ||
//                   data?.roommates ||
//                   data?.data ||
//                   [];

//             const pagination = data?.pagination;

//             const totalPages = Math.max(
//                 1,
//                 Number(
//                     pagination?.totalPages ??
//                     pagination?.pages ??
//                     1
//                 )
//             );

//             if (totalPages > 1) {
//                 const remainingRequests = [];

//                 for (let page = 2; page <= totalPages; page++) {
//                     remainingRequests.push(
//                         axiosInstance.get("/roommates", {
//                             params: {
//                                 page,
//                                 limit: 30,
//                                 includeFull: true,
//                             },
//                         })
//                     );
//                 }

//                 const remainingResponses =
//                     await Promise.all(remainingRequests);

//                 const remainingListings = remainingResponses.flatMap(
//                     (item) => {
//                         const pageData = item.data;

//                         if (Array.isArray(pageData)) return pageData;

//                         return (
//                             pageData?.listings ||
//                             pageData?.roommates ||
//                             pageData?.data ||
//                             []
//                         );
//                     }
//                 );

//                 return [
//                     ...firstPageListings,
//                     ...remainingListings,
//                 ];
//             }

//             return firstPageListings;
//         };

//         const fetchEstablishments = async () => {
//             const limit = 50;

//             const firstResponse = await axiosInstance.get(
//                 "/establishments",
//                 {
//                     params: {
//                         page: 1,
//                         limit,
//                     },
//                 }
//             );

//             const firstData = firstResponse.data;
//             const firstPage = getEstablishmentsFromResponse(firstData);

//             const totalPages = Math.max(
//                 1,
//                 Number(firstData?.pagination?.totalPages || 1)
//             );

//             if (totalPages <= 1) {
//                 return firstPage;
//             }

//             const remainingRequests = [];

//             for (let page = 2; page <= totalPages; page++) {
//                 remainingRequests.push(
//                     axiosInstance.get("/establishments", {
//                         params: {
//                             page,
//                             limit,
//                         },
//                     })
//                 );
//             }

//             const remainingResponses =
//                 await Promise.all(remainingRequests);

//             return [
//                 ...firstPage,
//                 ...remainingResponses.flatMap((response) =>
//                     getEstablishmentsFromResponse(response.data)
//                 ),
//             ];
//         };

//         const loadMapListings = async () => {
//             try {
//                 setLoading(true);
//                 setError("");

//                 const [
//                     propertyResult,
//                     roommateResult,
//                     establishmentResult,
//                 ] = await Promise.allSettled([
//                     fetchProperties(),
//                     fetchRoommates(),
//                     fetchEstablishments(),
//                 ]);

//                 if (!isMounted) return;

//                 if (propertyResult.status === "fulfilled") {
//                     setProperties(
//                         Array.isArray(propertyResult.value)
//                             ? propertyResult.value
//                             : []
//                     );
//                 } else {
//                     console.error(
//                         "Failed to load properties:",
//                         propertyResult.reason
//                     );
//                     setProperties([]);
//                 }

//                 if (roommateResult.status === "fulfilled") {
//                     setRoommates(
//                         Array.isArray(roommateResult.value)
//                             ? roommateResult.value
//                             : []
//                     );
//                 } else {
//                     console.error(
//                         "Failed to load roommates:",
//                         roommateResult.reason
//                     );
//                     setRoommates([]);
//                 }

//                 if (establishmentResult.status === "fulfilled") {
//                     setEstablishments(
//                         Array.isArray(establishmentResult.value)
//                             ? establishmentResult.value
//                             : []
//                     );
//                 } else {
//                     console.error(
//                         "Failed to load establishments:",
//                         establishmentResult.reason
//                     );
//                     setEstablishments([]);
//                 }

//                 if (
//                     propertyResult.status === "rejected" &&
//                     roommateResult.status === "rejected" &&
//                     establishmentResult.status === "rejected"
//                 ) {
//                     setError(
//                         "Unable to load properties, roommates and establishments. Please try again."
//                     );
//                 }
//             } catch (err) {
//                 console.error("Failed to load map listings:", err);

//                 if (isMounted) {
//                     setError(
//                         err.response?.data?.message ||
//                         "Unable to load map listings. Please try again."
//                     );
//                 }
//             } finally {
//                 if (isMounted) {
//                     setLoading(false);
//                 }
//             }
//         };

//         loadMapListings();

//         return () => {
//             isMounted = false;
//         };
//     }, []);

//     // Keep listings with valid Moroccan coordinates.
//     const locatedProperties = useMemo(
//         () => properties.filter(isLocatedInMorocco),
//         [properties]
//     );

//     const locatedRoommates = useMemo(
//         () => roommates.filter(isLocatedInMorocco),
//         [roommates]
//     );

//     const locatedEstablishments = useMemo(
//         () => establishments.filter(isLocatedInMorocco),
//         [establishments]
//     );

//     // Combine cities from all listing types.
//     const cities = useMemo(() => {
//         return [
//             ...new Set([
//                 ...locatedProperties.map((item) => item.city),
//                 ...locatedRoommates.map((item) => item.city),
//                 ...locatedEstablishments.map(
//                     (item) => item.location?.city
//                 ),
//             ].filter(Boolean)),
//         ].sort((a, b) => a.localeCompare(b));
//     }, [
//         locatedProperties,
//         locatedRoommates,
//         locatedEstablishments,
//     ]);

//     // Property types remain separate from accommodation types.
//     const propertyTypes = useMemo(() => {
//         return [
//             ...new Set([
//                 ...locatedProperties.map((item) => item.propertyType),
//                 ...locatedRoommates.map((item) => item.propertyType),
//             ].filter(Boolean)),
//         ].sort((a, b) => a.localeCompare(b));
//     }, [locatedProperties, locatedRoommates]);

//     // Filter properties.
//     const filteredProperties = useMemo(() => {
//         return locatedProperties.filter((property) => {
//             const matchesCity =
//                 filters.city === "All" ||
//                 property.city === filters.city;

//             const matchesType =
//                 filters.propertyType === "All" ||
//                 property.propertyType === filters.propertyType;

//             const matchesListing =
//                 filters.listingType === "All" ||
//                 property.listingType === filters.listingType;

//             const matchesRentalType =
//                 filters.listingType !== "For Rent" ||
//                 filters.rentalType !== "Roommate";

//             const matchesPrice =
//                 !filters.maxPrice ||
//                 Number(property.price) <= Number(filters.maxPrice);

//             return (
//                 matchesCity &&
//                 matchesType &&
//                 matchesListing &&
//                 matchesRentalType &&
//                 matchesPrice
//             );
//         });
//     }, [locatedProperties, filters]);

//     // Filter roommates.
//     const filteredRoommates = useMemo(() => {
//         return locatedRoommates.filter((roommate) => {
//             const matchesCity =
//                 filters.city === "All" ||
//                 roommate.city === filters.city;

//             const matchesType =
//                 filters.propertyType === "All" ||
//                 roommate.propertyType === filters.propertyType;

//             const matchesListing =
//                 filters.listingType === "All" ||
//                 filters.listingType === "For Rent";

//             const matchesRentalType =
//                 filters.listingType !== "For Rent" ||
//                 filters.rentalType !== "Property";

//             const roommatePrice = Number(
//                 roommate.rentPerPerson ??
//                 roommate.individualRoomPrice ??
//                 roommate.totalRent
//             );

//             const matchesPrice =
//                 !filters.maxPrice ||
//                 (
//                     Number.isFinite(roommatePrice) &&
//                     roommatePrice <= Number(filters.maxPrice)
//                 );

//             return (
//                 matchesCity &&
//                 matchesType &&
//                 matchesListing &&
//                 matchesRentalType &&
//                 matchesPrice
//             );
//         });
//     }, [locatedRoommates, filters]);

//     // Filter establishments.
//     const filteredEstablishments = useMemo(() => {
//         return locatedEstablishments.filter((establishment) => {
//             const matchesCity =
//                 filters.city === "All" ||
//                 establishment.location?.city === filters.city;

//             const matchesAccommodationType =
//                 filters.accommodationType === "All" ||
//                 establishment.accommodationType ===
//                     filters.accommodationType;

//             const roomPrice = getRoomPrice(establishment);

//             const matchesPrice =
//                 !filters.maxPrice ||
//                 (
//                     roomPrice !== null &&
//                     roomPrice <= Number(filters.maxPrice)
//                 );

//             return (
//                 matchesCity &&
//                 matchesAccommodationType &&
//                 matchesPrice
//             );
//         });
//     }, [locatedEstablishments, filters]);

//     // Navigate to property details.
//     const handlePropertyClick = (property) => {
//         const propertyId = property?._id || property?.id;

//         if (!propertyId) {
//             console.error("Property ID is missing:", property);
//             return;
//         }

//         navigate(`/properties/${propertyId}`, {
//             state: { property },
//         });
//     };

//     // Navigate to roommate details.
//     const handleRoommateClick = (roommate) => {
//         const roommateId = roommate?._id || roommate?.id;

//         if (!roommateId) {
//             console.error("Roommate ID is missing:", roommate);
//             return;
//         }

//         navigate(`/roommates/${roommateId}`, {
//             state: { roommate },
//         });
//     };

//     // Navigate to establishment details.
//     const handleEstablishmentClick = (establishment) => {
//         const establishmentId =
//             establishment?._id || establishment?.id;

//         if (!establishmentId) {
//             console.error(
//                 "Establishment ID is missing:",
//                 establishment
//             );
//             return;
//         }

//         navigate(`/establishments/${establishmentId}`, {
//             state: { establishment },
//         });
//     };

//     const totalDisplayed =
//         filteredProperties.length +
//         filteredRoommates.length +
//         filteredEstablishments.length;

//     return (
//         <Box className="find-map-page">
//             {/* Header */}
//             <Box className="find-map-header">
//                 <Box>
//                     <Typography variant="h5" fontWeight={700}>
//                         Find Properties, Roommates and Establishments on Map
//                     </Typography>

//                     <Typography
//                         variant="body2"
//                         color="text.secondary"
//                     >
//                         Explore properties, roommate announcements,
//                         hotels, riads and other accommodations across Morocco.
//                     </Typography>
//                 </Box>

//                 <Typography className="find-map-count">
//                     {totalDisplayed} listings on map
//                 </Typography>
//             </Box>

//             {/* Filters */}
//             <FindByMapFilters
//                 filters={filters}
//                 setFilters={setFilters}
//                 cities={cities}
//                 propertyTypes={propertyTypes}
//             />

//             {/* Map content */}
//             {loading ? (
//                 <Box className="find-map-loading">
//                     <CircularProgress />

//                     <Typography color="text.secondary">
//                         Loading properties, roommates and establishments...
//                     </Typography>
//                 </Box>
//             ) : error ? (
//                 <Box className="find-map-message">
//                     <Alert severity="error">
//                         {error}
//                     </Alert>
//                 </Box>
//             ) : totalDisplayed === 0 ? (
//                 <Box className="find-map-message">
//                     <Typography fontWeight={600}>
//                         No listings with map coordinates found.
//                     </Typography>

//                     <Typography color="text.secondary">
//                         Listings need valid Moroccan map coordinates
//                         to appear here.
//                     </Typography>
//                 </Box>
//             ) : (
//                 <PropertyMap
//                     properties={filteredProperties}
//                     roommates={filteredRoommates}
//                     establishments={filteredEstablishments}
//                     onPropertyClick={handlePropertyClick}
//                     onRoommateClick={handleRoommateClick}
//                     onEstablishmentClick={handleEstablishmentClick}
//                 />
//             )}
//         </Box>
//     );
// }
