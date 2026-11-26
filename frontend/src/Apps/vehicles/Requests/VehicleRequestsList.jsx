// src/Apps/vehicles/Requests/VehicleRequestsList.jsx
//
// A list of requests inside another page (no page header):
//   mode="mine"    my requests (My profile, My Publication),
//                  with status filter, reply counts and "Post a request"
//   mode="public"  a user's active requests on their public profile
//                  (only if they chose to show them)

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

import axiosInstance from "../../../api/axiosInstance";
import { FilterChips } from "../../../Components/ui/FilterKit";
import VehicleRequestCard from "./VehicleRequestCard";
import { REQUEST_API, REQUEST_BASE, requestPath } from "./vehicleRequestOptions";

const STATUSES = ["all", "active", "closed", "expired"];

export default function VehicleRequestsList({ mode = "mine", userId, onCountChange, showPost = true }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("all");

    useEffect(() => {
        let cancelled = false;
        const call = mode === "public" ? axiosInstance.get(`${REQUEST_API}/user/${userId}`) : axiosInstance.get(`${REQUEST_API}/mine`);
        call.then(({ data }) => {
            if (cancelled) return;
            const list = data.requests || [];
            setRequests(list);
            onCountChange?.(list.length);
        })
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("requests.mine.loadError", "Unable to load the requests.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [mode, userId, onCountChange, t]);

    const shown = requests.filter((request) => status === "all" || request.status === status);
    const count = (value) => requests.filter((request) => value === "all" || request.status === value).length;
    const mine = mode === "mine";

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {mine && (
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5, justifyContent: "space-between", alignItems: { md: "flex-end" } }}>
                    <FilterChips
                        label={t("requests.mine.status", "Status")}
                        value={status}
                        onChange={setStatus}
                        options={STATUSES.map((value) => ({ value, label: t(`requests.status.${value}`), count: count(value) }))}
                    />
                    {showPost && (
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate(`${REQUEST_BASE}/new`)} sx={{ textTransform: "none", fontWeight: 700, alignSelf: { xs: "flex-start", md: "auto" } }}>
                            {t("requests.post", "Post a request")}
                        </Button>
                    )}
                </Stack>
            )}

            {shown.length === 0 ? (
                <Box sx={{ py: 6, px: 2, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: "16px", bgcolor: "#F8FAFC" }}>
                    <Typography sx={{ fontWeight: 700, color: "#334155", mb: mine ? 1 : 0 }}>
                        {mine ? t("requests.mine.empty", "No request yet") : t("requests.profile.emptyPublic", "No active request.")}
                    </Typography>
                    {mine && (
                        <Typography variant="body2" sx={{ color: "#64748B", maxWidth: 520, mx: "auto" }}>
                            {t("requests.mine.emptyText", "Didn't find what you need? Post a request: professionals in your city are notified and contact you with what they have.")}
                        </Typography>
                    )}
                </Box>
            ) : (
                <Stack spacing={2}>
                    {shown.map((request) => (
                        <VehicleRequestCard
                            key={request.id}
                            request={request}
                            onClick={() => navigate(requestPath(request))}
                            badges={
                                mine ? (
                                    <>
                                        <Chip size="small" variant="outlined" icon={<ForumOutlinedIcon />} label={t("requests.repliesCount", "{{count}} replies", { count: request.responsesCount })} />
                                        {request.unreadResponses > 0 && <Chip size="small" color="error" label={t("requests.newReplies", "{{count}} new", { count: request.unreadResponses })} sx={{ fontWeight: 700 }} />}
                                    </>
                                ) : null
                            }
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}
