
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    Box,
    CircularProgress,
    Alert,
} from "@mui/material";

import axiosInstance from "../../api/axiosInstance";
import FurnishedPropertyDetails from "./FurnishedPropertyDetails";
import FurnishedSimilarProperties from "./FurnishedSimilarProperties";

const ALLOWED_PROPERTY_TYPES = [
    "room",
    "studio",
    "apartment",
    "villa",
    "house",
];

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const isFurnishedRental = (property) => {
    const listingType = normalize(property?.listingType);
    const furnishingStatus = normalize(property?.furnishingStatus);
    const propertyType = normalize(property?.propertyType);

    return (
        listingType === "for rent" &&
        furnishingStatus === "furnished" &&
        ALLOWED_PROPERTY_TYPES.includes(propertyType)
    );
};

export default function FurnishedPropertyDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setProperty(null);
            setSimilarProperties([]);

            try {
                // 1. Fetch the selected property.
                const response = await axiosInstance.get(`/property/${id}`);

                const propertyData =
                    response.data?.property ?? response.data;

                if (cancelled) return;

                // Ensure this is a supported furnished rental.
                if (!isFurnishedRental(propertyData)) {
                    setError("This furnished property is not available.");
                    return;
                }

                setProperty(propertyData);

                // 2. Fetch all properties to find similar furnished rentals.
                const listRes = await axiosInstance.get("/property/getlist");

                const allProperties = Array.isArray(listRes.data)
                    ? listRes.data
                    : Array.isArray(listRes.data?.properties)
                        ? listRes.data.properties
                        : [];

                if (cancelled) return;

                const currentId = String(
                    propertyData._id || propertyData.id || ""
                );

                const currentType = normalize(propertyData.propertyType);

                const filtered = allProperties.filter((item) => {
                    const itemId = String(item?._id || item?.id || "");

                    return (
                        itemId !== currentId &&
                        isFurnishedRental(item) &&
                        normalize(item.propertyType) === currentType
                    );
                });

                setSimilarProperties(filtered);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Failed to load furnished property details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleSelectSimilar = (similarProperty) => {
        const similarId =
            similarProperty?._id || similarProperty?.id;

        if (!similarId) return;

        navigate(`/furnishedproperties/${similarId}`);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 6,
                    flex: 1,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !property) {
        return (
            <Box sx={{ p: 4, flex: 1 }}>
                <Alert severity="error">
                    {error || "Furnished property not found."}
                </Alert>
            </Box>
        );
    }

    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                minWidth: 0,
                pb: 6,
            }}
        >
            <FurnishedPropertyDetails
                property={property}
                onSelectSimilar={handleSelectSimilar}
                onBack={() => navigate("/furnishedproperties")}
            />

            {similarProperties.length > 0 && (
                <FurnishedSimilarProperties
                    properties={similarProperties}
                    currentProperty={property}
                    onSelectProperty={handleSelectSimilar}
                />
            )}
        </Box>
    );
}
