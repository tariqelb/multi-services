// src/Apps/vehicles/Search/VehicleSearchResultsMap.jsx
//
// Map under the vehicle search results (MapLibre + MapTiler, like "Find by map"):
//   - one numbered marker per result of the page (same number as the card)
//   - hover: short tooltip (photo, price, title, place)
//   - click: side panel with more details and "See all details"
//   - centred on the results, or on the chosen city when none has a location

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Alert, Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import getImageUrl from "../../../utils/getImageUrl";
import { KIND_COLORS, formatCity, formatFacts, formatPrice, formatType } from "./vehicleSearchFormat";

maplibregl.setWorkerUrl(workerUrl);

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const MAPTILER_MAP_ID = import.meta.env.VITE_MAPTILER_MAP_ID || "streets-v4";
const STYLE_URL = `https://api.maptiler.com/maps/${MAPTILER_MAP_ID}/style.json?key=${MAPTILER_API_KEY}`;

const MOROCCO = { center: [-7.0926, 31.7917], zoom: 5 };

// City centres already looked up (MapTiler geocoding).
const cityCache = new Map();

async function findCity(city) {
    if (!city || !MAPTILER_API_KEY) return null;
    if (cityCache.has(city)) return cityCache.get(city);

    try {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(city)}.json?key=${MAPTILER_API_KEY}&country=ma&limit=1&types=municipality,place,locality`;
        const response = await fetch(url);
        const data = await response.json();
        const center = data?.features?.[0]?.center || null;
        cityCache.set(city, center);
        return center;
    } catch {
        return null;
    }
}

// Tooltip content built with DOM nodes (no HTML from listings).
function tooltipNode({ image, price, title, place, color }) {
    const root = document.createElement("div");
    root.className = "vsearch-map-tip";
    root.dir = "auto";

    if (image) {
        const img = document.createElement("img");
        img.src = image;
        img.alt = "";
        root.appendChild(img);
    }

    const body = document.createElement("div");
    const priceEl = document.createElement("strong");
    priceEl.textContent = price;
    priceEl.style.color = color;
    const titleEl = document.createElement("span");
    titleEl.textContent = title;
    const placeEl = document.createElement("small");
    placeEl.textContent = place;
    body.append(priceEl, titleEl, placeEl);
    root.appendChild(body);

    return root;
}

export default function VehicleSearchResultsMap({ results, city, activeId, onActiveChange, selectedId, onSelect }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir?.(i18n.resolvedLanguage || i18n.language) === "rtl";

    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef(new Map()); // id -> { marker, element, popup }
    const [ready, setReady] = useState(false);
    const [mapError, setMapError] = useState(MAPTILER_API_KEY ? "" : "missingKey");

    const located = useMemo(() => results.filter((result) => result.location), [results]);
    const selected = results.find((result) => result.id === selectedId) || null;

    // Latest callbacks for marker events (markers are created once per results).
    const callbacks = useRef({ onActiveChange, onSelect });
    useEffect(() => {
        callbacks.current = { onActiveChange, onSelect };
    }, [onActiveChange, onSelect]);

    /* ---------- map ---------- */
    useEffect(() => {
        if (!MAPTILER_API_KEY || !containerRef.current) return undefined;

        let map;

        try {
            map = new maplibregl.Map({
                container: containerRef.current,
                style: STYLE_URL,
                center: MOROCCO.center,
                zoom: MOROCCO.zoom,
                attributionControl: true,
                cooperativeGestures: true, // page scroll is not captured by the map
            });
        } catch (error) {
            console.error("Vehicle search map:", error);
            // reported asynchronously (not during the effect itself)
            queueMicrotask(() => setMapError("failed"));
            return undefined;
        }

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), isRtl ? "top-left" : "top-right");
        map.addControl(new maplibregl.FullscreenControl(), isRtl ? "top-left" : "top-right");
        map.on("load", () => setReady(true));
        map.on("error", (event) => console.error("Vehicle search map resource:", event?.error));

        const markers = markersRef.current;

        return () => {
            markers.forEach(({ marker, popup }) => {
                popup.remove();
                marker.remove();
            });
            markers.clear();
            map.remove();
            mapRef.current = null;
            setReady(false);
        };
    }, [isRtl]);

    /* ---------- markers ---------- */
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !ready) return;

        markersRef.current.forEach(({ marker, popup }) => {
            popup.remove();
            marker.remove();
        });
        markersRef.current.clear();

        results.forEach((result, position) => {
            if (!result.location) return;

            const color = KIND_COLORS[result.kind];

            const element = document.createElement("button");
            element.type = "button";
            element.className = "vsearch-map-marker";
            element.style.setProperty("--marker-color", color);
            element.textContent = String(position + 1);
            element.setAttribute("aria-label", `${position + 1}. ${result.title}`);

            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 20,
                maxWidth: "260px",
                className: "vsearch-map-popup",
            }).setDOMContent(
                tooltipNode({
                    image: getImageUrl(result.image),
                    price: formatPrice(result, t, i18n.language),
                    title: result.title,
                    place: formatCity(result, i18n.language),
                    color,
                })
            );

            element.addEventListener("mouseenter", () => callbacks.current.onActiveChange?.(result.id));
            element.addEventListener("mouseleave", () => callbacks.current.onActiveChange?.(null));
            element.addEventListener("focus", () => callbacks.current.onActiveChange?.(result.id));
            element.addEventListener("blur", () => callbacks.current.onActiveChange?.(null));
            element.addEventListener("click", (event) => {
                event.stopPropagation();
                callbacks.current.onSelect?.(result.id);
            });

            const marker = new maplibregl.Marker({ element })
                .setLngLat([result.location.lng, result.location.lat])
                .addTo(map);

            markersRef.current.set(result.id, { marker, element, popup });
        });
    }, [results, ready, t, i18n.language]);

    /* ---------- hover (card or marker): highlight + tooltip ---------- */
    useEffect(() => {
        const map = mapRef.current;

        markersRef.current.forEach(({ element, popup, marker }, id) => {
            const on = id === activeId || id === selectedId;
            element.classList.toggle("is-active", on);
            element.style.zIndex = on ? "5" : "";

            if (id === activeId && map) {
                popup.setLngLat(marker.getLngLat()).addTo(map);
            } else {
                popup.remove();
            }
        });
    }, [activeId, selectedId, results, ready]);

    /* ---------- framing ---------- */
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !ready) return undefined;

        let cancelled = false;

        if (located.length) {
            const bounds = new maplibregl.LngLatBounds();
            located.forEach((result) => bounds.extend([result.location.lng, result.location.lat]));
            map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
        } else if (city) {
            findCity(city).then((center) => {
                if (cancelled) return;
                if (center) map.flyTo({ center, zoom: 11, duration: 600 });
                else map.flyTo({ ...MOROCCO, duration: 600 });
            });
        } else {
            map.flyTo({ ...MOROCCO, duration: 600 });
        }

        return () => {
            cancelled = true;
        };
    }, [located, city, ready]);

    // Selected result: bring it into view.
    useEffect(() => {
        const map = mapRef.current;
        if (map && selected?.location) {
            map.easeTo({ center: [selected.location.lng, selected.location.lat], duration: 400 });
        }
    }, [selected]);

    if (mapError) {
        return (
            <Alert severity="info" sx={{ borderRadius: "14px" }}>
                {mapError === "missingKey"
                    ? t("vehiclesApp.search.mapMissingKey", "The map is not configured (VITE_MAPTILER_API_KEY).")
                    : t("vehiclesApp.search.mapError", "The map could not be loaded.")}
            </Alert>
        );
    }

    const notLocated = results.length - located.length;

    return (
        <Box>
            <Box
                sx={{
                    position: "relative",
                    height: { xs: 420, md: 520 },
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#E2E8F0",
                }}
            >
                <Box ref={containerRef} dir="ltr" sx={{ position: "absolute", inset: 0 }} />

                {/* Side panel with the clicked result */}
                {selected && (
                    <ResultPanel
                        result={selected}
                        number={results.findIndex((result) => result.id === selected.id) + 1}
                        isRtl={isRtl}
                        onClose={() => onSelect?.(null)}
                        onOpen={() => navigate(selected.link)}
                    />
                )}
            </Box>

            {notLocated > 0 && (
                <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                    {t("vehiclesApp.search.notLocated", "{{count}} result(s) of this page have no location and are not on the map.", { count: notLocated })}
                </Typography>
            )}
        </Box>
    );
}

function ResultPanel({ result, number, isRtl, onClose, onOpen }) {
    const { t, i18n } = useTranslation();
    const kind = result.kind;
    const color = KIND_COLORS[kind];
    const image = getImageUrl(result.image);
    const facts = formatFacts(result, t, i18n.language);

    return (
        <Box
            role="dialog"
            aria-label={result.title}
            sx={{
                position: "absolute",
                zIndex: 10,
                top: { xs: "auto", sm: 12 },
                bottom: 12,
                // flipped to the right in Arabic by the RTL style plugin
                left: 12,
                width: { xs: "calc(100% - 24px)", sm: 320 },
                maxHeight: { xs: "70%", sm: "calc(100% - 24px)" },
                overflowY: "auto",
                bgcolor: "background.paper",
                borderRadius: "14px",
                boxShadow: "0 12px 32px rgba(15,23,42,.25)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "#E2E8F0", flexShrink: 0 }}>
                {image && <Box component="img" src={image} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                <IconButton
                    size="small"
                    onClick={onClose}
                    aria-label={t("vehiclesApp.search.close", "Close")}
                    sx={{ position: "absolute", top: 8, insetInlineEnd: 8, bgcolor: "rgba(255,255,255,.92)", "&:hover": { bgcolor: "#fff" } }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
                <Box sx={{ position: "absolute", top: 8, insetInlineStart: 8, minWidth: 28, height: 28, px: 0.75, borderRadius: "14px", bgcolor: color, color: "#fff", fontWeight: 800, display: "grid", placeItems: "center", border: "2px solid #fff" }}>
                    {number}
                </Box>
            </Box>

            <Stack spacing={1} sx={{ p: 2 }}>
                <Chip size="small" label={t(`vehiclesApp.search.kinds.${kind}`)} sx={{ alignSelf: "flex-start", bgcolor: `${color}1A`, color, fontWeight: 700 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{formatPrice(result, t, i18n.language)}</Typography>
                <Typography sx={{ fontWeight: 600 }}>{result.title}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary" }}>
                    <PlaceOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography variant="body2">{formatCity(result, i18n.language)}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {[formatType(result, t), ...facts].filter(Boolean).join(" · ")}
                </Typography>
                <Button
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon sx={{ transform: isRtl ? "scaleX(-1)" : "none" }} />}
                    onClick={onOpen}
                    sx={{ mt: 1, textTransform: "none", fontWeight: 700, bgcolor: color, "&:hover": { bgcolor: color, filter: "brightness(.92)" } }}
                >
                    {t("vehiclesApp.search.seeDetails", "See all details")}
                </Button>
            </Stack>
        </Box>
    );
}
