import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
} from "@mui/material";

import {
    HomeWork,
    MeetingRoom,
    People,
    Hotel,
    RateReview,
} from "@mui/icons-material";

const statItems = [
    {
        key: "totalProperties",
        label: "publicProfile.stats.properties",
        icon: HomeWork,
        color: "#1976d2",
    },
    {
        key: "availableProperties",
        label: "publicProfile.stats.availableProperties",
        icon: HomeWork,
        color: "#2e7d32",
    },
    {
        key: "totalRoommates",
        label: "publicProfile.stats.roommates",
        icon: People,
        color: "#ed6c02",
    },
    {
        key: "totalEstablishments",
        label: "publicProfile.stats.establishments",
        icon: Hotel,
        color: "#7b1fa2",
    },
    {
        key: "totalReviews",
        label: "publicProfile.stats.reviews",
        icon: RateReview,
        color: "#0288d1",
    },
];

export default function PublicProfileStats({ statistics = {} }) {
    const { t } = useTranslation();

    return (
        <Grid container spacing={2}>
            {statItems.map((item) => {
                const Icon = item.icon;

                return (
                    <Grid
                        key={item.key}
                        size={{ xs: 6, sm: 4, md: 2.4 }}
                    >
                        <Card
                            elevation={0}
                            sx={{
                                height: "100%",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2.5,
                            }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 1,
                                        mb: 1.5,
                                    }}
                                >
                                    <Icon
                                        sx={{
                                            color: item.color,
                                            fontSize: 26,
                                        }}
                                    />
                                    <Typography
                                        variant="h5"
                                        fontWeight={700}
                                    >
                                        {statistics[item.key] || 0}
                                    </Typography>
                                </Box>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        display: "block",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {t(item.label)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
}