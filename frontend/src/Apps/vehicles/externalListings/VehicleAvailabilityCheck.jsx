// "Check availability" section of the External Listing Sources page.
//
// Opens every stored listing on its website. Listings that no longer exist
// are removed; listings that cannot be checked are kept. When almost every
// listing of a website looks gone (often a website blocking the check),
// they are kept "to review" and removed with one click if correct.

import { useCallback, useEffect, useRef, useState } from "react";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    IconButton,
    LinearProgress,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import axiosInstance from "../../../api/axiosInstance";
import { filterFieldSx } from "../../../Components/ui/FilterKit";
import { SectionCard, StatTile } from "./sourcesUi";
import { formatDate } from "./sourcesFormat";

const API = "/vehicles/external-listings/availability";
const POLL_INTERVAL = 2000;
const SHOWN_RESULTS = 50;

export default function VehicleAvailabilityCheck({
    tr,
    locale,
    websites,
    website,
    onWebsiteChange,
    collectRunning,
    onRunningChange,
    onFinished,
}) {
    const [job, setJob] = useState(null);
    const [history, setHistory] = useState([]);
    const [running, setRunning] = useState(false);
    const [starting, setStarting] = useState(false);
    const [dryRun, setDryRun] = useState(false);
    // Listings whose website does not answer (twice) are removed.
    const [removeUnreachable, setRemoveUnreachable] = useState(true);
    const [removing, setRemoving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const pollRef = useRef(null);

    useEffect(() => {
        onRunningChange?.(running);
    }, [running, onRunningChange]);

    /* ---------- data ---------- */

    const applyStatus = useCallback((data) => {
        setJob(data.current || null);
        setRunning(Boolean(data.running));
        setHistory(data.history || []);
        return Boolean(data.running);
    }, []);

    const loadStatus = useCallback(async () => {
        try {
            const response = await axiosInstance.get(`${API}/status`);
            return applyStatus(response.data);
        } catch {
            return false;
        }
    }, [applyStatus]);

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
                onFinished?.();
            }
        }, POLL_INTERVAL);
    }, [loadStatus, onFinished]);

    useEffect(() => {
        loadStatus().then((isRunning) => {
            if (isRunning) startPolling();
        });

        return stopPolling;
    }, [loadStatus, startPolling]);

    /* ---------- actions ---------- */

    const handleStart = async () => {
        setError("");
        setNotice("");

        try {
            setStarting(true);

            const response = await axiosInstance.post(`${API}/check`, {
                website: website || "all",
                dryRun,
                removeUnreachable,
            });

            setJob(response.data.job);
            setRunning(true);
            startPolling();
        } catch (err) {
            setError(err.response?.data?.message || tr("availability.startError", "Could not start the check."));
        } finally {
            setStarting(false);
        }
    };

    const handleCancel = async () => {
        try {
            await axiosInstance.post(`${API}/cancel`);
            setNotice(tr("availability.stopping", "Stopping after the current listing..."));
        } catch (err) {
            setError(err.response?.data?.message || tr("availability.cancelError", "Could not stop the check."));
        }
    };

    const removeIds = async (ids) => {
        if (!ids.length) return;

        setError("");
        setNotice("");

        try {
            setRemoving(true);
            const response = await axiosInstance.post(`${API}/remove`, { ids });
            applyStatus(response.data);
            setNotice(
                tr("availability.removedNotice", "{{count}} listing(s) removed.", {
                    count: response.data.removed ?? ids.length,
                })
            );
            onFinished?.();
        } catch (err) {
            setError(err.response?.data?.message || tr("availability.removeError", "Could not remove the listings."));
        } finally {
            setRemoving(false);
        }
    };

    /* ---------- derived ---------- */

    const results = job?.results || [];
    const toReview = results.filter((item) => !item.removed);
    const progress = job?.total ? Math.min(100, Math.round((job.checked / job.total) * 100)) : 0;
    const busy = running || collectRunning;

    const reasonLabel = (item) =>
        item.code
            ? tr(`availability.reasons.${item.code}`, item.reason, { phrase: item.phrase })
            : item.reason;

    const noteLabel = (site) =>
        site.noteCode ? tr(`availability.notes.${site.noteCode}`, site.note) : site.note;

    const summary = (data) =>
        data.total === 0
            ? tr("availability.nothingToCheck", "No external listings to check.")
            : tr(
                  "availability.summary",
                  "{{checked}} of {{total}} listings checked: {{available}} still available, {{removed}} removed, {{kept}} to review, {{unknown}} could not be checked.",
                  {
                      checked: data.checked,
                      total: data.total,
                      available: data.available,
                      removed: data.removed,
                      kept: data.kept,
                      unknown: data.unknown,
                  }
              );

    const statusChip = (status) => {
        const map = {
            completed: { color: "success", label: tr("collect.status.completed", "Completed") },
            running: { color: "info", label: tr("collect.status.running", "Running") },
            cancelled: { color: "warning", label: tr("collect.status.cancelled", "Stopped") },
            failed: { color: "error", label: tr("collect.status.failed", "Failed") },
        };
        const item = map[status] || { color: "default", label: status };

        return <Chip size="small" color={item.color} label={item.label} sx={{ fontWeight: 700 }} />;
    };

    const scopeLabel = (data) =>
        data.hostname
            ? websites.find((item) => item.hostname === data.hostname)?.sourceName || data.hostname
            : tr("availability.allWebsites", "All websites");

    /* ---------- render ---------- */

    return (
        <SectionCard
            id="availability-check"
            title={tr("availability.title", "Check listings availability")}
            subtitle={tr(
                "availability.subtitle",
                "Opens every listing on its website and removes the ones that no longer exist. Listings that cannot be checked are kept."
            )}
        >
            <Stack spacing={2}>
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

                {/* Form */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto auto" },
                        gap: 1.5,
                        alignItems: "center",
                    }}
                >
                    <TextField
                        select
                        size="small"
                        label={tr("availability.websiteLabel", "Listings to check")}
                        value={website || "all"}
                        onChange={(event) => onWebsiteChange(event.target.value === "all" ? "" : event.target.value)}
                        disabled={busy}
                        sx={filterFieldSx}
                    >
                        <MenuItem value="all">{tr("availability.allWebsites", "All websites")}</MenuItem>
                        {websites.map((item) => (
                            <MenuItem key={item.hostname} value={item.hostname}>
                                {item.sourceName || item.hostname}
                                {" · "}
                                {tr("collect.listingCount", "{{count}} listings", { count: item.listingCount ?? item.activeListingCount ?? 0 })}
                            </MenuItem>
                        ))}
                    </TextField>

                    <FormControlLabel
                        control={<Checkbox checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} disabled={busy} />}
                        label={tr("availability.dryRun", "Report only (remove nothing)")}
                        sx={{ m: 0 }}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={removeUnreachable}
                                onChange={(event) => setRemoveUnreachable(event.target.checked)}
                                disabled={busy}
                            />
                        }
                        label={tr("availability.removeUnreachable", "Remove listings that cannot be reached")}
                        sx={{ m: 0 }}
                    />

                    <Button
                        variant="contained"
                        startIcon={starting ? <CircularProgress size={16} color="inherit" /> : <FactCheckOutlinedIcon />}
                        onClick={handleStart}
                        disabled={busy || starting}
                        sx={{ height: 40, whiteSpace: "nowrap" }}
                    >
                        {tr("availability.button", "Check availability")}
                    </Button>
                </Box>

                {collectRunning && !running && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {tr("availability.waitCollection", "Available when the collection is finished.")}
                    </Typography>
                )}

                {/* Progress / result */}
                {job && (
                    <Box
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: "12px",
                            border: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 1.5 }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {running
                                        ? tr("availability.runningTitle", "Checking: {{scope}}", { scope: scopeLabel(job) })
                                        : tr("availability.resultTitle", "Last check: {{scope}}", { scope: scopeLabel(job) })}
                                    {job.dryRun ? ` · ${tr("availability.reportOnly", "report only")}` : ""}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {running ? formatDate(job.startedAt, locale) : formatDate(job.finishedAt, locale)}
                                </Typography>
                            </Box>
                            <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                                {running ? (
                                    <Button
                                        color="warning"
                                        variant="outlined"
                                        size="small"
                                        startIcon={<StopCircleOutlinedIcon />}
                                        onClick={handleCancel}
                                        disabled={job.cancelRequested}
                                    >
                                        {tr("collect.stop", "Stop")}
                                    </Button>
                                ) : (
                                    statusChip(job.status)
                                )}
                            </Box>
                        </Stack>

                        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {tr("availability.checkedOf", "{{checked}} of {{total}} listings checked", {
                                    checked: job.checked,
                                    total: job.total,
                                })}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {progress}%
                            </Typography>
                        </Stack>
                        <LinearProgress
                            variant={running && job.checked === 0 ? "indeterminate" : "determinate"}
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

                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                                gap: 1.25,
                            }}
                        >
                            <StatTile
                                icon={<CheckCircleRoundedIcon fontSize="small" />}
                                label={tr("availability.stats.available", "Still available")}
                                value={job.available}
                                color="success"
                            />
                            <StatTile
                                icon={<DeleteSweepOutlinedIcon fontSize="small" />}
                                label={tr("availability.stats.removed", "Removed")}
                                value={job.removed}
                                color="error"
                            />
                            <StatTile
                                icon={<RuleRoundedIcon fontSize="small" />}
                                label={
                                    job.dryRun
                                        ? tr("availability.stats.unavailable", "No longer available")
                                        : tr("availability.stats.toReview", "To review")
                                }
                                value={job.kept}
                                color="warning"
                            />
                            <StatTile
                                icon={<HelpOutlineRoundedIcon fontSize="small" />}
                                label={tr("availability.stats.unknown", "Could not check (kept)")}
                                value={job.unknown}
                                color="info"
                            />
                        </Box>

                        {!running && job.status !== "failed" && (
                            <Alert severity={job.kept > 0 ? "warning" : "success"} sx={{ mt: 2 }}>
                                {summary(job)}
                                {job.unreachable > 0 && (
                                    <>
                                        {" "}
                                        {job.dryRun
                                            ? tr("availability.unreachableReport", "{{count}} could not be reached (would be removed).", { count: job.unreachable })
                                            : tr("availability.unreachableRemoved", "{{count}} of the removed listings could not be reached.", { count: job.unreachable })}
                                    </>
                                )}
                            </Alert>
                        )}
                        {!running && job.offline && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                                {tr("availability.offline", "Our server could not reach the internet, so listings that could not be reached were kept.")}
                            </Alert>
                        )}
                        {!running && job.status === "failed" && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {job.message}
                            </Alert>
                        )}

                        {/* Per website */}
                        {job.websites?.length > 0 && (
                            <Stack
                                divider={<Divider flexItem />}
                                sx={{ mt: 2, border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
                            >
                                {job.websites.map((site) => (
                                    <Box key={site.hostname} sx={{ p: 1.25, minWidth: 0 }}>
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={1}
                                            sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                                    {site.sourceName || site.hostname}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    {tr("availability.checkedOf", "{{checked}} of {{total}} listings checked", {
                                                        checked: site.checked,
                                                        total: site.total,
                                                    })}
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                                                <Chip size="small" color="success" variant="outlined" label={`${tr("availability.stats.available", "Still available")}: ${site.available}`} />
                                                <Chip size="small" color="error" variant="outlined" label={`${tr("availability.stats.removed", "Removed")}: ${site.removed}`} />
                                                {site.kept > 0 && (
                                                    <Chip size="small" color="warning" variant="outlined" label={`${tr("availability.stats.toReview", "To review")}: ${site.kept}`} />
                                                )}
                                                {site.unreachable > 0 && (
                                                    <Chip size="small" color="error" variant="outlined" label={`${tr("availability.stats.unreachable", "Could not be reached")}: ${site.unreachable}`} />
                                                )}
                                                {site.unknown > 0 && (
                                                    <Chip size="small" color="info" variant="outlined" label={`${tr("availability.stats.unknown", "Could not check (kept)")}: ${site.unknown}`} />
                                                )}
                                            </Stack>
                                        </Stack>
                                        {site.note && (
                                            <Typography
                                                variant="caption"
                                                sx={{ display: "block", mt: 0.5, color: site.noteCode === "suspicious" ? "warning.main" : "text.secondary" }}
                                            >
                                                {noteLabel(site)}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        )}

                        {/* Listings found unavailable */}
                        {results.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                    sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 1 }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {tr("availability.resultsTitle", "Listings no longer available")}
                                    </Typography>
                                    {!running && toReview.length > 0 && (
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="contained"
                                            startIcon={removing ? <CircularProgress size={14} color="inherit" /> : <DeleteSweepOutlinedIcon />}
                                            onClick={() => removeIds(toReview.map((item) => item.id))}
                                            disabled={removing}
                                            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                                        >
                                            {tr("availability.removeAll", "Remove these {{count}} listings", { count: toReview.length })}
                                        </Button>
                                    )}
                                </Stack>

                                <Stack divider={<Divider flexItem />} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
                                    {[...toReview, ...results.filter((item) => item.removed)].slice(0, SHOWN_RESULTS).map((item) => (
                                        <Stack key={item.id} direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.25, minWidth: 0 }}>
                                            <Avatar variant="rounded" src={item.imageUrl} sx={{ width: 48, height: 40, flexShrink: 0 }} />
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                                    {item.title || item.sourceUrl}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }} noWrap>
                                                    {[item.sourceName, reasonLabel(item)].filter(Boolean).join(" · ")}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                color={item.removed ? "error" : "warning"}
                                                label={
                                                    item.removed
                                                        ? tr("availability.removedChip", "Removed")
                                                        : tr("availability.reviewChip", "To review")
                                                }
                                                sx={{ flexShrink: 0, display: { xs: "none", sm: "inline-flex" } }}
                                            />
                                            <Tooltip title={tr("actions.openLink", "Open link")}>
                                                <IconButton size="small" component="a" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                                                    <OpenInNewRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {!item.removed && !running && (
                                                <Tooltip title={tr("availability.removeOne", "Remove this listing")}>
                                                    <span>
                                                        <IconButton size="small" color="error" onClick={() => removeIds([item.id])} disabled={removing}>
                                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    ))}
                                </Stack>
                                {results.length > SHOWN_RESULTS && (
                                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.75 }}>
                                        {tr("availability.moreResults", "And {{count}} more.", { count: results.length - SHOWN_RESULTS })}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Recent checks */}
                {history.length > 1 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {tr("availability.historyTitle", "Recent checks")}
                        </Typography>
                        <Stack divider={<Divider flexItem />}>
                            {history.slice(1).map((run) => (
                                <Stack
                                    key={run.id}
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={{ xs: 0.5, sm: 2 }}
                                    sx={{ py: 1, alignItems: { sm: "center" }, justifyContent: "space-between" }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                            {scopeLabel(run)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {formatDate(run.finishedAt || run.startedAt, locale)}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                            {tr("availability.historyLine", "{{removed}} removed of {{checked}} checked", {
                                                removed: run.removed,
                                                checked: run.checked,
                                            })}
                                        </Typography>
                                        {statusChip(run.status)}
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Stack>
        </SectionCard>
    );
}
