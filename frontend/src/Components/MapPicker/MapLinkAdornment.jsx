// src/Components/MapPicker/MapLinkAdornment.jsx
//
// Two buttons shown inside every "Google Maps link" field:
//   1. Pick on map: opens MapPickerDialog and fills the field with the chosen place.
//   2. Open Google Maps: opens the current link (or a search for the address) in a new tab.
//
// Usage:
//   <TextField ... slotProps={{ input: { endAdornment: (
//       <MapLinkAdornment value={value} onChange={(link) => setValue(link)} searchHint="Agadir" />
//   ) } }} />

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, InputAdornment, Tooltip } from "@mui/material";
import AddLocationAltOutlinedIcon from "@mui/icons-material/AddLocationAltOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import MapPickerDialog from "./MapPickerDialog";
import { googleMapsSearchUrl, isHttpUrl } from "./mapLinkUtils";

export default function MapLinkAdornment({ value = "", onChange, searchHint = "", disabled = false }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const current = String(value || "").trim();
    const externalUrl = isHttpUrl(current) ? current : googleMapsSearchUrl(searchHint);

    return (
        <InputAdornment position="end" sx={{ gap: 0.25 }}>
            <Tooltip title={t("mapPicker.pickButton", "Pick on map")}>
                <span>
                    <IconButton
                        size="small"
                        color="primary"
                        disabled={disabled}
                        onClick={() => setOpen(true)}
                        aria-label={t("mapPicker.pickButton", "Pick on map")}
                    >
                        <AddLocationAltOutlinedIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={t("mapPicker.openGoogleMaps", "Open Google Maps")}>
                <IconButton
                    size="small"
                    component="a"
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("mapPicker.openGoogleMaps", "Open Google Maps")}
                >
                    <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <MapPickerDialog
                open={open}
                onClose={() => setOpen(false)}
                onSelect={(link) => onChange?.(link)}
                initialValue={current}
                searchHint={searchHint}
            />
        </InputAdornment>
    );
}
