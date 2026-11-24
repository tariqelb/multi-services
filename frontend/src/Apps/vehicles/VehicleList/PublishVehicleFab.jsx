// src/Apps/vehicles/VehicleList/PublishVehicleFab.jsx
// Same floating button as "Add property".

import { Fab, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PublishVehicleFab({ category = "car" }) {
    const isMoto = category === "moto";
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <Tooltip
            title={isMoto ? t("vehiclesApp.fab.motoTooltip", "Publish a new moto listing") : t("vehiclesApp.fab.tooltip", "Publish a new vehicle listing")}
            placement="left"
        >
            <Fab
                variant="extended"
                color="primary"
                aria-label={isMoto ? t("vehiclesApp.fab.motoLabel", "Add moto") : t("vehiclesApp.fab.label", "Add vehicle")}
                onClick={() => navigate(isMoto ? "/motos/publish" : "/vehicles/publish")}
                sx={{
                    position: "fixed !important",
                    bottom: { xs: 16, md: 32 },
                    insetInlineEnd: { xs: 16, md: 32 },
                    zIndex: 9999,
                    bgcolor: "#2563EB",
                    color: "#ffffff",
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
                    "&:hover": { bgcolor: "#1D4ED8" },
                }}
            >
                <AddIcon sx={{ marginInlineEnd: 1, fontSize: 24 }} />
                {isMoto ? t("vehiclesApp.fab.motoLabel", "Add moto") : t("vehiclesApp.fab.label", "Add vehicle")}
            </Fab>
        </Tooltip>
    );
}
