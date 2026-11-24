// src/Apps/vehicles/VehicleMap/VehicleMap.jsx
// MapTiler / MapLibre map of vehicles, same behaviour as the property map:
// hover a marker for a card, click it to open the vehicle.
// Cars: blue circles. Motos & bikes: orange squares.
// Dashed outline: no exact location, placed on its city centre.

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import VehicleMapCard from "./VehicleMapCard";
import "../../Property/FindByMap/findByMap.css";

maplibregl.setWorkerUrl(workerUrl);

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const MAPTILER_MAP_ID = import.meta.env.VITE_MAPTILER_MAP_ID || "streets-v4";
const STYLE_URL = `https://api.maptiler.com/maps/${MAPTILER_MAP_ID}/style.json?key=${MAPTILER_API_KEY}`;
const MOROCCO_CENTER = [-7.0926, 31.7917];

export const CAR_COLOR = "#2563EB";
export const MOTO_COLOR = "#EA580C";

// Material icons (DirectionsCar, TwoWheeler) drawn inside the markers.
const CAR_PATH =
    "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16m11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5M5 11l1.5-4.5h11L19 11z";
const MOTO_PATH =
    "M20 11c-.18 0-.36.03-.53.05L17.41 9H20V6l-3.72 1.86L13.41 5H9v2h3.59l2 2H11l-4 2-2-2H0v2h4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4l2 2h3l3.49-6.1 1.01 1.01c-.91.73-1.5 1.84-1.5 3.09 0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4M4 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m16 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2";

const svgIcon = (path) => `<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff" aria-hidden="true"><path d="${path}"/></svg>`;

function LegendItem({ color, square, dashed, label }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, "& + &": { mt: 0.5 } }}>
            <Box
                sx={{
                    width: 12,
                    height: 12,
                    borderRadius: square ? "3px" : "50%",
                    bgcolor: color,
                    border: dashed ? "2px dashed #64748b" : "none",
                    boxSizing: "border-box",
                }}
            />
            <Typography variant="caption">{label}</Typography>
        </Box>
    );
}

export default function VehicleMap({ vehicles = [], onVehicleClick }) {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const clickRef = useRef(onVehicleClick);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState("");

    useEffect(() => {
        clickRef.current = onVehicleClick;
    }, [onVehicleClick]);

    const counts = useMemo(
        () => ({
            cars: vehicles.filter((vehicle) => vehicle.category !== "moto").length,
            motos: vehicles.filter((vehicle) => vehicle.category === "moto").length,
            approximate: vehicles.filter((vehicle) => vehicle.approximate).length,
        }),
        [vehicles],
    );

    // Map
    useEffect(() => {
        let cancelled = false;
        let map = null;

        (async () => {
            if (!containerRef.current || !MAPTILER_API_KEY) return;
            try {
                const response = await fetch(STYLE_URL);
                if (!response.ok) throw new Error(`MapTiler returned HTTP ${response.status}: ${response.statusText}`);
                if (cancelled) return;

                map = new maplibregl.Map({ container: containerRef.current, style: STYLE_URL, center: MOROCCO_CENTER, zoom: 5.5, attributionControl: true });
                mapRef.current = map;
                map.addControl(new maplibregl.NavigationControl(), "top-right");
                map.addControl(new maplibregl.FullscreenControl(), "top-right");
                map.on("load", () => {
                    if (!cancelled) setMapLoaded(true);
                });
                map.on("error", (event) => console.error("MapLibre resource error:", event.error));
            } catch (error) {
                console.error("Map initialization failed:", error);
                if (!cancelled) setMapError(error.message || t("findMap.map.unknownError", "Unknown error"));
            }
        })();

        return () => {
            cancelled = true;
            map?.remove();
            mapRef.current = null;
        };
    }, [t]);

    // Markers
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded) return undefined;

        const clear = () => {
            markersRef.current.forEach((item) => {
                clearTimeout(item.closeTimer);
                item.popup.remove();
                // Unmount after the current render.
                setTimeout(() => item.root.unmount(), 0);
                item.marker.remove();
            });
            markersRef.current = [];
        };
        clear();
        if (!vehicles.length) return clear;

        const bounds = new maplibregl.LngLatBounds();

        vehicles.forEach((vehicle) => {
            const isMoto = vehicle.category === "moto";
            const coordinates = [Number(vehicle.location.lng), Number(vehicle.location.lat)];
            bounds.extend(coordinates);

            const element = document.createElement("button");
            element.type = "button";
            element.className = isMoto ? "vehicle-map-marker moto" : "vehicle-map-marker car";
            element.innerHTML = svgIcon(isMoto ? MOTO_PATH : CAR_PATH);
            element.title = vehicle.title || "";
            element.setAttribute("aria-label", t("vehiclesApp.map.markerLabel", "View {{title}}", { title: vehicle.title || "" }));
            Object.assign(element.style, {
                width: "34px",
                height: "34px",
                padding: "0",
                borderRadius: isMoto ? "9px" : "50%",
                backgroundColor: isMoto ? MOTO_COLOR : CAR_COLOR,
                border: vehicle.approximate ? "2px dashed #ffffff" : "3px solid #ffffff",
                opacity: vehicle.approximate ? "0.88" : "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                outline: "none",
            });

            const popupContainer = document.createElement("div");
            const root = createRoot(popupContainer);
            const popup = new maplibregl.Popup({
                offset: 22,
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false,
                maxWidth: "320px",
                className: "establishment-hover-popup",
            })
                .setLngLat(coordinates)
                .setDOMContent(popupContainer);

            const item = { marker: null, popup, root, closeTimer: null, popupEvents: false };
            const scheduleClose = () => {
                clearTimeout(item.closeTimer);
                item.closeTimer = setTimeout(() => popup.remove(), 180);
            };
            const keepOpen = () => clearTimeout(item.closeTimer);
            const open = () => {
                clearTimeout(item.closeTimer);
                popup.remove();
                clickRef.current?.(vehicle);
            };

            root.render(<VehicleMapCard vehicle={vehicle} onViewDetails={open} />);

            element.addEventListener("mouseenter", () => {
                keepOpen();
                popup.addTo(map);
                if (!item.popupEvents) {
                    popup.getElement().addEventListener("mouseenter", keepOpen);
                    popup.getElement().addEventListener("mouseleave", scheduleClose);
                    item.popupEvents = true;
                }
            });
            element.addEventListener("mouseleave", scheduleClose);
            element.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                open();
            });

            item.marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat(coordinates).addTo(map);
            markersRef.current.push(item);
        });

        if (vehicles.length === 1) map.flyTo({ center: bounds.getCenter(), zoom: 13, duration: 700 });
        else map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 700 });

        return clear;
    }, [mapLoaded, vehicles, t]);

    if (!MAPTILER_API_KEY) return <Alert severity="warning">{t("findMap.map.missingApiKey", "The map key is missing.")}</Alert>;

    if (mapError) {
        return (
            <Alert severity="error">
                <Typography sx={{ fontWeight: 700 }}>{t("findMap.map.loadFailed", "The map could not be loaded.")}</Typography>
                <Typography variant="body2">{mapError}</Typography>
            </Alert>
        );
    }

    return (
        <Box className="property-map-wrapper">
            {!mapLoaded && (
                <Box className="find-map-loading" sx={{ position: "absolute", inset: 0, zIndex: 2, bgcolor: "background.paper" }}>
                    <CircularProgress />
                    <Typography sx={{ color: "text.secondary" }}>{t("findMap.map.loading", "Loading the map...")}</Typography>
                </Box>
            )}

            <Box ref={containerRef} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

            <Box className="property-map-legend">
                <LegendItem color={CAR_COLOR} label={t("vehiclesApp.map.legendCars", "Cars ({{count}})", { count: counts.cars })} />
                <LegendItem color={MOTO_COLOR} square label={t("vehiclesApp.map.legendMotos", "Motos & bikes ({{count}})", { count: counts.motos })} />
                {counts.approximate > 0 && (
                    <LegendItem
                        color="#e2e8f0"
                        dashed
                        label={t("vehiclesApp.map.legendApproximate", "City centre, no exact location ({{count}})", { count: counts.approximate })}
                    />
                )}
            </Box>
        </Box>
    );
}
