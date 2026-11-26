// src/Components/Settings/ProfessionalProfileSettings.jsx
//
// Settings > "Receive requests": owners, agencies and dealers say what they
// work on, so they are notified when someone posts a matching request.
//   - on / off
//   - fields: property, vehicles (one or both); inside each, the offers and
//     types (nothing chosen = all)
//   - who I am: private owner, agency, dealer, rental company, parts shop, scrapyard
//   - cities: some cities, or all Morocco
//   - by notification and/or email, instantly or once a day
// Prefilled from the user's own listings when nothing is set yet.

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";

import axiosInstance from "../../api/axiosInstance";
import moroccanCities from "../../data/moroccanCities";
import { ChoiceChips } from "../ui/FormKit";
import {
    BUSINESS_TYPES,
    PROFILE_PROPERTY_TRANSACTIONS as PROPERTY_TRANSACTIONS,
    PROFILE_PROPERTY_TYPES as PROPERTY_TYPES,
    PROFILE_VEHICLE_CATEGORIES as VEHICLE_CATEGORIES,
    PROFILE_VEHICLE_TRANSACTIONS as VEHICLE_TRANSACTIONS,
    categoryLabel,
    propertyTypeLabel,
} from "./professionalProfileOptions";

const EMPTY = {
    receiveRequests: false,
    fields: [],
    businessType: "",
    businessName: "",
    propertyTransactions: [],
    propertyTypes: [],
    vehicleCategories: [],
    vehicleTransactions: [],
    allMorocco: false,
    cities: [],
    channels: { notification: true, email: true },
    frequency: "instant",
};

function Group({ title, help, children }) {
    return (
        <Box>
            <Typography sx={{ fontWeight: 700, mb: help ? 0.25 : 1 }}>{title}</Typography>
            {help && (
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.25 }}>
                    {help}
                </Typography>
            )}
            {children}
        </Box>
    );
}

export default function ProfessionalProfileSettings() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const cardRef = useRef(null);
    const isArabic = (i18n.resolvedLanguage || i18n.language || "").startsWith("ar");

    const [profile, setProfile] = useState(EMPTY);
    const [suggestion, setSuggestion] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/profile/me/professional")
            .then(({ data }) => {
                if (cancelled) return;
                setProfile({ ...EMPTY, ...data.profile });
                setSuggestion(data.suggestion || {});
            })
            .catch((error) => !cancelled && setNotice({ type: "error", message: error.response?.data?.message || t("requests.settings.loadError", "Unable to load these settings.") }))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [t]);

    // /setting#receive-requests (from the requests board): scroll here.
    useEffect(() => {
        if (!loading && location.hash === "#receive-requests") cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [loading, location.hash]);

    const set = (patch) => {
        setProfile((previous) => ({ ...previous, ...patch }));
        setErrors((previous) => {
            const next = { ...previous };
            Object.keys(patch).forEach((key) => delete next[key]);
            return next;
        });
    };

    const hasSuggestion = Boolean(suggestion.property || suggestion.vehicle);
    const neverSet = !profile.fields.length && !profile.cities.length && !profile.allMorocco;

    const applyMyListings = () => {
        const fields = [suggestion.property && "property", suggestion.vehicle && "vehicle"].filter(Boolean);
        const cities = [...new Set([...(suggestion.property?.cities || []), ...(suggestion.vehicle?.cities || [])])].slice(0, 30);
        set({
            receiveRequests: true,
            fields,
            cities,
            propertyTransactions: suggestion.property?.transactions || [],
            propertyTypes: [],
            vehicleCategories: suggestion.vehicle?.categories || [],
            vehicleTransactions: suggestion.vehicle?.transactions || [],
        });
    };

    const save = async () => {
        const local = {};
        if (profile.receiveRequests) {
            if (!profile.fields.length) local.fields = true;
            if (!profile.allMorocco && !profile.cities.length) local.cities = true;
            if (!profile.channels.notification && !profile.channels.email) local.channels = true;
        }
        if (Object.keys(local).length) {
            setErrors(local);
            setNotice({ type: "error", message: t("requests.settings.checkForm", "Choose at least one field, your cities, and how to be notified.") });
            return;
        }

        setSaving(true);
        setNotice(null);
        try {
            const { data } = await axiosInstance.put("/profile/me/professional", profile);
            setProfile({ ...EMPTY, ...data.profile });
            setNotice({ type: "success", message: t("requests.settings.saved", "Saved. You will receive the requests that match these choices.") });
        } catch (error) {
            setErrors(error.response?.data?.errors || {});
            setNotice({ type: "error", message: error.response?.data?.message || t("requests.settings.saveError", "Unable to save these settings.") });
        } finally {
            setSaving(false);
        }
    };

    const works = (field) => profile.fields.includes(field);
    const cityOptions = moroccanCities.map((city) => city.en);
    const cityLabel = (name) => {
        const city = moroccanCities.find((item) => item.en === name);
        return isArabic && city?.ar ? city.ar : name;
    };

    return (
        <Card variant="outlined" ref={cardRef} id="receive-requests" sx={{ borderRadius: "16px", scrollMarginTop: "5rem" }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", mb: 3 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: "10px", bgcolor: "#EFF6FF", color: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CampaignOutlinedIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {t("requests.settings.title", "Receive requests")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("requests.settings.subtitle", "Owner, agency or dealer? Get notified when someone is looking for what you have in your cities.")}
                        </Typography>
                    </Box>
                </Stack>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {notice && (
                            <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ borderRadius: "10px" }}>
                                {notice.message}
                            </Alert>
                        )}

                        {neverSet && hasSuggestion && (
                            <Alert
                                severity="info"
                                icon={<AutoFixHighOutlinedIcon />}
                                sx={{ borderRadius: "10px" }}
                                action={
                                    <Button color="inherit" size="small" onClick={applyMyListings} sx={{ textTransform: "none", fontWeight: 700 }}>
                                        {t("requests.settings.useListings", "Use my listings")}
                                    </Button>
                                }
                            >
                                {t("requests.settings.suggestion", "You already publish listings. Fill these settings from your listings' fields and cities?")}
                            </Alert>
                        )}

                        <FormControlLabel
                            control={<Switch checked={profile.receiveRequests} onChange={(event) => set({ receiveRequests: event.target.checked })} />}
                            label={
                                <Box>
                                    <Typography sx={{ fontWeight: 700 }}>{t("requests.settings.receive", "Receive requests")}</Typography>
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {profile.receiveRequests ? t("requests.settings.on", "On: you are notified of matching requests.") : t("requests.settings.off", "Off: your choices are kept, no notifications.")}
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: "flex-start", m: 0, gap: 1 }}
                        />

                        <Divider />

                        <Group title={t("requests.settings.fields", "I work in")} help={errors.fields ? t("requests.settings.fieldsRequired", "Choose at least one.") : null}>
                            <ChoiceChips
                                multiple
                                value={profile.fields}
                                onChange={(fields) => set({ fields })}
                                options={[
                                    { value: "property", icon: <HomeWorkOutlinedIcon fontSize="small" />, label: t("requests.services.property", "Property") },
                                    { value: "vehicle", icon: <DirectionsCarOutlinedIcon fontSize="small" />, label: t("requests.services.vehicle", "Vehicles") },
                                ]}
                            />
                        </Group>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField select fullWidth label={t("requests.settings.iAm", "I am")} value={profile.businessType} onChange={(event) => set({ businessType: event.target.value })}>
                                <MenuItem value="">{t("requests.settings.notSaid", "Not specified")}</MenuItem>
                                {BUSINESS_TYPES.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`requests.business.${value}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            {profile.businessType && profile.businessType !== "owner" && (
                                <TextField
                                    fullWidth
                                    label={t("requests.settings.businessName", "Business name")}
                                    value={profile.businessName}
                                    onChange={(event) => set({ businessName: event.target.value })}
                                    slotProps={{ htmlInput: { maxLength: 120 } }}
                                    helperText={t("requests.settings.businessNameHelp", "Shown to the people you reply to.")}
                                />
                            )}
                        </Stack>

                        {works("property") && (
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
                                <Stack spacing={2}>
                                    <Typography sx={{ fontWeight: 800, color: "primary.main" }}>{t("requests.services.property", "Property")}</Typography>
                                    <Group title={t("requests.settings.propertyOffers", "Requests to")} help={t("requests.settings.allIfEmpty", "Nothing selected = all.")}>
                                        <ChoiceChips
                                            multiple
                                            size="small"
                                            value={profile.propertyTransactions}
                                            onChange={(propertyTransactions) => set({ propertyTransactions })}
                                            options={PROPERTY_TRANSACTIONS.map((value) => ({ value, label: t(`requests.wantTo.property.${value}`) }))}
                                        />
                                    </Group>
                                    <Group title={t("requests.settings.propertyTypes", "Property types")} help={t("requests.settings.allIfEmpty", "Nothing selected = all.")}>
                                        <ChoiceChips
                                            multiple
                                            size="small"
                                            value={profile.propertyTypes}
                                            onChange={(propertyTypes) => set({ propertyTypes })}
                                            options={PROPERTY_TYPES.map((value) => ({ value, label: propertyTypeLabel(t, value) }))}
                                        />
                                    </Group>
                                </Stack>
                            </Box>
                        )}

                        {works("vehicle") && (
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
                                <Stack spacing={2}>
                                    <Typography sx={{ fontWeight: 800, color: "#EA580C" }}>{t("requests.services.vehicle", "Vehicles")}</Typography>
                                    <Group title={t("requests.settings.vehicleCategories", "What you have")} help={t("requests.settings.allIfEmpty", "Nothing selected = all.")}>
                                        <ChoiceChips
                                            multiple
                                            size="small"
                                            value={profile.vehicleCategories}
                                            onChange={(vehicleCategories) => set({ vehicleCategories })}
                                            options={VEHICLE_CATEGORIES.map((value) => ({ value, label: categoryLabel(t, value) }))}
                                        />
                                    </Group>
                                    <Group title={t("requests.settings.vehicleOffers", "Requests to")} help={t("requests.settings.allIfEmpty", "Nothing selected = all.")}>
                                        <ChoiceChips
                                            multiple
                                            size="small"
                                            value={profile.vehicleTransactions}
                                            onChange={(vehicleTransactions) => set({ vehicleTransactions })}
                                            options={VEHICLE_TRANSACTIONS.map((value) => ({ value, label: t(`requests.wantTo.vehicle.${value}`) }))}
                                        />
                                    </Group>
                                </Stack>
                            </Box>
                        )}

                        <Group title={t("requests.settings.cities", "Where you work")}>
                            <RadioGroup row value={profile.allMorocco ? "all" : "some"} onChange={(event) => set({ allMorocco: event.target.value === "all" })}>
                                <FormControlLabel value="some" control={<Radio />} label={t("requests.settings.someCities", "In these cities")} />
                                <FormControlLabel value="all" control={<Radio />} label={t("requests.settings.allMorocco", "All Morocco")} />
                            </RadioGroup>
                            {!profile.allMorocco && (
                                <Autocomplete
                                    multiple
                                    options={cityOptions}
                                    value={profile.cities}
                                    onChange={(_event, cities) => set({ cities: cities.slice(0, 30) })}
                                    getOptionLabel={cityLabel}
                                    renderValue={(values, getItemProps) =>
                                        values.map((value, index) => {
                                            const { key, ...itemProps } = getItemProps({ index });
                                            return <Chip key={key} size="small" label={cityLabel(value)} {...itemProps} />;
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t("requests.settings.chooseCities", "Cities (one or several)")}
                                            error={Boolean(errors.cities)}
                                            helperText={errors.cities ? t("requests.settings.citiesRequired", "Choose at least one city, or All Morocco.") : t("requests.settings.citiesHelp", "Up to 30 cities.")}
                                        />
                                    )}
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </Group>

                        <Group title={t("requests.settings.how", "How to notify you")} help={errors.channels ? t("requests.settings.channelsRequired", "Choose at least one.") : null}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <FormControlLabel
                                    control={<Switch checked={profile.channels.notification} onChange={(event) => set({ channels: { ...profile.channels, notification: event.target.checked } })} />}
                                    label={t("requests.settings.inApp", "In-app notification")}
                                />
                                <FormControlLabel
                                    control={<Switch checked={profile.channels.email} onChange={(event) => set({ channels: { ...profile.channels, email: event.target.checked } })} />}
                                    label={t("requests.settings.email", "Email")}
                                />
                            </Stack>
                            <RadioGroup value={profile.frequency} onChange={(event) => set({ frequency: event.target.value })} sx={{ mt: 1 }}>
                                <FormControlLabel value="instant" control={<Radio />} label={t("requests.settings.instant", "As soon as a request is posted")} />
                                <FormControlLabel value="daily" control={<Radio />} label={t("requests.settings.daily", "Once a day (a summary every morning)")} />
                            </RadioGroup>
                        </Group>

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ textTransform: "none", fontWeight: 700, px: 3 }}>
                                {t("requests.settings.save", "Save")}
                            </Button>
                        </Box>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
