// src/Apps/vehicles/Admin/VehiclePublicationsReview.jsx
//
// Vehicles admin panel: review everything users publish in the vehicles
// service (cars, motos & bikes, spare parts), filter by type and period,
// open or delete. Same page as the property "Publication Reviews".

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Article, CalendarMonth } from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import PageHeader from "../../../Components/ui/PageHeader";
import { FilterChips, FilterSelect } from "../../../Components/ui/FilterKit";
import VehiclePublicationReviewCard from "./VehiclePublicationReviewCard";
import { KIND_META } from "./vehiclePublicationKinds";

const PERIODS = ["today", "week", "month", "year", "all"];
const KINDS = ["all", "car", "moto", "part"];

export default function VehiclePublicationsReview() {
    const { t } = useTranslation();

    const [period, setPeriod] = useState("today");
    const [kind, setKind] = useState("all");
    const [publications, setPublications] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [reloadKey, setReloadKey] = useState(0);

    // Loading starts with the change (period, type, retry); the effect only fetches.
    const reload = (apply) => {
        setLoading(true);
        setError("");
        apply();
    };
    const changePeriod = (value) => reload(() => setPeriod(value));
    const changeKind = (value) => reload(() => setKind(value));
    const retry = () => reload(() => setReloadKey((key) => key + 1));

    useEffect(() => {
        let cancelled = false;

        axiosInstance
            .get("/vehicles/admin/publications", { params: { period, type: kind } })
            .then((response) => {
                if (cancelled) return;
                setPublications(Array.isArray(response.data?.publications) ? response.data.publications : []);
                setCounts(response.data?.counts || {});
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("Failed to fetch vehicle publications:", err.response?.data || err.message);
                setError(err.response?.data?.message || t("adminPublications.errors.load"));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [period, kind, reloadKey, t]);

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
                title={t("vehiclesApp.admin.title", "Vehicle Publication Reviews")}
                subtitle={t("vehiclesApp.admin.subtitle", "Review the cars, motos & bikes and spare parts published by users.")}
                action={
                    <Box sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                        <FilterSelect
                            label={t("adminPublications.dateRange")}
                            value={period}
                            onChange={changePeriod}
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
                    onChange={changeKind}
                    options={KINDS.map((value) => ({
                        value,
                        label: t(`vehiclesApp.admin.kinds.${value}`),
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
                        <Button color="inherit" size="small" onClick={retry}>
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
                        <VehiclePublicationReviewCard
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
