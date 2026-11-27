// src/Apps/DailyWorker/Form/WorkerProfileForm.jsx
//
// /daily-worker/publish — publish or edit MY worker profile (one per user):
// who I am, where and when I work, and up to 5 trade offers.
// The photo is the account photo (or the default one); work photos go in
// the portfolio of "My worker profile".

import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControlLabel,
    Snackbar,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import getImageUrl from "../../../utils/getImageUrl";

import axiosInstance from "../../../api/axiosInstance";
import moroccanCities from "../../../data/moroccanCities";
import { useGoBack, useReturnAfterSave } from "../../../Components/navigation/navHistory";
import {
    ChoiceChips,
    FieldGroupTitle,
    FormGrid,
    FormPage,
    FormPageHeader,
    FormSection,
    FormSubmitBar,
    FullRow,
    ImagePreviewGrid,
    UploadDropzone,
} from "../../../Components/ui/FormKit";
import WorkerAvatar from "../Components/WorkerAvatar";
import TradeOfferEditor from "./TradeOfferEditor";
import { emptyOffer, offerToBody, offerToForm } from "./offerForm";
import { langOf, useWorkerOptions } from "../workerOptions";
import { dayLabel, languageLabel, workplaceLabel } from "../workerFormat";
import MapLinkAdornment from "../../../Components/MapPicker/MapLinkAdornment";
import { joinHint } from "../../../Components/MapPicker/mapLinkUtils";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const initialForm = (prefill = {}) => ({
    firstName: prefill.firstName || "",
    lastName: prefill.lastName || "",
    gender: "",
    bio: "",
    hasWorkplace: false,
    workplace: { kind: "workshop", name: "", address: "", mapLink: "" },
    baseCity: "",
    coverage: "cities",
    cities: [],
    workDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
    hoursStart: "08:00",
    hoursEnd: "18:00",
    hasBreak: false,
    breakStart: "12:30",
    breakEnd: "14:00",
    worksAtNight: false,
    languages: ["ar"],
    teamMode: "alone",
    teamSize: "",
    hasTools: true,
    hasVehicle: false,
    acceptsUrgent: false,
    contactPreference: "both",
    offers: [emptyOffer()],
});

const profileToForm = (profile) => ({
    firstName: profile.firstName,
    lastName: profile.lastName,
    gender: profile.gender || "",
    bio: profile.bio || "",
    hasWorkplace: Boolean(profile.hasWorkplace),
    workplace: {
        kind: profile.workplace?.kind || "workshop",
        name: profile.workplace?.name || "",
        address: profile.workplace?.address || "",
        mapLink: profile.workplace?.mapLink || "",
    },
    baseCity: profile.baseCity,
    coverage: profile.coverage,
    // The base city is always included: the picker shows the others.
    cities: (profile.cities || []).filter((city) => city !== profile.baseCity),
    workDays: profile.workDays || [],
    hoursStart: profile.hours?.start || "08:00",
    hoursEnd: profile.hours?.end || "18:00",
    hasBreak: Boolean(profile.hasBreak),
    breakStart: profile.break?.start || "12:30",
    breakEnd: profile.break?.end || "14:00",
    worksAtNight: Boolean(profile.worksAtNight),
    languages: profile.languages || [],
    teamMode: profile.teamMode,
    teamSize: profile.teamMode === "team" ? String(profile.teamSize || "") : "",
    hasTools: profile.hasTools,
    hasVehicle: profile.hasVehicle,
    acceptsUrgent: profile.acceptsUrgent,
    contactPreference: profile.contactPreference,
    offers: profile.offers.length ? profile.offers.map(offerToForm) : [emptyOffer()],
});

export default function WorkerProfileForm() {
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const navigate = useNavigate();
    const { options, loading: optionsLoading, error: optionsError } = useWorkerOptions();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [profileId, setProfileId] = useState("");
    const [form, setForm] = useState(initialForm());
    const [account, setAccount] = useState({ profileImage: "", contact: null });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    // Workplace photos: { key, src, filename } (already saved) or { key, src, file } (new).
    const [placeImages, setPlaceImages] = useState([]);
    const placeInputRef = useRef(null);

    const isEdit = Boolean(profileId);
    const goBack = useGoBack("/daily-worker/me");
    const returnAfterSave = useReturnAfterSave();

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/workers/me")
            .then(({ data }) => {
                if (cancelled) return;
                setAccount({ profileImage: data.prefill?.profileImage || "", contact: data.contact });
                if (data.profile) {
                    setProfileId(data.profile.id);
                    setForm(profileToForm(data.profile));
                    setPlaceImages(
                        (data.profile.workplace?.images || []).map((image) => ({ key: image.filename, src: getImageUrl(image.path), filename: image.filename }))
                    );
                } else {
                    setForm(initialForm(data.prefill));
                }
            })
            .catch((error) => !cancelled && setLoadError(error.response?.data?.message || t("workersApp.form.loadError", "Unable to load your worker profile.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [t]);

    const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
    const maxPlaceImages = options?.workplaceMaxImages || 4;
    const addPlaceFiles = (fileList) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        const files = [...(fileList || [])].filter((file) => allowed.includes(file.type) && file.size <= 5 * 1024 * 1024);
        if (files.length < (fileList?.length || 0)) setToast({ severity: "warning", message: t("workersApp.form.photoRejected", "Some photos were skipped: JPG, PNG or WEBP up to 5 MB.") });
        setPlaceImages((current) => [
            ...current,
            ...files.slice(0, Math.max(0, maxPlaceImages - current.length)).map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, src: URL.createObjectURL(file), file })),
        ]);
    };
    // ImagePreviewGrid gives the index of the photo.
    const removePlaceImage = (index) =>
        setPlaceImages((current) => {
            const removed = current[index];
            if (removed?.file) URL.revokeObjectURL(removed.src);
            return current.filter((_, position) => position !== index);
        });
    const setPlace = (field, value) => setForm((current) => ({ ...current, workplace: { ...current.workplace, [field]: value } }));
    const limits = options?.limits || { offers: 5, cities: 20 };
    const usedTrades = form.offers.map((offer) => offer.trade).filter(Boolean);
    const cityOf = (name) => moroccanCities.find((city) => city.en === name) || null;
    const cityLabel = (option) => (lang === "ar" ? option.ar || option.en : option.en);
    const otherCities = useMemo(() => moroccanCities.filter((city) => city.en !== form.baseCity), [form.baseCity]);

    const updateOffer = (index, offer) => setForm((current) => ({ ...current, offers: current.offers.map((item, position) => (position === index ? offer : item)) }));
    const removeOffer = (index) => setForm((current) => ({ ...current, offers: current.offers.filter((_, position) => position !== index) }));
    const addOffer = () => setForm((current) => (current.offers.length >= limits.offers ? current : { ...current, offers: [...current.offers, emptyOffer()] }));

    const fieldError = (field) => errors[field] || "";

    const submit = async (event) => {
        event?.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const body = {
                firstName: form.firstName,
                lastName: form.lastName,
                gender: form.gender,
                bio: form.bio,
                hasWorkplace: form.hasWorkplace,
                workplace: form.hasWorkplace
                    ? { ...form.workplace, keepImages: placeImages.filter((image) => image.filename).map((image) => image.filename) }
                    : undefined,
                baseCity: form.baseCity,
                coverage: form.coverage,
                cities: form.cities,
                workDays: form.workDays,
                hours: { start: form.hoursStart, end: form.hoursEnd },
                hasBreak: form.hasBreak,
                break: form.hasBreak ? { start: form.breakStart, end: form.breakEnd } : undefined,
                worksAtNight: form.worksAtNight,
                languages: form.languages,
                teamMode: form.teamMode,
                teamSize: form.teamSize,
                hasTools: form.hasTools,
                hasVehicle: form.hasVehicle,
                acceptsUrgent: form.acceptsUrgent,
                contactPreference: form.contactPreference,
                offers: form.offers.map(offerToBody),
            };
            // multipart: the form as JSON + the new photos of the workplace.
            const payload = new FormData();
            payload.append("data", JSON.stringify(body));
            if (form.hasWorkplace) placeImages.filter((image) => image.file).forEach((image) => payload.append("workplaceImages", image.file));
            const { data } = await axiosInstance.put("/workers/me", payload);
            if (isEdit) {
                setToast({ severity: "success", message: data.message || t("workersApp.form.saved", "Your changes are saved.") });
                // Back from the profile page returns to where "Edit" was clicked.
                setTimeout(() => returnAfterSave([`/daily-worker/${data.profile.id}`, "/daily-worker/me"], { updated: true }), 700);
            } else {
                navigate("/daily-worker/me", { replace: true, state: { published: true } });
            }
        } catch (error) {
            const response = error.response?.data || {};
            setErrors(response.errors || {});
            setToast({ severity: "error", message: response.message || t("workersApp.form.saveError", "Unable to save your worker profile.") });
            // Show the first field with a problem.
            setTimeout(() => document.querySelector(".Mui-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        } finally {
            setSaving(false);
        }
    };

    if (loading || optionsLoading) {
        return (
            <FormPage>
                <Stack sx={{ alignItems: "center", py: 10 }}>
                    <CircularProgress />
                </Stack>
            </FormPage>
        );
    }

    if (loadError || optionsError) {
        return (
            <FormPage>
                <Alert severity="error">{loadError || t("workersApp.form.optionsError", "Unable to load the list of trades.")}</Alert>
            </FormPage>
        );
    }

    const canPublish = account.contact?.canPublish !== false;

    return (
        <FormPage>
            <FormPageHeader
                icon={isEdit ? <EditNoteRoundedIcon /> : <EngineeringOutlinedIcon />}
                badge={isEdit ? t("workersApp.form.editBadge", "Edit") : t("workersApp.form.badge", "Daily worker")}
                title={isEdit ? t("workersApp.form.editTitle", "Edit your worker profile") : t("workersApp.form.title", "Publish your worker profile")}
                subtitle={t(
                    "workersApp.form.subtitle",
                    "One profile, up to {{count}} trades. Clients find you by trade and city, then call you or write on WhatsApp.",
                    { count: limits.offers }
                )}
            />

            {!canPublish && (
                <Alert
                    severity="warning"
                    sx={{ mb: 3, borderRadius: 3 }}
                    action={
                        <Button color="inherit" size="small" component={RouterLink} to="/setting">
                            {t("workersApp.form.openSettings", "Settings")}
                        </Button>
                    }
                >
                    {t("workersApp.form.verifyContact", "Verify your phone or WhatsApp number in Settings before publishing: clients need a way to reach you.")}
                </Alert>
            )}

            <Box component="form" onSubmit={submit} noValidate sx={{ display: "grid", gap: { xs: 2.5, md: 3 } }}>
                {/* 1. Who */}
                <FormSection number={1} icon={<BadgeOutlinedIcon />} title={t("workersApp.form.whoTitle", "About you")} subtitle={t("workersApp.form.whoSubtitle", "Your name and a few words for clients.")}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2.5 }}>
                        <WorkerAvatar src={account.profileImage} gender={form.gender} size={64} />
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {account.profileImage
                                ? t("workersApp.form.photoHint", "Your account photo is shown on your profile.")
                                : t("workersApp.form.photoDefault", "No photo yet: a default picture is shown.")}{" "}
                            <Box component={RouterLink} to="/setting" sx={{ color: "primary.main", fontWeight: 700 }}>
                                {t("workersApp.form.changePhoto", "Change it in Settings")}
                            </Box>
                            <br />
                            {t("workersApp.form.portfolioHint", "Photos of your work go in your portfolio, after publishing.")}
                        </Typography>
                    </Stack>
                    <Box sx={{ mb: 2.5 }}>
                        <FieldGroupTitle>{t("workersApp.form.gender", "You are")} *</FieldGroupTitle>
                        <ChoiceChips
                            options={[
                                { value: "male", label: t("workersApp.gender.male", "Man") },
                                { value: "female", label: t("workersApp.gender.female", "Woman") },
                            ]}
                            value={form.gender}
                            onChange={(value) => set("gender", value)}
                        />
                        {fieldError("gender") && <Typography variant="caption" color="error" className="Mui-error">{fieldError("gender")}</Typography>}
                    </Box>
                    <FormGrid columns={2}>
                        <TextField required label={t("workersApp.form.firstName", "First name")} value={form.firstName} onChange={(event) => set("firstName", event.target.value)} error={Boolean(fieldError("firstName"))} helperText={fieldError("firstName")} slotProps={{ htmlInput: { maxLength: 50 } }} />
                        <TextField required label={t("workersApp.form.lastName", "Last name")} value={form.lastName} onChange={(event) => set("lastName", event.target.value)} error={Boolean(fieldError("lastName"))} helperText={fieldError("lastName")} slotProps={{ htmlInput: { maxLength: 50 } }} />
                        <FullRow>
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label={t("workersApp.form.bio", "Short presentation (optional)")}
                                placeholder={t("workersApp.form.bioPlaceholder", "e.g. Serious and on time, I have worked in Agadir and nearby for 10 years.")}
                                value={form.bio}
                                onChange={(event) => set("bio", event.target.value)}
                                error={Boolean(fieldError("bio"))}
                                helperText={fieldError("bio") || `${form.bio.length} / 1000`}
                                slotProps={{ htmlInput: { maxLength: 1000 } }}
                            />
                        </FullRow>
                    </FormGrid>
                </FormSection>

                {/* 2. Where */}
                <FormSection number={2} icon={<PlaceOutlinedIcon />} title={t("workersApp.form.whereTitle", "Where you work")} subtitle={t("workersApp.form.whereSubtitle", "Your city, and the cities where you accept jobs.")}>
                    <FormGrid columns={2}>
                        <Autocomplete
                            options={moroccanCities}
                            value={cityOf(form.baseCity)}
                            onChange={(_, option) => setForm((current) => ({ ...current, baseCity: option?.en || "", cities: current.cities.filter((city) => city !== option?.en) }))}
                            getOptionLabel={cityLabel}
                            isOptionEqualToValue={(option, value) => option.en === value.en}
                            renderInput={(props) => <TextField {...props} required label={t("workersApp.form.baseCity", "City where you live")} error={Boolean(fieldError("baseCity"))} helperText={fieldError("baseCity")} />}
                        />
                        <Box>
                            <ChoiceChips
                                options={[
                                    { value: "cities", label: t("workersApp.form.coverageCities", "Chosen cities") },
                                    { value: "morocco", label: t("workersApp.coverage.morocco", "All of Morocco") },
                                ]}
                                value={form.coverage}
                                onChange={(value) => set("coverage", value)}
                            />
                        </Box>
                        {form.coverage === "cities" && (
                            <FullRow>
                                <Autocomplete
                                    multiple
                                    options={otherCities}
                                    value={form.cities.map(cityOf).filter(Boolean)}
                                    onChange={(_, values) => set("cities", values.slice(0, limits.cities - 1).map((city) => city.en))}
                                    getOptionLabel={cityLabel}
                                    isOptionEqualToValue={(option, value) => option.en === value.en}
                                    renderValue={(values, getItemProps) =>
                                        values.map((option, index) => {
                                            const { key, ...itemProps } = getItemProps({ index });
                                            return <Chip key={key} label={cityLabel(option)} size="small" {...itemProps} />;
                                        })
                                    }
                                    renderInput={(props) => (
                                        <TextField
                                            {...props}
                                            label={t("workersApp.form.otherCities", "Other cities where you work (optional)")}
                                            error={Boolean(fieldError("cities"))}
                                            helperText={fieldError("cities") || t("workersApp.form.citiesHelp", "Up to {{count}} cities, your city included.", { count: limits.cities })}
                                        />
                                    )}
                                />
                            </FullRow>
                        )}
                        <FullRow>
                            <FormControlLabel
                                control={<Switch checked={form.hasWorkplace} onChange={(event) => set("hasWorkplace", event.target.checked)} />}
                                label={t("workersApp.form.hasWorkplace", "I have a workshop, a shop or a garage where clients can come")}
                            />
                        </FullRow>
                        {form.hasWorkplace && (
                            <FullRow>
                                <Stack spacing={2} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "#FBFCFE" }}>
                                    <ChoiceChips
                                        options={["workshop", "shop", "garage"].map((value) => ({ value, label: workplaceLabel(t, value) }))}
                                        value={form.workplace.kind}
                                        onChange={(value) => setPlace("kind", value)}
                                    />
                                    {fieldError("workplace.kind") && <Typography variant="caption" color="error">{fieldError("workplace.kind")}</Typography>}
                                    <FormGrid columns={2}>
                                        <TextField
                                            label={t("workersApp.form.workplaceName", "Name (optional)")}
                                            placeholder={t("workersApp.form.workplaceNamePlaceholder", "e.g. Garage Atlas")}
                                            value={form.workplace.name}
                                            onChange={(event) => setPlace("name", event.target.value)}
                                            error={Boolean(fieldError("workplace.name"))}
                                            helperText={fieldError("workplace.name")}
                                            slotProps={{ htmlInput: { maxLength: 80 } }}
                                        />
                                        <TextField
                                            label={t("workersApp.form.workplaceAddress", "Address (optional)")}
                                            placeholder={t("workersApp.form.workplaceAddressPlaceholder", "Street, neighborhood")}
                                            value={form.workplace.address}
                                            onChange={(event) => setPlace("address", event.target.value)}
                                            error={Boolean(fieldError("workplace.address"))}
                                            helperText={fieldError("workplace.address")}
                                            slotProps={{ htmlInput: { maxLength: 160 } }}
                                        />
                                        <FullRow>
                                            <TextField
                                                fullWidth
                                                required
                                                type="url"
                                                label={t("workersApp.form.workplaceMap", "Google Maps link of your place")}
                                                placeholder="https://maps.app.goo.gl/..."
                                                value={form.workplace.mapLink}
                                                onChange={(event) => setPlace("mapLink", event.target.value)}
                                                error={Boolean(fieldError("workplace.mapLink"))}
                                                helperText={fieldError("workplace.mapLink") || t("workersApp.form.workplaceMapHelp", "Pick it on the map, or in Google Maps: Share → Copy link.")}
                                                slotProps={{
                                                    input: {
                                                        endAdornment: (
                                                            <MapLinkAdornment
                                                                value={form.workplace.mapLink}
                                                                onChange={(link) => setPlace("mapLink", link)}
                                                                searchHint={joinHint(form.workplace.name, form.workplace.address, form.baseCity)}
                                                            />
                                                        ),
                                                    },
                                                }}
                                            />
                                        </FullRow>
                                    </FormGrid>
                                    <Box>
                                        <FieldGroupTitle>{t("workersApp.form.workplacePhotos", "Photos of your place (optional)")}</FieldGroupTitle>
                                        <input
                                            ref={placeInputRef}
                                            type="file"
                                            hidden
                                            multiple
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(event) => {
                                                addPlaceFiles(event.target.files);
                                                event.target.value = "";
                                            }}
                                        />
                                        {placeImages.length < maxPlaceImages && (
                                            <UploadDropzone
                                                icon={<AddPhotoAlternateOutlinedIcon />}
                                                title={t("workersApp.form.workplacePhotosTitle", "Add photos of your workshop, shop or garage")}
                                                hint={t("workersApp.form.workplacePhotosHint", "Up to {{max}} photos · JPG, PNG or WEBP · 5 MB max", { max: maxPlaceImages })}
                                                buttonLabel={t("workersApp.form.browse", "Choose photos")}
                                                onClick={() => placeInputRef.current?.click()}
                                            />
                                        )}
                                        {placeImages.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <ImagePreviewGrid
                                                    items={placeImages.map((image) => ({ key: image.key, src: image.src, alt: "" }))}
                                                    onRemove={removePlaceImage}
                                                    countLabel={`${placeImages.length} / ${maxPlaceImages}`}
                                                    mainLabel={t("workersApp.form.mainPhoto", "Main")}
                                                    removeLabel={t("workersApp.form.removePhoto", "Remove")}
                                                />
                                            </Box>
                                        )}
                                        {fieldError("workplace.images") && <Typography variant="caption" color="error" className="Mui-error">{fieldError("workplace.images")}</Typography>}
                                    </Box>
                                </Stack>
                            </FullRow>
                        )}
                    </FormGrid>
                </FormSection>

                {/* 3. When */}
                <FormSection number={3} icon={<ScheduleOutlinedIcon />} title={t("workersApp.form.whenTitle", "When you work")} subtitle={t("workersApp.form.whenSubtitle", "Your working days and hours.")}>
                    <FieldGroupTitle>{t("workersApp.form.days", "Working days")}</FieldGroupTitle>
                    <ChoiceChips multiple options={DAYS.map((day) => ({ value: day, label: dayLabel(t, day) }))} value={form.workDays} onChange={(value) => set("workDays", value)} />
                    {fieldError("workDays") && <Typography variant="caption" color="error">{fieldError("workDays")}</Typography>}
                    <FormGrid columns={2} sx={{ mt: 2.5 }}>
                        <TextField type="time" required label={t("workersApp.form.hoursStart", "From")} value={form.hoursStart} onChange={(event) => set("hoursStart", event.target.value)} error={Boolean(fieldError("hours"))} slotProps={{ inputLabel: { shrink: true } }} />
                        <TextField type="time" required label={t("workersApp.form.hoursEnd", "To")} value={form.hoursEnd} onChange={(event) => set("hoursEnd", event.target.value)} error={Boolean(fieldError("hours"))} helperText={fieldError("hours")} slotProps={{ inputLabel: { shrink: true } }} />
                        <FullRow>
                            <FormControlLabel
                                control={<Switch checked={form.hasBreak} onChange={(event) => set("hasBreak", event.target.checked)} />}
                                label={t("workersApp.form.hasBreak", "I take a lunch break")}
                            />
                        </FullRow>
                        {form.hasBreak && (
                            <TextField type="time" label={t("workersApp.form.breakStart", "Break from")} value={form.breakStart} onChange={(event) => set("breakStart", event.target.value)} error={Boolean(fieldError("break"))} slotProps={{ inputLabel: { shrink: true } }} />
                        )}
                        {form.hasBreak && (
                            <TextField type="time" label={t("workersApp.form.breakEnd", "Break to")} value={form.breakEnd} onChange={(event) => set("breakEnd", event.target.value)} error={Boolean(fieldError("break"))} helperText={fieldError("break")} slotProps={{ inputLabel: { shrink: true } }} />
                        )}
                        <FullRow>
                            <FormControlLabel
                                control={<Switch checked={form.worksAtNight} onChange={(event) => set("worksAtNight", event.target.checked)} />}
                                label={t("workersApp.form.worksAtNight", "I also work at night (night jobs, hours after midnight)")}
                            />
                        </FullRow>
                    </FormGrid>
                </FormSection>

                {/* 4. How */}
                <FormSection number={4} icon={<HandymanOutlinedIcon />} title={t("workersApp.form.howTitle", "How you work")} subtitle={t("workersApp.form.howSubtitle", "Languages, team, tools and how clients contact you.")}>
                    <Stack spacing={2.5}>
                        <Box>
                            <FieldGroupTitle>{t("workersApp.form.languages", "Languages you speak")}</FieldGroupTitle>
                            <ChoiceChips multiple options={["ar", "fr", "en"].map((value) => ({ value, label: languageLabel(t, value) }))} value={form.languages} onChange={(value) => set("languages", value)} />
                            {fieldError("languages") && <Typography variant="caption" color="error">{fieldError("languages")}</Typography>}
                        </Box>
                        <Box>
                            <FieldGroupTitle>{t("workersApp.form.team", "You work")}</FieldGroupTitle>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                                <ChoiceChips
                                    options={[
                                        { value: "alone", label: t("workersApp.details.alone", "Alone") },
                                        { value: "team", label: t("workersApp.form.withTeam", "With a team") },
                                    ]}
                                    value={form.teamMode}
                                    onChange={(value) => set("teamMode", value)}
                                />
                                {form.teamMode === "team" && (
                                    <TextField
                                        size="small"
                                        type="number"
                                        label={t("workersApp.form.teamSize", "People in the team")}
                                        value={form.teamSize}
                                        onChange={(event) => set("teamSize", event.target.value)}
                                        error={Boolean(fieldError("teamSize"))}
                                        helperText={fieldError("teamSize")}
                                        slotProps={{ htmlInput: { min: 2, max: 50 } }}
                                        sx={{ maxWidth: 220 }}
                                    />
                                )}
                            </Stack>
                        </Box>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0.5, md: 3 }}>
                            <FormControlLabel control={<Switch checked={form.hasTools} onChange={(event) => set("hasTools", event.target.checked)} />} label={t("workersApp.form.hasTools", "I have my own tools")} />
                            <FormControlLabel control={<Switch checked={form.hasVehicle} onChange={(event) => set("hasVehicle", event.target.checked)} />} label={t("workersApp.form.hasVehicle", "I have a vehicle")} />
                            <FormControlLabel control={<Switch checked={form.acceptsUrgent} onChange={(event) => set("acceptsUrgent", event.target.checked)} />} label={t("workersApp.form.urgent", "I accept urgent jobs")} />
                        </Stack>
                        <Box>
                            <FieldGroupTitle>{t("workersApp.form.contactPreference", "Clients can contact you by")}</FieldGroupTitle>
                            <ChoiceChips
                                options={[
                                    { value: "both", label: t("workersApp.form.contactBoth", "Call and WhatsApp") },
                                    { value: "call", label: t("workersApp.form.contactCall", "Call only") },
                                    { value: "whatsapp", label: t("workersApp.form.contactWhatsapp", "WhatsApp only") },
                                ]}
                                value={form.contactPreference}
                                onChange={(value) => set("contactPreference", value)}
                            />
                            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                                {t("workersApp.form.contactHint", "We show the numbers of your account: {{numbers}}.", {
                                    numbers: [account.contact?.phone, account.contact?.whatsappNumber].filter(Boolean).join(" · ") || t("workersApp.form.noNumber", "none yet"),
                                })}
                            </Typography>
                        </Box>
                    </Stack>
                </FormSection>

                {/* 5. Trades */}
                <FormSection
                    number={5}
                    icon={<WorkOutlineRoundedIcon />}
                    title={t("workersApp.form.tradesTitle", "Your trades and prices")}
                    subtitle={t("workersApp.form.tradesSubtitle", "One card per trade, up to {{count}}. Each one has its own price and conditions.", { count: limits.offers })}
                >
                    {fieldError("offers") && <Alert severity="error" sx={{ mb: 2 }}>{fieldError("offers")}</Alert>}
                    <Stack spacing={2}>
                        {form.offers.map((offer, index) => (
                            <TradeOfferEditor
                                key={offer.key}
                                index={index}
                                offer={offer}
                                options={options}
                                errors={errors}
                                usedTrades={usedTrades}
                                onChange={(next) => updateOffer(index, next)}
                                onRemove={() => removeOffer(index)}
                                canRemove={form.offers.length > 1}
                            />
                        ))}
                    </Stack>
                    <Button
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={addOffer}
                        disabled={form.offers.length >= limits.offers}
                        sx={{ mt: 2 }}
                    >
                        {form.offers.length >= limits.offers
                            ? t("workersApp.form.maxOffers", "Maximum {{count}} trades", { count: limits.offers })
                            : t("workersApp.form.addOffer", "Add another trade ({{count}} / {{max}})", { count: form.offers.length, max: limits.offers })}
                    </Button>
                </FormSection>

                <FormSubmitBar
                    loading={saving}
                    disabled={!canPublish}
                    title={isEdit ? t("workersApp.form.saveTitle", "Save your changes") : t("workersApp.form.publishTitle", "Ready to publish?")}
                    subtitle={isEdit ? t("workersApp.form.saveSubtitle", "Clients see the new details right away.") : t("workersApp.form.publishSubtitle", "You can change your profile or hide it at any time.")}
                    submitLabel={isEdit ? t("workersApp.form.save", "Save changes") : t("workersApp.form.publish", "Publish my profile")}
                    loadingLabel={t("workersApp.form.saving", "Saving...")}
                    submitIcon={<CheckCircleRoundedIcon />}
                    onCancel={isEdit ? () => goBack() : undefined}
                />
            </Box>

            <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                {toast ? (
                    <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
                        {toast.message}
                    </Alert>
                ) : (
                    <span />
                )}
            </Snackbar>
        </FormPage>
    );
}
