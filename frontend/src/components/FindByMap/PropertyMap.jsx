
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import { createRoot } from "react-dom/client";

import {
    Alert,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";

import PropertyMapCard from "./PropertyMapCard";

maplibregl.setWorkerUrl(workerUrl);

// MapTiler configuration
const MAPTILER_API_KEY =
    import.meta.env.VITE_MAPTILER_API_KEY;

const MAPTILER_MAP_ID =
    import.meta.env.VITE_MAPTILER_MAP_ID || "streets-v4";

const MAPTILER_STYLE_URL =
    `https://api.maptiler.com/maps/${MAPTILER_MAP_ID}/style.json?key=${MAPTILER_API_KEY}`;

const moroccoCenter = {
    lat: 31.7917,
    lng: -7.0926,
};

const initialZoom = 6;

export default function PropertyMap({
    properties = [],
    onPropertyClick,
}) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    const markersRef = useRef([]);
    const onPropertyClickRef = useRef(onPropertyClick);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState("");

    // Keep the latest navigation callback without rebuilding markers.
    onPropertyClickRef.current = onPropertyClick;

    // Validate property coordinates.
    const validProperties = useMemo(() => {
        return properties.filter((property) => {
            const rawLat = property.location?.lat;
            const rawLng = property.location?.lng;

            if (
                rawLat === null ||
                rawLat === undefined ||
                rawLat === "" ||
                rawLng === null ||
                rawLng === undefined ||
                rawLng === ""
            ) {
                return false;
            }

            const lat = Number(rawLat);
            const lng = Number(rawLng);

            return (
                Number.isFinite(lat) &&
                Number.isFinite(lng) &&
                lat >= -90 &&
                lat <= 90 &&
                lng >= -180 &&
                lng <= 180
            );
        });
    }, [properties]);

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
                    center: [
                        moroccoCenter.lng,
                        moroccoCenter.lat,
                    ],
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
                    console.error(
                        "MapLibre resource error:",
                        event.error
                    );
                });

            } catch (error) {
                console.error("Map initialization failed:", error);

                if (!cancelled) {
                    setMapError(
                        error.message || "Unknown map error."
                    );
                }
            }
        };

        initializeMap();

        return () => {
            cancelled = true;

            map?.remove();
            mapRef.current = null;
        };
    }, []);

    // Add markers with hover previews.
    useEffect(() => {
        const map = mapRef.current;

        if (!map || !mapLoaded) return;

        // Clean up previous markers and popups.
        markersRef.current.forEach((item) => {
            clearTimeout(item.closeTimer);

            item.popup.remove();
            item.root.unmount();
            item.marker.remove();
        });

        markersRef.current = [];

        if (!validProperties.length) return;

        const bounds = new maplibregl.LngLatBounds();

        validProperties.forEach((property, index) => {
            const lat = Number(property.location.lat);
            const lng = Number(property.location.lng);

            const coordinates = [lng, lat];

            bounds.extend(coordinates);

            // Create numbered marker.
            const markerElement = document.createElement("button");

            markerElement.type = "button";
            markerElement.className = "property-map-marker";
            markerElement.textContent = String(index + 1);

            markerElement.setAttribute(
                "aria-label",
                `View property ${index + 1}`
            );

            markerElement.title = "Hover to preview, click to view details";

            Object.assign(markerElement.style, {
                width: "32px",
                height: "32px",
                padding: "0",
                borderRadius: "50%",
                backgroundColor: "#1976d2",
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
                transition: "transform 0.15s ease, background-color 0.15s ease",
            });

            // Create the property preview popup.
            const popupContainer = document.createElement("div");

            const root = createRoot(popupContainer);

            const popup = new maplibregl.Popup({
                offset: 22,
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false,
                maxWidth: "320px",
                className: "property-hover-popup",
            })
                .setLngLat(coordinates)
                .setDOMContent(popupContainer);

            // Store marker, popup and React root.
            const markerData = {
                marker: null,
                popup,
                root,
                closeTimer: null,
                popupEventsAttached: false,
            };

            // Close preview after leaving marker and popup.
            const schedulePopupClose = () => {
                clearTimeout(markerData.closeTimer);

                markerData.closeTimer = setTimeout(() => {
                    popup.remove();
                }, 180);
            };

            // Cancel closing when mouse enters preview.
            const keepPopupOpen = () => {
                clearTimeout(markerData.closeTimer);
            };

            // Render property preview.
            root.render(
                <PropertyMapCard
                    property={property}
                    onViewDetails={() => {
                        clearTimeout(markerData.closeTimer);

                        popup.remove();

                        onPropertyClickRef.current?.(property);
                    }}
                />
            );

            // Show preview when hovering over marker.
            markerElement.addEventListener("mouseenter", () => {
                clearTimeout(markerData.closeTimer);

                popup.addTo(map);

                // Attach popup hover events only once.
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

            // Close preview when leaving marker.
            markerElement.addEventListener(
                "mouseleave",
                schedulePopupClose
            );

            // Navigate directly when clicking marker.
            markerElement.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();

                clearTimeout(markerData.closeTimer);
                popup.remove();

                const propertyId =
                    property?._id || property?.id;

                if (!propertyId) {
                    console.error(
                        "Property ID is missing:",
                        property
                    );
                    return;
                }

                if (typeof onPropertyClickRef.current === "function") {
                    onPropertyClickRef.current(property);
                } else {
                    console.error(
                        "onPropertyClick callback is missing."
                    );
                }
            });

            // Create MapLibre marker.
            const marker = new maplibregl.Marker({
                element: markerElement,
                anchor: "center",
            })
                .setLngLat(coordinates)
                .addTo(map);

            markerData.marker = marker;

            markersRef.current.push(markerData);
        });

        // Fit map to property locations.
        if (validProperties.length === 1) {
            map.flyTo({
                center: [
                    Number(validProperties[0].location.lng),
                    Number(validProperties[0].location.lat),
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

        // Cleanup when properties change or component unmounts.
        return () => {
            markersRef.current.forEach((item) => {
                clearTimeout(item.closeTimer);

                item.popup.remove();
                item.root.unmount();
                item.marker.remove();
            });

            markersRef.current = [];
        };
    }, [mapLoaded, validProperties]);

    if (!MAPTILER_API_KEY) {
        return (
            <Alert severity="warning">
                MapTiler API key is missing.
                Add VITE_MAPTILER_API_KEY to your frontend .env file.
            </Alert>
        );
    }

    if (mapError) {
        return (
            <Alert severity="error">
                <Typography fontWeight={700}>
                    The map could not be loaded.
                </Typography>

                <Typography variant="body2">
                    {mapError}
                </Typography>

                Check your API key, allowed origins, and map ID.
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

                    <Typography color="text.secondary">
                        Loading MapTiler map...
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
                <Typography variant="caption">
                    {validProperties.length} properties displayed
                </Typography>
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

// import {
//     Alert,
//     Box,
//     CircularProgress,
//     Typography,
// } from "@mui/material";

// maplibregl.setWorkerUrl(workerUrl);

// // MapTiler configuration
// const MAPTILER_API_KEY =
//     import.meta.env.VITE_MAPTILER_API_KEY;

// const MAPTILER_MAP_ID =
//     import.meta.env.VITE_MAPTILER_MAP_ID || "streets-v4";

// const MAPTILER_STYLE_URL =
//     `https://api.maptiler.com/maps/${MAPTILER_MAP_ID}/style.json?key=${MAPTILER_API_KEY}`;

// const moroccoCenter = {
//     lat: 31.7917,
//     lng: -7.0926,
// };

// const initialZoom = 6;

// export default function PropertyMap({
//     properties = [],
//     onPropertyClick,
// }) {
//     const mapContainerRef = useRef(null);
//     const mapRef = useRef(null);
//     const markersRef = useRef([]);

//     const [mapLoaded, setMapLoaded] = useState(false);
//     const [mapError, setMapError] = useState("");

//     // Validate property coordinates
//     const validProperties = useMemo(() => {
//         return properties.filter((property) => {
//             const rawLat = property.location?.lat;
//             const rawLng = property.location?.lng;

//             if (
//                 rawLat === null ||
//                 rawLat === undefined ||
//                 rawLat === "" ||
//                 rawLng === null ||
//                 rawLng === undefined ||
//                 rawLng === ""
//             ) {
//                 return false;
//             }

//             const lat = Number(rawLat);
//             const lng = Number(rawLng);

//             return (
//                 Number.isFinite(lat) &&
//                 Number.isFinite(lng) &&
//                 lat >= -90 &&
//                 lat <= 90 &&
//                 lng >= -180 &&
//                 lng <= 180
//             );
//         });
//     }, [properties]);

//     // Initialize MapTiler / MapLibre
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
//                     center: [
//                         moroccoCenter.lng,
//                         moroccoCenter.lat,
//                     ],
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
//                     console.error(
//                         "MapLibre resource error:",
//                         event.error
//                     );
//                 });

//             } catch (error) {
//                 console.error("Map initialization failed:", error);

//                 if (!cancelled) {
//                     setMapError(
//                         error.message || "Unknown map error."
//                     );
//                 }
//             }
//         };

//         initializeMap();

//         return () => {
//             cancelled = true;

//             markersRef.current.forEach((marker) => marker.remove());
//             markersRef.current = [];

//             map?.remove();
//             mapRef.current = null;
//         };
//     }, []);

//     // Add property markers
//     useEffect(() => {
//         const map = mapRef.current;

//         if (!map || !mapLoaded) return;

//         // Remove previous markers
//         markersRef.current.forEach((marker) => marker.remove());
//         markersRef.current = [];

//         if (!validProperties.length) return;

//         const bounds = new maplibregl.LngLatBounds();

//         validProperties.forEach((property, index) => {
//             const lat = Number(property.location.lat);
//             const lng = Number(property.location.lng);

//             const coordinates = [lng, lat];

//             bounds.extend(coordinates);

//             // Create clickable numbered marker
//             const markerElement = document.createElement("button");

//             markerElement.type = "button";
//             markerElement.className = "property-map-marker";
//             markerElement.textContent = String(index + 1);
//             markerElement.setAttribute(
//                 "aria-label",
//                 `View property ${index + 1}`
//             );
//             markerElement.title = "View property details";

//             Object.assign(markerElement.style, {
//                 width: "32px",
//                 height: "32px",
//                 padding: "0",
//                 borderRadius: "50%",
//                 backgroundColor: "#1976d2",
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
//             });

//             // Navigate directly when marker is clicked
//             markerElement.addEventListener("click", (event) => {
//                 event.preventDefault();
//                 event.stopPropagation();

//                 const propertyId = property?._id || property?.id;

//                 if (!propertyId) {
//                     console.error(
//                         "Property ID is missing:",
//                         property
//                     );
//                     return;
//                 }

//                 if (typeof onPropertyClick === "function") {
//                     onPropertyClick(property);
//                 } else {
//                     console.error(
//                         "onPropertyClick callback is missing."
//                     );
//                 }
//             });

//             const marker = new maplibregl.Marker({
//                 element: markerElement,
//                 anchor: "center",
//             })
//                 .setLngLat(coordinates)
//                 .addTo(map);

//             markersRef.current.push(marker);
//         });

//         // Fit map to property locations
//         if (validProperties.length === 1) {
//             map.flyTo({
//                 center: [
//                     Number(validProperties[0].location.lng),
//                     Number(validProperties[0].location.lat),
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
//     }, [mapLoaded, validProperties, onPropertyClick]);

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
//                         Loading MapTiler map...
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
//                 <Typography variant="caption">
//                     {validProperties.length} properties displayed
//                 </Typography>
//             </Box>
//         </Box>
//     );
// }
