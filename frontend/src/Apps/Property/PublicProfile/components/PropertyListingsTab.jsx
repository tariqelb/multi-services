import React from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    Typography,
} from "@mui/material";

import ListingCard from "./ListingCard";

import {
    getPropertyId,
    getPropertyImage,
} from "../utils/publicProfileHelpers";

export default function PropertyListingsTab({
    properties = [],
    loading,
    error,
    hasMore,
    onLoadMore,
    onView,
}) {
    const { t } = useTranslation();

    if (loading && properties.length === 0) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {properties.length === 0 ? (
                <Alert severity="info">
                    {t("publicProfile.empty.properties")}
                </Alert>
            ) : (
                <Grid container spacing={2.5}>
                    {properties.map((property) => {
                        const id = getPropertyId(property);

                        return (
                            <Grid
                                key={id}
                                size={{ xs: 12, sm: 6, md: 4 }}
                            >
                                <ListingCard
                                    image={getPropertyImage(property)}
                                    title={
                                        property.title ||
                                        property.propertyTitle ||
                                        property.name
                                    }
                                    subtitle={
                                        property.propertyType ||
                                        property.type
                                    }
                                    location={[
                                        property.city,
                                        property.neighborhood,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    description={
                                        property.description
                                    }
                                    price={
                                        property.price ??
                                        property.rentPrice ??
                                        null
                                    }
                                    priceLabel={
                                        property.listingType === "For Rent"
                                            ? `${t("publicProfile.pricePerMonth")} `
                                            : ""
                                    }
                                    status={property.status}
                                    details={[
                                        property.bedrooms
                                            ? `${property.bedrooms} ${t("publicProfile.bedrooms")}`
                                            : null,
                                        property.area
                                            ? `${property.area} m²`
                                            : null,
                                    ].filter(Boolean)}
                                    onView={() => onView(id)}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {hasMore && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={onLoadMore}
                        disabled={loading}
                    >
                        {loading
                            ? t("publicProfile.loading")
                            : t("publicProfile.loadMore")}
                    </Button>
                </Box>
            )}
        </Box>
    );
}