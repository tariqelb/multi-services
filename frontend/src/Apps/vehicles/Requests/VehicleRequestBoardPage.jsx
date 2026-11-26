// src/Apps/vehicles/Requests/VehicleRequestBoardPage.jsx
//
// Vehicle requests board for dealers, rental companies and parts shops
// (/vehicles/requests/board):
//   For me       requests matching my "Receive requests" settings
//   All          every active vehicle request (filters: city, offer, category)
//   My replies   the requests I replied to, with the contact a seeker shared

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Pagination, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";

import axiosInstance from "../../../api/axiosInstance";
import moroccanCities from "../../../data/moroccanCities";
import PageLayout from "../../../Components/Home/PageLayout";
import { FilterGrid, FilterPanel, FilterSelect, filterFieldSx } from "../../../Components/ui/FilterKit";
import VehicleRequestCard from "./VehicleRequestCard";
import { REQUEST_API, VEHICLE_CATEGORIES, VEHICLE_TRANSACTIONS as TRANSACTIONS, categoryLabel, requestPath } from "./vehicleRequestOptions";

const EMPTY = { city: "", transaction: "", category: "" };

export default function VehicleRequestBoardPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isArabic = (i18n.resolvedLanguage || i18n.language || "").startsWith("ar");

    const [tab, setTab] = useState("forMe");
    const [filters, setFilters] = useState(EMPTY);
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ requests: [], pagination: {}, profile: null });
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        const request =
            tab === "replies"
                ? axiosInstance.get(`${REQUEST_API}/replies`).then(({ data: body }) => !cancelled && setReplies(body.replies || []))
                : axiosInstance
                      .get(`${REQUEST_API}/board`, { params: { matching: tab === "forMe", page, ...filters } })
                      .then(({ data: body }) => !cancelled && setData(body));
        request
            .then(() => !cancelled && setError(""))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("requests.board.loadError", "Unable to load the requests.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [tab, filters, page, t]);

    const change = (apply) => {
        setLoading(true);
        apply();
    };
    const setFilter = (field, value) => change(() => {
        setFilters((previous) => ({ ...previous, [field]: value }));
        setPage(1);
    });

    const cityOption = moroccanCities.find((city) => city.en === filters.city) || null;
    const configured = data.profile?.configured;
    const activeFilters = Object.values(filters).filter(Boolean).length;

    return (
        <PageLayout
            icon={<CampaignOutlinedIcon />}
            title={t("requests.board.titleVehicle", "Vehicle requests")}
            subtitle={t("requests.board.subtitle", "People looking for something you may have. Reply with \"I have a match\": they choose whom to share their contact with.")}
            action={
                <Button variant="outlined" startIcon={<TuneRoundedIcon />} onClick={() => navigate("/setting#receive-requests")} sx={{ textTransform: "none", bgcolor: "background.paper" }}>
                    {t("requests.board.settings", "What I receive")}
                </Button>
            }
        >
            <Tabs value={tab} onChange={(_event, value) => change(() => { setTab(value); setPage(1); })} sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }} variant="scrollable" allowScrollButtonsMobile>
                <Tab value="forMe" label={t("requests.board.forMe", "For me")} sx={{ textTransform: "none", fontWeight: 700 }} />
                <Tab value="all" label={t("requests.board.all", "All requests")} sx={{ textTransform: "none", fontWeight: 700 }} />
                <Tab value="replies" label={t("requests.board.myReplies", "My replies")} sx={{ textTransform: "none", fontWeight: 700 }} />
            </Tabs>

            {tab === "forMe" && data.profile && !configured && !loading && (
                <Alert
                    severity="info"
                    sx={{ mb: 2.5, borderRadius: "12px" }}
                    action={
                        <Button color="inherit" size="small" onClick={() => navigate("/setting#receive-requests")} sx={{ textTransform: "none", fontWeight: 700 }}>
                            {t("requests.board.setUp", "Set up")}
                        </Button>
                    }
                >
                    {t("requests.board.notConfigured", "Tell us your field and cities in Settings to see the requests for you, and to be notified of new ones.")}
                </Alert>
            )}
            {tab === "forMe" && configured && data.profile?.receiveRequests === false && (
                <Alert severity="warning" sx={{ mb: 2.5, borderRadius: "12px" }}>
                    {t("requests.board.paused", "Receiving requests is paused in your settings: you see them here but get no notifications.")}
                </Alert>
            )}

            {tab !== "replies" && (
                <FilterPanel activeCount={activeFilters} onClear={() => change(() => { setFilters(EMPTY); setPage(1); })} sx={{ mb: 3 }}>
                    <FilterGrid min={190}>
                        <Autocomplete
                            size="small"
                            options={moroccanCities}
                            value={cityOption}
                            onChange={(_event, value) => setFilter("city", value?.en || "")}
                            getOptionLabel={(city) => (isArabic ? city.ar || city.en : city.en)}
                            isOptionEqualToValue={(option, value) => option.en === value.en}
                            sx={filterFieldSx}
                            renderInput={(params) => <TextField {...params} label={t("requests.form.city", "City")} placeholder={t("requests.board.anyCity", "All cities")} />}
                        />
                        <FilterSelect
                            label={t("requests.board.offer", "Looking to")}
                            value={filters.transaction}
                            onChange={(value) => setFilter("transaction", value)}
                            options={[{ value: "", label: t("requests.any", "Any") }, ...TRANSACTIONS.map((value) => ({ value, label: t(`requests.wantTo.vehicle.${value}`) }))]}
                        />
                        <FilterSelect
                            label={t("requests.board.category", "Category")}
                            value={filters.category}
                            onChange={(value) => setFilter("category", value)}
                            options={[{ value: "", label: t("requests.any", "Any") }, ...VEHICLE_CATEGORIES.map((value) => ({ value, label: categoryLabel(t, value) }))]}
                        />
                    </FilterGrid>
                </FilterPanel>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : tab === "replies" ? (
                replies.length === 0 ? (
                    <Empty text={t("requests.board.noReplies", "You have not replied to a request yet.")} />
                ) : (
                    <Stack spacing={2}>
                        {replies.map((reply) => (
                            <VehicleRequestCard
                                key={reply.id}
                                request={reply.request}
                                onClick={() => navigate(requestPath(reply.request))}
                                badges={
                                    reply.seekerContact ? (
                                        <Chip size="small" color="success" icon={<ContactPhoneOutlinedIcon />} label={t("requests.board.contactShared", "Contact shared")} sx={{ fontWeight: 700 }} />
                                    ) : (
                                        <Chip size="small" variant="outlined" label={t("requests.board.waiting", "Waiting for their answer")} />
                                    )
                                }
                            />
                        ))}
                    </Stack>
                )
            ) : data.requests.length === 0 ? (
                <Empty text={tab === "forMe" ? t("requests.board.emptyForMe", "No request matches your settings right now. New ones are sent to you as they come.") : t("requests.board.empty", "No active request matches these filters.")} />
            ) : (
                <>
                    <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 600, mb: 1.5 }}>
                        {t("requests.board.count", "{{count}} active request(s)", { count: data.pagination.total || 0 })}
                    </Typography>
                    <Stack spacing={2}>
                        {data.requests.map((request) => (
                            <VehicleRequestCard
                                key={request.id}
                                request={request}
                                onClick={() => navigate(requestPath(request))}
                                badges={request.replied ? <Chip size="small" color="primary" icon={<CheckCircleRoundedIcon />} label={t("requests.board.replied", "Replied")} /> : null}
                            />
                        ))}
                    </Stack>
                    {data.pagination.totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination color="primary" shape="rounded" page={page} count={data.pagination.totalPages} onChange={(_event, value) => change(() => setPage(value))} />
                        </Box>
                    )}
                </>
            )}
        </PageLayout>
    );
}

function Empty({ text }) {
    return (
        <Box sx={{ py: 7, px: 2, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: "16px", bgcolor: "#F8FAFC" }}>
            <Typography sx={{ color: "#475569", fontWeight: 600, maxWidth: 520, mx: "auto" }}>{text}</Typography>
        </Box>
    );
}
