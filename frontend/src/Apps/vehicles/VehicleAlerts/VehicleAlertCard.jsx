// src/Apps/vehicles/VehicleAlerts/VehicleAlertCard.jsx
// One vehicle alert, same design as the property alert cards:
// city, what it looks for, how often it matched, Archive / Restore.

import { useTranslation } from "react-i18next";
import { Box, Button, Chip, CircularProgress, Divider, Paper, Stack, Tooltip, Typography } from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlined from "@mui/icons-material/UnarchiveOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";

import { formatDate, formatNumber, optionLabel } from "../vehicleFormat";

const actionButtonSx = {
    flexShrink: 0,
    borderRadius: 2,
    fontSize: "0.9rem",
    minWidth: { xs: "105px", sm: "125px" },
    height: 40,
    px: 1.5,
    textTransform: "none",
    fontWeight: 700,
};

const chipSx = {
    maxWidth: "100%",
    fontWeight: 600,
    fontSize: { xs: "0.8rem", sm: "0.9rem" },
    "& .MuiChip-label": { whiteSpace: "normal" },
};

export default function VehicleAlertCard({ alert, archived = false, busyId, onArchive, onRestore, cityLabel }) {
    const { t, i18n } = useTranslation();
    const busy = busyId === alert._id;
    const hasMoto = (alert.categories || []).includes("moto");
    const hasCar = (alert.categories || []).includes("car");

    const sectionLabel = (category) =>
        category === "moto" ? t("vehiclesApp.alerts.motos", "Motos & bikes") : t("vehiclesApp.alerts.vehicles", "Vehicles");

    return (
        <Paper
            elevation={0}
            sx={{
                width: "100%",
                boxSizing: "border-box",
                p: { xs: 2.5, sm: 4, md: 5 },
                border: "1px solid #E2E8F0",
                borderRadius: { xs: 3, sm: 4 },
                bgcolor: archived ? "#F8FAFC" : "#ffffff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                opacity: archived ? 0.9 : 1,
            }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} sx={{ alignItems: "center", minWidth: 0, flex: 1 }}>
                    <Box
                        sx={{
                            width: { xs: 42, sm: 52 },
                            height: { xs: 42, sm: 52 },
                            flexShrink: 0,
                            borderRadius: "10px",
                            bgcolor: archived ? "#F1F5F9" : "#eff6ff",
                            color: archived ? "#64748B" : "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            "& svg": { fontSize: { xs: 22, sm: 26 } },
                        }}
                    >
                        {hasMoto && !hasCar ? <TwoWheelerOutlinedIcon /> : <DirectionsCarOutlinedIcon />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1.05rem", sm: "1.2rem" }, color: "#0f172a", overflowWrap: "anywhere" }}>
                            {alert.city ? cityLabel(alert.city) : t("vehiclesApp.alerts.allCities", "All cities")}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: { xs: "0.85rem", sm: "0.95rem" }, mt: 0.5 }}>
                            {alert.matchCount
                                ? t("vehiclesApp.alerts.matched", "Matched {{count}} times · last {{date}}", {
                                      count: alert.matchCount,
                                      date: formatDate(alert.lastMatchedAt, i18n.language),
                                  })
                                : t("vehiclesApp.alerts.notMatchedYet", "No match yet")}
                        </Typography>
                    </Box>
                </Stack>

                {archived ? (
                    <Tooltip title={t("vehiclesApp.alerts.restoreHelp", "Restore: you will be notified again")}>
                        <span>
                            <Button
                                disabled={busy}
                                onClick={() => onRestore(alert._id)}
                                startIcon={busy ? <CircularProgress size={17} color="inherit" /> : <UnarchiveOutlined />}
                                sx={{ ...actionButtonSx, color: "#15803D", bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", "&:hover": { bgcolor: "#DCFCE7" } }}
                            >
                                {t("alerts.restore", "Restore")}
                            </Button>
                        </span>
                    </Tooltip>
                ) : (
                    <Tooltip title={t("vehiclesApp.alerts.archiveHelp", "Archive: the alert stays saved but stops notifying you")}>
                        <span>
                            <Button
                                disabled={busy}
                                onClick={() => onArchive(alert._id)}
                                startIcon={busy ? <CircularProgress size={17} color="inherit" /> : <ArchiveOutlined />}
                                sx={{ ...actionButtonSx, color: "#B45309", bgcolor: "#FFFBEB", border: "1px solid #FDE68A", "&:hover": { bgcolor: "#FEF3C7" } }}
                            >
                                {t("alerts.archive", "Archive")}
                            </Button>
                        </span>
                    </Tooltip>
                )}
            </Stack>

            {archived && (
                <Chip
                    size="small"
                    icon={<NotificationsActiveOutlined />}
                    label={t("vehiclesApp.alerts.silent", "Archived · silent")}
                    sx={{ mt: 2, bgcolor: "#F1F5F9", color: "#475569", fontWeight: 700 }}
                />
            )}

            <Divider sx={{ my: { xs: 2.5, sm: 3 } }} />

            <Stack spacing={{ xs: 1.5, sm: 2 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
                    {(alert.listingTypes || []).map((type) => (
                        <Chip key={type} size="small" color="info" variant="outlined" label={optionLabel(t, "listingType", type)} sx={chipSx} />
                    ))}
                    {(alert.categories || []).map((category) => (
                        <Chip key={category} size="small" color="primary" variant="outlined" label={sectionLabel(category)} sx={chipSx} />
                    ))}
                    {alert.maxPrice ? (
                        <Chip
                            size="small"
                            variant="outlined"
                            color="success"
                            label={t("vehiclesApp.alerts.maxPriceChip", "≤ {{price}} MAD", { price: formatNumber(alert.maxPrice, i18n.language) })}
                            sx={chipSx}
                        />
                    ) : null}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
                    {hasCar && !alert.bodyTypes?.length && <Chip size="small" label={t("vehiclesApp.alerts.anyVehicleType", "Any vehicle type")} sx={chipSx} />}
                    {(alert.bodyTypes || []).map((type) => (
                        <Chip key={type} size="small" label={optionLabel(t, "bodyType", type)} sx={chipSx} />
                    ))}
                    {hasMoto && !alert.motoTypes?.length && <Chip size="small" label={t("vehiclesApp.alerts.anyMotoType", "Any moto or bike")} sx={chipSx} />}
                    {(alert.motoTypes || []).map((type) => (
                        <Chip key={type} size="small" label={optionLabel(t, "motoType", type)} sx={chipSx} />
                    ))}
                    {(alert.makes || []).map((make) => (
                        <Chip key={make} size="small" variant="outlined" label={make} sx={chipSx} />
                    ))}
                </Box>
            </Stack>
        </Paper>
    );
}
