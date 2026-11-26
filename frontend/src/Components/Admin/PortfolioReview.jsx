// src/Components/Admin/PortfolioReview.jsx
//
// Admin panel: "Portfolio Reviews" of a service. Lists the articles and
// YouTube videos users publish on their profiles, newest first, by period
// and type, so inappropriate ones can be opened and deleted.
// Same idea as "Publication Reviews". One page per service:
//   <PortfolioReview service="property" api="/property/dashboard/portfolio" section="propertyPublications" profilePath={...} />
//   <PortfolioReview service="vehicles" api="/vehicles/admin/portfolio" section="vehiclePublications" profilePath={...} />

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import axiosInstance from "../../api/axiosInstance";
import { pagePaddingSx } from "../ui/PageContainer";
import PageHeader from "../ui/PageHeader";
import { FilterChips, FilterSelect } from "../ui/FilterKit";
import { useAdminAccess } from "./adminSections";
import { PortfolioCard, PortfolioGrid } from "../Profile/Portfolio/PortfolioSection";
import PortfolioViewer from "../Profile/Portfolio/PortfolioViewer";

const PERIODS = ["today", "week", "month", "year", "all"];
const TYPES = [
    { value: "all", icon: <AppsRoundedIcon fontSize="small" /> },
    { value: "article", icon: <ArticleOutlinedIcon fontSize="small" /> },
    { value: "video", icon: <YouTubeIcon fontSize="small" /> },
];

export default function PortfolioReview({ service, api, section, profilePath }) {
    const { t } = useTranslation();
    const title =
        service === "vehicles"
            ? t("portfolioReview.vehiclesTitle", "Vehicle Portfolio Reviews")
            : t("portfolioReview.propertyTitle", "Property Portfolio Reviews");
    const subtitle = t("portfolioReview.subtitle", "Articles and YouTube videos users publish on their profiles. Open them and delete the inappropriate ones.");
    const navigate = useNavigate();
    const canDelete = useAdminAccess().can(section, "write");

    const [period, setPeriod] = useState("week");
    const [type, setType] = useState("all");
    const [items, setItems] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [viewing, setViewing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");

    const reload = (apply) => {
        setLoading(true);
        setError("");
        apply();
    };

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(api, { params: { period, type } })
            .then(({ data }) => {
                if (cancelled) return;
                setItems(data.items || []);
                setCounts(data.counts || {});
            })
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("portfolioReview.loadError", "Unable to load the portfolio items.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [api, period, type, reloadKey, t]);

    const confirmDelete = async () => {
        setBusy(true);
        try {
            await axiosInstance.delete(`${api}/${deleting.id}`);
            setItems((previous) => previous.filter((item) => item.id !== deleting.id));
            setCounts((previous) => ({
                ...previous,
                [deleting.type]: Math.max(0, (previous[deleting.type] || 0) - 1),
                all: Math.max(0, (previous.all || 0) - 1),
            }));
            setNotice(t("portfolioReview.deleted", "Deleted. The user's profile no longer shows it."));
            setDeleting(null);
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("portfolioReview.deleteError", "Unable to delete this item."));
            setDeleting(null);
        } finally {
            setBusy(false);
        }
    };

    const ownerName = (owner) => [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || owner?.email || t("portfolioReview.unknownUser", "Deleted account");

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<AutoStoriesOutlinedIcon />}
                title={title}
                subtitle={subtitle}
                action={
                    <Box sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                        <FilterSelect
                            label={t("adminPublications.dateRange", "Date range")}
                            value={period}
                            onChange={(value) => reload(() => setPeriod(value))}
                            startIcon={<CalendarMonth fontSize="small" />}
                            options={PERIODS.map((value) => ({ value, label: t(`adminPublications.periods.${value}`) }))}
                        />
                    </Box>
                }
            />

            <Box
                sx={(theme) => ({
                    p: { xs: 1.5, sm: 2 },
                    mb: 3,
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: "14px",
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    display: "flex",
                    alignItems: { xs: "stretch", md: "center" },
                    flexDirection: { xs: "column", md: "row" },
                    justifyContent: "space-between",
                    gap: 2,
                })}
            >
                <FilterChips
                    label={t("adminPublications.typeLabel", "Type")}
                    value={type}
                    onChange={(value) => reload(() => setType(value))}
                    options={TYPES.map((option) => ({
                        value: option.value,
                        label: t(`portfolioReview.types.${option.value}`, option.value),
                        count: loading && counts[option.value] === undefined ? undefined : counts[option.value] ?? 0,
                        icon: option.icon,
                    }))}
                />
                <Stack sx={{ alignItems: { xs: "flex-start", md: "flex-end" }, flexShrink: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
                        {loading ? "—" : counts[type] ?? items.length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
                        {t("portfolioReview.count", "Items")} · {t(`adminPublications.periods.${period}`)}
                    </Typography>
                </Stack>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => reload(() => setReloadKey((key) => key + 1))}>{t("adminPublications.retry", "Retry")}</Button>}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : !items.length ? (
                <Box sx={{ textAlign: "center", py: 8, border: "1px dashed", borderColor: "divider", borderRadius: 3 }}>
                    <AutoStoriesOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                    <Typography sx={{ fontWeight: 700 }}>{t("portfolioReview.empty", "Nothing published in this period")}</Typography>
                </Box>
            ) : (
                <PortfolioGrid>
                    {items.map((item) => (
                        <Stack key={item.id} spacing={1}>
                            <PortfolioCard item={item} onOpen={setViewing} />
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 0.5 }}>
                                <Avatar src={item.owner?.profileImage || undefined} sx={{ width: 28, height: 28, fontSize: 13 }}>
                                    {ownerName(item.owner).charAt(0)}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                        {ownerName(item.owner)}
                                    </Typography>
                                    {item.owner?.email && (
                                        <Typography variant="caption" noWrap sx={{ color: "text.secondary", display: "block" }}>
                                            {item.owner.email}
                                        </Typography>
                                    )}
                                </Box>
                                {item.owner?.id && (
                                    <Button size="small" startIcon={<PersonOutlineRoundedIcon />} onClick={() => navigate(profilePath(item.owner.id))} sx={{ textTransform: "none" }}>
                                        {t("portfolioReview.profile", "Profile")}
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleting(item)} sx={{ textTransform: "none" }}>
                                        {t("portfolio.delete", "Delete")}
                                    </Button>
                                )}
                            </Stack>
                        </Stack>
                    ))}
                </PortfolioGrid>
            )}

            <PortfolioViewer item={viewing} onClose={() => setViewing(null)} />

            <Dialog open={Boolean(deleting)} onClose={busy ? undefined : () => setDeleting(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>{t("portfolioReview.deleteTitle", "Delete this item?")}</DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{deleting?.title}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                        {t("portfolioReview.deleteHelp", "It is removed from {{name}}'s profile, with its photos. This cannot be undone.", { name: ownerName(deleting?.owner) })}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleting(null)} disabled={busy} sx={{ textTransform: "none" }}>
                        {t("portfolio.cancel", "Cancel")}
                    </Button>
                    <Button color="error" variant="contained" onClick={confirmDelete} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null} sx={{ textTransform: "none", fontWeight: 700 }}>
                        {t("portfolio.delete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} message={notice} />
        </Box>
    );
}
