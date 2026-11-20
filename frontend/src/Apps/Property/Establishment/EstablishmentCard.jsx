import { useTranslation } from "react-i18next";
import { Stack, Typography } from "@mui/material";

import HotelOutlinedIcon from "@mui/icons-material/HotelOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import ListingCard, { CardBadge } from "../../../Components/ui/ListingCard";

export default function EstablishmentCard({ establishment, image, startingPrice, onClick }) {
    const { t } = useTranslation();

    const type = establishment.accommodationType;
    const typeLabel = type
        ? t(`establishments.types.${type.toLowerCase()}`, { defaultValue: type })
        : t("establishments.accommodation");

    const stars = String(establishment.officialClassification || "").match(/[1-5]/)?.[0];

    return (
        <ListingCard
            onClick={onClick}
            image={image}
            imageAlt={establishment.name}
            emptyIcon={<HotelOutlinedIcon />}
            topBadges={<CardBadge tone="primary" label={typeLabel} />}
            topEndBadges={
                stars ? <CardBadge tone="light" icon={<StarRoundedIcon sx={{ color: "#F59E0B !important" }} />} label={stars} /> : null
            }
            title={establishment.name}
            location={
                [establishment.location?.neighborhood, establishment.location?.city].filter(Boolean).join(", ") ||
                t("establishments.locationNotSpecified")
            }
            features={[
                establishment.numberOfRooms && {
                    icon: <MeetingRoomOutlinedIcon />,
                    label: t("establishments.rooms", { count: establishment.numberOfRooms }),
                },
            ].filter(Boolean)}
            price={startingPrice !== null ? `${startingPrice.toLocaleString()} ${t("common.currency", "MAD")}` : null}
            priceCaption={startingPrice !== null ? t("establishments.details.night", "night") : ""}
            priceNote={startingPrice !== null ? t("establishments.startingPrice") : t("establishments.contactForPrices")}
            footer={
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {establishment.shortDescription || t("establishments.descriptionFallback")}
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: "center", color: "primary.main", fontWeight: 700, flexShrink: 0, fontSize: "0.85rem" }}
                    >
                        <span>{t("establishments.viewDetails")}</span>
                        <ArrowForwardRoundedIcon
                            sx={{ fontSize: 18, transform: (theme) => (theme.direction === "rtl" ? "scaleX(-1)" : "none") }}
                        />
                    </Stack>
                </Stack>
            }
        />
    );
}
