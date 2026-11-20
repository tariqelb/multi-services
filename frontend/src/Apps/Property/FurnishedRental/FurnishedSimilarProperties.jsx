
import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Typography,
    Pagination,
} from "@mui/material";

import PropertyCard from "../properties/PropertyCard";
import getImageUrl from "../../../utils/getImageUrl";
import axiosInstance from "../../../api/axiosInstance";

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const isFurnished = (value) =>
    [
        "furnished",
        "fully furnished",
        "furnished property",
    ].includes(normalize(value));

export default function FurnishedSimilarProperties({
    properties = [],
    currentProperty,
    onSelectProperty,
}) {
    const { t, i18n } = useTranslation();

    const [page, setPage] = useState(1);
    const itemsPerPage = 4;

    // Only show furnished rental properties of the same category.
    const similarProperties = useMemo(() => {
        const currentId = String(
            currentProperty?._id || currentProperty?.id || ""
        );

        const currentType = normalize(
            currentProperty?.propertyType
        );

        return properties.filter((property) => {
            const propertyId = String(
                property?._id || property?.id || ""
            );

            const isSameProperty =
                currentId && propertyId === currentId;

            const isForRent =
                normalize(property.listingType) === "for rent";

            const isSameCategory =
                normalize(property.propertyType) === currentType;

            return (
                !isSameProperty &&
                isForRent &&
                isFurnished(property.furnishingStatus) &&
                isSameCategory
            );
        });
    }, [properties, currentProperty]);

    const totalPages = Math.ceil(
        similarProperties.length / itemsPerPage
    );

    const displayedProperties = similarProperties.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Track property clicks and preserve navigation behavior.
    const handleSelectProperty = useCallback(
        (property) => {
            const propertyId = property?._id || property?.id;

            if (!propertyId) return;

            axiosInstance
                .post(`/property/${propertyId}/click`)
                .catch((error) => {
                    console.error(
                        "Unable to track furnished similar property click:",
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

    // Reset pagination if the available properties change.
    React.useEffect(() => {
        setPage(1);
    }, [currentProperty?._id, currentProperty?.id]);

    if (similarProperties.length === 0) return null;

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
                {t("properties.furnished.similar.title", {
                    defaultValue: "Similar furnished rentals",
                })}
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
                        "";

                    const formattedProperty = {
                        ...property,
                        _id: property._id || property.id,
                        id: property.id || property._id,
                        title: property.title,
                        status: property.status || "Available",
                        price:
                            property.price != null
                                ? `${Number(
                                      property.price
                                  ).toLocaleString(i18n.language)} MAD`
                                : "0 MAD",
                        image: fullImageUrl,
                        listingType: property.listingType,
                        propertyType: property.propertyType,
                        rentalPeriod: property.rentalPeriod || "",
                        furnishingStatus:
                            property.furnishingStatus || "",
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
                              ).toLocaleDateString(i18n.language)
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
                        aria-label={t(
                            "properties.similar.pagination"
                        )}
                    />
                </Box>
            )}
        </Box>
    );
}
