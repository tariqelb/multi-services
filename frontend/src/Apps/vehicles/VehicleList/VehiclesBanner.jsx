// src/Apps/vehicles/VehicleList/VehiclesBanner.jsx
// Same banner as the real estate page, with the vehicles picture.

import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

import vehiclesImage from "../../../assets/cars.jpg";
import { VEHICLE_PHOTOS, vehiclePhoto } from "../vehiclePhotos";

// category: "car", "moto" or "part" (spare parts page).
export default function VehiclesBanner({ category = "car" }) {
    const { t } = useTranslation();
    const isMoto = category === "moto";
    const isPart = category === "part";
    // Motos: their own photo (local copy or Unsplash); the car picture stays
    // underneath in case it does not load.
    const motoPhoto = VEHICLE_PHOTOS["motos-banner"] || vehiclePhoto("all-motos", { width: 1600, height: 640 });
    const partPhoto = vehiclePhoto("parts-banner", { width: 1600, height: 640 });
    const photo = isPart ? partPhoto : isMoto ? motoPhoto : "";
    const backgroundImage = photo ? `url(${photo}), url(${vehiclesImage})` : `url(${vehiclesImage})`;

    return (
        <Box
            component="section"
            sx={{
                position: "relative",
                width: "100%",
                minHeight: { xs: 220, sm: 280, md: 320 },
                backgroundImage,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "flex-end",
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 3, md: 5 },
                overflow: "hidden",
                boxSizing: "border-box",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.55) 55%, rgba(15,23,42,0.82) 100%)",
                    zIndex: 1,
                },
            }}
        >
            <Box sx={{ position: "relative", zIndex: 2, maxWidth: 720, color: "#fff" }}>
                <Chip
                    icon={isPart ? <BuildOutlinedIcon /> : isMoto ? <TwoWheelerOutlinedIcon /> : <DirectionsCarOutlinedIcon />}
                    label={
                        isPart
                            ? t("vehiclesApp.banner.partBadge", "Spare parts")
                            : isMoto
                              ? t("vehiclesApp.banner.motoBadge", "Motos")
                              : t("vehiclesApp.banner.badge", "Vehicles")
                    }
                    size="small"
                    sx={{
                        mb: 1.5,
                        color: "#fff",
                        bgcolor: "rgba(255,255,255,0.16)",
                        backdropFilter: "blur(6px)",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#fff" },
                    }}
                />
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontWeight: 800,
                        lineHeight: 1.25,
                        fontSize: { xs: "1.45rem", sm: "1.9rem", md: "2.3rem" },
                        textShadow: "0 2px 12px rgba(0,0,0,0.25)",
                    }}
                >
                    {isPart
                        ? t("vehiclesApp.banner.partTitle", "Car and Motorcycle Spare Parts")
                        : isMoto
                        ? t("vehiclesApp.banner.motoTitle", "Motorcycles, Scooters and Bikes Across Morocco")
                        : t("vehiclesApp.banner.title", "Buy, Sell and Rent Vehicles Across Morocco")}
                </Typography>
                <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.86)", fontSize: { xs: "0.92rem", md: "1.02rem" } }}>
                    {isPart
                        ? t("vehiclesApp.banner.partDescription", "New, used and refurbished parts from private sellers, parts shops and scrapyards.")
                        : isMoto
                        ? t("vehiclesApp.banner.motoDescription", "Motorcycles, scooters, bicycles, kick scooters and tricycles to buy or rent.")
                        : t("vehiclesApp.banner.description", "Cars, SUVs and vans from owners, agencies and showrooms, with verified contacts.")}
                </Typography>
            </Box>
        </Box>
    );
}
