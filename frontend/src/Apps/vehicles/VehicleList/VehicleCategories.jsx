// src/Apps/vehicles/VehicleList/VehicleCategories.jsx
// "Explore categories" strip, same layout as the real estate one, with real photos.
// Cars: body types. Motos: motorcycle, scooter, bicycle, kick scooter, tricycle.
//
// Photos: free Unsplash photos (see vehiclePhotos.js), or the local copies in
// src/assets/vehicles after `npm run vehicle-photos`. A photo that does not
// load shows the category icon instead.

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import TimeToLeaveRoundedIcon from "@mui/icons-material/TimeToLeaveRounded";
import TerrainRoundedIcon from "@mui/icons-material/TerrainRounded";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import SportsScoreRoundedIcon from "@mui/icons-material/SportsScoreRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import FamilyRestroomRoundedIcon from "@mui/icons-material/FamilyRestroomRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import TwoWheelerRoundedIcon from "@mui/icons-material/TwoWheelerRounded";
import MopedRoundedIcon from "@mui/icons-material/MopedRounded";
import PedalBikeRoundedIcon from "@mui/icons-material/PedalBikeRounded";
import ElectricScooterRoundedIcon from "@mui/icons-material/ElectricScooterRounded";
import ElectricRickshawRoundedIcon from "@mui/icons-material/ElectricRickshawRounded";

import { optionLabel } from "../vehicleFormat";
import { vehiclePhoto } from "../vehiclePhotos";

// key = value sent to the API, file = photo name in src/assets/vehicles.
const CAR_CATEGORIES = [
    { key: "", file: "all-cars", icon: AppsRoundedIcon, color: "#2563EB" },
    { key: "city_car", file: "city-car", icon: DirectionsCarRoundedIcon, color: "#0EA5E9" },
    { key: "sedan", file: "sedan", icon: DirectionsCarFilledRoundedIcon, color: "#6366F1" },
    { key: "suv", file: "suv", icon: TimeToLeaveRoundedIcon, color: "#0F766E" },
    { key: "4x4", file: "4x4", icon: TerrainRoundedIcon, color: "#B45309" },
    { key: "estate", file: "estate", icon: LuggageRoundedIcon, color: "#7C3AED" },
    { key: "coupe", file: "coupe", icon: SportsScoreRoundedIcon, color: "#DC2626" },
    { key: "convertible", file: "convertible", icon: WbSunnyRoundedIcon, color: "#F59E0B" },
    { key: "minivan", file: "minivan", icon: FamilyRestroomRoundedIcon, color: "#DB2777" },
    { key: "van", file: "van", icon: AirportShuttleRoundedIcon, color: "#475569" },
    { key: "pickup", file: "pickup", icon: LocalShippingRoundedIcon, color: "#15803D" },
];

const MOTO_CATEGORIES = [
    { key: "", file: "all-motos", icon: AppsRoundedIcon, color: "#2563EB" },
    { key: "motorcycle", file: "motorcycle", icon: TwoWheelerRoundedIcon, color: "#DC2626" },
    { key: "scooter", file: "scooter", icon: MopedRoundedIcon, color: "#0EA5E9" },
    { key: "bicycle", file: "bicycle", icon: PedalBikeRoundedIcon, color: "#15803D" },
    { key: "kick_scooter", file: "kick-scooter", icon: ElectricScooterRoundedIcon, color: "#7C3AED" },
    { key: "tricycle", file: "tricycle", icon: ElectricRickshawRoundedIcon, color: "#B45309" },
];

export default function VehicleCategories({ category = "car", selected = "", onSelect }) {
    const { t } = useTranslation();
    const isMoto = category === "moto";
    const items = isMoto ? MOTO_CATEGORIES : CAR_CATEGORIES;
    // Photos that failed to load: their tile shows the icon.
    const [failed, setFailed] = useState(() => new Set());

    const labelFor = (key) => {
        if (!key) return isMoto ? t("vehiclesApp.categories.allMotos", "All Motos") : t("vehiclesApp.categories.all", "All Vehicles");
        return isMoto ? optionLabel(t, "motoType", key) : optionLabel(t, "bodyType", key);
    };

    return (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2.5, md: 3.5 }, pb: 1, width: "100%", boxSizing: "border-box" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t("vehiclesApp.categories.title", "Explore Categories")}
            </Typography>

            <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1.5, scrollSnapType: "x proximity", scrollbarWidth: "thin" }}>
                {items.map(({ key, file, icon: Icon, color }) => {
                    const label = labelFor(key);
                    const active = selected === key;
                    const photo = failed.has(file) ? "" : vehiclePhoto(file);

                    return (
                        <Box
                            key={key || "all"}
                            role="button"
                            tabIndex={0}
                            aria-pressed={active}
                            aria-label={label}
                            onClick={() => onSelect(key)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onSelect(key);
                                }
                            }}
                            sx={{
                                flex: "0 0 auto",
                                width: { xs: 104, md: 118 },
                                cursor: "pointer",
                                scrollSnapAlign: "start",
                                textAlign: "center",
                                outline: "none",
                                "&:hover img, &:focus-visible img, &:hover .cat-icon, &:focus-visible .cat-icon": { transform: "scale(1.06)" },
                                "&:focus-visible .cat-img": { boxShadow: "0 0 0 3px rgba(37,99,235,.45)" },
                            }}
                        >
                            <Box
                                className="cat-img"
                                sx={{
                                    height: { xs: 72, md: 80 },
                                    borderRadius: "14px",
                                    overflow: "hidden",
                                    border: active ? "2px solid" : "1px solid",
                                    borderColor: active ? "primary.main" : "divider",
                                    bgcolor: "background.muted",
                                    display: "grid",
                                    placeItems: "center",
                                    background: photo ? undefined : `linear-gradient(135deg, ${color}14 0%, ${color}33 100%)`,
                                }}
                            >
                                {photo ? (
                                    <Box
                                        component="img"
                                        src={photo}
                                        alt=""
                                        loading="lazy"
                                        onError={() => setFailed((previous) => new Set(previous).add(file))}
                                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .25s ease" }}
                                    />
                                ) : (
                                    <Icon className="cat-icon" sx={{ fontSize: 38, color, transition: "transform .25s ease" }} />
                                )}
                            </Box>
                            <Typography
                                variant="caption"
                                sx={{ display: "block", mt: 0.75, fontWeight: active ? 800 : 600, lineHeight: 1.25, color: active ? "primary.main" : "text.primary" }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
