// src/Apps/vehicles/Profile/components/VehicleProfileStats.jsx
import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
} from "@mui/material";

import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import DirectionsCar from "@mui/icons-material/DirectionsCar";
import TwoWheeler from "@mui/icons-material/TwoWheeler";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import RateReview from "@mui/icons-material/RateReview";
import BuildOutlined from "@mui/icons-material/BuildOutlined";

// Vehicle statistics cards (my profile and public profile).
const VEHICLE_STAT_ITEMS = [
    { key: "totalVehicles", label: "vehiclesApp.profile.stats.vehicles", icon: DirectionsCarOutlined, color: "#2563EB" },
    { key: "availableVehicles", label: "vehiclesApp.profile.stats.availableVehicles", icon: DirectionsCar, color: "#16A34A" },
    { key: "totalMotos", label: "vehiclesApp.profile.stats.motos", icon: TwoWheelerOutlined, color: "#EA580C" },
    { key: "availableMotos", label: "vehiclesApp.profile.stats.availableMotos", icon: TwoWheeler, color: "#9333EA" },
    { key: "totalParts", label: "vehiclesApp.profile.stats.parts", icon: BuildOutlined, color: "#0D9488" },
    { key: "totalReviews", label: "vehiclesApp.profile.stats.reviews", icon: RateReview, color: "#0288d1" },
];

export default function VehicleProfileStats({ statistics = {}, items = VEHICLE_STAT_ITEMS }) {
    const { t } = useTranslation();

    return (
        <Grid container spacing={2}>
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <Grid
                        key={item.key}
                        size={{ xs: 6, sm: 4, md: 12 / Math.min(Math.max(items.length, 1), 6) }}
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
                                        variant="h5" sx={{ fontWeight: 700 }}
                                    >
                                        {statistics[item.key] || 0}
                                    </Typography>
                                </Box>

                                <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary",
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