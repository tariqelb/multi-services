// src/Apps/vehicles/VehicleDetails/VehicleDetailsPage.jsx
// /vehicles/:id — one vehicle: photos, characteristics, price conditions, contact.

import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Avatar, Box, Button, CircularProgress, Rating, Stack, Typography } from "@mui/material";

import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";

import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import {
    DescriptionText,
    DetailsBackButton,
    DetailsContainer,
    DetailsHeader,
    DetailsLayout,
    DetailsSection,
    FactGrid,
    FeatureChips,
    KeyValueList,
    MapLinkButton,
    MediaGallery,
    SidebarCard,
    StatusBadge,
    VideoEmbed,
} from "../../../Components/ui/DetailsKit";

import SimilarVehicles from "./SimilarVehicles";
import SaveVehicleButton from "../Saved/SaveVehicleButton";
import { STATUS_TONES, formatVehiclePrice, formatCity, formatDate, formatNumber, getYoutubeVideoId, optionLabel } from "../vehicleFormat";

const yesNo = (t, value) => (value ? t("vehiclesApp.details.yes", "Yes") : null);
const waLink = (number) => `https://wa.me/${String(number).replace(/\D/g, "")}`;

function Verified({ show, color = "primary" }) {
    const { t } = useTranslation();
    if (!show) return null;
    return <VerifiedRoundedIcon titleAccess={t("vehiclesApp.details.verified", "Verified")} color={color} sx={{ fontSize: 18 }} />;
}

// key: a fresh page (no old vehicle shown) when opening a similar vehicle.
export default function VehicleDetailsPage() {
    const { id } = useParams();
    return <VehicleDetails key={id} id={id} />;
}

function VehicleDetails({ id }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const language = i18n.language;

    const [vehicle, setVehicle] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get(`/vehicles/${id}`);
                if (!cancelled) setVehicle(data.vehicle);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("vehiclesApp.details.error", "Unable to load this vehicle."));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, t]);

    if (error) {
        return (
            <DetailsContainer>
                <DetailsBackButton onClick={() => navigate("/vehicles")} label={t("vehiclesApp.details.back", "Back to vehicles")} />
                <Alert severity="error">{error}</Alert>
            </DetailsContainer>
        );
    }

    if (!vehicle) {
        return (
            <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const isRent = vehicle.listingType === "rent";
    const isMoto = vehicle.category === "moto";
    const listPath = isMoto ? "/motos" : "/vehicles";
    const mad = t("vehiclesApp.price.currency", "MAD");
    const money = (value) => (value ? `${formatNumber(value, language)} ${mad}` : null);
    const youtubeId = getYoutubeVideoId(vehicle.youtubeVideoUrl);
    const mapsHref = vehicle.mapLink || (vehicle.location?.lat != null ? `https://www.google.com/maps?q=${vehicle.location.lat},${vehicle.location.lng}` : "");
    const contact = vehicle.contact;
    const publisherName = vehicle.business?.name || [vehicle.publisher?.firstName, vehicle.publisher?.lastName].filter(Boolean).join(" ");
    const publisherId = vehicle.publisher?.id || vehicle.userId || "";
    const publisherRating = Number(vehicle.publisher?.averageRating) || 0;
    const publisherReviews = Number(vehicle.publisher?.totalReviews) || 0;

    const km = (value) => (value ? t("vehiclesApp.card.km", "{{value}} km", { value: formatNumber(value, language) }) : null);
    const facts = isMoto
        ? [
              { label: t("vehiclesApp.form.moto.type", "Type"), value: optionLabel(t, "motoType", vehicle.motoType) },
              { label: t("vehiclesApp.form.vehicle.year", "Year"), value: vehicle.year },
              { label: t("vehiclesApp.form.vehicle.mileage", "Mileage"), value: vehicle.condition === "used" ? km(vehicle.mileage) : null },
              { label: t("vehiclesApp.form.moto.power", "Power"), value: optionLabel(t, "fuel", vehicle.fuel) },
              { label: t("vehiclesApp.form.moto.engineCc", "Engine"), value: vehicle.engineCc ? `${formatNumber(vehicle.engineCc, language)} cc` : null },
              { label: t("vehiclesApp.form.vehicle.rangeKm", "Range"), value: km(vehicle.rangeKm) },
              { label: t("vehiclesApp.form.vehicle.transmission", "Gearbox"), value: optionLabel(t, "transmission", vehicle.transmission) },
              { label: t("vehiclesApp.form.moto.seats", "Places"), value: vehicle.seats },
              { label: t("vehiclesApp.form.vehicle.fiscalPower", "Tax horsepower"), value: vehicle.fiscalPower ? `${vehicle.fiscalPower} CV` : null },
              { label: t("vehiclesApp.form.vehicle.exteriorColor", "Colour"), value: optionLabel(t, "color", vehicle.exteriorColor) },
          ]
        : [
              { label: t("vehiclesApp.form.vehicle.year", "Year"), value: vehicle.year },
              { label: t("vehiclesApp.form.vehicle.mileage", "Mileage"), value: vehicle.condition === "used" ? km(vehicle.mileage) : null },
              { label: t("vehiclesApp.form.vehicle.fuel", "Fuel"), value: optionLabel(t, "fuel", vehicle.fuel) },
              { label: t("vehiclesApp.form.vehicle.rangeKm", "Range"), value: km(vehicle.rangeKm) },
              { label: t("vehiclesApp.form.vehicle.transmission", "Gearbox"), value: optionLabel(t, "transmission", vehicle.transmission) },
              { label: t("vehiclesApp.form.vehicle.bodyType", "Body type"), value: optionLabel(t, "bodyType", vehicle.bodyType) },
              { label: t("vehiclesApp.form.vehicle.seats", "Seats"), value: vehicle.seats },
              { label: t("vehiclesApp.form.vehicle.doors", "Doors"), value: vehicle.doors },
              { label: t("vehiclesApp.form.vehicle.fiscalPower", "Tax horsepower"), value: vehicle.fiscalPower ? `${vehicle.fiscalPower} CV` : null },
              { label: t("vehiclesApp.form.vehicle.engineSize", "Engine size"), value: vehicle.engineSize ? `${vehicle.engineSize} L` : null },
              { label: t("vehiclesApp.form.vehicle.exteriorColor", "Colour"), value: optionLabel(t, "color", vehicle.exteriorColor) },
              { label: t("vehiclesApp.form.vehicle.interiorColor", "Interior"), value: vehicle.interiorColor },
              { label: t("vehiclesApp.form.vehicle.version", "Version / trim"), value: vehicle.version },
          ];

    const history = [
        { label: t("vehiclesApp.form.details.condition", "Condition"), value: optionLabel(t, "condition", vehicle.condition) },
        { label: t("vehiclesApp.form.history.firstHand", "First hand"), value: yesNo(t, vehicle.firstHand) },
        { label: t("vehiclesApp.form.history.previousOwners", "Previous owners"), value: vehicle.previousOwners },
        { label: t("vehiclesApp.form.history.accidentFree", "No accident"), value: yesNo(t, vehicle.accidentFree) },
        { label: t("vehiclesApp.form.history.serviceHistory", "Service history"), value: yesNo(t, vehicle.serviceHistory) },
        { label: t("vehiclesApp.form.history.origin", "Origin"), value: optionLabel(t, "origin", vehicle.origin) },
        { label: t("vehiclesApp.form.history.vignettePaid", "Vignette paid"), value: yesNo(t, vehicle.vignettePaid) },
        { label: t("vehiclesApp.form.history.technicalInspection", "Technical inspection valid until"), value: formatDate(vehicle.technicalInspectionUntil, language) },
    ];

    const conditions = isRent
        ? [
              { label: t("vehiclesApp.form.rent.pricePerDay", "Price per day"), value: money(vehicle.price) },
              { label: t("vehiclesApp.form.rent.pricePerWeek", "Price per week"), value: money(vehicle.rent?.pricePerWeek) },
              { label: t("vehiclesApp.form.rent.pricePerMonth", "Price per month"), value: money(vehicle.rent?.pricePerMonth) },
              { label: t("vehiclesApp.form.rent.deposit", "Deposit"), value: money(vehicle.rent?.deposit) },
              { label: t("vehiclesApp.form.rent.minDays", "Minimum days"), value: vehicle.rent?.minDays > 1 ? vehicle.rent.minDays : null },
              { label: t("vehiclesApp.form.rent.insurance", "Insurance included"), value: optionLabel(t, "insurance", vehicle.rent?.insurance) },
              { label: t("vehiclesApp.form.rent.insuranceExcess", "Insurance excess"), value: money(vehicle.rent?.insuranceExcess) },
              {
                  label: t("vehiclesApp.form.rent.mileagePolicy", "Mileage"),
                  value:
                      vehicle.rent?.mileagePolicy === "limited"
                          ? t("vehiclesApp.details.kmPerDay", "{{km}} km per day", { km: formatNumber(vehicle.rent.kmPerDay, language) })
                          : optionLabel(t, "mileagePolicy", vehicle.rent?.mileagePolicy),
              },
              { label: t("vehiclesApp.form.rent.minDriverAge", "Driver minimum age"), value: vehicle.rent?.minDriverAge },
              { label: t("vehiclesApp.form.rent.minLicenseYears", "Years with a licence"), value: vehicle.rent?.minLicenseYears },
              { label: t("vehiclesApp.form.rent.withDriver", "With driver available"), value: yesNo(t, vehicle.rent?.withDriver) },
              { label: t("vehiclesApp.form.rent.delivery", "Delivery (airport, hotel)"), value: yesNo(t, vehicle.rent?.delivery) },
          ]
        : [
              { label: t("vehiclesApp.form.sale.negotiable", "Negotiable"), value: yesNo(t, vehicle.sale?.negotiable) },
              { label: t("vehiclesApp.form.sale.creditAvailable", "Bank credit possible"), value: yesNo(t, vehicle.sale?.creditAvailable) },
              { label: t("vehiclesApp.form.sale.tradeInAccepted", "Trade-in accepted"), value: yesNo(t, vehicle.sale?.tradeInAccepted) },
              { label: t("vehiclesApp.form.sale.insuranceValidUntil", "Insurance valid until"), value: formatDate(vehicle.sale?.insuranceValidUntil, language) },
          ];

    const main = (
        <>
            <MediaGallery
                images={(vehicle.images || []).map((image) => getImageUrl(image))}
                alt={vehicle.title}
                emptyIcon={isMoto ? <TwoWheelerOutlinedIcon /> : <DirectionsCarOutlinedIcon />}
                emptyLabel={t("vehiclesApp.card.noPhoto", "No photo")}
            />

            <DetailsSection title={t("vehiclesApp.details.characteristics", "Characteristics")} icon={<InfoOutlinedIcon />}>
                <FactGrid items={facts} />
            </DetailsSection>

            <DetailsSection title={isRent ? t("vehiclesApp.form.rent.title", "Rental price and conditions") : t("vehiclesApp.details.saleConditions", "Sale conditions")} icon={<ReceiptLongOutlinedIcon />}>
                <KeyValueList items={conditions} />
            </DetailsSection>

            <DetailsSection title={t("vehiclesApp.form.history.papers", "History and Papers")} icon={<FactCheckOutlinedIcon />}>
                <KeyValueList items={history} />
            </DetailsSection>

            <DetailsSection title={t("vehiclesApp.form.history.equipment", "Equipment")} icon={<TuneOutlinedIcon />}>
                <FeatureChips
                    items={(vehicle.equipment || []).map((item) => ({ label: optionLabel(t, "equipment", item) }))}
                    emptyLabel={t("vehiclesApp.details.noEquipment", "Not specified")}
                />
            </DetailsSection>

            {vehicle.customFields?.length > 0 && (
                <DetailsSection title={t("vehiclesApp.form.custom.title", "Additional Details")} icon={<PlaylistAddCheckRoundedIcon />}>
                    <KeyValueList items={vehicle.customFields.map((field) => ({ label: field.label, value: field.value }))} />
                </DetailsSection>
            )}

            {vehicle.description && (
                <DetailsSection title={t("vehiclesApp.details.description", "Description")} icon={<DescriptionOutlinedIcon />}>
                    <DescriptionText>{vehicle.description}</DescriptionText>
                </DetailsSection>
            )}

            {youtubeId && (
                <DetailsSection title={t("vehiclesApp.details.video", "Video")} icon={<PlayCircleOutlineRoundedIcon />}>
                    <VideoEmbed
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                        title={vehicle.title}
                        externalUrl={`https://www.youtube.com/watch?v=${youtubeId}`}
                    />
                </DetailsSection>
            )}
        </>
    );

    const sidebar = (
        <>
            <SidebarCard>
                {/* Publisher: opens their vehicle profile (publications and reviews). */}
                <Stack
                    direction="row"
                    spacing={1.5}
                    component={publisherId ? RouterLink : "div"}
                    to={publisherId ? `/vehicles/profile/${publisherId}` : undefined}
                    sx={{
                        alignItems: "center",
                        mb: 2,
                        color: "inherit",
                        textDecoration: "none",
                        borderRadius: 2,
                        ...(publisherId && { "&:hover .publisher-name": { color: "primary.main", textDecoration: "underline" } }),
                    }}
                >
                    <Avatar src={getImageUrl(vehicle.publisher?.profileImage) || undefined} sx={{ bgcolor: "primary.main" }}>
                        {vehicle.publisherType === "owner" ? publisherName.slice(0, 1) : <StorefrontOutlinedIcon />}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography className="publisher-name" sx={{ fontWeight: 700 }} noWrap dir="auto">
                            {publisherName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {optionLabel(t, "publisherType", vehicle.publisherType)}
                        </Typography>
                        {publisherId && (
                            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.25 }}>
                                <Rating value={publisherRating} precision={0.1} readOnly size="small" />
                                <Typography variant="caption" color="text.secondary">
                                    {publisherReviews
                                        ? t("vehiclesApp.details.ratingCount", "{{value}} · {{count}} reviews", { value: publisherRating.toFixed(1), count: publisherReviews })
                                        : t("vehiclesApp.details.noReviews", "No reviews yet")}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                </Stack>

                {vehicle.contactHidden ? (
                    <Alert severity="warning">
                        {t("vehiclesApp.details.inactiveNoContact", "This vehicle is not available at the moment. The publisher is not accepting contacts.")}
                    </Alert>
                ) : contact ? (
                    <Stack spacing={1.25}>
                        {contact.phone && (
                            <Button variant="contained" size="large" component="a" href={`tel:${contact.phone}`} startIcon={<PhoneRoundedIcon />} endIcon={<Verified show={contact.contactVerified?.phone} color="inherit" />}>
                                <span dir="ltr">{contact.phone}</span>
                            </Button>
                        )}
                        {contact.whatsappNumber && (
                            <Button
                                variant="outlined"
                                color="success"
                                size="large"
                                component="a"
                                href={waLink(contact.whatsappNumber)}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<WhatsAppIcon />}
                                endIcon={<Verified show={contact.contactVerified?.whatsapp} />}
                            >
                                WhatsApp
                            </Button>
                        )}
                        {/* Save: right under WhatsApp, like the other details pages */}
                        {!vehicle.isOwner && <SaveVehicleButton vehicle={vehicle} />}
                        {contact.email && (
                            <Button variant="text" component="a" href={`mailto:${contact.email}`} startIcon={<MailOutlineRoundedIcon />} endIcon={<Verified show={contact.contactVerified?.email} />}>
                                {contact.email}
                            </Button>
                        )}
                    </Stack>
                ) : null}

                {/* No contact shown (inactive): the save button stays in this card. */}
                {!vehicle.isOwner && (vehicle.contactHidden || !contact) && <SaveVehicleButton vehicle={vehicle} sx={{ mt: 2 }} />}

                {vehicle.isOwner && (
                    <Button fullWidth sx={{ mt: 2 }} variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => navigate(`/vehicles/${vehicle._id}/edit`)}>
                        {t("vehiclesApp.details.edit", "Edit this vehicle")}
                    </Button>
                )}
            </SidebarCard>

            {(formatCity(vehicle, language) || vehicle.business?.address || mapsHref) && (
                <SidebarCard>
                    <KeyValueList
                        items={[
                            { icon: <PlaceOutlinedIcon />, label: t("vehiclesApp.details.location", "Location"), value: formatCity(vehicle, language) },
                            { label: t("vehiclesApp.form.publisher.businessAddress", "Business address"), value: vehicle.business?.address },
                        ]}
                    />
                    {mapsHref && <MapLinkButton href={mapsHref} label={t("vehiclesApp.details.viewOnMaps", "View on Google Maps")} fullWidth />}
                </SidebarCard>
            )}
        </>
    );

    return (
        <DetailsContainer>
            <DetailsBackButton
                onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(listPath))}
                label={isMoto ? t("vehiclesApp.details.backMotos", "Back to motos") : t("vehiclesApp.details.back", "Back to vehicles")}
            />

            {location.state?.published && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {t("vehiclesApp.details.published", "Your vehicle is published.")}
                </Alert>
            )}
            {location.state?.updated && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {t("vehiclesApp.details.updated", "Your changes are saved.")}
                </Alert>
            )}

            <DetailsHeader
                badges={
                    <>
                        <StatusBadge label={optionLabel(t, "listingType", vehicle.listingType)} tone={isRent ? "info" : "primary"} />
                        <StatusBadge label={t(`vehiclesApp.status.${vehicle.status}`, vehicle.status)} tone={STATUS_TONES[vehicle.status]} />
                    </>
                }
                title={vehicle.title}
                location={formatCity(vehicle, language)}
                price={formatVehiclePrice(vehicle, t, language)}
                priceCaption={isRent ? t("vehiclesApp.details.rentCaption", "Rental") : vehicle.sale?.negotiable ? t("vehiclesApp.card.negotiable", "Negotiable") : null}
            />

            <DetailsLayout main={main} sidebar={sidebar} />

            <SimilarVehicles key={vehicle._id} vehicleId={vehicle._id} isMoto={isMoto} />
        </DetailsContainer>
    );
}
