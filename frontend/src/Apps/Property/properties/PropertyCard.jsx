
import React from "react";
import { useTranslation } from "react-i18next";

import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import BathtubOutlinedIcon from "@mui/icons-material/BathtubOutlined";
import WeekendOutlinedIcon from "@mui/icons-material/WeekendOutlined";
import ChairOutlinedIcon from "@mui/icons-material/ChairOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";

import { Typography } from "@mui/material";
import ListingCard, { CardBadge } from "../../../Components/ui/ListingCard";

import { getFurnishingStatus } from "../../../utils/furnishing";
import getImageUrl from "../../../utils/getImageUrl";

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase();

export default function PropertyCard({ property = {}, onClick }) {
    const { t, i18n } = useTranslation();

    const {
        title = "",
        price = "",
        image = "",
        listingType = "For Sale",
        status = "Available",
        propertyType = "Apartment",
        furnishingStatus = "",
        referenceCode = "",
        city = "",
        neighborhood = "",
        surface = "",
        rooms = "",
        salons = "",
        bathrooms = "",
        createdDate = "",
    } = property;

    const locationText = neighborhood
        ? `${city} — ${neighborhood}`
        : city;

    const currency = t("common.currency", "MAD");
    const formattedPrice =
        typeof price === "number"
            ? `${price.toLocaleString(i18n.language)} ${currency}`
            : String(price || "").replace(/\bMAD$/, currency);

    const listingTypeKey = {
        "for sale": "forSale",
        "for rent": "forRent",
    }[normalize(listingType)];

    const statusKey = {
        available: "available",
        rented: "rented",
        sold: "sold",
        inactive: "inactive",
    }[normalize(status)];

    const propertyTypeKeys = {
        apartment: "apartment",
        house: "house",
        villa: "villa",
        studio: "studio",
        room: "room",
        store: "store",
        office: "office",
        land: "land",
        warehouse: "warehouse",
        "commercial space": "commercialSpace",
        "commercial store": "commercialStore",
        garage: "garage",
        other: "other",
    };

    const translatedPropertyType =
        propertyTypeKeys[normalize(propertyType)];

    const statusTone = {
        available: "success",
        rented: "warning",
        sold: "error",
        inactive: "dark",
    }[normalize(status)] || "success";

    const isRent = normalize(listingType) === "for rent";
    // Only homes (villa, apartment, house, studio, room) show it.
    const furnishing = getFurnishingStatus({ propertyType, furnishingStatus });
    const imageUrl = image ? getImageUrl(image) : "";
    const hasValue = (value) => value !== undefined && value !== null && value !== "";

    const typeLabel = translatedPropertyType
        ? t(`properties.categories.${translatedPropertyType}`, { defaultValue: propertyType })
        : propertyType;

    const rentalPeriodLabel =
        isRent && property.rentalPeriod
            ? t(`properties.details.rentalPeriod.${normalize(property.rentalPeriod)}`, {
                defaultValue: property.rentalPeriod,
            })
            : "";

    return (
        <ListingCard
            onClick={onClick}
            image={imageUrl}
            imageAlt={title}
            emptyIcon={<HomeWorkOutlinedIcon />}
            topBadges={
                <>
                    <CardBadge
                        tone={isRent ? "info" : "primary"}
                        label={listingTypeKey ? t(`properties.card.${listingTypeKey}`) : listingType}
                    />
                    {status && (
                        <CardBadge
                            tone={statusTone}
                            label={statusKey ? t(`properties.card.${statusKey}`, { defaultValue: status }) : status}
                        />
                    )}
                </>
            }
            bottomBadges={
                <>
                    {typeLabel && <CardBadge tone="dark" label={typeLabel} />}
                    {furnishing && (
                        <CardBadge
                            tone="light"
                            icon={<ChairOutlinedIcon />}
                            label={
                                furnishing === "Furnished"
                                    ? t("properties.card.furnished", { defaultValue: "Furnished" })
                                    : t("properties.card.unfurnished", { defaultValue: "Unfurnished" })
                            }
                        />
                    )}
                </>
            }
            meta={createdDate}
            metaEnd={
                referenceCode ? (
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }} noWrap>
                        {t("properties.card.reference")} {referenceCode}
                    </Typography>
                ) : null
            }
            title={title}
            location={locationText}
            features={[
                hasValue(surface) && { icon: <SquareFootRoundedIcon />, label: `${surface} m²` },
                hasValue(rooms) && { icon: <BedOutlinedIcon />, label: `${rooms} ${t("properties.card.rooms")}` },
                hasValue(bathrooms) && { icon: <BathtubOutlinedIcon />, label: `${bathrooms} ${t("properties.card.bathrooms")}` },
                hasValue(salons) && Number(salons) > 0 && { icon: <WeekendOutlinedIcon />, label: `${salons} ${t("properties.card.salons")}` },
            ].filter(Boolean)}
            price={formattedPrice}
            priceCaption={rentalPeriodLabel}
        />
    );
}
