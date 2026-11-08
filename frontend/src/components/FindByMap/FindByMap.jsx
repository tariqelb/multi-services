
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";
import PropertyMap from "./PropertyMap";
import FindByMapFilters from "./FindByMapFilters";

import "./findByMap.css";

export default function FindByMap() {
    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);

    const [filters, setFilters] = useState({
        city: "All",
        propertyType: "All",
        listingType: "All",
        maxPrice: "",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch properties from the backend.
    useEffect(() => {
        let isMounted = true;

        const fetchProperties = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axiosInstance.get(
                    "/property/getlist"
                );

                const data = response.data;

                const propertyList = Array.isArray(data)
                    ? data
                    : data?.properties ||
                      data?.data ||
                      data?.results ||
                      [];

                if (isMounted) {
                    setProperties(
                        Array.isArray(propertyList)
                            ? propertyList
                            : []
                    );
                }
            } catch (err) {
                console.error(
                    "Failed to load properties:",
                    err
                );

                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load properties. Please try again."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProperties();

        return () => {
            isMounted = false;
        };
    }, []);

    // Keep only properties with valid geographic coordinates.
    const locatedProperties = useMemo(() => {
        return properties.filter((property) => {
            const lat = Number(property.location?.lat);
            const lng = Number(property.location?.lng);

            return (
                Number.isFinite(lat) &&
                Number.isFinite(lng) &&
                lat >= 20 &&
                lat <= 36 &&
                lng >= -18 &&
                lng <= -0.5
            );
        });
    }, [properties]);

    // Get available cities.
    const cities = useMemo(() => {
        return [
            ...new Set(
                locatedProperties
                    .map((property) => property.city)
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b));
    }, [locatedProperties]);

    // Get available property types.
    const propertyTypes = useMemo(() => {
        return [
            ...new Set(
                locatedProperties
                    .map((property) => property.propertyType)
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b));
    }, [locatedProperties]);

    // Apply filters.
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

            const matchesPrice =
                !filters.maxPrice ||
                Number(property.price) <=
                    Number(filters.maxPrice);

            return (
                matchesCity &&
                matchesType &&
                matchesListing &&
                matchesPrice
            );
        });
    }, [locatedProperties, filters]);

    // Navigate to property details.
    const handlePropertyClick = (property) => {
        const propertyId = property?._id || property?.id;

        if (!propertyId) {
            console.error(
                "Property ID is missing:",
                property
            );
            return;
        }

        navigate(`/properties/${propertyId}`, {
            state: { property },
        });
    };

    return (
        <Box className="find-map-page">

            {/* Header */}
            <Box className="find-map-header">
                <Box>
                    <Typography
                        variant="h5"
                        fontWeight={700}
                    >
                        Find Properties on Map
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Explore available properties across Morocco.
                    </Typography>
                </Box>

                <Typography className="find-map-count">
                    {filteredProperties.length} properties on map
                </Typography>
            </Box>

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

                    <Typography color="text.secondary">
                        Loading properties...
                    </Typography>
                </Box>
            ) : error ? (
                <Box className="find-map-message">
                    <Typography color="error">
                        {error}
                    </Typography>
                </Box>
            ) : locatedProperties.length === 0 ? (
                <Box className="find-map-message">
                    <Typography fontWeight={600}>
                        No properties with map coordinates found.
                    </Typography>

                    <Typography color="text.secondary">
                        Add latitude and longitude to your property
                        listings to display them on the map.
                    </Typography>
                </Box>
            ) : filteredProperties.length === 0 ? (
                <Box className="find-map-message">
                    <Typography>
                        No properties match your selected filters.
                    </Typography>
                </Box>
            ) : (
                <PropertyMap
                    properties={filteredProperties}
                    onPropertyClick={handlePropertyClick}
                />
            )}
        </Box>
    );
}
