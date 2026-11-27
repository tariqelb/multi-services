// src/Apps/DailyWorker/Details/WorkerDetailsPage.jsx
//
// /daily-worker/:id — public page of a worker: who he is, where and when he
// works, each trade offer with its price and conditions, contact buttons and
// his portfolio (photos of his work, videos). ?offer=<id> opens on that trade.

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import FreeBreakfastOutlinedIcon from "@mui/icons-material/FreeBreakfastOutlined";
import getImageUrl from "../../../utils/getImageUrl";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import axiosInstance from "../../../api/axiosInstance";
import { useGoBack } from "../../../Components/navigation/navHistory";
import {
    DetailsBackButton,
    DetailsContainer,
    DetailsLayout,
    DetailsSection,
    DescriptionText,
    FactGrid,
    MapLinkButton,
    MediaGallery,
    MobileActionBar,
    SidebarCard,
} from "../../../Components/ui/DetailsKit";
import PortfolioSection from "../../../Components/Profile/Portfolio/PortfolioSection";
import { buildEmbedUrl } from "../../../Components/MapPicker/mapLinkUtils";
import WorkerAvatar from "../Components/WorkerAvatar";
import WorkerOfferDetails from "./WorkerOfferDetails";
import { langOf, tradeName, useWorkerOptions } from "../workerOptions";
import { availabilityBadge, cityName, coverageText, daysText, fullName, hoursText, languageLabel, workplaceLabel } from "../workerFormat";

const waLink = (number) => `https://wa.me/${String(number).replace(/\D/g, "")}`;

function ContactButtons({ contact, t, compact = false }) {
    if (!contact?.phone && !contact?.whatsappNumber) {
        return <Typography variant="body2" sx={{ color: "text.secondary" }}>{t("workersApp.details.noContact", "No contact number yet.")}</Typography>;
    }
    return (
        <>
            {contact.phone && (
                <Button
                    variant="contained"
                    size="large"
                    component="a"
                    href={`tel:${contact.phone}`}
                    startIcon={<PhoneRoundedIcon />}
                    endIcon={contact.contactVerified?.phone ? <VerifiedRoundedIcon /> : null}
                    fullWidth
                >
                    {compact ? t("workersApp.details.call", "Call") : contact.phone}
                </Button>
            )}
            {contact.whatsappNumber && (
                <Button
                    variant="contained"
                    size="large"
                    component="a"
                    href={waLink(contact.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<WhatsAppIcon />}
                    endIcon={contact.contactVerified?.whatsapp ? <VerifiedRoundedIcon /> : null}
                    sx={{ bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" } }}
                    fullWidth
                >
                    WhatsApp
                </Button>
            )}
        </>
    );
}

export default function WorkerDetailsPage() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const focusOffer = params.get("offer") || "";
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const navigate = useNavigate();
    const goBack = useGoBack("/daily-worker");
    const { options } = useWorkerOptions();

    const [worker, setWorker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [portfolio, setPortfolio] = useState({ items: [], loading: true });

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`/workers/${id}`)
            .then(({ data }) => {
                if (cancelled) return;
                setWorker(data.worker);
                setError("");
                return axiosInstance
                    .get(`/workers/portfolio/user/${data.worker.userId}`)
                    .then((response) => !cancelled && setPortfolio({ items: response.data.items || [], loading: false }))
                    .catch(() => !cancelled && setPortfolio({ items: [], loading: false }));
            })
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("workersApp.details.error", "Unable to load this worker.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [id, t]);

    // Scroll to the trade the visitor clicked in the list.
    useEffect(() => {
        if (!worker || !focusOffer) return;
        const element = document.getElementById(`offer-${focusOffer}`);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [worker, focusOffer]);

    if (loading) {
        return (
            <DetailsContainer>
                <Stack sx={{ alignItems: "center", py: 10 }}>
                    <CircularProgress />
                </Stack>
            </DetailsContainer>
        );
    }

    if (error || !worker) {
        return (
            <DetailsContainer>
                <DetailsBackButton onClick={() => goBack()} label={t("workersApp.details.back", "Back")} />
                <Alert severity="error">{error || t("workersApp.details.notFound", "Worker not found.")}</Alert>
            </DetailsContainer>
        );
    }

    const badge = availabilityBadge(t, worker.availability, lang);
    const name = fullName(worker);
    // The offer the visitor came for first, then the others.
    const offers = [...worker.offers].sort((a, b) => (a.id === focusOffer ? -1 : b.id === focusOffer ? 1 : 0));

    const facts = [
        { icon: <PlaceOutlinedIcon />, label: t("workersApp.details.base", "Lives in"), value: cityName(worker.baseCity, lang) },
        { icon: <PlaceOutlinedIcon />, label: t("workersApp.details.worksIn", "Works in"), value: coverageText(t, worker, lang, 8) },
        { icon: <CalendarMonthOutlinedIcon />, label: t("workersApp.details.days", "Working days"), value: daysText(t, worker.workDays) },
        { icon: <ScheduleOutlinedIcon />, label: t("workersApp.details.hours", "Hours"), value: hoursText(worker.hours) },
        { icon: <FreeBreakfastOutlinedIcon />, label: t("workersApp.details.break", "Lunch break"), value: worker.hasBreak ? hoursText(worker.break) : "" },
        { icon: <TranslateOutlinedIcon />, label: t("workersApp.details.languages", "Languages"), value: worker.languages.map((value) => languageLabel(t, value)).join(", ") },
        {
            icon: <GroupsOutlinedIcon />,
            label: t("workersApp.details.team", "Works"),
            value: worker.teamMode === "team" ? t("workersApp.card.team", "Team of {{count}}", { count: worker.teamSize }) : t("workersApp.details.alone", "Alone"),
        },
    ];

    const extras = [
        worker.hasTools && { icon: <HandymanOutlinedIcon />, label: t("workersApp.details.hasTools", "Has his own tools") },
        worker.hasVehicle && { icon: <LocalShippingOutlinedIcon />, label: t("workersApp.details.hasVehicle", "Has a vehicle") },
        worker.acceptsUrgent && { icon: <BoltRoundedIcon />, label: t("workersApp.details.urgent", "Accepts urgent jobs") },
        worker.worksAtNight && { icon: <BedtimeOutlinedIcon />, label: t("workersApp.details.night", "Works at night") },
    ].filter(Boolean);

    const main = (
        <>
            <DetailsSection>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
                    <WorkerAvatar src={worker.profileImage} gender={worker.gender} name={name} size={104} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", md: "2rem" } }}>
                                {name}
                            </Typography>
                            <Chip label={badge.label} color={badge.tone} size="small" sx={{ fontWeight: 700 }} />
                            {worker.status === "hidden" && <Chip label={t("workersApp.details.hidden", "Hidden")} size="small" />}
                        </Stack>
                        <Typography variant="body1" sx={{ color: "text.secondary", mt: 0.5 }}>
                            {offers.map((offer) => tradeName(options, offer, lang)).join(" · ")}
                        </Typography>
                        {extras.length > 0 && (
                            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 1.25 }}>
                                {extras.map((extra) => (
                                    <Chip key={extra.label} icon={extra.icon} label={extra.label} size="small" variant="outlined" />
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Stack>
                {worker.bio && (
                    <Box sx={{ mt: 2.5 }}>
                        <DescriptionText>{worker.bio}</DescriptionText>
                    </Box>
                )}
            </DetailsSection>

            <DetailsSection title={t("workersApp.details.when", "Where & when")} icon={<CalendarMonthOutlinedIcon />}>
                <FactGrid items={facts} minWidth={180} />
            </DetailsSection>

            {worker.hasWorkplace && worker.workplace && (
                <DetailsSection
                    title={worker.workplace.name || workplaceLabel(t, worker.workplace.kind)}
                    subtitle={[workplaceLabel(t, worker.workplace.kind), worker.workplace.address].filter(Boolean).join(" · ")}
                    icon={<StorefrontOutlinedIcon />}
                >
                    {worker.workplace.images?.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                            <MediaGallery images={worker.workplace.images.map((image) => getImageUrl(image.path))} alt={worker.workplace.name || workplaceLabel(t, worker.workplace.kind)} />
                        </Box>
                    )}
                    {worker.workplace.location && (
                        <Box
                            component="iframe"
                            title={worker.workplace.name || workplaceLabel(t, worker.workplace.kind)}
                            src={buildEmbedUrl({ point: worker.workplace.location, zoom: 16 })}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            sx={{ width: "100%", height: { xs: 220, md: 280 }, border: 0, borderRadius: 3, display: "block", mb: 1.5, bgcolor: "#EEF2F7" }}
                        />
                    )}
                    {worker.workplace.mapLink && (
                        <MapLinkButton href={worker.workplace.mapLink} label={t("workersApp.details.openMap", "Open in Google Maps")} />
                    )}
                </DetailsSection>
            )}

            <DetailsSection
                title={t("workersApp.details.offers", "Trades & prices")}
                subtitle={t("workersApp.details.offersCount", "{{count}} trades", { count: offers.length })}
                icon={<EngineeringOutlinedIcon />}
            >
                <Stack spacing={2} divider={<Divider flexItem />}>
                    {offers.map((offer) => (
                        <WorkerOfferDetails key={offer.id} offer={offer} options={options} highlighted={offer.id === focusOffer} />
                    ))}
                </Stack>
            </DetailsSection>

            <DetailsSection
                title={t("workersApp.details.portfolio", "Work & videos")}
                subtitle={t("workersApp.details.portfolioHint", "Photos of finished jobs and videos published by the worker.")}
                icon={<PhotoLibraryOutlinedIcon />}
            >
                {!portfolio.loading && portfolio.items.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {t("workersApp.details.portfolioEmpty", "No photos or videos yet.")}
                    </Typography>
                ) : (
                    <PortfolioSection api="/workers/portfolio" items={portfolio.items} loading={portfolio.loading} />
                )}
            </DetailsSection>
        </>
    );

    const sidebar = (
        <>
            <SidebarCard>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                    {t("workersApp.details.contact", "Contact the worker")}
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                    <ContactButtons contact={worker.contact} t={t} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2, color: "text.secondary", alignItems: "flex-start" }}>
                    <InfoOutlinedIcon sx={{ fontSize: 18, mt: 0.25 }} />
                    <Typography variant="caption">
                        {t("workersApp.details.safety", "Agree on the price, the deposit and the work before starting. Never pay the full amount in advance.")}
                    </Typography>
                </Stack>
            </SidebarCard>
            {worker.isOwner && (
                <SidebarCard>
                    <Stack spacing={1}>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => navigate("/daily-worker/publish")}>
                            {t("workersApp.details.edit", "Edit my profile")}
                        </Button>
                        <Button onClick={() => navigate("/daily-worker/me")}>{t("workersApp.details.manage", "Manage availability & portfolio")}</Button>
                    </Stack>
                </SidebarCard>
            )}
        </>
    );

    return (
        <DetailsContainer withMobileBar>
            <DetailsBackButton onClick={() => goBack()} label={t("workersApp.details.back", "Back")} />
            <DetailsLayout main={main} sidebar={sidebar} />
            <MobileActionBar>
                <ContactButtons contact={worker.contact} t={t} compact />
            </MobileActionBar>
        </DetailsContainer>
    );
}
