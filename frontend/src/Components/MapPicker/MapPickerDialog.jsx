// src/Components/MapPicker/MapPickerDialog.jsx
//
// Popup to find a place without leaving the form.
// - With VITE_GOOGLE_MAPS_API_KEY: interactive Google map, click or drag the pin.
// - Without a key: Google's embed map, place search and "my location".
// "Use this location" writes a Google Maps link into the field.

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import {
    GOOGLE_MAPS_API_KEY,
    buildEmbedUrl,
    buildGoogleMapsLink,
    googleMapsSearchUrl,
    isValidPoint,
    parseCoordinates,
    searchPlaces,
} from "./mapLinkUtils";

const GoogleMapCanvas = lazy(() => import("./GoogleMapCanvas"));

function PickerBody({ onClose, onSelect, initialValue, searchHint }) {
    const { t, i18n } = useTranslation();
    const language = String(i18n.language || "en").slice(0, 2);
    const interactive = Boolean(GOOGLE_MAPS_API_KEY);

    const [query, setQuery] = useState(searchHint || "");
    const [point, setPoint] = useState(() => parseCoordinates(initialValue));
    const [label, setLabel] = useState("");
    const [results, setResults] = useState([]);
    const [busy, setBusy] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const abortRef = useRef(null);

    const runSearch = async (text) => {
        const value = String(text || "").trim();
        if (!value) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setBusy(true);
        setError("");
        try {
            const rows = await searchPlaces(value, { language, signal: controller.signal });
            setResults(rows);
            if (rows.length) {
                setPoint(rows[0].point);
                setLabel(rows[0].label);
            } else {
                setError(t("mapPicker.noResults", "No place found. Try another name, a neighborhood or a city."));
            }
        } catch (err) {
            if (err?.name !== "AbortError") setError(t("mapPicker.searchFailed", "Search is not available right now. Try again later."));
        } finally {
            if (abortRef.current === controller) setBusy(false);
        }
    };

    // On open: start from the current link, or search the address / city once.
    useEffect(() => {
        const timer = !parseCoordinates(initialValue) && searchHint ? setTimeout(() => runSearch(searchHint), 0) : null;
        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const link = useMemo(() => buildGoogleMapsLink(point), [point]);

    const pickPoint = (next, nextLabel = "") => {
        setPoint(next);
        setLabel(nextLabel);
        setCopied(false);
    };

    const locateMe = () => {
        if (!navigator.geolocation) {
            setError(t("mapPicker.noGeolocation", "Your browser cannot share your location."));
            return;
        }
        setLocating(true);
        setError("");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocating(false);
                setResults([]);
                pickPoint({ lat: position.coords.latitude, lng: position.coords.longitude }, t("mapPicker.myLocation", "My location"));
            },
            () => {
                setLocating(false);
                setError(t("mapPicker.locationDenied", "We could not get your location. Allow location access or search instead."));
            },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };

    const copyLink = async () => {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    const confirm = () => {
        if (!link) return;
        onSelect(link);
        onClose();
    };

    return (
        <>
            <DialogTitle sx={{ pr: 6, fontWeight: 800 }}>
                {t("mapPicker.title", "Find the place on the map")}
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    {interactive
                        ? t("mapPicker.subtitleInteractive", "Search, then click on the map or drag the pin to the exact place.")
                        : t("mapPicker.subtitle", "Search for the place or use your location, then press “Use this location”.")}
                </Typography>
                <IconButton aria-label={t("mapPicker.close", "Close")} onClick={onClose} sx={{ position: "absolute", top: 12, insetInlineEnd: 12 }}>
                    <CloseRoundedIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Stack
                    component="form"
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mb: 1.5 }}
                    onSubmit={(event) => {
                        // Stop here: React events bubble through the portal to the outer form.
                        event.preventDefault();
                        event.stopPropagation();
                        runSearch(query);
                    }}
                >
                    <TextField
                        fullWidth
                        size="small"
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t("mapPicker.searchPlaceholder", "Address, neighborhood, place name or city")}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        <Button type="submit" variant="contained" disabled={busy || !query.trim()} sx={{ minWidth: 96 }}>
                            {busy ? <CircularProgress size={18} color="inherit" /> : t("mapPicker.search", "Search")}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={locateMe}
                            disabled={locating}
                            startIcon={locating ? <CircularProgress size={16} /> : <MyLocationRoundedIcon />}
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            {t("mapPicker.useMyLocation", "My location")}
                        </Button>
                    </Stack>
                </Stack>

                {error && (
                    <Alert severity="info" sx={{ mb: 1.5 }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: results.length > 1 ? "minmax(0,1fr) 260px" : "1fr" } }}>
                    <Box
                        sx={{
                            height: { xs: 340, sm: 420 },
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "#EEF2F7",
                        }}
                    >
                        {interactive ? (
                            <Suspense
                                fallback={
                                    <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                }
                            >
                                <GoogleMapCanvas
                                    point={point}
                                    language={language}
                                    onPick={(next) => pickPoint(next, "")}
                                    errorText={t("mapPicker.loadError", "Google Maps could not be loaded.")}
                                />
                            </Suspense>
                        ) : (
                            <Box
                                component="iframe"
                                title={t("mapPicker.title", "Find the place on the map")}
                                src={buildEmbedUrl({ point })}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
                            />
                        )}
                    </Box>

                    {results.length > 1 && (
                        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: { xs: 220, md: 420 }, overflowY: "auto" }}>
                            <Typography variant="caption" sx={{ display: "block", px: 1.5, pt: 1, color: "text.secondary", fontWeight: 700 }}>
                                {t("mapPicker.results", "Results")}
                            </Typography>
                            <List dense disablePadding>
                                {results.map((row) => (
                                    <ListItemButton
                                        key={row.id}
                                        selected={isValidPoint(point) && row.point.lat === point.lat && row.point.lng === point.lng}
                                        onClick={() => pickPoint(row.point, row.label)}
                                    >
                                        <ListItemIcon sx={{ minWidth: 30 }}>
                                            <PlaceOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={row.label} slotProps={{ primary: { variant: "body2", sx: { lineHeight: 1.35 } } }} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Box>
                    )}
                </Box>

                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid", borderColor: "divider" }}>
                    {link ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                {label && (
                                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={label}>
                                        {label}
                                    </Typography>
                                )}
                                <Typography variant="caption" sx={{ color: "text.secondary", wordBreak: "break-all" }}>
                                    {link}
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title={copied ? t("mapPicker.copied", "Copied") : t("mapPicker.copy", "Copy link")}>
                                    <IconButton onClick={copyLink} size="small" aria-label={t("mapPicker.copy", "Copy link")}>
                                        {copied ? <CheckRoundedIcon fontSize="small" color="success" /> : <ContentCopyRoundedIcon fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t("mapPicker.openInGoogle", "Open in Google Maps")}>
                                    <IconButton
                                        component="a"
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        aria-label={t("mapPicker.openInGoogle", "Open in Google Maps")}
                                    >
                                        <OpenInNewRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    ) : (
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("mapPicker.noPlace", "No place selected yet.")}
                        </Typography>
                    )}
                    {!interactive && (
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                            {t("mapPicker.exactHint", "Need the exact spot? Open Google Maps, press Share → Copy link, and paste it into the field.")}{" "}
                            <Box
                                component="a"
                                href={googleMapsSearchUrl(query)}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: "primary.main", fontWeight: 700 }}
                            >
                                {t("mapPicker.openGoogleMaps", "Open Google Maps")}
                            </Box>
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose}>{t("mapPicker.cancel", "Cancel")}</Button>
                <Button variant="contained" onClick={confirm} disabled={!link} startIcon={<PlaceOutlinedIcon />}>
                    {t("mapPicker.useLocation", "Use this location")}
                </Button>
            </DialogActions>
        </>
    );
}

export default function MapPickerDialog({ open, onClose, onSelect, initialValue = "", searchHint = "" }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
            {/* Mounted only while open, so every opening starts fresh from the field value. */}
            {open && (
                <PickerBody
                    onClose={onClose}
                    onSelect={onSelect}
                    initialValue={initialValue}
                    searchHint={searchHint}
                />
            )}
        </Dialog>
    );
}
