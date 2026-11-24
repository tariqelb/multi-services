// src/Apps/vehicles/VehicleDetails/SimilarVehicles.jsx
// "Similar vehicles" under the details, same layout as similar properties:
// same offer and section (car / moto type), closest make, price, city first.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Pagination, Typography } from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";
import VehicleCard from "../VehicleList/VehicleCard";

const PER_PAGE = 4;

export default function SimilarVehicles({ vehicleId, isMoto }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get(`/vehicles/${vehicleId}/similar`);
                if (!cancelled) {
                    setVehicles(data.vehicles || []);
                    setPage(1);
                }
            } catch {
                // Optional section: nothing shown on error.
                if (!cancelled) setVehicles([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [vehicleId]);

    if (!vehicles.length) return null;

    const totalPages = Math.ceil(vehicles.length / PER_PAGE);
    const shown = vehicles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <Box component="section" sx={{ mt: 5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: "#0f172a" }}>
                {isMoto ? t("vehiclesApp.similar.motoTitle", "Similar Motos") : t("vehiclesApp.similar.title", "Similar Vehicles")}
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "minmax(0, 1fr)",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(3, minmax(0, 1fr))",
                        xl: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: { xs: 3, sm: 2.5, md: 3 },
                    alignItems: "stretch",
                }}
            >
                {shown.map((vehicle) => (
                    <VehicleCard
                        key={vehicle._id}
                        vehicle={vehicle}
                        onClick={() => {
                            navigate(`/vehicles/${vehicle._id}`);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                ))}
            </Box>

            {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" />
                </Box>
            )}
        </Box>
    );
}
