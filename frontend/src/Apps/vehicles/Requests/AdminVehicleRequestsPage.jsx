// src/Apps/vehicles/Requests/AdminVehicleRequestsPage.jsx
//
// Admin panel > Vehicles > Requests: every vehicle request
// posted, with its author. Admins and team members with write access can
// delete fake or abusive requests.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Pagination, Stack, Typography } from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import PageLayout from "../../../Components/Home/PageLayout";
import { FilterChips, FilterSelect } from "../../../Components/ui/FilterKit";
import { useAdminAccess } from "../../../Components/Admin/adminSections";
import VehicleRequestCard from "./VehicleRequestCard";
import { REQUEST_API, requestPath } from "./vehicleRequestOptions";

const STATUSES = ["all", "active", "closed", "expired"];
const PERIODS = ["all", "today", "week", "month", "year"];

export default function AdminVehicleRequestsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const canDelete = useAdminAccess().can("vehicleRequests", "write");

    const [status, setStatus] = useState("all");
    const [period, setPeriod] = useState("all");
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ requests: [], pagination: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`${REQUEST_API}/admin`, { params: { status, period, page } })
            .then(({ data: body }) => !cancelled && (setData(body), setError("")))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("requests.admin.loadError", "Unable to load the requests.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [status, period, page, reloadKey, t]);

    const change = (apply) => {
        setLoading(true);
        apply();
    };

    const confirmDelete = async () => {
        const request = deleting;
        setDeleting(null);
        try {
            await axiosInstance.delete(`${REQUEST_API}/admin/${request.id}`);
            change(() => setReloadKey((key) => key + 1));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("requests.admin.deleteError", "Unable to delete this request."));
        }
    };

    return (
        <PageLayout
            icon={<CampaignOutlinedIcon />}
            title={t("requests.admin.titleVehicle", "Vehicle requests")}
            subtitle={t("requests.admin.subtitle", "What users are looking for. Remove fake or abusive requests.")}
        >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3, justifyContent: "space-between", alignItems: { md: "flex-end" } }}>
                <FilterChips
                    label={t("requests.mine.status", "Status")}
                    value={status}
                    onChange={(value) => change(() => { setStatus(value); setPage(1); })}
                    options={STATUSES.map((value) => ({ value, label: t(`requests.status.${value}`) }))}
                />
                <Box sx={{ minWidth: 200 }}>
                    <FilterSelect
                        label={t("requests.admin.period", "Posted")}
                        value={period}
                        onChange={(value) => change(() => { setPeriod(value); setPage(1); })}
                        options={PERIODS.map((value) => ({ value, label: t(`requests.admin.periods.${value}`) }))}
                    />
                </Box>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : data.requests.length === 0 ? (
                <Box sx={{ py: 7, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: "16px", bgcolor: "#F8FAFC" }}>
                    <Typography sx={{ fontWeight: 700, color: "#475569" }}>{t("requests.admin.empty", "No request for these filters.")}</Typography>
                </Box>
            ) : (
                <>
                    <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 600, mb: 1.5 }}>
                        {t("requests.admin.count", "{{count}} request(s)", { count: data.pagination.total || 0 })}
                    </Typography>
                    <Stack spacing={2}>
                        {data.requests.map((request) => {
                            const owner = request.owner;
                            const name = owner ? [owner.firstName, owner.lastName].filter(Boolean).join(" ") : t("requests.details.deletedUser", "Deleted account");
                            return (
                                <VehicleRequestCard
                                    key={request.id}
                                    request={request}
                                    onClick={request.status === "active" ? () => navigate(requestPath(request)) : undefined}
                                    footer={
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1.5, borderTop: "1px solid #E2E8F0", justifyContent: "space-between", alignItems: { sm: "center" } }}>
                                            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                                                <Avatar src={owner?.profileImage ? getImageUrl(owner.profileImage) : undefined} sx={{ width: 32, height: 32 }}>
                                                    {name.charAt(0)}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                                        {name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#64748B" }} noWrap>
                                                        {[owner?.email, t("requests.admin.stats", "{{recipients}} notified · {{replies}} replies", { recipients: request.recipientsCount, replies: request.responsesCount })]
                                                            .filter(Boolean)
                                                            .join(" · ")}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            {canDelete && (
                                                <Button color="error" variant="outlined" size="small" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleting(request)} sx={{ textTransform: "none" }}>
                                                    {t("requests.details.delete", "Delete")}
                                                </Button>
                                            )}
                                        </Stack>
                                    }
                                />
                            );
                        })}
                    </Stack>
                    {data.pagination.totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination color="primary" shape="rounded" page={page} count={data.pagination.totalPages} onChange={(_event, value) => change(() => setPage(value))} />
                        </Box>
                    )}
                </>
            )}

            <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>{t("requests.details.deleteTitle", "Delete this request?")}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {t("requests.details.deleteText", "The request and its replies are deleted for good.")}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleting(null)} sx={{ textTransform: "none" }}>
                        {t("requests.cancel", "Cancel")}
                    </Button>
                    <Button color="error" variant="contained" onClick={confirmDelete} sx={{ textTransform: "none" }}>
                        {t("requests.details.delete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageLayout>
    );
}
