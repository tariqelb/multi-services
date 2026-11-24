// src/Apps/vehicles/SpareParts/sparePartOptions.jsx
// Values of a spare part listing (same lists as the backend
// backend/apps/vehicles/utils/sparePartOptions.js), their icons, and the form.
// Labels: vehiclesApp.options.<group>.<value> (see vehicleFormat.optionLabel).

import SettingsSuggestOutlined from "@mui/icons-material/SettingsSuggestOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import DiscFullOutlined from "@mui/icons-material/DiscFullOutlined";
import AlignVerticalCenterOutlined from "@mui/icons-material/AlignVerticalCenterOutlined";
import ElectricalServicesOutlined from "@mui/icons-material/ElectricalServicesOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import CarRepairOutlined from "@mui/icons-material/CarRepairOutlined";
import AirlineSeatReclineNormalOutlined from "@mui/icons-material/AirlineSeatReclineNormalOutlined";
import TireRepairOutlined from "@mui/icons-material/TireRepairOutlined";
import AirOutlined from "@mui/icons-material/AirOutlined";
import AcUnitOutlined from "@mui/icons-material/AcUnitOutlined";
import FilterAltOutlined from "@mui/icons-material/FilterAltOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import ExtensionOutlined from "@mui/icons-material/ExtensionOutlined";
import AppsRounded from "@mui/icons-material/AppsRounded";

export const PART_VEHICLE_TYPES = ["car", "moto"];
export const PART_CATEGORIES = [
    "engine",
    "transmission",
    "brakes",
    "suspension",
    "electrical",
    "lighting",
    "body",
    "interior",
    "wheels",
    "exhaust",
    "cooling",
    "filters",
    "accessories",
    "other",
];
export const PART_CONDITIONS = ["new", "used", "refurbished"];
export const PART_SELLER_TYPES = ["owner", "shop", "scrapyard"];
export const PART_BUSINESS_TYPES = ["shop", "scrapyard"];
export const PART_STATUSES = ["Available", "Sold", "Inactive"];
export const MAX_PART_IMAGES = 10;
export const PART_DESCRIPTION_MAX = 3000;

// Icon and colour of each category (category strip, cards without photo).
export const PART_CATEGORY_STYLES = {
    all: { icon: AppsRounded, color: "#2563EB" },
    engine: { icon: SettingsSuggestOutlined, color: "#DC2626" },
    transmission: { icon: SettingsOutlined, color: "#7C3AED" },
    brakes: { icon: DiscFullOutlined, color: "#B91C1C" },
    suspension: { icon: AlignVerticalCenterOutlined, color: "#0F766E" },
    electrical: { icon: ElectricalServicesOutlined, color: "#CA8A04" },
    lighting: { icon: LightModeOutlined, color: "#F59E0B" },
    body: { icon: CarRepairOutlined, color: "#0EA5E9" },
    interior: { icon: AirlineSeatReclineNormalOutlined, color: "#DB2777" },
    wheels: { icon: TireRepairOutlined, color: "#334155" },
    exhaust: { icon: AirOutlined, color: "#64748B" },
    cooling: { icon: AcUnitOutlined, color: "#0284C7" },
    filters: { icon: FilterAltOutlined, color: "#15803D" },
    accessories: { icon: AutoAwesomeOutlined, color: "#9333EA" },
    other: { icon: ExtensionOutlined, color: "#B45309" },
};

export const EMPTY_PART_FORM = {
    sellerType: "owner",
    businessName: "",
    businessAddress: "",

    vehicleType: "car",
    partCategory: "",
    title: "",
    brand: "",
    partNumber: "",
    condition: "used",
    quantity: "1",
    warrantyMonths: "",

    universal: false,
    compatibleMake: "",
    compatibleModel: "",
    yearFrom: "",
    yearTo: "",
    compatibilityNotes: "",

    price: "",
    negotiable: false,
    delivery: false,
    installation: false,

    city: "",
    neighborhood: "",
    mapLink: "",
    showEmail: false,
    description: "",
};

const str = (value) => (value === null || value === undefined ? "" : String(value));

/** Saved part -> form values (edit). */
export function partToForm(part) {
    const compatibility = part.compatibility || {};
    return {
        ...EMPTY_PART_FORM,
        sellerType: part.sellerType || "owner",
        businessName: part.business?.name || "",
        businessAddress: part.business?.address || "",
        vehicleType: part.vehicleType || "car",
        partCategory: part.partCategory || "",
        title: part.title || "",
        brand: part.brand || "",
        partNumber: part.partNumber || "",
        condition: part.condition || "used",
        quantity: str(part.quantity || 1),
        warrantyMonths: str(part.warrantyMonths),
        universal: Boolean(compatibility.universal),
        compatibleMake: compatibility.make || "",
        compatibleModel: compatibility.model || "",
        yearFrom: str(compatibility.yearFrom),
        yearTo: str(compatibility.yearTo),
        compatibilityNotes: compatibility.notes || "",
        price: str(part.price),
        negotiable: Boolean(part.negotiable),
        delivery: Boolean(part.delivery),
        installation: Boolean(part.installation),
        city: part.city || "",
        neighborhood: part.neighborhood || "",
        mapLink: part.mapLink || "",
        showEmail: Boolean(part.showEmail),
        description: part.description || "",
    };
}

/** "Dacia Logan 2012–2020", "Universal" or "". */
export function compatibilityLabel(part, t) {
    const compatibility = part?.compatibility || {};
    if (compatibility.universal) return t("vehiclesApp.parts.universal", "Universal");
    const years =
        compatibility.yearFrom && compatibility.yearTo
            ? `${compatibility.yearFrom}–${compatibility.yearTo}`
            : compatibility.yearFrom
              ? `${compatibility.yearFrom}+`
              : compatibility.yearTo
                ? `≤ ${compatibility.yearTo}`
                : "";
    return [compatibility.make, compatibility.model, years].filter(Boolean).join(" ");
}
