
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
    GoogleMap,
    InfoWindowF,
    MarkerF,
    useJsApiLoader,
} from "@react-google-maps/api";

import {
    Alert,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";

import PropertyMapCard from "./PropertyMapCard";

// Google Maps API key
const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const moroccoCenter = {
    lat: 31.7917,
    lng: -7.0926,
};

const mapOptions = {
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
    clickableIcons: false,
    restriction: {
        latLngBounds: {
            north: 36.2,
            south: 20.5,
            west: -18.5,
            east: -0.5,
        },
        strictBounds: false,
    },
};

export default function PropertyMap({
    properties = [],
    onPropertyClick,
}) {
    const mapRef = useRef(null);

    const [selectedProperty, setSelectedProperty] = useState(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: "morocco-property-map",
        googleMapsApiKey: GOOGLE_MAPS_API_KEY || "",
    });

    const validProperties = useMemo(
        () =>
            properties.filter((property) => {
                const lat = Number(property.location?.lat);
                const lng = Number(property.location?.lng);

                return Number.isFinite(lat) && Number.isFinite(lng);
            }),
        [properties]
    );

    useEffect(() => {
        if (!mapRef.current || !window.google || !validProperties.length) {
            return;
        }

        const bounds = new window.google.maps.LatLngBounds();

        validProperties.forEach((property) => {
            bounds.extend({
                lat: Number(property.location.lat),
                lng: Number(property.location.lng),
            });
        });

        mapRef.current.fitBounds(bounds);

        if (validProperties.length === 1) {
            mapRef.current.setZoom(14);
        }
    }, [validProperties]);

    const handleMapLoad = (map) => {
        mapRef.current = map;
    };

    const handleMapUnmount = () => {
        mapRef.current = null;
    };

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <Alert severity="warning">
                Google Maps API key is missing. Add
                VITE_GOOGLE_MAPS_API_KEY to your frontend .env file.
            </Alert>
        );
    }

    if (loadError) {
        return (
            <Alert severity="error">
                Google Maps could not be loaded. Check your API key and
                Google Cloud configuration.
            </Alert>
        );
    }

    if (!isLoaded) {
        return (
            <Box className="find-map-loading">
                <CircularProgress />
                <Typography color="text.secondary">
                    Loading Google Maps...
                </Typography>
            </Box>
        );
    }

    return (
        <Box className="property-map-wrapper">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={moroccoCenter}
                zoom={6}
                options={mapOptions}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
            >
                {validProperties.map((property, index) => (
                    <MarkerF
                        key={property._id}
                        position={{
                            lat: Number(property.location.lat),
                            lng: Number(property.location.lng),
                        }}
                        label={{
                            text: String(index + 1),
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "700",
                        }}
                        title={property.title}
                        onClick={() => setSelectedProperty(property)}
                    />
                ))}

                {selectedProperty && (
                    <InfoWindowF
                        position={{
                            lat: Number(selectedProperty.location.lat),
                            lng: Number(selectedProperty.location.lng),
                        }}
                        onCloseClick={() => setSelectedProperty(null)}
                    >
                        <PropertyMapCard
                            property={selectedProperty}
                            onViewDetails={() =>
                                onPropertyClick?.(selectedProperty)
                            }
                        />
                    </InfoWindowF>
                )}
            </GoogleMap>

            <Box className="property-map-legend">
                <Typography variant="caption">
                    {validProperties.length} properties displayed
                </Typography>
            </Box>
        </Box>
    );
}
