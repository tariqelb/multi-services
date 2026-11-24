// src/Apps/vehicles/VehicleMap/VehicleMapCard.jsx
// Card shown when hovering a vehicle marker, same layout as the property map card.

import { useTranslation } from "react-i18next";
import { Box, Button, Typography } from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import getImageUrl from "../../../utils/getImageUrl";
import { formatCity, formatVehiclePrice, optionLabel } from "../vehicleFormat";

export default function VehicleMapCard({ vehicle, onViewDetails }) {
    const { t, i18n } = useTranslation();
    if (!vehicle) return null;

    const isMoto = vehicle.category === "moto";
    const image = getImageUrl(vehicle.images?.[0]);
    const type = isMoto ? optionLabel(t, "motoType", vehicle.motoType) : optionLabel(t, "bodyType", vehicle.bodyType);
    const facts = [type, vehicle.year, optionLabel(t, "listingType", vehicle.listingType)].filter(Boolean).join(" · ");

    return (
        <Box sx={{ width: 250, overflow: "hidden", bgcolor: "#fff", borderRadius: 2, color: "#1f2937" }}>
            {image ? (
                <Box component="img" src={image} alt={vehicle.title} sx={{ width: "100%", height: 135, objectFit: "cover", display: "block" }} />
            ) : (
                <Box sx={{ height: 135, display: "grid", placeItems: "center", bgcolor: "#f1f5f9", color: "#94a3b8", "& svg": { fontSize: 44 } }}>
                    {isMoto ? <TwoWheelerOutlinedIcon /> : <DirectionsCarOutlinedIcon />}
                </Box>
            )}

            <Box sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 0.5, lineHeight: 1.3 }}>{vehicle.title}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 12 }}>{formatCity(vehicle, i18n.language)}</Typography>
                {vehicle.approximate && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5, color: "#a16207", fontSize: 11, fontWeight: 600 }}>
                        <PlaceOutlinedIcon sx={{ fontSize: 14 }} />
                        {t("vehiclesApp.map.approximateNote", "Approximate position (city centre)")}
                    </Box>
                )}
                <Typography sx={{ fontWeight: 700, color: "primary.main", fontSize: 14, mt: 1 }}>{formatVehiclePrice(vehicle, t, i18n.language)}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{facts}</Typography>
                <Button fullWidth size="small" variant="contained" onClick={onViewDetails} sx={{ mt: 1.5 }}>
                    {t("vehiclesApp.map.viewDetails", "View details")}
                </Button>
            </Box>
        </Box>
    );
}
