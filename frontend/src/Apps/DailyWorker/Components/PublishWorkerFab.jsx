// src/Apps/DailyWorker/Components/PublishWorkerFab.jsx
// Same floating button as "Add property" / "Add vehicle".

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Fab, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function PublishWorkerFab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    return (
        <Tooltip title={t("workersApp.fab.tooltip", "Publish your worker profile")} placement="left">
            <Fab
                variant="extended"
                color="primary"
                aria-label={t("workersApp.fab.label", "Publish my profile")}
                onClick={() => navigate("/daily-worker/publish")}
                sx={{
                    position: "fixed !important",
                    bottom: { xs: 16, md: 32 },
                    insetInlineEnd: { xs: 16, md: 32 },
                    zIndex: 9999,
                    bgcolor: "#2563EB",
                    color: "#fff",
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
                {t("workersApp.fab.label", "Publish my profile")}
            </Fab>
        </Tooltip>
    );
}
