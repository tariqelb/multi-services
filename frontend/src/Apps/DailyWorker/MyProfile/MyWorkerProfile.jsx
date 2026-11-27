// src/Apps/DailyWorker/MyProfile/MyWorkerProfile.jsx
//
// /daily-worker/me — my worker profile: availability (available / busy until),
// online or hidden, my trades, edit, delete, and my portfolio (photos of my
// work and YouTube videos, shown on my public page).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { useFlashState } from "../../../Components/navigation/navHistory";
import PortfolioSection from "../../../Components/Profile/Portfolio/PortfolioSection";
import WorkerAvatar from "../Components/WorkerAvatar";
import { langOf, tradeName, useWorkerOptions } from "../workerOptions";
import { availabilityBadge, coverageText, fullName, priceText } from "../workerFormat";

const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
};

function Panel({ children, sx }) {
    return (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderRadius: 4, ...sx }}>
            {children}
        </Paper>
    );
}

export default function MyWorkerProfile() {
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const navigate = useNavigate();
    const flash = useFlashState();
    const { options } = useWorkerOptions();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyUntil, setBusyUntil] = useState(tomorrow());
    const [working, setWorking] = useState("");
    const [notice, setNotice] = useState(
        flash?.published
            ? { severity: "success", message: t("workersApp.mine.published", "Your worker profile is published. Add photos of your work below.") }
            : flash?.updated
              ? { severity: "success", message: t("workersApp.form.saved", "Your changes are saved.") }
              : null
    );
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/workers/me")
            .then(({ data }) => !cancelled && setProfile(data.profile))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("workersApp.form.loadError", "Unable to load your worker profile.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [t]);

    const run = async (key, request, onDone) => {
        setWorking(key);
        try {
            const { data } = await request();
            onDone(data);
        } catch (requestError) {
            setNotice({ severity: "error", message: requestError.response?.data?.message || t("workersApp.mine.actionError", "Something went wrong. Try again.") });
        } finally {
            setWorking("");
        }
    };

    const setAvailability = (status) =>
        run(
            status,
            () => axiosInstance.patch("/workers/me/availability", status === "busy" ? { status, busyUntil } : { status }),
            (data) => {
                setProfile((current) => ({ ...current, availability: data.availability }));
                setNotice({ severity: "success", message: t("workersApp.mine.availabilitySaved", "Availability updated.") });
            }
        );

    const toggleVisibility = () =>
        run(
            "visibility",
            () => axiosInstance.patch("/workers/me/visibility", { status: profile.status === "hidden" ? "active" : "hidden" }),
            (data) => {
                setProfile((current) => ({ ...current, status: data.status }));
                setNotice({
                    severity: "success",
                    message: data.status === "hidden" ? t("workersApp.mine.hiddenNotice", "Your profile is hidden from clients.") : t("workersApp.mine.onlineNotice", "Your profile is online again."),
                });
            }
        );

    const deleteProfile = () =>
        run(
            "delete",
            () => axiosInstance.delete("/workers/me"),
            () => {
                setConfirmDelete(false);
                setProfile(null);
                setNotice({ severity: "success", message: t("workersApp.mine.deleted", "Your worker profile is deleted.") });
            }
        );

    if (loading) {
        return (
            <Box sx={pagePaddingSx}>
                <Stack sx={{ alignItems: "center", py: 10 }}>
                    <CircularProgress />
                </Stack>
            </Box>
        );
    }

    const header = (
        <PageHeader
            icon={<EngineeringOutlinedIcon />}
            title={t("workersApp.mine.title", "My worker profile")}
            subtitle={t("workersApp.mine.subtitle", "Your availability, your trades and the photos of your work.")}
        />
    );

    if (error) {
        return (
            <Box sx={pagePaddingSx}>
                {header}
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!profile) {
        return (
            <Box sx={pagePaddingSx}>
                {header}
                {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.message}</Alert>}
                <Panel sx={{ textAlign: "center", py: { xs: 5, md: 7 } }}>
                    <EngineeringOutlinedIcon sx={{ fontSize: 56, color: "primary.main" }} />
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 800 }}>
                        {t("workersApp.mine.emptyTitle", "You have no worker profile yet")}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", maxWidth: 520, mx: "auto", mt: 0.5 }}>
                        {t("workersApp.mine.emptyText", "Publish your trades, your cities and your prices, and let clients call you directly.")}
                    </Typography>
                    <Button variant="contained" size="large" sx={{ mt: 3 }} onClick={() => navigate("/daily-worker/publish")}>
                        {t("workersApp.fab.label", "Publish my profile")}
                    </Button>
                </Panel>
            </Box>
        );
    }

    const badge = availabilityBadge(t, profile.availability, lang);
    const hidden = profile.status === "hidden";

    return (
        <Box sx={pagePaddingSx}>
            {header}
            {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.message}</Alert>}
            {hidden && <Alert severity="warning" sx={{ mb: 2 }}>{t("workersApp.mine.hiddenBanner", "Your profile is hidden: clients cannot find it.")}</Alert>}

            <Box sx={{ display: "grid", gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 380px" }, alignItems: "start" }}>
                <Stack spacing={{ xs: 2, md: 3 }} sx={{ minWidth: 0 }}>
                    <Panel>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                            <WorkerAvatar src={profile.profileImage} gender={profile.gender} name={fullName(profile)} size={72} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {fullName(profile)}
                                    </Typography>
                                    <Chip label={badge.label} color={badge.tone} size="small" sx={{ fontWeight: 700 }} />
                                    <Chip
                                        icon={hidden ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                        label={hidden ? t("workersApp.details.hidden", "Hidden") : t("workersApp.mine.online", "Online")}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Stack>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    {coverageText(t, profile, lang, 5)} · {t("workersApp.mine.views", "{{count}} visits", { count: profile.views || 0 })}
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 2.5 }}>
                            <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={() => navigate("/daily-worker/publish")}>
                                {t("workersApp.details.edit", "Edit my profile")}
                            </Button>
                            <Button variant="outlined" startIcon={<OpenInNewRoundedIcon />} onClick={() => navigate(`/daily-worker/${profile.id}`)}>
                                {t("workersApp.mine.viewPublic", "See my public page")}
                            </Button>
                        </Stack>
                    </Panel>

                    <Panel>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                            {t("workersApp.details.offers", "Trades & prices")}
                        </Typography>
                        <Stack divider={<Divider flexItem />} spacing={1.25}>
                            {profile.offers.map((offer) => (
                                <Stack key={offer.id} direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "center" }}>
                                    <Typography sx={{ fontWeight: 700 }}>{tradeName(options, offer, lang)}</Typography>
                                    <Typography sx={{ color: "primary.main", fontWeight: 700, textAlign: "end" }}>{priceText(t, offer, lang)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Panel>

                    <Panel>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 0.5 }}>
                            <PhotoLibraryOutlinedIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {t("workersApp.details.portfolio", "Work & videos")}
                            </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                            {t("workersApp.mine.portfolioHint", "Show finished jobs: before / after photos, or a YouTube video. Clients trust what they can see.")}
                        </Typography>
                        <PortfolioSection api="/workers/portfolio" mine />
                    </Panel>
                </Stack>

                <Stack spacing={{ xs: 2, md: 3 }} sx={{ minWidth: 0, position: { lg: "sticky" }, top: { lg: 88 } }}>
                    <Panel>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {t("workersApp.mine.availabilityTitle", "Availability")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                            {t("workersApp.mine.availabilityHint", "Clients filter on \"Available now\". Tell them when you are busy.")}
                        </Typography>
                        <Stack spacing={1.25}>
                            <Button
                                variant={profile.availability?.availableNow ? "contained" : "outlined"}
                                color="success"
                                disabled={Boolean(working)}
                                onClick={() => setAvailability("available")}
                            >
                                {working === "available" ? <CircularProgress size={18} color="inherit" /> : t("workersApp.mine.setAvailable", "I am available")}
                            </Button>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    type="date"
                                    size="small"
                                    label={t("workersApp.mine.busyUntil", "Busy until")}
                                    value={busyUntil}
                                    onChange={(event) => setBusyUntil(event.target.value)}
                                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: tomorrow() } }}
                                    sx={{ flex: 1 }}
                                />
                                <Button variant="outlined" color="warning" disabled={Boolean(working) || !busyUntil} onClick={() => setAvailability("busy")}>
                                    {working === "busy" ? <CircularProgress size={18} color="inherit" /> : t("workersApp.mine.setBusy", "Set busy")}
                                </Button>
                            </Stack>
                        </Stack>
                    </Panel>

                    <Panel>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                            {t("workersApp.mine.manageTitle", "Profile")}
                        </Typography>
                        <Stack spacing={1}>
                            <Button
                                variant="outlined"
                                startIcon={hidden ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                                disabled={Boolean(working)}
                                onClick={toggleVisibility}
                            >
                                {hidden ? t("workersApp.mine.show", "Put my profile online") : t("workersApp.mine.hide", "Hide my profile")}
                            </Button>
                            <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} disabled={Boolean(working)} onClick={() => setConfirmDelete(true)}>
                                {t("workersApp.mine.delete", "Delete my worker profile")}
                            </Button>
                        </Stack>
                    </Panel>
                </Stack>
            </Box>

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                <DialogTitle>{t("workersApp.mine.deleteTitle", "Delete your worker profile?")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("workersApp.mine.deleteText", "Your trades and your portfolio (photos and videos) will be deleted. This cannot be undone.")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(false)}>{t("workersApp.mine.cancel", "Cancel")}</Button>
                    <Button color="error" variant="contained" onClick={deleteProfile} disabled={working === "delete"}>
                        {t("workersApp.mine.confirmDelete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
