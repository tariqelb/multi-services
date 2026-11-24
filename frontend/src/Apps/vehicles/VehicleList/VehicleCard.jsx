// src/Apps/vehicles/VehicleList/VehicleCard.jsx
// Same card as properties: offer + status on top, type badges on the photo,
// date and reference, main facts, price.

import { useTranslation } from "react-i18next";
import { Chip, Typography } from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import LocalGasStationOutlinedIcon from "@mui/icons-material/LocalGasStationOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import EventSeatOutlinedIcon from "@mui/icons-material/EventSeatOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";
import BatteryChargingFullOutlinedIcon from "@mui/icons-material/BatteryChargingFullOutlined";

import ListingCard, { CardBadge } from "../../../Components/ui/ListingCard";
import getImageUrl from "../../../utils/getImageUrl";
import { STATUS_TONES, formatCity, formatNumber, optionLabel } from "../vehicleFormat";

const STATUS_BADGE_TONES = { Available: "success", Sold: "error", Rented: "warning", Inactive: "dark" };

const shortDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (number) => String(number).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export default function VehicleCard({ vehicle, onClick, footer }) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const isRent = vehicle.listingType === "rent";
    const currency = t("vehiclesApp.price.currency", "MAD");
    const isMoto = vehicle.category === "moto";
    const km = (value) => t("vehiclesApp.card.km", "{{value}} km", { value: formatNumber(value, language) });

    // Four facts at most, on two rows, so every card has the same height.
    // Cars: year, km, fuel, gearbox. Motos: year, km, power (cc / electric), range.
    const features = isMoto
        ? [
              vehicle.year && { icon: <CalendarMonthOutlinedIcon />, label: vehicle.year },
              vehicle.condition === "used" && vehicle.mileage > 0 && { icon: <SpeedOutlinedIcon />, label: km(vehicle.mileage) },
              vehicle.engineCc
                  ? { icon: <LocalGasStationOutlinedIcon />, label: `${formatNumber(vehicle.engineCc, language)} cc` }
                  : vehicle.fuel && { icon: vehicle.fuel === "electric" ? <ElectricBoltOutlinedIcon /> : <LocalGasStationOutlinedIcon />, label: optionLabel(t, "fuel", vehicle.fuel) },
              vehicle.rangeKm && { icon: <BatteryChargingFullOutlinedIcon />, label: km(vehicle.rangeKm) },
          ]
        : [
              { icon: <CalendarMonthOutlinedIcon />, label: vehicle.year },
              vehicle.condition === "used" && { icon: <SpeedOutlinedIcon />, label: km(vehicle.mileage) },
              { icon: <LocalGasStationOutlinedIcon />, label: optionLabel(t, "fuel", vehicle.fuel) },
              { icon: <SettingsOutlinedIcon />, label: optionLabel(t, "transmission", vehicle.transmission) },
              // New cars have no mileage: show the seats instead.
              vehicle.condition !== "used" && vehicle.seats && { icon: <EventSeatOutlinedIcon />, label: t("vehiclesApp.card.seats", "{{count}} seats", { count: vehicle.seats }) },
          ];

    return (
        <ListingCard
            image={getImageUrl(vehicle.images?.[0])}
            imageAlt={vehicle.title}
            emptyIcon={isMoto ? <TwoWheelerOutlinedIcon /> : <DirectionsCarOutlinedIcon />}
            emptyLabel={t("vehiclesApp.card.noPhoto", "No photo")}
            topBadges={
                <>
                    <CardBadge label={optionLabel(t, "listingType", vehicle.listingType)} tone={isRent ? "info" : "primary"} />
                    {vehicle.status && <CardBadge label={t(`vehiclesApp.status.${vehicle.status}`, vehicle.status)} tone={STATUS_BADGE_TONES[vehicle.status] || "dark"} />}
                </>
            }
            bottomBadges={
                <>
                    {isMoto
                        ? vehicle.motoType && <CardBadge tone="dark" label={optionLabel(t, "motoType", vehicle.motoType)} />
                        : vehicle.bodyType && <CardBadge tone="dark" label={optionLabel(t, "bodyType", vehicle.bodyType)} />}
                    {vehicle.condition === "new" && <CardBadge tone="success" label={optionLabel(t, "condition", "new")} />}
                    <CardBadge
                        tone="light"
                        icon={vehicle.publisherType === "owner" ? <PersonOutlineRoundedIcon /> : <StorefrontOutlinedIcon />}
                        label={vehicle.business?.name || optionLabel(t, "publisherType", vehicle.publisherType)}
                    />
                </>
            }
            meta={shortDate(vehicle.createdAt)}
            metaEnd={
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }} noWrap>
                    {t("vehiclesApp.card.reference", "REF")} #{String(vehicle._id || "").slice(-6).toUpperCase()}
                </Typography>
            }
            title={vehicle.title}
            location={formatCity(vehicle, language)}
            features={features.filter(Boolean).slice(0, 4)}
            featureRows={2}
            price={vehicle.price ? `${formatNumber(vehicle.price, language)} ${currency}` : t("vehiclesApp.price.onRequest", "Price on request")}
            priceCaption={isRent ? t("vehiclesApp.card.perDay", "day") : null}
            // Always one line under the price, so cards keep the same height.
            priceNote={!isRent && vehicle.sale?.negotiable ? t("vehiclesApp.card.negotiable", "Negotiable") : "\u00A0"}
            footer={footer}
            onClick={onClick}
        />
    );
}

export function StatusChip({ status }) {
    const { t } = useTranslation();
    const tone = STATUS_TONES[status] || "default";
    return <Chip size="small" color={tone === "default" ? "default" : tone} label={t(`vehiclesApp.status.${status}`, status)} />;
}
