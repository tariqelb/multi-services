import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTranslation } from "react-i18next";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { createRoot } from "react-dom/client";

import {
    Alert,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";

import PropertyMapCard from "./PropertyMapCard";
import RoommateMapCard from "./RoommateMapCard";
import EstablishmentMapCard from "./EstablishmentMapCard";

maplibregl.setWorkerUrl(workerUrl);

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const MAPTILER_MAP_ID =
    import.meta.env.VITE_MAPTILER_MAP_ID || "streets-v4";

const MAPTILER_STYLE_URL =
    `https://api.maptiler.com/maps/${MAPTILER_MAP_ID}/style.json?key=${MAPTILER_API_KEY}`;

const moroccoCenter = {
    lat: 31.7917,
    lng: -7.0926,
};

const initialZoom = 6;

const isFurnishedRental = (property) => {
    return (
        String(property?.listingType || "").trim().toLowerCase() === "for rent" &&
        String(property?.furnishingStatus || "").trim().toLowerCase() === "furnished" &&
        ["room", "studio", "apartment", "villa", "house"].includes(
            String(property?.propertyType || "").trim().toLowerCase()
        )
    );
};

const hasValidCoordinates = (item) => {
    const lat = item?.location?.lat;
    const lng = item?.location?.lng;

    if (
        lat === null ||
        lat === undefined ||
        lat === "" ||
        lng === null ||
        lng === undefined ||
        lng === ""
    ) {
        return false;
    }

    const numericLat = Number(lat);
    const numericLng = Number(lng);

    return (
        Number.isFinite(numericLat) &&
        Number.isFinite(numericLng) &&
        numericLat >= 20 &&
        numericLat <= 36 &&
        numericLng >= -18 &&
        numericLng <= -0.5
    );
};

export default function PropertyMap({
    properties = [],
    roommates = [],
    establishments = [],
    onPropertyClick,
    onRoommateClick,
    onEstablishmentClick,
}) {
    const { t } = useTranslation();

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    const onPropertyClickRef = useRef(onPropertyClick);
    const onRoommateClickRef = useRef(onRoommateClick);
    const onEstablishmentClickRef = useRef(onEstablishmentClick);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState("");

    onPropertyClickRef.current = onPropertyClick;
    onRoommateClickRef.current = onRoommateClick;
    onEstablishmentClickRef.current = onEstablishmentClick;

    const validProperties = useMemo(
        () => properties.filter(hasValidCoordinates),
        [properties]
    );

    const validRoommates = useMemo(
        () => roommates.filter(hasValidCoordinates),
        [roommates]
    );

    const validEstablishments = useMemo(
        () => establishments.filter(hasValidCoordinates),
        [establishments]
    );

    const regularProperties = useMemo(
        () => validProperties.filter((item) => !isFurnishedRental(item)),
        [validProperties]
    );

    const furnishedProperties = useMemo(
        () => validProperties.filter(isFurnishedRental),
        [validProperties]
    );

    // Initialize MapTiler / MapLibre.
    useEffect(() => {
        let cancelled = false;
        let map = null;

        const initializeMap = async () => {
            if (!mapContainerRef.current || !MAPTILER_API_KEY) {
                return;
            }

            try {
                const response = await fetch(MAPTILER_STYLE_URL);

                if (!response.ok) {
                    throw new Error(
                        `MapTiler returned HTTP ${response.status}: ${response.statusText}`
                    );
                }

                if (cancelled) return;

                map = new maplibregl.Map({
                    container: mapContainerRef.current,
                    style: MAPTILER_STYLE_URL,
                    center: [moroccoCenter.lng, moroccoCenter.lat],
                    zoom: initialZoom,
                    attributionControl: true,
                });

                mapRef.current = map;

                map.addControl(
                    new maplibregl.NavigationControl(),
                    "top-right"
                );

                map.addControl(
                    new maplibregl.FullscreenControl(),
                    "top-right"
                );

                map.on("load", () => {
                    if (!cancelled) {
                        setMapLoaded(true);
                        setMapError("");
                    }
                });

                map.on("error", (event) => {
                    console.error("MapLibre resource error:", event.error);
                });
            } catch (error) {
                console.error("Map initialization failed:", error);

                if (!cancelled) {
                    setMapError(error.message || t("findMap.map.unknownError"));
                }
            }
        };

        initializeMap();

        return () => {
            cancelled = true;
            map?.remove();
            mapRef.current = null;
        };
    }, [t]);

    // Create all listing markers.
    useEffect(() => {
        const map = mapRef.current;

        if (!map || !mapLoaded) return;

        // Remove old markers and popups.
        markersRef.current.forEach((item) => {
            clearTimeout(item.closeTimer);
            item.popup.remove();
            item.root.unmount();
            item.marker.remove();
        });

        markersRef.current = [];

        const totalListings =
            validProperties.length +
            validRoommates.length +
            validEstablishments.length;

        if (totalListings === 0) return;

        const bounds = new maplibregl.LngLatBounds();

        const createListingMarker = ({
            listing,
            index,
            type,
        }) => {
            const isRoommate = type === "roommate";
            const isEstablishment = type === "establishment";
            const isFurnished = !isRoommate &&
                !isEstablishment &&
                isFurnishedRental(listing);

            const lat = Number(listing.location.lat);
            const lng = Number(listing.location.lng);
            const coordinates = [lng, lat];

            bounds.extend(coordinates);

            const markerElement = document.createElement("button");
            markerElement.type = "button";

            markerElement.className = isRoommate
                ? "roommate-map-marker"
                : isEstablishment
                    ? "establishment-map-marker"
                    : isFurnished
                        ? "furnished-map-marker"
                        : "property-map-marker";

            const markerLabel = isRoommate
                ? t("findMap.map.markerRoommate")
                : isEstablishment
                    ? t("findMap.map.markerEstablishment")
                    : isFurnished
                        ? t("findMap.map.markerFurnished")
                        : t("findMap.map.markerProperty");

            markerElement.setAttribute(
                "aria-label",
                t("findMap.map.viewMarker", {
                    type: markerLabel,
                    number: index + 1,
                })
            );

            markerElement.title = markerLabel;

            const markerColor = isRoommate
                ? "#16A34A"
                : isEstablishment
                    ? "#7e22ce"
                    : isFurnished
                        ? "#f59e0b"
                        : "#2563EB";

            Object.assign(markerElement.style, {
                width: isEstablishment ? "40px" : "34px",
                height: isEstablishment ? "40px" : "34px",
                padding: "0",
                borderRadius: isRoommate ? "5px" : isEstablishment ? "8px" : "50%",
                backgroundColor: markerColor,
                border: "3px solid white",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                outline: "none",
                transition: "transform 0.15s ease",
                transform: isRoommate
                    ? "rotate(45deg)"
                    : isEstablishment
                        ? "rotate(45deg)"
                        : "none",
            });

            // Establishment marker has a hexagonal shape.
            if (isEstablishment) {
                markerElement.style.clipPath =
                    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
                markerElement.style.borderRadius = "0";
                markerElement.style.transform = "none";
            }

            const numberElement = document.createElement("span");
            numberElement.textContent = String(index + 1);

            if (isRoommate || isEstablishment) {
                Object.assign(numberElement.style, {
                    display: "block",
                    transform: isRoommate
                        ? "rotate(-45deg)"
                        : "none",
                });
            }

            markerElement.appendChild(numberElement);

            // Popup container.
            const popupContainer = document.createElement("div");
            const root = createRoot(popupContainer);

            const popup = new maplibregl.Popup({
                offset: isRoommate ? 24 : 22,
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false,
                maxWidth: "320px",
                className: isRoommate
                    ? "roommate-hover-popup"
                    : isEstablishment
                        ? "establishment-hover-popup"
                        : isFurnished
                            ? "furnished-hover-popup"
                            : "property-hover-popup",
            })
                .setLngLat(coordinates)
                .setDOMContent(popupContainer);

            const markerData = {
                marker: null,
                popup,
                root,
                closeTimer: null,
                popupEventsAttached: false,
            };

            const schedulePopupClose = () => {
                clearTimeout(markerData.closeTimer);

                markerData.closeTimer = setTimeout(() => {
                    popup.remove();
                }, 180);
            };

            const keepPopupOpen = () => {
                clearTimeout(markerData.closeTimer);
            };

            const handleViewDetails = () => {
                clearTimeout(markerData.closeTimer);
                popup.remove();

                if (isRoommate) {
                    onRoommateClickRef.current?.(listing);
                } else if (isEstablishment) {
                    onEstablishmentClickRef.current?.(listing);
                } else {
                    onPropertyClickRef.current?.(listing);
                }
            };

            if (isRoommate) {
                root.render(
                    <RoommateMapCard
                        roommate={listing}
                        onViewDetails={handleViewDetails}
                    />
                );
            } else if (isEstablishment) {
                root.render(
                    <EstablishmentMapCard
                        establishment={listing}
                        onViewDetails={handleViewDetails}
                    />
                );
            } else {
                root.render(
                    <PropertyMapCard
                        property={listing}
                        onViewDetails={handleViewDetails}
                    />
                );
            }

            markerElement.addEventListener("mouseenter", () => {
                clearTimeout(markerData.closeTimer);
                popup.addTo(map);

                if (!markerData.popupEventsAttached) {
                    const popupElement = popup.getElement();

                    popupElement.addEventListener(
                        "mouseenter",
                        keepPopupOpen
                    );

                    popupElement.addEventListener(
                        "mouseleave",
                        schedulePopupClose
                    );

                    markerData.popupEventsAttached = true;
                }
            });

            markerElement.addEventListener(
                "mouseleave",
                schedulePopupClose
            );

            markerElement.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                handleViewDetails();
            });

            const marker = new maplibregl.Marker({
                element: markerElement,
                anchor: "center",
            })
                .setLngLat(coordinates)
                .addTo(map);

            markerData.marker = marker;
            markersRef.current.push(markerData);
        };

        // Regular properties.
        regularProperties.forEach((property, index) => {
            createListingMarker({
                listing: property,
                index,
                type: "property",
            });
        });

        // Furnished rentals.
        furnishedProperties.forEach((property, index) => {
            createListingMarker({
                listing: property,
                index,
                type: "property",
            });
        });

        // Roommates.
        validRoommates.forEach((roommate, index) => {
            createListingMarker({
                listing: roommate,
                index,
                type: "roommate",
            });
        });

        // Establishments.
        validEstablishments.forEach((establishment, index) => {
            createListingMarker({
                listing: establishment,
                index,
                type: "establishment",
            });
        });

        // Fit the map to all displayed listings.
        if (totalListings === 1) {
            const onlyListing =
                validProperties[0] ||
                validRoommates[0] ||
                validEstablishments[0];

            map.flyTo({
                center: [
                    Number(onlyListing.location.lng),
                    Number(onlyListing.location.lat),
                ],
                zoom: 14,
                duration: 700,
            });
        } else {
            map.fitBounds(bounds, {
                padding: 70,
                maxZoom: 13,
                duration: 700,
            });
        }

        return () => {
            markersRef.current.forEach((item) => {
                clearTimeout(item.closeTimer);
                item.popup.remove();
                item.root.unmount();
                item.marker.remove();
            });

            markersRef.current = [];
        };
    }, [
        mapLoaded,
        validProperties,
        validRoommates,
        validEstablishments,
        regularProperties,
        furnishedProperties,
        t,
    ]);

    if (!MAPTILER_API_KEY) {
        return (
            <Alert severity="warning">
                {t("findMap.map.missingApiKey")}
            </Alert>
        );
    }

    if (mapError) {
        return (
            <Alert severity="error">
                <Typography sx={{ fontWeight: 700 }}>
                    {t("findMap.map.loadFailed")}
                </Typography>

                <Typography variant="body2">
                    {mapError}
                </Typography>

                {t("findMap.map.checkConfiguration")}
            </Alert>
        );
    }

    return (
        <Box className="property-map-wrapper">
            {!mapLoaded && (
                <Box
                    className="find-map-loading"
                    sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        backgroundColor: "background.paper",
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ color: "text.secondary" }}>
                        {t("findMap.map.loading")}
                    </Typography>
                </Box>
            )}

            <Box
                ref={mapContainerRef}
                className="property-map-canvas"
                sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            />

            <Box className="property-map-legend">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: "#2563EB",
                        }}
                    />
                    <Typography variant="caption">
                        {t("findMap.legend.properties", {
                            count: regularProperties.length,
                        })}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: "#f59e0b",
                        }}
                    />
                    <Typography variant="caption">
                        {t("findMap.legend.furnishedRentals", {
                            count: furnishedProperties.length,
                        })}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box
                        sx={{
                            width: 11,
                            height: 11,
                            backgroundColor: "#16A34A",
                            transform: "rotate(45deg)",
                        }}
                    />
                    <Typography variant="caption">
                        {t("findMap.legend.roommates", {
                            count: validRoommates.length,
                        })}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                        sx={{
                            width: 13,
                            height: 13,
                            backgroundColor: "#7e22ce",
                            clipPath:
                                "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                        }}
                    />
                    <Typography variant="caption">
                        {t("findMap.legend.establishments", {
                            count: validEstablishments.length,
                        })}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
// import React, {
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
// } from "react";

// import * as maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";

// import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
// import { createRoot } from "react-dom/client";

// import {
//     Alert,
//     Box,
//     CircularProgress,
//     Typography,
// } from "@mui/material";

// import PropertyMapCard from "./PropertyMapCard";
// import RoommateMapCard from "./RoommateMapCard";
// import EstablishmentMapCard from "./EstablishmentMapCard";

// maplibregl.setWorkerUrl(workerUrl);

// const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

// const MAPTILER_MAP_ID =
//     import.meta.env.VITE_MAPTILER_MAP_ID || "streets-v4";

// const MAPTILER_STYLE_URL =
//     `https://api.maptiler.com/maps/${MAPTILER_MAP_ID}/style.json?key=${MAPTILER_API_KEY}`;

// const moroccoCenter = {
//     lat: 31.7917,
//     lng: -7.0926,
// };

// const initialZoom = 6;

// const isFurnishedRental = (property) => {
//     return (
//         String(property?.listingType || "").trim().toLowerCase() === "for rent" &&
//         String(property?.furnishingStatus || "").trim().toLowerCase() === "furnished" &&
//         ["room", "studio", "apartment", "villa", "house"].includes(
//             String(property?.propertyType || "").trim().toLowerCase()
//         )
//     );
// };

// const hasValidCoordinates = (item) => {
//     const lat = item?.location?.lat;
//     const lng = item?.location?.lng;

//     if (
//         lat === null ||
//         lat === undefined ||
//         lat === "" ||
//         lng === null ||
//         lng === undefined ||
//         lng === ""
//     ) {
//         return false;
//     }

//     const numericLat = Number(lat);
//     const numericLng = Number(lng);

//     return (
//         Number.isFinite(numericLat) &&
//         Number.isFinite(numericLng) &&
//         numericLat >= 20 &&
//         numericLat <= 36 &&
//         numericLng >= -18 &&
//         numericLng <= -0.5
//     );
// };

// export default function PropertyMap({
//     properties = [],
//     roommates = [],
//     establishments = [],
//     onPropertyClick,
//     onRoommateClick,
//     onEstablishmentClick,
// }) {
//     const mapContainerRef = useRef(null);
//     const mapRef = useRef(null);
//     const markersRef = useRef([]);

//     const onPropertyClickRef = useRef(onPropertyClick);
//     const onRoommateClickRef = useRef(onRoommateClick);
//     const onEstablishmentClickRef = useRef(onEstablishmentClick);

//     const [mapLoaded, setMapLoaded] = useState(false);
//     const [mapError, setMapError] = useState("");

//     onPropertyClickRef.current = onPropertyClick;
//     onRoommateClickRef.current = onRoommateClick;
//     onEstablishmentClickRef.current = onEstablishmentClick;

//     const validProperties = useMemo(
//         () => properties.filter(hasValidCoordinates),
//         [properties]
//     );

//     const validRoommates = useMemo(
//         () => roommates.filter(hasValidCoordinates),
//         [roommates]
//     );

//     const validEstablishments = useMemo(
//         () => establishments.filter(hasValidCoordinates),
//         [establishments]
//     );

//     const regularProperties = useMemo(
//         () => validProperties.filter((item) => !isFurnishedRental(item)),
//         [validProperties]
//     );

//     const furnishedProperties = useMemo(
//         () => validProperties.filter(isFurnishedRental),
//         [validProperties]
//     );

//     // Initialize MapTiler / MapLibre.
//     useEffect(() => {
//         let cancelled = false;
//         let map = null;

//         const initializeMap = async () => {
//             if (!mapContainerRef.current || !MAPTILER_API_KEY) {
//                 return;
//             }

//             try {
//                 const response = await fetch(MAPTILER_STYLE_URL);

//                 if (!response.ok) {
//                     throw new Error(
//                         `MapTiler returned HTTP ${response.status}: ${response.statusText}`
//                     );
//                 }

//                 if (cancelled) return;

//                 map = new maplibregl.Map({
//                     container: mapContainerRef.current,
//                     style: MAPTILER_STYLE_URL,
//                     center: [moroccoCenter.lng, moroccoCenter.lat],
//                     zoom: initialZoom,
//                     attributionControl: true,
//                 });

//                 mapRef.current = map;

//                 map.addControl(
//                     new maplibregl.NavigationControl(),
//                     "top-right"
//                 );

//                 map.addControl(
//                     new maplibregl.FullscreenControl(),
//                     "top-right"
//                 );

//                 map.on("load", () => {
//                     if (!cancelled) {
//                         setMapLoaded(true);
//                         setMapError("");
//                     }
//                 });

//                 map.on("error", (event) => {
//                     console.error("MapLibre resource error:", event.error);
//                 });
//             } catch (error) {
//                 console.error("Map initialization failed:", error);

//                 if (!cancelled) {
//                     setMapError(error.message || "Unknown map error.");
//                 }
//             }
//         };

//         initializeMap();

//         return () => {
//             cancelled = true;
//             map?.remove();
//             mapRef.current = null;
//         };
//     }, []);

//     // Create all listing markers.
//     useEffect(() => {
//         const map = mapRef.current;

//         if (!map || !mapLoaded) return;

//         // Remove old markers and popups.
//         markersRef.current.forEach((item) => {
//             clearTimeout(item.closeTimer);
//             item.popup.remove();
//             item.root.unmount();
//             item.marker.remove();
//         });

//         markersRef.current = [];

//         const totalListings =
//             validProperties.length +
//             validRoommates.length +
//             validEstablishments.length;

//         if (totalListings === 0) return;

//         const bounds = new maplibregl.LngLatBounds();

//         const createListingMarker = ({
//             listing,
//             index,
//             type,
//         }) => {
//             const isRoommate = type === "roommate";
//             const isEstablishment = type === "establishment";
//             const isFurnished = !isRoommate &&
//                 !isEstablishment &&
//                 isFurnishedRental(listing);

//             const lat = Number(listing.location.lat);
//             const lng = Number(listing.location.lng);
//             const coordinates = [lng, lat];

//             bounds.extend(coordinates);

//             const markerElement = document.createElement("button");
//             markerElement.type = "button";

//             markerElement.className = isRoommate
//                 ? "roommate-map-marker"
//                 : isEstablishment
//                     ? "establishment-map-marker"
//                     : isFurnished
//                         ? "furnished-map-marker"
//                         : "property-map-marker";

//             const markerLabel = isRoommate
//                 ? "roommate announcement"
//                 : isEstablishment
//                     ? "establishment"
//                     : isFurnished
//                         ? "furnished property"
//                         : "property";

//             markerElement.setAttribute(
//                 "aria-label",
//                 `View ${markerLabel} ${index + 1}`
//             );

//             markerElement.title = markerLabel;

//             const markerColor = isRoommate
//                 ? "#16A34A"
//                 : isEstablishment
//                     ? "#7e22ce"
//                     : isFurnished
//                         ? "#f59e0b"
//                         : "#2563EB";

//             Object.assign(markerElement.style, {
//                 width: isEstablishment ? "40px" : "34px",
//                 height: isEstablishment ? "40px" : "34px",
//                 padding: "0",
//                 borderRadius: isRoommate ? "5px" : isEstablishment ? "8px" : "50%",
//                 backgroundColor: markerColor,
//                 border: "3px solid white",
//                 color: "#ffffff",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: "12px",
//                 fontWeight: "700",
//                 cursor: "pointer",
//                 boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
//                 outline: "none",
//                 transition: "transform 0.15s ease",
//                 transform: isRoommate
//                     ? "rotate(45deg)"
//                     : isEstablishment
//                         ? "rotate(45deg)"
//                         : "none",
//             });

//             // Establishment marker has a hexagonal shape.
//             if (isEstablishment) {
//                 markerElement.style.clipPath =
//                     "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
//                 markerElement.style.borderRadius = "0";
//                 markerElement.style.transform = "none";
//             }

//             const numberElement = document.createElement("span");
//             numberElement.textContent = String(index + 1);

//             if (isRoommate || isEstablishment) {
//                 Object.assign(numberElement.style, {
//                     display: "block",
//                     transform: isRoommate
//                         ? "rotate(-45deg)"
//                         : "none",
//                 });
//             }

//             markerElement.appendChild(numberElement);

//             // Popup container.
//             const popupContainer = document.createElement("div");
//             const root = createRoot(popupContainer);

//             const popup = new maplibregl.Popup({
//                 offset: isRoommate ? 24 : 22,
//                 closeButton: false,
//                 closeOnClick: false,
//                 closeOnMove: false,
//                 maxWidth: "320px",
//                 className: isRoommate
//                     ? "roommate-hover-popup"
//                     : isEstablishment
//                         ? "establishment-hover-popup"
//                         : isFurnished
//                             ? "furnished-hover-popup"
//                             : "property-hover-popup",
//             })
//                 .setLngLat(coordinates)
//                 .setDOMContent(popupContainer);

//             const markerData = {
//                 marker: null,
//                 popup,
//                 root,
//                 closeTimer: null,
//                 popupEventsAttached: false,
//             };

//             const schedulePopupClose = () => {
//                 clearTimeout(markerData.closeTimer);

//                 markerData.closeTimer = setTimeout(() => {
//                     popup.remove();
//                 }, 180);
//             };

//             const keepPopupOpen = () => {
//                 clearTimeout(markerData.closeTimer);
//             };

//             const handleViewDetails = () => {
//                 clearTimeout(markerData.closeTimer);
//                 popup.remove();

//                 if (isRoommate) {
//                     onRoommateClickRef.current?.(listing);
//                 } else if (isEstablishment) {
//                     onEstablishmentClickRef.current?.(listing);
//                 } else {
//                     onPropertyClickRef.current?.(listing);
//                 }
//             };

//             if (isRoommate) {
//                 root.render(
//                     <RoommateMapCard
//                         roommate={listing}
//                         onViewDetails={handleViewDetails}
//                     />
//                 );
//             } else if (isEstablishment) {
//                 root.render(
//                     <EstablishmentMapCard
//                         establishment={listing}
//                         onViewDetails={handleViewDetails}
//                     />
//                 );
//             } else {
//                 root.render(
//                     <PropertyMapCard
//                         property={listing}
//                         onViewDetails={handleViewDetails}
//                     />
//                 );
//             }

//             markerElement.addEventListener("mouseenter", () => {
//                 clearTimeout(markerData.closeTimer);
//                 popup.addTo(map);

//                 if (!markerData.popupEventsAttached) {
//                     const popupElement = popup.getElement();

//                     popupElement.addEventListener(
//                         "mouseenter",
//                         keepPopupOpen
//                     );

//                     popupElement.addEventListener(
//                         "mouseleave",
//                         schedulePopupClose
//                     );

//                     markerData.popupEventsAttached = true;
//                 }
//             });

//             markerElement.addEventListener(
//                 "mouseleave",
//                 schedulePopupClose
//             );

//             markerElement.addEventListener("click", (event) => {
//                 event.preventDefault();
//                 event.stopPropagation();
//                 handleViewDetails();
//             });

//             const marker = new maplibregl.Marker({
//                 element: markerElement,
//                 anchor: "center",
//             })
//                 .setLngLat(coordinates)
//                 .addTo(map);

//             markerData.marker = marker;
//             markersRef.current.push(markerData);
//         };

//         // Regular properties.
//         regularProperties.forEach((property, index) => {
//             createListingMarker({
//                 listing: property,
//                 index,
//                 type: "property",
//             });
//         });

//         // Furnished rentals.
//         furnishedProperties.forEach((property, index) => {
//             createListingMarker({
//                 listing: property,
//                 index,
//                 type: "property",
//             });
//         });

//         // Roommates.
//         validRoommates.forEach((roommate, index) => {
//             createListingMarker({
//                 listing: roommate,
//                 index,
//                 type: "roommate",
//             });
//         });

//         // Establishments.
//         validEstablishments.forEach((establishment, index) => {
//             createListingMarker({
//                 listing: establishment,
//                 index,
//                 type: "establishment",
//             });
//         });

//         // Fit the map to all displayed listings.
//         if (totalListings === 1) {
//             const onlyListing =
//                 validProperties[0] ||
//                 validRoommates[0] ||
//                 validEstablishments[0];

//             map.flyTo({
//                 center: [
//                     Number(onlyListing.location.lng),
//                     Number(onlyListing.location.lat),
//                 ],
//                 zoom: 14,
//                 duration: 700,
//             });
//         } else {
//             map.fitBounds(bounds, {
//                 padding: 70,
//                 maxZoom: 13,
//                 duration: 700,
//             });
//         }

//         return () => {
//             markersRef.current.forEach((item) => {
//                 clearTimeout(item.closeTimer);
//                 item.popup.remove();
//                 item.root.unmount();
//                 item.marker.remove();
//             });

//             markersRef.current = [];
//         };
//     }, [
//         mapLoaded,
//         validProperties,
//         validRoommates,
//         validEstablishments,
//         regularProperties,
//         furnishedProperties,
//     ]);

//     if (!MAPTILER_API_KEY) {
//         return (
//             <Alert severity="warning">
//                 MapTiler API key is missing.
//                 Add VITE_MAPTILER_API_KEY to your frontend .env file.
//             </Alert>
//         );
//     }

//     if (mapError) {
//         return (
//             <Alert severity="error">
//                 <Typography fontWeight={700}>
//                     The map could not be loaded.
//                 </Typography>

//                 <Typography variant="body2">
//                     {mapError}
//                 </Typography>

//                 Check your API key, allowed origins, and map ID.
//             </Alert>
//         );
//     }

//     return (
//         <Box className="property-map-wrapper">
//             {!mapLoaded && (
//                 <Box
//                     className="find-map-loading"
//                     sx={{
//                         position: "absolute",
//                         inset: 0,
//                         zIndex: 2,
//                         backgroundColor: "background.paper",
//                     }}
//                 >
//                     <CircularProgress />
//                     <Typography color="text.secondary">
//                         Loading map...
//                     </Typography>
//                 </Box>
//             )}

//             <Box
//                 ref={mapContainerRef}
//                 className="property-map-canvas"
//                 sx={{
//                     position: "absolute",
//                     inset: 0,
//                     width: "100%",
//                     height: "100%",
//                 }}
//             />

//             <Box className="property-map-legend">
//                 <Box display="flex" alignItems="center" gap={1} mb={0.5}>
//                     <Box
//                         sx={{
//                             width: 12,
//                             height: 12,
//                             borderRadius: "50%",
//                             backgroundColor: "#2563EB",
//                         }}
//                     />
//                     <Typography variant="caption">
//                         {regularProperties.length} properties
//                     </Typography>
//                 </Box>

//                 <Box display="flex" alignItems="center" gap={1} mb={0.5}>
//                     <Box
//                         sx={{
//                             width: 12,
//                             height: 12,
//                             borderRadius: "50%",
//                             backgroundColor: "#f59e0b",
//                         }}
//                     />
//                     <Typography variant="caption">
//                         {furnishedProperties.length} furnished rentals
//                     </Typography>
//                 </Box>

//                 <Box display="flex" alignItems="center" gap={1} mb={0.5}>
//                     <Box
//                         sx={{
//                             width: 11,
//                             height: 11,
//                             backgroundColor: "#16A34A",
//                             transform: "rotate(45deg)",
//                         }}
//                     />
//                     <Typography variant="caption">
//                         {validRoommates.length} roommate announcements
//                     </Typography>
//                 </Box>

//                 <Box display="flex" alignItems="center" gap={1}>
//                     <Box
//                         sx={{
//                             width: 13,
//                             height: 13,
//                             backgroundColor: "#7e22ce",
//                             clipPath:
//                                 "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
//                         }}
//                     />
//                     <Typography variant="caption">
//                         {validEstablishments.length} establishments
//                     </Typography>
//                 </Box>
//             </Box>
//         </Box>
//     );
// }
