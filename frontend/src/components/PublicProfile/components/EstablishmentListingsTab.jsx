import React from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
} from "@mui/material";

import ListingCard from "./ListingCard";

import {
    getEstablishmentId,
    getEstablishmentImage,
    getEstablishmentStartingPrice,
} from "../utils/publicProfileHelpers";

export default function EstablishmentListingsTab({
    establishments = [],
    loading,
    error,
    hasMore,
    onLoadMore,
    onView,
}) {
    const { t } = useTranslation();

    if (loading && establishments.length === 0) {
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

            {establishments.length === 0 ? (
                <Alert severity="info">
                    {t("publicProfile.empty.establishments")}
                </Alert>
            ) : (
                <Grid container spacing={2.5}>
                    {establishments.map((establishment) => {
                        const id = getEstablishmentId(establishment);

                        const startingPrice =
                            getEstablishmentStartingPrice(establishment);

                        return (
                            <Grid
                                key={id}
                                size={{ xs: 12, sm: 6, md: 4 }}
                            >
                                <ListingCard
                                    image={getEstablishmentImage(establishment)}
                                    imageFit="contain"
                                    title={establishment.name}
                                    subtitle={t(
                                        `profileEstablishment.types.${establishment.accommodationType}`,
                                        {
                                            defaultValue:
                                                establishment.accommodationType,
                                        }
                                    )}
                                    location={[
                                        establishment.location?.city,
                                        establishment.location?.neighborhood,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    description={
                                        establishment.shortDescription ||
                                        establishment.fullDescription
                                    }
                                    price={startingPrice}
                                    priceLabel={
                                        startingPrice !== null
                                            ? `${t("publicProfile.from")} `
                                            : ""
                                    }
                                    status={establishment.status}
                                    details={[
                                        establishment.numberOfRooms
                                            ? `${establishment.numberOfRooms} ${t("publicProfile.rooms")}`
                                            : null,
                                        establishment.officialClassification
                                            ? establishment.officialClassification
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