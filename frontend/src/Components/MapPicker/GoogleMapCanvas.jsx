// src/Components/MapPicker/GoogleMapCanvas.jsx
//
// Interactive Google map, used only when VITE_GOOGLE_MAPS_API_KEY is set.
// Click anywhere (or drag the pin) to choose the exact place.

import { useCallback, useEffect, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY, MOROCCO_CENTER, isValidPoint } from "./mapLinkUtils";

const containerStyle = { width: "100%", height: "100%" };

export default function GoogleMapCanvas({ point, onPick, language = "en", errorText }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: "multiservices-google-maps",
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        language,
        region: "MA",
    });
    const mapRef = useRef(null);

    // Move the map when the pin changes from outside (search, my location).
    useEffect(() => {
        if (mapRef.current && isValidPoint(point)) {
            mapRef.current.panTo(point);
            if (mapRef.current.getZoom() < 14) mapRef.current.setZoom(16);
        }
    }, [point]);

    const handleClick = useCallback(
        (event) => {
            if (event?.latLng) onPick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        },
        [onPick]
    );

    if (loadError) {
        return (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center", p: 3 }}>
                <Typography variant="body2" color="error" sx={{ textAlign: "center" }}>
                    {errorText}
                </Typography>
            </Box>
        );
    }

    if (!isLoaded) {
        return (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={isValidPoint(point) ? point : MOROCCO_CENTER}
            zoom={isValidPoint(point) ? 16 : 6}
            onLoad={(map) => {
                mapRef.current = map;
            }}
            onUnmount={() => {
                mapRef.current = null;
            }}
            onClick={handleClick}
            options={{ streetViewControl: false, mapTypeControl: true, fullscreenControl: false, clickableIcons: false }}
        >
            {isValidPoint(point) && <MarkerF position={point} draggable onDragEnd={handleClick} />}
        </GoogleMap>
    );
}
