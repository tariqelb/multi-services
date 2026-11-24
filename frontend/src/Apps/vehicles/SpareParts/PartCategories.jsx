// src/Apps/vehicles/SpareParts/PartCategories.jsx
// "Explore categories" strip of the spare parts page (same layout as the
// vehicle one): all, engine, brakes, lighting... with an icon per family.

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { optionLabel } from "../vehicleFormat";
import { PART_CATEGORIES, PART_CATEGORY_STYLES } from "./sparePartOptions";

export default function PartCategories({ selected = "", onSelect }) {
    const { t } = useTranslation();
    const items = ["", ...PART_CATEGORIES];

    return (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2.5, md: 3.5 }, pb: 1, width: "100%", boxSizing: "border-box" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t("vehiclesApp.categories.title", "Explore Categories")}
            </Typography>

            <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1.5, scrollSnapType: "x proximity", scrollbarWidth: "thin" }}>
                {items.map((key) => {
                    const { icon: Icon, color } = PART_CATEGORY_STYLES[key || "all"];
                    const label = key ? optionLabel(t, "partCategory", key) : t("vehiclesApp.parts.allParts", "All parts");
                    const active = selected === key;

                    return (
                        <Box
                            key={key || "all"}
                            role="button"
                            tabIndex={0}
                            aria-pressed={active}
                            aria-label={label}
                            onClick={() => onSelect(key)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onSelect(key);
                                }
                            }}
                            sx={{
                                flex: "0 0 auto",
                                width: { xs: 104, md: 118 },
                                cursor: "pointer",
                                scrollSnapAlign: "start",
                                textAlign: "center",
                                outline: "none",
                                "&:hover .cat-icon, &:focus-visible .cat-icon": { transform: "scale(1.08)" },
                                "&:focus-visible .cat-img": { boxShadow: "0 0 0 3px rgba(37,99,235,.45)" },
                            }}
                        >
                            <Box
                                className="cat-img"
                                sx={{
                                    height: { xs: 72, md: 80 },
                                    borderRadius: "14px",
                                    border: active ? "2px solid" : "1px solid",
                                    borderColor: active ? "primary.main" : "divider",
                                    display: "grid",
                                    placeItems: "center",
                                    background: `linear-gradient(135deg, ${color}14 0%, ${color}33 100%)`,
                                }}
                            >
                                <Icon className="cat-icon" sx={{ fontSize: 38, color, transition: "transform .25s ease" }} />
                            </Box>
                            <Typography
                                variant="caption"
                                sx={{ display: "block", mt: 0.75, fontWeight: active ? 800 : 600, lineHeight: 1.25, color: active ? "primary.main" : "text.primary" }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
