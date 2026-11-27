// src/Apps/DailyWorker/Admin/WorkerPublicationsReview.jsx
//
// Admin › Daily worker › Publication Reviews: every worker profile (online or
// hidden), with its trades and cities. Delete removes the profile and its
// portfolio. Section "workerPublications" (read: see, write: delete).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterChips, FilterPanel, FilterSearch } from "../../../Components/ui/FilterKit";
import { useAdminAccess } from "../../../Components/Admin/adminSections";
import WorkerAvatar from "../Components/WorkerAvatar";
import { langOf, tradeName, useWorkerOptions } from "../workerOptions";
import { coverageText, formatDate, fullName, priceText } from "../workerFormat";

const PERIODS = ["today", "week", "month", "year", "all"];

export default function WorkerPublicationsReview() {
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const navigate = useNavigate();
    const { options } = useWorkerOptions();
    const canDelete = useAdminAccess().can("workerPublications", "write");

    const [period, setPeriod] = useState("all");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [data, setData] = useState({ items: [], counts: { all: 0, active: 0, hidden: 0 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/workers/admin/publications", { params: { period, q: query } })
            .then(({ data: response }) => {
                if (cancelled) return;
                setData(response);
                setError("");
            })
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("workersApp.admin.error", "Unable to load worker profiles.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [period, query, t]);

    const confirmDelete = async () => {
        if (!deleting) return;
        setBusy(true);
        try {
            await axiosInstance.delete(`/workers/admin/publications/${deleting.id}`);
            setData((current) => ({ ...current, items: current.items.filter((item) => item.id !== deleting.id) }));
            setDeleting(null);
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("workersApp.admin.deleteError", "Unable to delete this profile."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<EngineeringOutlinedIcon />}
                title={t("workersApp.admin.title", "Worker profiles")}
                subtitle={t("workersApp.admin.subtitle", "Review what daily workers publish and remove inappropriate profiles.")}
            />

            <FilterPanel title={t("workersApp.admin.filters", "Filters")}>
                <FilterChips
                    options={PERIODS.map((value) => ({ value, label: t(`workersApp.admin.periods.${value}`, { today: "Today", week: "7 days", month: "30 days", year: "12 months", all: "All" }[value]) }))}
                    value={period}
                    onChange={(value) => {
                        if (value === period) return;
                        setLoading(true);
                        setPeriod(value);
                    }}
                />
                <FilterSearch
                    value={search}
                    onChange={setSearch}
                    onSubmit={() => {
                        if (search.trim() === query) return;
                        setLoading(true);
                        setQuery(search.trim());
                    }}
                    placeholder={t("workersApp.admin.searchPlaceholder", "Name, trade, city…")}
                />
            </FilterPanel>

            <Stack direction="row" spacing={1} sx={{ my: 2.5 }}>
                <Chip label={t("workersApp.admin.countAll", "{{count}} profiles", { count: data.counts?.all || 0 })} />
                <Chip color="success" variant="outlined" label={t("workersApp.admin.countOnline", "{{count}} online", { count: data.counts?.active || 0 })} />
                <Chip variant="outlined" label={t("workersApp.admin.countHidden", "{{count}} hidden", { count: data.counts?.hidden || 0 })} />
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Stack sx={{ alignItems: "center", py: 8 }}>
                    <CircularProgress />
                </Stack>
            ) : data.items.length === 0 ? (
                <Typography sx={{ color: "text.secondary", py: 6, textAlign: "center" }}>{t("workersApp.admin.empty", "No worker profile in this period.")}</Typography>
            ) : (
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } }}>
                    {data.items.map((item) => (
                        <Card key={item.id} variant="outlined" sx={{ p: 2.25, borderRadius: 4 }}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <WorkerAvatar src={item.profileImage} gender={item.gender} size={52} />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <Typography sx={{ fontWeight: 800 }} noWrap>
                                            {fullName(item)}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={item.status === "hidden" ? t("workersApp.details.hidden", "Hidden") : t("workersApp.mine.online", "Online")}
                                            color={item.status === "hidden" ? "default" : "success"}
                                            variant="outlined"
                                        />
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap component="div">
                                        {item.owner?.email} · {t("workersApp.admin.updated", "Updated {{date}}", { date: formatDate(item.updatedAt, lang) })}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
                                {coverageText(t, item, lang, 4)}
                            </Typography>
                            <Stack spacing={0.5} sx={{ mt: 1.25 }}>
                                {item.offers.map((offer) => (
                                    <Stack key={offer.id} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {tradeName(options, offer, lang)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "primary.main" }}>
                                            {priceText(t, offer, lang)}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                            {item.bio && (
                                <Typography variant="body2" sx={{ mt: 1.25, whiteSpace: "pre-line" }}>
                                    {item.bio}
                                </Typography>
                            )}
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Button size="small" startIcon={<OpenInNewRoundedIcon />} onClick={() => navigate(`/daily-worker/${item.id}`)}>
                                    {t("workersApp.admin.open", "Open")}
                                </Button>
                                {canDelete && (
                                    <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleting(item)}>
                                        {t("workersApp.admin.delete", "Delete")}
                                    </Button>
                                )}
                            </Stack>
                        </Card>
                    ))}
                </Box>
            )}

            <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
                <DialogTitle>{t("workersApp.admin.deleteTitle", "Delete this worker profile?")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("workersApp.admin.deleteText", "The profile of {{name}} and its portfolio will be deleted. The account stays.", { name: fullName(deleting) })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleting(null)}>{t("workersApp.mine.cancel", "Cancel")}</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete} disabled={busy}>
                        {t("workersApp.admin.delete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
