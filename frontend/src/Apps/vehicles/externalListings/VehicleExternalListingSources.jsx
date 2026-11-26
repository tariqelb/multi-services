// src/Apps/vehicles/externalListings/VehicleExternalListingSources.jsx
//
// Admin > Vehicles > External listings: the vehicle version of the property
// "External Listing Sources" page (same tools, own API /api/vehicles/external-listings).
//
// Admin page: collect new external listings from a whole website.
//
// Type a website (or pick one), choose how many NEW listings you want,
// click Collect. The backend visits the website, skips listings already in
// the application and saves the new ones. Progress is polled live.
//
// "Check listings availability" removes listings that no longer exist on
// their website (AvailabilityCheck.jsx).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Autocomplete,
    Avatar,
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
    IconButton,
    InputAdornment,
    LinearProgress,
    Link,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import HideImageOutlinedIcon from "@mui/icons-material/HideImageOutlined";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { filterFieldSx } from "../../../Components/ui/FilterKit";
import { SectionCard, StatTile } from "./sourcesUi";
import { formatDate, getLocale } from "./sourcesFormat";
import AvailabilityCheck from "./VehicleAvailabilityCheck";
import NonVehicleCleanup from "./VehicleNonVehicleCleanup";
import WebsiteSearchSettingsDialog from "./VehicleWebsiteSearchSettingsDialog";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

const API = "/vehicles/external-listings";
const POLL_INTERVAL = 2000;
const DEFAULT_COUNT = 10;

/* --------------------------------------------------
   Page
-------------------------------------------------- */

export default function VehicleExternalListingSources() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.resolvedLanguage || i18n.language);
    const tr = useCallback((key, fallback, options) => t(`externalSources.${key}`, { defaultValue: fallback, ...options }), [t]);

    const [websites, setWebsites] = useState([]);
    const [maxPerRun, setMaxPerRun] = useState(50);
    const [loadingWebsites, setLoadingWebsites] = useState(true);

    const [website, setWebsite] = useState("");
    const [count, setCount] = useState(DEFAULT_COUNT);

    const [job, setJob] = useState(null);
    const [history, setHistory] = useState([]);
    const [running, setRunning] = useState(false);
    const [starting, setStarting] = useState(false);

    const [exampleUrl, setExampleUrl] = useState("");
    const [teaching, setTeaching] = useState(false);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    // Website whose live search settings are open.
    const [searchTarget, setSearchTarget] = useState(null);

    // Availability check (see AvailabilityCheck.jsx)
    const [checkRunning, setCheckRunning] = useState(false);
    const [checkWebsite, setCheckWebsite] = useState("");

    const pollRef = useRef(null);

    /* ---------- data ---------- */

    const loadWebsites = useCallback(async () => {
        try {
            setLoadingWebsites(true);
            const response = await axiosInstance.get(`${API}/websites`);
            setWebsites(response.data.websites || []);
            setMaxPerRun(response.data.maxPerRun || 50);
        } catch (err) {
            setError(err.response?.data?.message || tr("errors.load", "Failed to load listing sources."));
        } finally {
            setLoadingWebsites(false);
        }
    }, [tr]);

    const loadStatus = useCallback(async () => {
        try {
            const response = await axiosInstance.get(`${API}/collect-site/status`);
            const { current, running: isRunning, history: runs } = response.data;

            setJob(current || null);
            setRunning(Boolean(isRunning));
            setHistory(runs || []);

            return Boolean(isRunning);
        } catch {
            return false;
        }
    }, []);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const startPolling = useCallback(() => {
        stopPolling();

        pollRef.current = setInterval(async () => {
            const stillRunning = await loadStatus();

            if (!stillRunning) {
                stopPolling();
                loadWebsites();
            }
        }, POLL_INTERVAL);
    }, [loadStatus, loadWebsites]);

    useEffect(() => {
        loadWebsites();

        loadStatus().then((isRunning) => {
            if (isRunning) startPolling();
        });

        return stopPolling;
    }, [loadWebsites, loadStatus, startPolling]);

    /* ---------- actions ---------- */

    const handleCollect = async (event) => {
        event?.preventDefault();
        setError("");
        setNotice("");

        const target = String(website || "").trim();

        if (!target) {
            setError(tr("collect.websiteRequired", "Type or choose a website."));
            return;
        }

        try {
            setStarting(true);

            const response = await axiosInstance.post(`${API}/collect-site`, {
                website: target,
                count,
            });

            setJob(response.data.job);
            setRunning(true);
            startPolling();
        } catch (err) {
            setError(err.response?.data?.message || tr("collect.startError", "Could not start the collection."));
        } finally {
            setStarting(false);
        }
    };

    const handleCancel = async () => {
        try {
            await axiosInstance.post(`${API}/collect-site/cancel`);
            setNotice(tr("collect.stopping", "Stopping after the current listing..."));
        } catch (err) {
            setError(err.response?.data?.message || tr("collect.cancelError", "Could not stop the collection."));
        }
    };

    const handleTeach = async () => {
        setError("");
        setNotice("");

        try {
            setTeaching(true);
            const response = await axiosInstance.post(`${API}/websites`, { website: exampleUrl.trim() });
            setNotice(response.data.message);
            setExampleUrl("");
            await loadWebsites();
        } catch (err) {
            setError(err.response?.data?.message || tr("collect.teachError", "Could not use this listing URL."));
        } finally {
            setTeaching(false);
        }
    };

    const handleRefreshExisting = async () => {
        setError("");
        setNotice("");

        try {
            setRefreshing(true);
            const response = await axiosInstance.post(`${API}/refresh`);
            setNotice(response.data.message || tr("messages.refreshSuccess", "External listings refreshed successfully."));
        } catch (err) {
            setError(err.response?.data?.message || tr("errors.refresh", "Failed to refresh external listings."));
        } finally {
            setRefreshing(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            const response = await axiosInstance.delete(
                `${API}/websites/${encodeURIComponent(deleteTarget.hostname)}`
            );
            setNotice(response.data.message);
            setDeleteTarget(null);
            await loadWebsites();
        } catch (err) {
            setError(err.response?.data?.message || tr("errors.delete", "Failed to delete listing source."));
            setDeleteTarget(null);
        }
    };

    /* ---------- derived ---------- */

    const websiteOptions = useMemo(
        () => websites.map((item) => item.hostname).filter(Boolean),
        [websites]
    );

    const websiteByHost = useMemo(
        () => new Map(websites.map((item) => [item.hostname, item])),
        [websites]
    );

    const progress = job?.requested ? Math.min(100, Math.round((job.saved / job.requested) * 100)) : 0;

    const finishedJob = job && !running ? job : null;
    const showTeach = finishedJob && finishedJob.discovered === 0 && finishedJob.status !== "failed";

    const phaseLabel = (phase) =>
        ({
            starting: tr("collect.phase.starting", "Starting..."),
            robots: tr("collect.phase.robots", "Reading the website's robots.txt..."),
            discovering: tr("collect.phase.discovering", "Looking for listings on the website..."),
            extracting: tr("collect.phase.extracting", "Reading a new listing..."),
        })[phase] || tr("collect.phase.working", "Working...");

    const statusChip = (status) => {
        const map = {
            completed: { color: "success", label: tr("collect.status.completed", "Completed") },
            running: { color: "info", label: tr("collect.status.running", "Running") },
            cancelled: { color: "warning", label: tr("collect.status.cancelled", "Stopped") },
            failed: { color: "error", label: tr("collect.status.failed", "Failed") },
            skipped: { color: "default", label: tr("collect.status.skipped", "Skipped (robots.txt)") },
        };
        const item = map[status] || { color: "default", label: status };

        return <Chip size="small" color={item.color} label={item.label} sx={{ fontWeight: 700 }} />;
    };

    /* ---------- render ---------- */

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<TravelExploreOutlinedIcon />}
                title={t("vehicleExternal.admin.title", "Vehicle external listings")}
                subtitle={t(
                    "vehicleExternal.admin.subtitle",
                    "Collect new vehicle, moto and spare part listings from Avito, Moteur.ma, Wandaloo and other websites. Listings already in your application are skipped automatically."
                )}
                action={
                    <Button
                        variant="outlined"
                        startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
                        onClick={handleRefreshExisting}
                        disabled={refreshing || running || checkRunning}
                    >
                        {refreshing
                            ? tr("actions.refreshing", "Refreshing...")
                            : tr("collect.refreshExisting", "Refresh existing listings")}
                    </Button>
                }
            />

            <Stack spacing={3}>
                {error && (
                    <Alert severity="error" onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}
                {notice && (
                    <Alert severity="success" onClose={() => setNotice("")}>
                        {notice}
                    </Alert>
                )}

                {/* ---------- Collect form ---------- */}
                <SectionCard
                    title={tr("collect.title", "Collect new listings")}
                    subtitle={tr(
                        "collect.subtitle",
                        "Type the website name and how many new listings you want."
                    )}
                >
                    <Box
                        component="form"
                        onSubmit={handleCollect}
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 160px auto" },
                            gap: 1.5,
                            alignItems: "start",
                        }}
                    >
                        <Autocomplete
                            freeSolo
                            options={websiteOptions}
                            inputValue={website}
                            onInputChange={(_event, value) => setWebsite(value)}
                            disabled={running || checkRunning}
                            renderOption={(props, option) => {
                                const { key, ...rest } = props;
                                const item = websiteByHost.get(option);

                                return (
                                    <Box component="li" key={key} {...rest}>
                                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", width: "100%" }}>
                                            <LanguageRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                                    {item?.sourceName || option}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                                                    {option}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={tr("collect.listingCount", "{{count}} listings", {
                                                    count: item?.activeListingCount || 0,
                                                })}
                                            />
                                        </Stack>
                                    </Box>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    label={tr("collect.websiteLabel", "Website")}
                                    placeholder={t("vehicleExternal.admin.websitePlaceholder", "e.g. avito.ma")}
                                    helperText={tr(
                                        "collect.websiteHelp",
                                        "Choose a website or type a new domain."
                                    )}
                                    sx={filterFieldSx}
                                    slotProps={{
                                        ...params.slotProps,
                                        input: {
                                            ...params.slotProps?.input,
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LanguageRoundedIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            )}
                        />

                        <TextField
                            size="small"
                            type="number"
                            label={tr("collect.countLabel", "New listings")}
                            value={count}
                            disabled={running || checkRunning}
                            onChange={(event) => {
                                const value = Number(event.target.value);
                                setCount(Number.isFinite(value) ? Math.min(maxPerRun, Math.max(1, Math.round(value))) : 1);
                            }}
                            helperText={tr("collect.countHelp", "1 to {{max}}", { max: maxPerRun })}
                            sx={filterFieldSx}
                            slotProps={{ htmlInput: { min: 1, max: maxPerRun } }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={starting ? <CircularProgress size={16} color="inherit" /> : <CloudDownloadOutlinedIcon />}
                            disabled={running || starting || checkRunning}
                            sx={{ height: 40, whiteSpace: "nowrap" }}
                        >
                            {tr("collect.button", "Collect")}
                        </Button>
                    </Box>
                </SectionCard>

                {/* ---------- Live progress / result ---------- */}
                {job && (
                    <SectionCard
                        title={
                            running
                                ? tr("collect.runningTitle", "Collecting from {{site}}", {
                                      site: job.sourceName || job.website,
                                  })
                                : tr("collect.resultTitle", "Last collection: {{site}}", {
                                      site: job.sourceName || job.website,
                                  })
                        }
                        subtitle={running ? phaseLabel(job.phase) : formatDate(job.finishedAt, locale)}
                        action={
                            running ? (
                                <Button
                                    color="warning"
                                    variant="outlined"
                                    startIcon={<StopCircleOutlinedIcon />}
                                    onClick={handleCancel}
                                    disabled={job.cancelRequested}
                                >
                                    {tr("collect.stop", "Stop")}
                                </Button>
                            ) : (
                                statusChip(job.status)
                            )
                        }
                    >
                        <Stack spacing={2}>
                            <Box>
                                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.75 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {tr("collect.savedOf", "{{saved}} of {{requested}} new listings saved", {
                                            saved: job.saved,
                                            requested: job.requested,
                                        })}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {progress}%
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant={running && job.saved === 0 ? "indeterminate" : "determinate"}
                                    value={progress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                {running && job.currentUrl && (
                                    <Typography
                                        variant="caption"
                                        sx={{ color: "text.secondary", display: "block", mt: 0.75, overflowWrap: "anywhere" }}
                                    >
                                        {job.currentUrl}
                                    </Typography>
                                )}
                            </Box>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" },
                                    gap: 1.25,
                                }}
                            >
                                <StatTile
                                    icon={<CheckCircleRoundedIcon fontSize="small" />}
                                    label={tr("collect.stats.saved", "New listings saved")}
                                    value={job.saved}
                                    color="success"
                                />
                                <StatTile
                                    icon={<ContentCopyRoundedIcon fontSize="small" />}
                                    label={tr("collect.stats.alreadyInDb", "Already in your app")}
                                    value={job.alreadyInDb}
                                    color="info"
                                />
                                <StatTile
                                    icon={<HideImageOutlinedIcon fontSize="small" />}
                                    label={tr("collect.stats.noImage", "Skipped (no photo)")}
                                    value={job.skippedNoImage}
                                    color="warning"
                                />
                                <StatTile
                                    icon={<BlockRoundedIcon fontSize="small" />}
                                    label={t("vehicleExternal.cleanup.notVehicleStat", "Skipped (not a vehicle)")}
                                    value={job.skippedNotVehicle || 0}
                                    color="warning"
                                />
                                <StatTile
                                    icon={<ErrorOutlineRoundedIcon fontSize="small" />}
                                    label={tr("collect.stats.failed", "Failed")}
                                    value={job.failed}
                                    color="error"
                                />
                                <StatTile
                                    icon={<TravelExploreRoundedIcon fontSize="small" />}
                                    label={tr("collect.stats.pages", "Pages scanned")}
                                    value={job.pagesScanned + (job.sitemapFiles || 0)}
                                />
                            </Box>

                            {!running && job.message && (
                                <Alert
                                    severity={
                                        job.status === "failed"
                                            ? "error"
                                            : job.saved >= job.requested
                                              ? "success"
                                              : job.saved > 0
                                                ? "info"
                                                : "warning"
                                    }
                                >
                                    {job.message}
                                </Alert>
                            )}

                            {/* Teach the listing path when nothing was found */}
                            {showTeach && (
                                <Box
                                    sx={(theme) => ({
                                        p: 2,
                                        borderRadius: "12px",
                                        border: "1px dashed",
                                        borderColor: "divider",
                                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                                    })}
                                >
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                                        <SchoolOutlinedIcon color="primary" fontSize="small" />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {tr("collect.teachTitle", "Help the collector find the listings")}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                                        {tr(
                                            "collect.teachText",
                                            "Paste the link of one listing from this website, then collect again."
                                        )}
                                    </Typography>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            type="url"
                                            value={exampleUrl}
                                            onChange={(event) => setExampleUrl(event.target.value)}
                                            placeholder={`https://${job.hostname || "website.ma"}/...`}
                                            sx={filterFieldSx}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleTeach}
                                            disabled={!exampleUrl.trim() || teaching}
                                            sx={{ whiteSpace: "nowrap" }}
                                        >
                                            {tr("collect.teachButton", "Use this link")}
                                        </Button>
                                    </Stack>
                                </Box>
                            )}

                            {job.savedListings?.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                        {tr("collect.savedListTitle", "Listings added")}
                                    </Typography>
                                    <Stack divider={<Divider flexItem />} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
                                        {job.savedListings.slice(-10).reverse().map((listing) => (
                                            <Stack
                                                key={listing.sourceUrl}
                                                direction="row"
                                                spacing={1.5}
                                                sx={{ alignItems: "center", p: 1.25, minWidth: 0 }}
                                            >
                                                <Avatar
                                                    variant="rounded"
                                                    src={listing.imageUrl}
                                                    sx={{ width: 48, height: 40, flexShrink: 0 }}
                                                />
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                                        {listing.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap component="div">
                                                        {[listing.city, listing.price != null ? `${Number(listing.price).toLocaleString(locale)} ${listing.currency || "MAD"}` : ""]
                                                            .filter(Boolean)
                                                            .join(" · ")}
                                                    </Typography>
                                                </Box>
                                                <Tooltip title={tr("actions.openLink", "Open link")}>
                                                    <IconButton
                                                        size="small"
                                                        component="a"
                                                        href={listing.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <OpenInNewRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {!running && job.errors?.length > 0 && (
                                <Typography variant="caption" sx={{ color: "text.secondary", overflowWrap: "anywhere" }}>
                                    {tr("collect.lastError", "Last error:")} {job.errors[job.errors.length - 1]}
                                </Typography>
                            )}
                        </Stack>
                    </SectionCard>
                )}

                {/* ---------- Availability check ---------- */}
                <AvailabilityCheck
                    tr={tr}
                    locale={locale}
                    websites={websites}
                    website={checkWebsite}
                    onWebsiteChange={setCheckWebsite}
                    collectRunning={running}
                    onRunningChange={setCheckRunning}
                    onFinished={loadWebsites}
                />

                {/* ---------- Listings that are not vehicles ---------- */}
                <NonVehicleCleanup disabled={running || checkRunning} onFinished={loadWebsites} />

                {/* ---------- Registered websites ---------- */}
                <SectionCard
                    title={tr("collect.websitesTitle", "Websites")}
                    subtitle={tr(
                        "collect.websitesSubtitle",
                        "Websites you collect listings from. Removing a website keeps its listings."
                    )}
                    action={
                        <Chip
                            color="primary"
                            variant="outlined"
                            label={tr("sourceCount", "{{count}} sources", { count: websites.length })}
                            sx={{ fontWeight: 700 }}
                        />
                    }
                >
                    {loadingWebsites ? (
                        <Stack sx={{ alignItems: "center", py: 4 }}>
                            <CircularProgress size={28} />
                        </Stack>
                    ) : websites.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                                {tr("empty.title", "No external listing sources added yet.")}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {tr("collect.emptyText", "Type a website above to collect its listings.")}
                            </Typography>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
                                gap: 1.5,
                            }}
                        >
                            {websites.map((item) => (
                                <Box
                                    key={item.hostname}
                                    sx={{
                                        p: 2,
                                        borderRadius: "14px",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        transition: "border-color .2s",
                                        "&:hover": { borderColor: "primary.light" },
                                        minWidth: 0,
                                    }}
                                >
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                                        <Avatar
                                            variant="rounded"
                                            sx={(theme) => ({
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                color: "primary.main",
                                                width: 40,
                                                height: 40,
                                            })}
                                        >
                                            <LanguageRoundedIcon />
                                        </Avatar>

                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography sx={{ fontWeight: 700 }} noWrap>
                                                {item.sourceName}
                                            </Typography>
                                            <Link
                                                href={`https://${item.hostname}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                variant="caption"
                                                underline="hover"
                                                sx={{ display: "block" }}
                                                noWrap
                                            >
                                                {item.hostname}
                                            </Link>
                                        </Box>

                                        <Tooltip title={tr("actions.delete", "Delete")}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setDeleteTarget(item)}
                                                    disabled={running || checkRunning}
                                                >
                                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>

                                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                                        <Chip
                                            size="small"
                                            label={tr("collect.listingCount", "{{count}} listings", {
                                                count: item.activeListingCount,
                                            })}
                                        />
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={item.pathPrefix === "/" ? "warning" : "default"}
                                            label={
                                                item.pathPrefix === "/"
                                                    ? tr("collect.pathUnknown", "Listing path not detected yet")
                                                    : tr("collect.pathKnown", "Listings: {{path}}", { path: item.pathPrefix })
                                            }
                                        />
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={item.search?.templates?.length ? "primary" : "default"}
                                            label={
                                                item.search?.templates?.length
                                                    ? tr("searchSettings.live", "Live search: results page")
                                                    : tr("searchSettings.engine", "Live search: search engine")
                                            }
                                        />
                                        {item.robots && (
                                            <Chip
                                                size="small"
                                                color={item.robots.allowed ? "success" : "error"}
                                                variant={item.robots.allowed ? "outlined" : "filled"}
                                                label={
                                                    item.robots.allowed
                                                        ? tr("collect.robotsAllowed", "robots.txt: allowed")
                                                        : tr("collect.robotsBlocked", "robots.txt: not allowed, skipped")
                                                }
                                            />
                                        )}
                                    </Stack>

                                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.25 }}>
                                        {item.lastCollectedAt
                                            ? tr("collect.lastCollected", "Last collection: {{date}} · {{saved}} added", {
                                                  date: formatDate(item.lastCollectedAt, locale),
                                                  saved: item.lastCollectSummary?.saved ?? 0,
                                              })
                                            : tr("collect.neverCollected", "Never collected")}
                                    </Typography>

                                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<CloudDownloadOutlinedIcon />}
                                            disabled={running || checkRunning}
                                            onClick={() => {
                                                setWebsite(item.hostname);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            sx={{ flex: 1, minWidth: 0 }}
                                        >
                                            {tr("collect.button", "Collect")}
                                        </Button>
                                        <Tooltip title={tr("searchSettings.button", "Live search settings")}>
                                            <span>
                                                <IconButton size="small" aria-label={tr("searchSettings.button", "Live search settings")} onClick={() => setSearchTarget(item)} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                                                    <TuneRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="secondary"
                                            startIcon={<FactCheckOutlinedIcon />}
                                            disabled={running || checkRunning}
                                            onClick={() => {
                                                setCheckWebsite(item.hostname);
                                                document
                                                    .getElementById("availability-check")
                                                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                                            }}
                                            sx={{ flex: 1, minWidth: 0 }}
                                        >
                                            {tr("availability.checkShort", "Check")}
                                        </Button>
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    )}
                </SectionCard>

                {/* ---------- Recent collections ---------- */}
                {history.length > 0 && (
                    <SectionCard
                        title={tr("collect.historyTitle", "Recent collections")}
                        subtitle={tr("collect.historySubtitle", "Since the server last started.")}
                    >
                        <Stack divider={<Divider flexItem />}>
                            {history.map((run) => (
                                <Stack
                                    key={run.id}
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={{ xs: 0.5, sm: 2 }}
                                    sx={{ py: 1.25, alignItems: { sm: "center" }, justifyContent: "space-between" }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                            {run.sourceName || run.website}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {formatDate(run.finishedAt || run.startedAt, locale)}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                            {tr("collect.historyLine", "{{saved}}/{{requested}} added · {{already}} already in app", {
                                                saved: run.saved,
                                                requested: run.requested,
                                                already: run.alreadyInDb,
                                            })}
                                        </Typography>
                                        {statusChip(run.status)}
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    </SectionCard>
                )}
            </Stack>

            {/* Delete confirmation */}
            <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{tr("collect.deleteTitle", "Remove this website?")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {tr(
                            "collect.deleteText",
                            "{{site}} will no longer be collected. The listings already added stay in your application.",
                            { site: deleteTarget?.sourceName || "" }
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>{t("common.cancel", "Cancel")}</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>
                        {tr("actions.delete", "Delete")}
                    </Button>
                </DialogActions>
            </Dialog>
            {searchTarget && (
                <WebsiteSearchSettingsDialog
                    key={searchTarget.hostname}
                    website={searchTarget}
                    onClose={() => setSearchTarget(null)}
                    onSaved={loadWebsites}
                />
            )}
        </Box>
    );
}
