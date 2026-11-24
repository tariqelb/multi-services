// src/Apps/vehicles/Admin/VehiclePublicationReviewCard.jsx
//
// Admin review card for one vehicle publication: a car, a moto & bike or a
// spare part (publication.kind). Same design as the property review card.

import { useAdminAccess } from "../../../Components/Admin/adminSections";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardMedia,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
    CalendarToday,
    Delete,
    ImageNotSupportedOutlined,
    LocationOn,
    Person,
    Visibility,
} from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import { KIND_META } from "./vehiclePublicationKinds";
import { formatNumber, optionLabel } from "../vehicleFormat";
import { compatibilityLabel } from "../SpareParts/sparePartOptions";

const STATUS_TONE = {
    available: "success",
    active: "success",
    open: "success",
    full: "warning",
    sold: "error",
    rented: "error",
    completed: "default",
    inactive: "default",
};

function toKey(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replaceAll(" ", "_")
        .replaceAll("-", "_");
}

function hasValue(value) {
    return value !== "" && value !== null && value !== undefined;
}

/** One shape for the three kinds of vehicle publication. */
function describe(publication, t, formatMoney, language) {
    const kind = publication.kind || "car";
    const id = publication._id || publication.id;
    const owner =
        publication.userId && typeof publication.userId === "object"
            ? publication.userId
            : publication.owner || {};

    const base = {
        kind,
        id,
        owner,
        createdAt: publication.createdAt,
        status: publication.status || "",
        title: publication.title || t("adminPublications.card.untitled"),
        image: publication.images?.[0],
        location: [publication.neighborhood, publication.city].filter(Boolean).join(", "),
    };

    if (kind === "part") {
        return {
            ...base,
            price: hasValue(publication.price)
                ? `${formatMoney(publication.price)} ${t("vehiclesApp.parts.perUnit", "each")}`
                : t("adminPublications.card.priceOnRequest"),
            typeLabel: optionLabel(t, "partCategory", publication.partCategory),
            secondaryType: optionLabel(t, "partVehicleType", publication.vehicleType || "car"),
            details: [
                `${t("vehiclesApp.parts.fits", "Fits")}: ${compatibilityLabel(publication, t) || "—"}`,
                publication.condition ? optionLabel(t, "partCondition", publication.condition) : null,
                publication.brand || null,
                Number(publication.quantity) > 1 ? `${t("vehiclesApp.parts.form.quantity", "Quantity")}: ${publication.quantity}` : null,
                publication.business?.name || null,
            ].filter(Boolean),
            detailsPath: `/vehicles/parts/${id}`,
        };
    }

    // car / moto
    return {
        ...base,
        price: hasValue(publication.price)
            ? `${formatMoney(publication.price)}${publication.listingType === "rent" ? ` ${t("adminPublications.card.perDay")}` : ""}`
            : t("adminPublications.card.priceOnRequest"),
        typeLabel: optionLabel(t, "listingType", publication.listingType),
        secondaryType:
            kind === "moto"
                ? [optionLabel(t, "motoType", publication.motoType), [publication.make, publication.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ")
                : [publication.make, publication.model].filter(Boolean).join(" "),
        details: [
            publication.year ? String(publication.year) : null,
            hasValue(publication.mileage) && publication.mileage > 0 ? `${formatNumber(publication.mileage, language)} km` : null,
            publication.fuel && publication.fuel !== "none" ? optionLabel(t, "fuel", publication.fuel) : null,
            publication.transmission ? optionLabel(t, "transmission", publication.transmission) : null,
            publication.business?.name || null,
        ].filter(Boolean),
        detailsPath: `/vehicles/${id}`,
    };
}

export default function VehiclePublicationReviewCard({ publication, onDeleted }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const item = publication || {};

    // View-only team members: no Delete button.
    const canDelete = useAdminAccess().can("vehiclePublications", "write");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

    const locale = i18n.language?.startsWith("ar") ? "ar-MA" : i18n.language?.startsWith("fr") ? "fr-FR" : "en-GB";
    const formatMoney = (value) => `${Number(value || 0).toLocaleString(locale)} MAD`;

    const view = describe(item, t, formatMoney, i18n.language);
    const meta = KIND_META[view.kind] || KIND_META.car;
    const imageUrl = view.image ? getImageUrl(view.image) : "";

    const ownerName =
        [view.owner.firstName, view.owner.lastName].filter(Boolean).join(" ") ||
        view.owner.name ||
        t("adminPublications.card.unknownUser");
    const ownerEmail = view.owner.email || t("adminPublications.card.noEmail");

    const formattedDate = view.createdAt
        ? new Date(view.createdAt).toLocaleString(locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : t("adminPublications.card.dateUnavailable");

    const statusKey = toKey(view.status);
    const statusLabel = view.status
        ? t(`adminPublications.statuses.${statusKey}`, { defaultValue: view.status })
        : "";

    const notify = (message, severity = "success") => setNotification({ open: true, message, severity });

    const handleViewDetails = () => {
        if (!view.id) {
            notify(t("adminPublications.notifications.missingId"), "error");
            return;
        }

        navigate(view.detailsPath);
    };

    const handleDelete = async () => {
        if (!view.id) {
            notify(t("adminPublications.notifications.missingId"), "error");
            return;
        }

        try {
            setDeleting(true);
            await axiosInstance.delete(`/vehicles/admin/publications/${view.kind}/${view.id}`);
            setDeleteDialogOpen(false);
            // The page removes the card and shows the success message.
            onDeleted?.(view.id, view.kind);
        } catch (error) {
            console.error("Failed to delete publication:", error.response?.data || error);
            notify(error.response?.data?.message || t("adminPublications.notifications.deleteError"), "error");
        } finally {
            setDeleting(false);
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
                    overflow: "hidden",
                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                    "&:hover": { boxShadow: 3, borderColor: `${meta.color}.light` },
                }}
            >
                {/* Image */}
                <Box
                    sx={{
                        position: "relative",
                        width: { xs: "100%", sm: 250 },
                        height: { xs: 190, sm: "auto" },
                        minHeight: { sm: 220 },
                        flex: { xs: "0 0 190px", sm: "0 0 250px" },
                        bgcolor: "action.hover",
                    }}
                >
                    {imageUrl && !imageFailed ? (
                        <CardMedia
                            component="img"
                            image={imageUrl}
                            alt={view.title}
                            loading="lazy"
                            onError={() => setImageFailed(true)}
                            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <Stack
                            spacing={0.5}
                            sx={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", color: "text.disabled" }}
                        >
                            <ImageNotSupportedOutlined sx={{ fontSize: 40 }} />
                            <Typography variant="caption">{t("adminPublications.card.noImage")}</Typography>
                        </Stack>
                    )}

                    <Chip
                        size="small"
                        color={meta.color}
                        icon={meta.icon}
                        label={t(`vehiclesApp.admin.kind.${view.kind}`)}
                        sx={{ position: "absolute", top: 12, insetInlineStart: 12, fontWeight: 700, boxShadow: 1 }}
                    />
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        p: { xs: 2, sm: 2.5 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Stack
                            direction="row"
                            sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1 }}
                        >
                            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
                                <CalendarToday sx={{ fontSize: 15 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {formattedDate}
                                </Typography>
                            </Stack>

                            {statusLabel && (
                                <Chip
                                    size="small"
                                    label={statusLabel}
                                    color={STATUS_TONE[statusKey] || "warning"}
                                    variant={STATUS_TONE[statusKey] === "default" ? "outlined" : "filled"}
                                    sx={{ fontWeight: 700 }}
                                />
                            )}
                        </Stack>

                        <Typography variant="h6" sx={{ fontWeight: 700, overflowWrap: "anywhere", lineHeight: 1.35 }}>
                            {view.title}
                        </Typography>

                        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main", mt: 0.25 }}>
                            {view.price}
                        </Typography>

                        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", mt: 1, mb: 1.5 }}>
                            {view.typeLabel && (
                                <Chip size="small" color={meta.color} variant="outlined" label={view.typeLabel} />
                            )}
                            {view.secondaryType && (
                                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    {view.secondaryType}
                                </Typography>
                            )}
                        </Stack>

                        {view.location && (
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 1.25, color: "text.secondary" }}>
                                <LocationOn sx={{ fontSize: 17, color: "primary.main" }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {view.location}
                                </Typography>
                            </Stack>
                        )}

                        {view.details.length > 0 && (
                            <Stack
                                direction="row"
                                spacing={2}
                                useFlexGap
                                sx={{ flexWrap: "wrap", rowGap: 0.75, color: "text.secondary", typography: "body2", fontWeight: 600 }}
                            >
                                {view.details.map((detail) => (
                                    <Box key={detail}>{detail}</Box>
                                ))}
                            </Stack>
                        )}
                    </Box>

                    {/* Publisher and actions */}
                    <Box
                        sx={{
                            pt: 1.5,
                            borderTop: "1px solid",
                            borderColor: "divider",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", sm: "center" },
                            flexDirection: { xs: "column", sm: "row" },
                            gap: 1.5,
                        }}
                    >
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0, maxWidth: "100%" }}>
                            <Box
                                sx={(theme) => ({
                                    width: 32,
                                    height: 32,
                                    flexShrink: 0,
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: "primary.main",
                                })}
                            >
                                <Person sx={{ fontSize: 18 }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                    {ownerName}
                                </Typography>
                                <Typography variant="caption" noWrap component="div" sx={{ color: "text.secondary" }}>
                                    {ownerEmail}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={handleViewDetails}
                                sx={{ whiteSpace: "nowrap" }}
                            >
                                {t("adminPublications.card.viewDetails")}
                            </Button>
                            {canDelete && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<Delete />}
                                    onClick={() => setDeleteDialogOpen(true)}
                                    sx={{ whiteSpace: "nowrap" }}
                                >
                                    {t("adminPublications.card.delete")}
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </Box>
            </Card>

            {/* Delete confirmation */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleting && setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>{t("adminPublications.dialog.title")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("adminPublications.dialog.confirm", { title: view.title })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button autoFocus onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                        {t("adminPublications.card.cancel")}
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
                    >
                        {deleting ? t("adminPublications.card.deleting") : t("adminPublications.card.delete")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification((previous) => ({ ...previous, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    onClose={() => setNotification((previous) => ({ ...previous, open: false }))}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
}
