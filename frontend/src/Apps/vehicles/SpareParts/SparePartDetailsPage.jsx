// src/Apps/vehicles/SpareParts/SparePartDetailsPage.jsx
// /vehicles/parts/:id — one spare part: photos, the part, compatible
// vehicles, price, seller with contact (Save under WhatsApp), similar parts.

import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Alert, Avatar, Box, Button, CircularProgress, Pagination, Rating, Snackbar, Stack, Typography } from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import SaveToggleButton from "../../../Components/ui/SaveToggleButton";
import {
    DescriptionText,
    DetailsBackButton,
    DetailsContainer,
    DetailsHeader,
    DetailsLayout,
    DetailsSection,
    FactGrid,
    KeyValueList,
    MapLinkButton,
    MediaGallery,
    SidebarCard,
    StatusBadge,
} from "../../../Components/ui/DetailsKit";

import { STATUS_TONES, formatCity, formatNumber, optionLabel } from "../vehicleFormat";
import SparePartCard from "./SparePartCard";
import { PART_CATEGORY_STYLES, compatibilityLabel } from "./sparePartOptions";
import VisitProfileButton from "../../../Components/Profile/VisitProfileButton";
import { trackVehicleContact, trackVehicleView } from "../statsTracking";
import { useFlashState, useGoBack } from "../../../Components/navigation/navHistory";

const waLink = (number) => `https://wa.me/${String(number).replace(/\D/g, "")}`;
const yes = (t, value) => (value ? t("vehiclesApp.details.yes", "Yes") : null);

function Verified({ show, color = "primary" }) {
    const { t } = useTranslation();
    if (!show) return null;
    return <VerifiedRoundedIcon titleAccess={t("vehiclesApp.details.verified", "Verified")} color={color} sx={{ fontSize: 18 }} />;
}

/** "Save this part" / "Saved" (same button as every details page). */
function SavePartButton({ part, sx }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth?.user ?? state.loginForm?.user ?? null);
    const [saved, setSaved] = useState(Boolean(part.isSaved));
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const toggle = async () => {
        if (!user) return navigate("/login");
        const next = !saved;
        setSaving(true);
        try {
            if (next) await axiosInstance.post(`/vehicles/parts/${part._id}/save`);
            else await axiosInstance.delete(`/vehicles/parts/${part._id}/save`);
            setSaved(next);
            setFeedback({
                severity: "success",
                message: next ? t("vehiclesApp.parts.saved", "Saved. Find it in Saved vehicles, Spare parts tab.") : t("vehiclesApp.saved.removed", "Removed from your saved vehicles."),
            });
        } catch (requestError) {
            setFeedback({ severity: "error", message: requestError.response?.data?.message || t("vehiclesApp.saved.error", "Unable to update your saved vehicles.") });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <SaveToggleButton
                saved={saved}
                saving={saving}
                onClick={toggle}
                saveLabel={t("vehiclesApp.parts.saveButton", "Save this part")}
                savedLabel={t("vehiclesApp.saved.savedButton", "Saved")}
                sx={sx}
            />
            <Snackbar open={Boolean(feedback)} autoHideDuration={3000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={feedback?.severity || "success"} variant="filled" onClose={() => setFeedback(null)}>
                    {feedback?.message}
                </Alert>
            </Snackbar>
        </>
    );
}

function SimilarParts({ partId }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [parts, setParts] = useState([]);
    const [page, setPage] = useState(1);
    const perPage = 4;

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`/vehicles/parts/${partId}/similar`)
            .then(({ data }) => !cancelled && setParts(data.parts || []))
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [partId]);

    if (!parts.length) return null;
    const pages = Math.ceil(parts.length / perPage);
    return (
        <Box sx={{ mt: { xs: 4, md: 6 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
                {t("vehiclesApp.parts.similar", "Similar spare parts")}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gap: 2.5, "& > *": { minWidth: 0 } }}>
                {parts.slice((page - 1) * perPage, page * perPage).map((part) => (
                    <SparePartCard key={part._id} part={part} onClick={() => navigate(`/vehicles/parts/${part._id}`)} />
                ))}
            </Box>
            {pages > 1 && (
                <Stack sx={{ alignItems: "center", mt: 3 }}>
                    <Pagination count={pages} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" />
                </Stack>
            )}
        </Box>
    );
}

// key: a fresh page when opening a similar part.
export default function SparePartDetailsPage() {
    const { id } = useParams();
    return <SparePartDetails key={id} id={id} />;
}

function SparePartDetails({ id }) {
    const navigate = useNavigate();
    const goBack = useGoBack("/vehicles/parts");
    // "published" / "updated" message, also after returning from the edit form.
    const flashState = useFlashState();
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const [part, setPart] = useState(null);
    const [error, setError] = useState("");

    // One view per page opening (Vehicles › Statistics; owners are not counted).
    useEffect(() => {
        trackVehicleView("part", id);
    }, [id]);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`/vehicles/parts/${id}`)
            .then(({ data }) => !cancelled && setPart(data.part))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("vehiclesApp.parts.detailsError", "Unable to load this spare part.")));
        return () => {
            cancelled = true;
        };
    }, [id, t]);

    if (error) {
        return (
            <DetailsContainer>
                <DetailsBackButton onClick={() => goBack()} label={t("vehiclesApp.details.backShort", "Back")} />
                <Alert severity="error">{error}</Alert>
            </DetailsContainer>
        );
    }
    if (!part) {
        return (
            <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const mad = t("vehiclesApp.price.currency", "MAD");
    const contact = part.contact;
    const compatibility = part.compatibility || {};
    const CategoryIcon = (PART_CATEGORY_STYLES[part.partCategory] || PART_CATEGORY_STYLES.other).icon;
    const publisherName = part.business?.name || [part.publisher?.firstName, part.publisher?.lastName].filter(Boolean).join(" ");
    const publisherId = part.publisher?.id || part.userId || "";
    const rating = Number(part.publisher?.averageRating) || 0;
    const reviews = Number(part.publisher?.totalReviews) || 0;
    const mapsHref = part.mapLink || (part.location?.lat != null ? `https://www.google.com/maps?q=${part.location.lat},${part.location.lng}` : "");
    const years =
        compatibility.yearFrom || compatibility.yearTo ? [compatibility.yearFrom || "…", compatibility.yearTo || "…"].join(" – ") : null;

    const facts = [
        { label: t("vehiclesApp.parts.form.category", "Category"), value: optionLabel(t, "partCategory", part.partCategory) },
        { label: t("vehiclesApp.parts.form.forVehicle", "Part for"), value: optionLabel(t, "partVehicleType", part.vehicleType) },
        { label: t("vehiclesApp.filters.condition", "Condition"), value: optionLabel(t, "partCondition", part.condition) },
        { label: t("vehiclesApp.parts.form.brand", "Part brand"), value: part.brand },
        { label: t("vehiclesApp.parts.form.partNumber", "Reference (OEM number)"), value: part.partNumber },
        { label: t("vehiclesApp.parts.form.quantity", "Quantity"), value: part.quantity > 1 ? part.quantity : null },
        {
            label: t("vehiclesApp.parts.form.warranty", "Warranty"),
            value: part.warrantyMonths ? t("vehiclesApp.parts.warrantyMonths", "{{count}} months", { count: part.warrantyMonths }) : null,
        },
    ];

    const fits = compatibility.universal
        ? [{ label: t("vehiclesApp.parts.fits", "Fits"), value: t("vehiclesApp.parts.universal", "Universal") }]
        : [
              { label: t("vehiclesApp.form.vehicle.make", "Make"), value: compatibility.make },
              { label: t("vehiclesApp.form.vehicle.model", "Model"), value: compatibility.model || t("vehiclesApp.parts.allModels", "All models") },
              { label: t("vehiclesApp.parts.years", "Years"), value: years },
          ];
    if (compatibility.notes) fits.push({ label: t("vehiclesApp.parts.alsoFits", "Also fits"), value: compatibility.notes });

    const conditions = [
        { label: t("vehiclesApp.parts.form.price", "Price per unit"), value: part.price ? `${formatNumber(part.price, language)} ${mad}` : null },
        { label: t("vehiclesApp.form.sale.negotiable", "Negotiable"), value: yes(t, part.negotiable) },
        { label: t("vehiclesApp.parts.form.delivery", "Delivery possible"), value: yes(t, part.delivery) },
        { label: t("vehiclesApp.parts.form.installation", "Fitting offered"), value: yes(t, part.installation) },
    ];

    const main = (
        <>
            <MediaGallery images={(part.images || []).map((image) => getImageUrl(image))} alt={part.title} emptyIcon={<CategoryIcon />} emptyLabel={t("vehiclesApp.card.noPhoto", "No photo")} />
            <DetailsSection title={t("vehiclesApp.parts.form.partTitle", "The Part")} icon={<InfoOutlinedIcon />}>
                <FactGrid items={facts} />
            </DetailsSection>
            <DetailsSection title={t("vehiclesApp.parts.form.compatibilityTitle", "Compatible Vehicles")} icon={<DirectionsCarOutlinedIcon />}>
                <KeyValueList items={fits} />
            </DetailsSection>
            <DetailsSection title={t("vehiclesApp.parts.conditions", "Price and Delivery")} icon={<ReceiptLongOutlinedIcon />}>
                <KeyValueList items={conditions} />
            </DetailsSection>
            {part.description && (
                <DetailsSection title={t("vehiclesApp.details.description", "Description")} icon={<DescriptionOutlinedIcon />}>
                    <DescriptionText>{part.description}</DescriptionText>
                </DetailsSection>
            )}
        </>
    );

    const sidebar = (
        <>
            <SidebarCard>
                {/* Seller: opens their vehicle profile (publications and reviews). */}
                <Stack
                    direction="row"
                    spacing={1.5}
                    component={publisherId ? RouterLink : "div"}
                    to={publisherId ? `/vehicles/profile/${publisherId}?tab=parts` : undefined}
                    sx={{
                        alignItems: "center",
                        mb: 2,
                        color: "inherit",
                        textDecoration: "none",
                        ...(publisherId && { "&:hover .publisher-name": { color: "primary.main", textDecoration: "underline" } }),
                    }}
                >
                    <Avatar src={getImageUrl(part.publisher?.profileImage) || undefined} sx={{ bgcolor: "primary.main" }}>
                        {part.sellerType === "owner" ? publisherName.slice(0, 1) : <StorefrontOutlinedIcon />}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography className="publisher-name" sx={{ fontWeight: 700 }} noWrap dir="auto">
                            {publisherName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {optionLabel(t, "sellerType", part.sellerType || "owner")}
                        </Typography>
                        {publisherId && (
                            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.25 }}>
                                <Rating value={rating} precision={0.1} readOnly size="small" />
                                <Typography variant="caption" color="text.secondary">
                                    {reviews
                                        ? t("vehiclesApp.details.ratingCount", "{{value}} · {{count}} reviews", { value: rating.toFixed(1), count: reviews })
                                        : t("vehiclesApp.details.noReviews", "No reviews yet")}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                </Stack>

                {part.contactHidden ? (
                    <Alert severity="warning">{t("vehiclesApp.parts.inactiveNoContact", "This part is not available at the moment. The seller is not accepting contacts.")}</Alert>
                ) : contact ? (
                    <Stack spacing={1.25}>
                        {contact.phone && (
                            <Button variant="contained" size="large" component="a" href={`tel:${contact.phone}`} onClick={() => trackVehicleContact("part", part._id, "phone")} startIcon={<PhoneRoundedIcon />} endIcon={<Verified show={contact.contactVerified?.phone} color="inherit" />}>
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
                                onClick={() => trackVehicleContact("part", part._id, "whatsapp")}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<WhatsAppIcon />}
                                endIcon={<Verified show={contact.contactVerified?.whatsapp} />}
                            >
                                WhatsApp
                            </Button>
                        )}
                        {/* Save: right under WhatsApp, like every details page */}
                        {!part.isOwner && <SavePartButton part={part} />}
                        {contact.email && (
                            <Button variant="text" component="a" href={`mailto:${contact.email}`} onClick={() => trackVehicleContact("part", part._id, "email")} startIcon={<MailOutlineRoundedIcon />} endIcon={<Verified show={contact.contactVerified?.email} />}>
                                {contact.email}
                            </Button>
                        )}
                    </Stack>
                ) : null}

                {!part.isOwner && (part.contactHidden || !contact) && <SavePartButton part={part} sx={{ mt: 2 }} />}

                {part.isOwner && (
                    <Button fullWidth sx={{ mt: 2 }} variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => navigate(`/vehicles/parts/${part._id}/edit`)}>
                        {t("vehiclesApp.parts.edit", "Edit this part")}
                    </Button>
                )}

                {/* Vehicles service: the publisher's vehicles profile (publications, reviews) */}
                <VisitProfileButton service="vehicles" userId={publisherId} tab="parts" sx={{ mt: 1.25 }} />
            </SidebarCard>

            {(formatCity(part, language) || part.business?.address || mapsHref) && (
                <SidebarCard>
                    <KeyValueList
                        items={[
                            { icon: <PlaceOutlinedIcon />, label: t("vehiclesApp.details.location", "Location"), value: formatCity(part, language) },
                            { label: t("vehiclesApp.form.publisher.businessAddress", "Business address"), value: part.business?.address },
                        ]}
                    />
                    {mapsHref && <MapLinkButton href={mapsHref} label={t("vehiclesApp.details.viewOnMaps", "View on Google Maps")} fullWidth />}
                </SidebarCard>
            )}
        </>
    );

    const fitsLabel = compatibilityLabel(part, t);

    return (
        <DetailsContainer>
            <DetailsBackButton
                onClick={() => goBack()}
                label={t("vehiclesApp.details.backShort", "Back")}
            />
            {flashState?.published && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {t("vehiclesApp.parts.published", "Your spare part is published.")}
                </Alert>
            )}
            {flashState?.updated && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {t("vehiclesApp.details.updated", "Your changes are saved.")}
                </Alert>
            )}

            <DetailsHeader
                badges={
                    <>
                        <StatusBadge label={optionLabel(t, "partCategory", part.partCategory)} tone="primary" />
                        <StatusBadge label={t(`vehiclesApp.status.${part.status}`, part.status)} tone={STATUS_TONES[part.status]} />
                    </>
                }
                title={part.title}
                location={[fitsLabel, formatCity(part, language)].filter(Boolean).join(" · ")}
                price={part.price ? `${formatNumber(part.price, language)} ${mad}` : t("vehiclesApp.price.onRequest", "Price on request")}
                priceCaption={part.negotiable ? t("vehiclesApp.card.negotiable", "Negotiable") : part.quantity > 1 ? t("vehiclesApp.parts.perUnit", "each") : null}
            />

            <DetailsLayout main={main} sidebar={sidebar} />

            <SimilarParts partId={part._id} />
        </DetailsContainer>
    );
}
