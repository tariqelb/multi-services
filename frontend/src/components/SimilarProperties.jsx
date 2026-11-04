import React, { useState, useCallback } from "react";
import {
    Box,
    Typography,
    Pagination,
} from "@mui/material";

import PropertyCard from "./PropertyCard";
import getImageUrl from "../utils/getImageUrl";
import axiosInstance from "../api/axiosInstance";

export default function SimilarProperties({
    properties = [],
    onSelectProperty,
}) {
    const [page, setPage] = useState(1);
    const itemsPerPage = 4;

    const totalPages = Math.ceil(properties.length / itemsPerPage);

    const displayedProperties = properties.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Track property clicks and preserve existing navigation behavior.
    const handleSelectProperty = useCallback(
        (property) => {
            if (!property?._id) return;

            // Send click statistics without delaying navigation.
            axiosInstance
                .post(`/property/${property._id}/click`)
                .catch((error) => {
                    console.error(
                        "Unable to track similar property click:",
                        error.message
                    );
                });

            onSelectProperty?.(property);
        },
        [onSelectProperty]
    );

    const handlePageChange = (_event, value) => {
        setPage(value);
    };

    if (properties.length === 0) return null;

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1600,
                mx: "auto",
                my: 5,
                px: { xs: 2, md: 4 },
                boxSizing: "border-box",
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    mb: 3,
                    color: "#0f172a",
                }}
            >
                Similar Properties
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "minmax(0, 1fr)",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: {
                        xs: 3,
                        sm: 2.5,
                        md: 3,
                    },
                    alignItems: "stretch",
                    width: "100%",
                }}
            >
                {displayedProperties.map((property) => {
                    const fullImageUrl =
                        getImageUrl(property.images?.[0]) ||
                        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500";

                    const formattedProperty = {
                        ...property,
                        title: property.title,
                        price:
                            property.price != null
                                ? `${Number(
                                      property.price
                                  ).toLocaleString()} MAD`
                                : "0 MAD",
                        image: fullImageUrl,
                        listingType: property.listingType,
                        propertyType: property.propertyType,
                        referenceCode: property._id
                            ? `#${property._id.slice(-4)}`
                            : "#48",
                        city: property.city,
                        neighborhood: property.neighborhood,
                        surface: property.surface,
                        rooms: property.rooms,
                        salons: property.salons,
                        bathrooms: property.bathrooms,
                        createdDate: property.createdAt
                            ? new Date(
                                  property.createdAt
                              ).toLocaleDateString("en-GB")
                            : "",
                    };

                    return (
                        <Box
                            key={property._id || property.id}
                            sx={{
                                width: "100%",
                                minWidth: 0,
                                display: "flex",
                                "& > *": {
                                    width: "100%",
                                    minWidth: 0,
                                },
                            }}
                        >
                            <PropertyCard
                                property={formattedProperty}
                                onClick={() =>
                                    handleSelectProperty(property)
                                }
                            />
                        </Box>
                    );
                })}
            </Box>

            {totalPages > 1 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 4,
                    }}
                >
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="medium"
                    />
                </Box>
            )}
        </Box>
    );
}