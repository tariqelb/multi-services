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
    getRoommateId,
    getRoommateImage,
} from "../utils/publicProfileHelpers";

export default function RoommateListingsTab({
    listings = [],
    loading,
    error,
    hasMore,
    onLoadMore,
    onView,
}) {
    const { t } = useTranslation();

    if (loading && listings.length === 0) {
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

            {listings.length === 0 ? (
                <Alert severity="info">
                    {t("publicProfile.empty.roommates")}
                </Alert>
            ) : (
                <Grid container spacing={2.5}>
                    {listings.map((listing) => {
                        const id = getRoommateId(listing);

                        return (
                            <Grid
                                key={id}
                                size={{ xs: 12, sm: 6, md: 4 }}
                            >
                                <ListingCard
                                    image={getRoommateImage(listing)}
                                    title={
                                        listing.title ||
                                        listing.name ||
                                        listing.city ||
                                        t("publicProfile.roommateListing")
                                    }
                                    subtitle={
                                        listing.roomType ||
                                        listing.propertyType ||
                                        listing.lookingFor ||
                                        ""
                                    }
                                    location={[
                                        listing.city,
                                        listing.neighborhood,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    description={
                                        listing.description ||
                                        listing.about ||
                                        listing.message
                                    }
                                    price={
                                        listing.price ??
                                        listing.budget ??
                                        listing.monthlyBudget ??
                                        null
                                    }
                                    priceLabel={`${t("publicProfile.pricePerMonth")} `}
                                    status={listing.status}
                                    details={[
                                        listing.gender
                                            ? t(
                                                  `publicProfile.genders.${listing.gender}`,
                                                  { defaultValue: listing.gender }
                                              )
                                            : null,
                                        listing.occupants
                                            ? `${listing.occupants} ${t("publicProfile.occupants")}`
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