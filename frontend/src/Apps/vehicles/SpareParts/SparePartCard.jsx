// src/Apps/vehicles/SpareParts/SparePartCard.jsx
// Same card as vehicles: status on top, category and seller on the photo,
// date and reference, fitting vehicle, condition, brand, price.

import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import ListingCard, { CardBadge } from "../../../Components/ui/ListingCard";
import getImageUrl from "../../../utils/getImageUrl";
import { formatCity, formatNumber, optionLabel } from "../vehicleFormat";
import { PART_CATEGORY_STYLES, compatibilityLabel } from "./sparePartOptions";

const STATUS_BADGE_TONES = { Available: "success", Sold: "error", Inactive: "dark" };

const shortDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (number) => String(number).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export default function SparePartCard({ part, onClick, footer }) {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const isMoto = part.vehicleType === "moto";
    const CategoryIcon = (PART_CATEGORY_STYLES[part.partCategory] || PART_CATEGORY_STYLES.other).icon;
    const fits = compatibilityLabel(part, t);

    // Four facts at most, on two rows: fits, condition, brand / reference, delivery.
    const features = [
        fits && { icon: isMoto ? <TwoWheelerOutlinedIcon /> : <DirectionsCarOutlinedIcon />, label: fits },
        { icon: <VerifiedOutlinedIcon />, label: optionLabel(t, "partCondition", part.condition) },
        part.brand ? { icon: <SellOutlinedIcon />, label: part.brand } : part.partNumber && { icon: <QrCode2OutlinedIcon />, label: part.partNumber },
        part.delivery && { icon: <LocalShippingOutlinedIcon />, label: t("vehiclesApp.parts.delivery", "Delivery") },
    ];

    return (
        <ListingCard
            image={getImageUrl(part.images?.[0])}
            imageAlt={part.title}
            emptyIcon={<CategoryIcon />}
            emptyLabel={t("vehiclesApp.card.noPhoto", "No photo")}
            topBadges={
                <>
                    <CardBadge label={optionLabel(t, "partVehicleType", part.vehicleType || "car")} tone="primary" />
                    {part.status && <CardBadge label={t(`vehiclesApp.status.${part.status}`, part.status)} tone={STATUS_BADGE_TONES[part.status] || "dark"} />}
                </>
            }
            bottomBadges={
                <>
                    <CardBadge tone="dark" label={optionLabel(t, "partCategory", part.partCategory)} />
                    {part.condition === "new" && <CardBadge tone="success" label={optionLabel(t, "partCondition", "new")} />}
                    <CardBadge
                        tone="light"
                        icon={part.sellerType === "owner" ? <PersonOutlineRoundedIcon /> : <StorefrontOutlinedIcon />}
                        label={part.business?.name || optionLabel(t, "sellerType", part.sellerType || "owner")}
                    />
                </>
            }
            meta={shortDate(part.createdAt)}
            metaEnd={
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }} noWrap>
                    {t("vehiclesApp.card.reference", "REF")} #{String(part._id || "").slice(-6).toUpperCase()}
                </Typography>
            }
            title={part.title}
            location={formatCity(part, language)}
            features={features.filter(Boolean).slice(0, 4)}
            featureRows={2}
            price={part.price ? `${formatNumber(part.price, language)} ${t("vehiclesApp.price.currency", "MAD")}` : t("vehiclesApp.price.onRequest", "Price on request")}
            priceCaption={part.quantity > 1 ? t("vehiclesApp.parts.perUnit", "each") : null}
            // Always one line under the price, so cards keep the same height.
            priceNote={part.negotiable ? t("vehiclesApp.card.negotiable", "Negotiable") : " "}
            footer={footer}
            onClick={onClick}
        />
    );
}
