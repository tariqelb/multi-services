// src/Apps/vehicles/MyVehicles/MyVehicleCard.jsx
// Horizontal card of "My vehicles", same design as the cards of the property
// "My publications": photo on the side, offer + status, main facts and the
// actions Edit · Edit status · View details · Delete.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";

import getImageUrl from "../../../utils/getImageUrl";
import { STATUSES_BY_LISTING_TYPE } from "../vehicleOptions";
import { formatCity, formatDate, formatNumber, optionLabel } from "../vehicleFormat";

const STATUS_STYLES = {
    Available: { bgcolor: "#dcfce7", color: "#15803d" },
    Sold: { bgcolor: "#fee2e2", color: "#b91c1c" },
    Rented: { bgcolor: "#fee2e2", color: "#b91c1c" },
    Inactive: { bgcolor: "#f1f5f9", color: "#475569" },
};

const chipSx = { height: 28, px: 0.5, fontWeight: 700, fontSize: "0.78rem", borderRadius: "16px" };

// Same responsive action buttons as the property cards.
const actionSx = {
    textTransform: "none",
    fontWeight: 700,
    whiteSpace: "nowrap",
    flexShrink: 0,
    px: { xs: 0.8, sm: 1.5 },
    fontSize: { xs: "0.68rem", sm: "0.875rem" },
    "& .MuiButton-startIcon": { mr: { xs: 0.5, sm: 1 }, ml: 0, "& > *:nth-of-type(1)": { fontSize: { xs: 15, sm: 20 } } },
};

// Spare parts use the same card through these optional props:
//   basePath   "/vehicles" (default) or "/vehicles/parts": edit and view links
//   typeLabel, offer {label, color}, facts, statuses, emptyIcon
export default function MyVehicleCard({ vehicle, onStatusChange, onDelete, basePath = "/vehicles", typeLabel, offer, facts: factsOverride, statuses, emptyIcon }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const language = i18n.language;

    const [statusAnchor, setStatusAnchor] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isMoto = vehicle.category === "moto";
    const isRent = vehicle.listingType === "rent";
    const image = getImageUrl(vehicle.images?.[0]);
    const status = vehicle.status || "Available";
    const statusLabel = (value) => t(`vehiclesApp.status.${value}`, value);
    const type = typeLabel ?? (isMoto ? optionLabel(t, "motoType", vehicle.motoType) : optionLabel(t, "bodyType", vehicle.bodyType));
    const date = formatDate(vehicle.createdAt, language);
    const price = vehicle.price
        ? `${formatNumber(vehicle.price, language)} ${t("vehiclesApp.price.currency", "MAD")}`
        : t("vehiclesApp.price.onRequest", "Price on request");

    const facts = factsOverride || [
        { label: t("vehiclesApp.form.vehicle.year", "Year"), value: vehicle.year },
        {
            label: t("vehiclesApp.form.vehicle.mileage", "Mileage"),
            value: vehicle.condition === "used" && vehicle.mileage ? `${formatNumber(vehicle.mileage, language)} km` : null,
        },
        {
            label: isMoto ? t("vehiclesApp.form.moto.power", "Power") : t("vehiclesApp.form.vehicle.fuel", "Fuel"),
            value: optionLabel(t, "fuel", vehicle.fuel),
        },
        isMoto
            ? { label: t("vehiclesApp.form.moto.engineCc", "Engine"), value: vehicle.engineCc ? `${formatNumber(vehicle.engineCc, language)} cc` : null }
            : { label: t("vehiclesApp.form.vehicle.transmission", "Gearbox"), value: optionLabel(t, "transmission", vehicle.transmission) },
    ].filter((fact) => fact.value);

    const chooseStatus = async (next) => {
        setStatusAnchor(null);
        if (next === status) return;
        setUpdating(true);
        try {
            await onStatusChange(vehicle, next);
        } finally {
            setUpdating(false);
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(vehicle);
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
        }
    };

    return (
        <>
            <Card
                variant="outlined"
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    borderRadius: "16px",
                    borderColor: "#e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    bgcolor: "#ffffff",
                    transition: "all 0.2s ease",
                    "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.08)" },
                }}
            >
                {/* Photo */}
                <Box
                    sx={{
                        width: { xs: "100%", sm: 300 },
                        height: { xs: 200, sm: 260 },
                        flex: { xs: "0 0 200px", sm: "0 0 300px" },
                        bgcolor: "#e2e8f0",
                        display: "grid",
                        placeItems: "center",
                        color: "#94a3b8",
                        "& > svg": { fontSize: 56 },
                    }}
                >
                    {image ? (
                        <Box component="img" src={image} alt={vehicle.title} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : emptyIcon ? (
                        emptyIcon
                    ) : isMoto ? (
                        <TwoWheelerOutlinedIcon />
                    ) : (
                        <DirectionsCarOutlinedIcon />
                    )}
                </Box>

                {/* Content */}
                <Box sx={{ p: 2.5, pt: { xs: 2.5, sm: 3 }, display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                    <Stack
                        direction={{ xs: "column-reverse", sm: "row" }}
                        spacing={{ xs: 1, sm: 2 }}
                        sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
                    >
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
                                {[date && `${t("vehiclesApp.mine.publishedOn", "Published on")} ${date}`, type].filter(Boolean).join(" • ")}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mt: 0.5, overflowWrap: "anywhere" }}>
                                {vehicle.title}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#2563EB", whiteSpace: "nowrap" }}>
                                {price}
                                {isRent && vehicle.price ? (
                                    <Typography component="span" variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        {" "}
                                        / {t("vehiclesApp.card.perDay", "day")}
                                    </Typography>
                                ) : null}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                            <Chip
                                size="small"
                                label={offer?.label ?? optionLabel(t, "listingType", vehicle.listingType)}
                                sx={{ ...chipSx, bgcolor: offer?.color || (isRent ? "#0284c7" : "#2563EB"), color: "#fff" }}
                            />
                            <Chip size="small" label={statusLabel(status)} sx={{ ...chipSx, ...(STATUS_STYLES[status] || STATUS_STYLES.Inactive) }} />
                        </Stack>
                    </Stack>

                    {vehicle.city && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "#64748B", mb: 2 }}>
                            <LocationOnIcon sx={{ fontSize: 16, color: "#2563EB" }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatCity(vehicle, language)}
                            </Typography>
                        </Stack>
                    )}

                    {facts.length > 0 && (
                        <Stack direction="row" spacing={3} useFlexGap sx={{ color: "#475569", mb: 2, typography: "body2", fontWeight: 600, flexWrap: "wrap", rowGap: 1 }}>
                            {facts.map((fact) => (
                                <Box key={fact.label}>
                                    {fact.label}: <strong>{fact.value}</strong>
                                </Box>
                            ))}
                        </Stack>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2, borderTop: "1px solid #f1f5f9", mt: "auto", overflowX: "auto" }}>
                        <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }} sx={{ justifyContent: "flex-end", alignItems: "center", flexWrap: "nowrap" }}>
                            <Button variant="contained" size="small" startIcon={<EditNoteIcon />} onClick={() => navigate(`${basePath}/${vehicle._id}/edit`)} sx={actionSx}>
                                {t("vehiclesApp.mine.edit", "Edit")}
                            </Button>

                            <Button
                                variant="outlined"
                                size="small"
                                disabled={updating}
                                startIcon={updating ? <CircularProgress size={14} /> : <EditIcon />}
                                onClick={(event) => setStatusAnchor(event.currentTarget)}
                                sx={{ ...actionSx, borderColor: "#E2E8F0", color: "#0f172a" }}
                            >
                                {updating ? t("vehiclesApp.mine.updating", "Updating...") : t("vehiclesApp.mine.editStatus", "Edit status")}
                            </Button>
                            <Menu
                                anchorEl={statusAnchor}
                                open={Boolean(statusAnchor)}
                                onClose={() => setStatusAnchor(null)}
                                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                            >
                                {(statuses || STATUSES_BY_LISTING_TYPE[vehicle.listingType] || ["Available", "Inactive"]).map((option) => (
                                    <MenuItem key={option} selected={option === status} onClick={() => chooseStatus(option)} sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                                        {statusLabel(option)}
                                    </MenuItem>
                                ))}
                            </Menu>

                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => navigate(`${basePath}/${vehicle._id}`)}
                                sx={{ ...actionSx, borderColor: "#E2E8F0", color: "#334155" }}
                            >
                                {t("vehiclesApp.mine.viewDetails", "View details")}
                            </Button>

                            <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} sx={actionSx}>
                                {t("vehiclesApp.mine.delete", "Delete")}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Card>

            <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
                <DialogTitle sx={{ fontWeight: 700 }}>{t("vehiclesApp.mine.deleteTitle", "Delete this listing?")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("vehiclesApp.mine.deleteText", "\"{{title}}\" and its photos will be removed for good.", { title: vehicle.title })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteOpen(false)} disabled={deleting} sx={{ textTransform: "none", fontWeight: 600, color: "#64748B" }}>
                        {t("vehiclesApp.mine.cancel", "Cancel")}
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                        {t("vehiclesApp.mine.confirmDelete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
