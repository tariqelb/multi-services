// src/Apps/vehicles/externalListings/VehicleWebsiteSearchSettingsDialog.jsx
//
// Admin: how the vehicle live search opens a website's results page.
// The settings are JSON (see backend apps/vehicles/.../live/searchUrlBuilder.js):
//   { "offers": ["sale"], "categories": ["car", "moto"],
//     "templates": [{ "url": "/fr/{city}/{category}-{transaction}" }],
//     "maps": { "transaction": { "sale": "a_vendre", "rent": "a_louer" }, "category": {...}, "city": {...}, "make": {...} } }
// "Test" opens the website now with the example search and shows the
// addresses built and the listings read. Empty settings = the website is
// searched through the search engine (Brave), if it is set up.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";

const API = "/vehicles/external-listings/search/websites";

const EXAMPLE = {
    offers: ["sale", "rent"],
    categories: ["car", "moto"],
    allCities: "maroc",
    templates: [{ url: "/fr/{city}/{category}-{transaction}?marque={make}&prix_max={maxPrice}" }, { url: "/fr/{city}/{category}" }],
    maps: {
        transaction: { sale: "a_vendre", rent: "a_louer" },
        category: { car: "voitures", moto: "motos", part: "pieces" },
        city: { Marrakesh: "marrakech" },
        make: { "Mercedes-Benz": "mercedes" },
    },
    resultLinkPattern: "^/fr/[^/]+/[^/]+/[^/]+_\\d+\\.htm$",
};

const CATEGORIES = ["", "car", "moto", "part"];

export default function VehicleWebsiteSearchSettingsDialog({ website, onClose, onSaved }) {
    const { t } = useTranslation();
    const tr = (key, fallback, options) => t(`externalSources.searchSettings.${key}`, { defaultValue: fallback, ...options });

    // The dialog is keyed by website: the settings are read once when it opens.
    const [text, setText] = useState(() => (website?.search ? JSON.stringify(website.search, null, 2) : ""));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [test, setTest] = useState(null);
    const [example, setExample] = useState({ city: "Casablanca", category: "car", listingType: "sale", make: "", maxPrice: "" });

    const parse = () => {
        if (!text.trim()) return null;
        try {
            return JSON.parse(text);
        } catch (parseError) {
            throw new Error(tr("invalidJson", "The settings are not valid JSON: {{message}}", { message: parseError.message }), { cause: parseError });
        }
    };

    const runTest = async () => {
        setError("");
        setTest(null);
        try {
            const search = parse();
            setTesting(true);
            const { data } = await axiosInstance.post(`${API}/${website.hostname}/test`, { search, ...example });
            setTest(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message);
        } finally {
            setTesting(false);
        }
    };

    const save = async () => {
        setError("");
        try {
            const search = parse();
            setSaving(true);
            await axiosInstance.put(`${API}/${website.hostname}/config`, { search });
            onSaved?.();
            onClose();
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={Boolean(website)} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 800 }}>
                {tr("title", "Live search settings: {{name}}", { name: website?.sourceName || website?.hostname || "" })}
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                    {t(
                        "vehicleExternal.admin.settingsHelp",
                        "Address patterns of the website's results pages, most precise first. Placeholders: {city}, {category}, {transaction}, {make}, {model}, {maxPrice}. Values: sale / rent, car / moto / part. A template can be limited with \"listingType\" and \"category\". Leave empty to search this website through the search engine.",
                    )}
                </Typography>
                <TextField
                    multiline
                    fullWidth
                    minRows={10}
                    maxRows={22}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={JSON.stringify(EXAMPLE, null, 2)}
                    slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 } } }}
                />

                <Typography sx={{ fontWeight: 700, fontSize: 13, color: "text.secondary", mt: 2.5, mb: 1 }}>{tr("testTitle", "Try with a search")}</Typography>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth size="small" label={tr("city", "City (or all)")} value={example.city} onChange={(event) => setExample({ ...example, city: event.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField select fullWidth size="small" label={t("vehicleExternal.search.category", "Car, moto or part")} value={example.category} onChange={(event) => setExample({ ...example, category: event.target.value })}>
                            {CATEGORIES.map((category) => (
                                <MenuItem key={category || "all"} value={category}>
                                    {category ? t(`requests.categories.${category}`, category) : tr("any", "Any")}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField select fullWidth size="small" label={tr("offer", "Offer")} value={example.listingType} onChange={(event) => setExample({ ...example, listingType: event.target.value })}>
                            <MenuItem value="">{tr("any", "Any")}</MenuItem>
                            <MenuItem value="sale">sale</MenuItem>
                            <MenuItem value="rent">rent</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6 }}>
                        <TextField fullWidth size="small" label={t("vehicleExternal.search.make", "Make")} placeholder="Dacia" value={example.make} onChange={(event) => setExample({ ...example, make: event.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6 }}>
                        <TextField fullWidth size="small" type="number" label={t("externalSearch.maxPrice", "Maximum price")} value={example.maxPrice} onChange={(event) => setExample({ ...example, maxPrice: event.target.value })} />
                    </Grid>
                </Grid>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {test && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "rgba(37,99,235,.05)" }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }}>
                            <Chip size="small" label={test.site?.status} color={test.site?.status === "ok" ? "success" : "default"} />
                            <Chip size="small" variant="outlined" label={test.site?.method} />
                            <Typography variant="body2">{tr("found", "{{count}} matching listings", { count: test.site?.count || 0 })}</Typography>
                        </Stack>
                        {(test.site?.pages || []).map((page) => (
                            <Typography key={page.url} variant="caption" sx={{ display: "block", wordBreak: "break-all" }}>
                                {page.status === "ok" ? "✓" : "✗"}{" "}
                                <Link href={page.url} target="_blank" rel="noopener noreferrer">
                                    {page.url}
                                </Link>{" "}
                                — {page.status === "ok" ? tr("cards", "{{count}} cards read", { count: page.cards }) : page.error || page.status}
                            </Typography>
                        ))}
                        {!test.urls?.length && (
                            <Typography variant="caption" sx={{ display: "block" }}>
                                {tr("noUrl", "No template fits this search.")}
                            </Typography>
                        )}
                        <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
                            {(test.listings || []).map((listing) => (
                                <li key={listing.sourceUrl}>
                                    <Typography variant="caption">
                                        {listing.title} {listing.price ? `· ${listing.price} MAD` : ""}
                                    </Typography>
                                </li>
                            ))}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: "none" }}>
                    {tr("cancel", "Cancel")}
                </Button>
                <Button variant="outlined" onClick={runTest} disabled={testing} startIcon={testing ? <CircularProgress size={14} /> : null} sx={{ textTransform: "none" }}>
                    {tr("test", "Test")}
                </Button>
                <Button variant="contained" onClick={save} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>
                    {tr("save", "Save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
