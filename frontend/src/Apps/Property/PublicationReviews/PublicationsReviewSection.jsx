// Admin: review everything users publish (properties, establishments and
// roommate announcements), filter by type and period, open or delete.

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Article, CalendarMonth } from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import PageHeader from "../../../Components/ui/PageHeader";
import { FilterChips, FilterSelect } from "../../../Components/ui/FilterKit";
import PublicationReviewCard from "./PublicationReviewCard";
import { KIND_META } from "./publicationKinds";

const PERIODS = ["today", "week", "month", "year", "all"];
const KINDS = ["all", "property", "establishment", "roommate"];

export default function PublicationsReviewSection() {
    const { t } = useTranslation();

    const [period, setPeriod] = useState("today");
    const [kind, setKind] = useState("all");
    const [publications, setPublications] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const fetchPublications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get("/property/dashboard/publications", {
                params: { period, type: kind },
            });

            setPublications(Array.isArray(response.data?.publications) ? response.data.publications : []);
            setCounts(response.data?.counts || {});
        } catch (err) {
            console.error("Failed to fetch publications:", err.response?.data || err.message);
            setError(err.response?.data?.message || t("adminPublications.errors.load"));
        } finally {
            setLoading(false);
        }
    }, [period, kind, t]);

    useEffect(() => {
        fetchPublications();
    }, [fetchPublications]);

    const handleDeleted = (id, deletedKind) => {
        setPublications((current) => current.filter((item) => (item._id || item.id) !== id));
        setCounts((current) => ({
            ...current,
            [deletedKind]: Math.max(0, (current[deletedKind] || 0) - 1),
            all: Math.max(0, (current.all || 0) - 1),
        }));
        setNotice(t("adminPublications.notifications.deleteSuccess"));
    };

    const total = counts[kind] ?? publications.length;

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<Article />}
                title={t("adminPublications.title")}
                subtitle={t("adminPublications.subtitle")}
                action={
                    <Box sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                        <FilterSelect
                            label={t("adminPublications.dateRange")}
                            value={period}
                            onChange={setPeriod}
                            startIcon={<CalendarMonth fontSize="small" />}
                            options={PERIODS.map((value) => ({
                                value,
                                label: t(`adminPublications.periods.${value}`),
                            }))}
                        />
                    </Box>
                }
            />

            {/* Type filter + count */}
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
                    label={t("adminPublications.typeLabel")}
                    value={kind}
                    onChange={setKind}
                    options={KINDS.map((value) => ({
                        value,
                        label: t(`adminPublications.kinds.${value}`),
                        count: loading && counts[value] === undefined ? undefined : counts[value] ?? 0,
                        icon: KIND_META[value]?.icon,
                    }))}
                />

                <Stack sx={{ alignItems: { xs: "flex-start", md: "flex-end" }, flexShrink: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                        {loading ? "—" : total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
                        {t("adminPublications.count")} · {t(`adminPublications.periods.${period}`)}
                    </Typography>
                </Stack>
            </Box>

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={fetchPublications}>
                            {t("adminPublications.retry", { defaultValue: "Retry" })}
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {!loading && !error && publications.length === 0 && (
                <Box
                    sx={{
                        py: 7,
                        px: 2,
                        textAlign: "center",
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: "16px",
                        bgcolor: "background.muted",
                    }}
                >
                    <Article sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("adminPublications.empty.title")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        {t("adminPublications.empty.description")}
                    </Typography>
                </Box>
            )}

            {!loading && !error && publications.length > 0 && (
                <Stack spacing={2.5}>
                    {publications.map((publication) => (
                        <PublicationReviewCard
                            key={`${publication.kind}-${publication._id || publication.id}`}
                            publication={publication}
                            onDeleted={handleDeleted}
                        />
                    ))}
                </Stack>
            )}

            <Snackbar
                open={Boolean(notice)}
                autoHideDuration={4000}
                onClose={() => setNotice("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert severity="success" variant="filled" onClose={() => setNotice("")}>
                    {notice}
                </Alert>
            </Snackbar>
        </Box>
    );
}
