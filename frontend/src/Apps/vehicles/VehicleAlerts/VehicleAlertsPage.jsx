// src/Apps/vehicles/VehicleAlerts/VehicleAlertsPage.jsx
// /vehicles/alerts — vehicle alerts, same page as the property alerts:
// create an alert (city or all cities, for sale / for rent / both,
// vehicles and / or motos & bikes, their types, optional makes and maximum
// price), see the active ones and the archived (silent) ones.
// A new vehicle matching an active alert sends a notification, an email
// and a WhatsApp message, depending on the user's settings.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert as MuiAlert,
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    InputAdornment,
    Link,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import Add from "@mui/icons-material/Add";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import cities from "../../../data/moroccanCities";
import AlertSelectionChips from "../../Property/Alert/AlertSelectionChips";

import { BODY_TYPES, MOTO_TYPES, makesFor } from "../vehicleOptions";
import { optionLabel } from "../vehicleFormat";
import VehicleAlertCard from "./VehicleAlertCard";

const API = "/vehicles/alerts";
const ALL = "all";
const LISTING_TYPES = ["sale", "rent"];
const CATEGORIES = ["car", "moto"];

const sectionTitleSx = { fontSize: { xs: "1.05rem", sm: "1.15rem" }, fontWeight: 700, color: "#0F172A", mb: 2.5 };
const hintSx = { color: "text.secondary", fontSize: "0.9rem", mb: 2, mt: -1.5 };

export default function VehicleAlertsPage() {
    const { t, i18n } = useTranslation();
    const isArabic = String(i18n.language).startsWith("ar");

    const [alerts, setAlerts] = useState([]);
    const [archivedAlerts, setArchivedAlerts] = useState([]);
    const [tab, setTab] = useState("active");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form
    const [city, setCity] = useState(ALL);
    const [listingTypes, setListingTypes] = useState(["sale"]);
    const [categories, setCategories] = useState(["car"]);
    const [bodyTypes, setBodyTypes] = useState([]);
    const [motoTypes, setMotoTypes] = useState([]);
    const [makes, setMakes] = useState([]);
    const [maxPrice, setMaxPrice] = useState("");

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const cityLabel = useCallback(
        (name) => {
            if (!name || name === ALL) return t("vehiclesApp.alerts.allCities", "All cities");
            const known = cities.find((item) => item.en.toLowerCase() === String(name).toLowerCase());
            return isArabic && known?.ar ? known.ar : known?.en || name;
        },
        [isArabic, t],
    );
    const cityOptions = useMemo(
        () => [ALL, ...cities.map((item) => item.en).sort((a, b) => cityLabel(a).localeCompare(cityLabel(b), isArabic ? "ar" : "fr"))],
        [cityLabel, isArabic],
    );
    const makeOptions = useMemo(
        () => [...new Set(categories.flatMap((category) => makesFor(category)))].sort((a, b) => a.localeCompare(b)),
        [categories],
    );

    // Load
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get(API, { params: { includeArchived: true } });
                if (cancelled) return;
                const list = data.vehicleAlerts || [];
                setAlerts(list.filter((alert) => !alert.isArchived));
                setArchivedAlerts(list.filter((alert) => alert.isArchived));
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("alerts.errors.load", "Failed to load alerts."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    // Create
    const createAlert = async () => {
        clearMessages();
        if (!listingTypes.length) return setError(t("vehiclesApp.alerts.errors.offer", "Choose for sale, for rent or both."));
        if (!categories.length) return setError(t("vehiclesApp.alerts.errors.section", "Choose vehicles, motos & bikes or both."));

        setSaving(true);
        try {
            const { data } = await axiosInstance.post(API, {
                city: city === ALL ? "" : city,
                listingTypes,
                categories,
                bodyTypes: categories.includes("car") ? bodyTypes : [],
                motoTypes: categories.includes("moto") ? motoTypes : [],
                makes,
                maxPrice: maxPrice ? Number(maxPrice) : null,
            });
            setAlerts((previous) => [data.vehicleAlert, ...previous]);
            setTab("active");
            setSuccess(t("vehiclesApp.alerts.created", "Alert created. We will notify you when a matching vehicle is published."));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("alerts.errors.create", "Failed to create alert."));
        } finally {
            setSaving(false);
        }
    };

    // Archive (silent) / restore
    const archive = async (id) => {
        clearMessages();
        setBusyId(id);
        try {
            const { data } = await axiosInstance.delete(`${API}/${id}`);
            setAlerts((previous) => previous.filter((alert) => alert._id !== id));
            setArchivedAlerts((previous) => [data.vehicleAlert, ...previous]);
            setSuccess(t("vehiclesApp.alerts.archived", "Alert archived: it will not notify you anymore."));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("alerts.errors.archive", "Failed to archive alert."));
        } finally {
            setBusyId(null);
        }
    };
    const restore = async (id) => {
        clearMessages();
        setBusyId(id);
        try {
            const { data } = await axiosInstance.patch(`${API}/${id}/restore`);
            setArchivedAlerts((previous) => previous.filter((alert) => alert._id !== id));
            setAlerts((previous) => [data.vehicleAlert, ...previous]);
            setSuccess(t("vehiclesApp.alerts.restored", "Alert restored: you will be notified again."));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("alerts.errors.restore", "Failed to restore alert."));
        } finally {
            setBusyId(null);
        }
    };

    const shown = tab === "active" ? alerts : archivedAlerts;
    const sectionLabel = (category) =>
        category === "moto" ? t("vehiclesApp.alerts.motos", "Motos & bikes") : t("vehiclesApp.alerts.vehicles", "Vehicles");

    return (
        <Box sx={{ ...pagePaddingSx, display: "flex", flexDirection: "column", gap: { xs: 2.5, md: 3 } }}>
            <PageHeader
                icon={<NotificationsActiveOutlined />}
                title={t("vehiclesApp.alerts.title", "Vehicle alerts")}
                subtitle={t("vehiclesApp.alerts.subtitle", "Be told as soon as a vehicle, moto or bike you are looking for is published.")}
                sx={{ mb: 0 }}
            />

            {error && (
                <MuiAlert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
                    {error}
                </MuiAlert>
            )}
            {success && (
                <MuiAlert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>
                    {success}
                </MuiAlert>
            )}

            {/* Create */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, sm: 4, md: 6 },
                    border: "1px solid #E2E8F0",
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: "#ffffff",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: { xs: "1.35rem", sm: "1.5rem", md: "1.6rem" }, mb: 2 }}>
                    {t("vehiclesApp.alerts.createTitle", "Create a vehicle alert")}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: { xs: "0.9rem", sm: "1rem" }, lineHeight: 1.8, mb: { xs: 3.5, sm: 5 } }}>
                    {t("vehiclesApp.alerts.createSubtitle", "Choose what you are looking for. You get a notification, an email and a WhatsApp message (if turned on in your settings).")}
                </Typography>

                {/* City */}
                <Typography sx={sectionTitleSx}>{t("vehiclesApp.alerts.city", "City")}</Typography>
                <Autocomplete
                    options={cityOptions}
                    value={city}
                    onChange={(_event, value) => {
                        setCity(value || ALL);
                        clearMessages();
                    }}
                    getOptionLabel={cityLabel}
                    disableClearable
                    renderInput={(params) => <TextField {...params} placeholder={t("vehiclesApp.alerts.allCities", "All cities")} />}
                    sx={{ mb: { xs: 4, sm: 5 } }}
                />

                {/* Offer */}
                <Typography sx={sectionTitleSx}>{t("vehiclesApp.alerts.offer", "For sale, for rent or both")}</Typography>
                <AlertSelectionChips
                    options={LISTING_TYPES}
                    selected={listingTypes}
                    setter={setListingTypes}
                    getLabel={(value) => optionLabel(t, "listingType", value)}
                    onSelectionChange={clearMessages}
                />

                {/* Section */}
                <Typography sx={sectionTitleSx}>{t("vehiclesApp.alerts.section", "Vehicles, motos & bikes or both")}</Typography>
                <AlertSelectionChips options={CATEGORIES} selected={categories} setter={setCategories} getLabel={sectionLabel} onSelectionChange={clearMessages} />

                {categories.includes("car") && (
                    <>
                        <Typography sx={sectionTitleSx}>{t("vehiclesApp.alerts.vehicleTypes", "Vehicle types")}</Typography>
                        <Typography sx={hintSx}>{t("vehiclesApp.alerts.anyTypeHint", "Leave empty to be told about every type.")}</Typography>
                        <AlertSelectionChips
                            options={BODY_TYPES}
                            selected={bodyTypes}
                            setter={setBodyTypes}
                            getLabel={(value) => optionLabel(t, "bodyType", value)}
                            onSelectionChange={clearMessages}
                        />
                    </>
                )}
                {categories.includes("moto") && (
                    <>
                        <Typography sx={sectionTitleSx}>{t("vehiclesApp.alerts.motoTypes", "Moto and bike types")}</Typography>
                        <Typography sx={hintSx}>{t("vehiclesApp.alerts.anyTypeHint", "Leave empty to be told about every type.")}</Typography>
                        <AlertSelectionChips
                            options={MOTO_TYPES}
                            selected={motoTypes}
                            setter={setMotoTypes}
                            getLabel={(value) => optionLabel(t, "motoType", value)}
                            onSelectionChange={clearMessages}
                        />
                    </>
                )}

                {/* Optional */}
                <Typography sx={sectionTitleSx}>{t("vehiclesApp.alerts.optional", "More precise (optional)")}</Typography>
                <Grid container spacing={2} sx={{ mb: { xs: 4, sm: 5 } }}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={makeOptions}
                            value={makes}
                            onChange={(_event, value) => {
                                setMakes([...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, 10));
                                clearMessages();
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t("vehiclesApp.alerts.makes", "Makes")}
                                    placeholder={makes.length ? "" : t("vehiclesApp.alerts.anyMake", "Any make")}
                                    helperText={t("vehiclesApp.alerts.makesHelp", "Up to 10. Empty: every make.")}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label={t("vehiclesApp.alerts.maxPrice", "Maximum price")}
                            value={maxPrice}
                            onChange={(event) => {
                                setMaxPrice(event.target.value.replace(/[^\d]/g, ""));
                                clearMessages();
                            }}
                            helperText={t("vehiclesApp.alerts.maxPriceHelp", "Per day for rentals. Empty: any price.")}
                            slotProps={{ htmlInput: { min: 0 }, input: { endAdornment: <InputAdornment position="end">MAD</InputAdornment> } }}
                        />
                    </Grid>
                </Grid>

                {/* Summary */}
                <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #E2E8F0", borderRadius: "16px", p: { xs: 2, sm: 3 }, mb: { xs: 3, sm: 4 } }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem" }, color: "#0f172a", mb: 1.5 }}>
                        {t("alerts.selectedForAlert", "Your alert preferences")}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", mb: 1.5 }}>{cityLabel(city)}</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {listingTypes.map((value) => (
                            <Chip key={value} size="small" color="info" variant="outlined" label={optionLabel(t, "listingType", value)} />
                        ))}
                        {categories.map((value) => (
                            <Chip key={value} size="small" color="primary" variant="outlined" label={sectionLabel(value)} />
                        ))}
                        {categories.includes("car") &&
                            (bodyTypes.length
                                ? bodyTypes.map((value) => <Chip key={value} size="small" label={optionLabel(t, "bodyType", value)} />)
                                : [<Chip key="anyCar" size="small" label={t("vehiclesApp.alerts.anyVehicleType", "Any vehicle type")} />])}
                        {categories.includes("moto") &&
                            (motoTypes.length
                                ? motoTypes.map((value) => <Chip key={value} size="small" label={optionLabel(t, "motoType", value)} />)
                                : [<Chip key="anyMoto" size="small" label={t("vehiclesApp.alerts.anyMotoType", "Any moto or bike")} />])}
                        {makes.map((make) => (
                            <Chip key={make} size="small" variant="outlined" label={make} />
                        ))}
                        {maxPrice && (
                            <Chip size="small" color="success" variant="outlined" label={t("vehiclesApp.alerts.maxPriceChip", "≤ {{price}} MAD", { price: Number(maxPrice).toLocaleString() })} />
                        )}
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Add />}
                    disabled={saving || loading}
                    onClick={createAlert}
                    sx={{
                        minHeight: { xs: 50, sm: 58 },
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "10px",
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        boxShadow: "0 6px 18px rgba(37, 99, 235, 0.25)",
                    }}
                >
                    {saving ? t("alerts.saving", "Saving...") : t("alerts.save", "Create alert")}
                </Button>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 2, textAlign: "center" }}>
                    {t("vehiclesApp.alerts.channelsHint", "Email and WhatsApp messages can be turned on or off in")}{" "}
                    <Link component={RouterLink} to="/setting" sx={{ fontWeight: 700 }}>
                        {t("vehiclesApp.alerts.settingsLink", "Settings")}
                    </Link>
                </Typography>
            </Paper>

            {/* Lists */}
            <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, p: 0.75, bgcolor: "#F8FAFC" }}>
                <Tabs
                    value={tab}
                    onChange={(_event, value) => setTab(value)}
                    variant="fullWidth"
                    sx={{
                        minHeight: 52,
                        "& .MuiTabs-indicator": { display: "none" },
                        "& .MuiTab-root": { minHeight: 52, textTransform: "none", fontWeight: 700, borderRadius: 2, color: "#64748B" },
                        "& .MuiTab-root.Mui-selected": { bgcolor: "#FFFFFF", color: "#2563EB", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
                    }}
                >
                    <Tab value="active" label={t("vehiclesApp.alerts.activeTab", "Active ({{count}})", { count: alerts.length })} />
                    <Tab value="archived" label={t("vehiclesApp.alerts.archivedTab", "Archived · silent ({{count}})", { count: archivedAlerts.length })} />
                </Tabs>
            </Paper>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 6, bgcolor: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "16px" }}>
                    <CircularProgress />
                </Box>
            ) : shown.length === 0 ? (
                <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, textAlign: "center", border: "1px dashed #E2E8F0", borderRadius: "16px" }}>
                    <NotificationsActiveOutlined sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: "#334155" }}>
                        {tab === "active" ? t("vehiclesApp.alerts.emptyActive", "No active alert yet") : t("vehiclesApp.alerts.emptyArchived", "No archived alert")}
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={2.5}>
                    {shown.map((alert) => (
                        <VehicleAlertCard
                            key={alert._id}
                            alert={alert}
                            archived={tab === "archived"}
                            busyId={busyId}
                            onArchive={archive}
                            onRestore={restore}
                            cityLabel={cityLabel}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}
