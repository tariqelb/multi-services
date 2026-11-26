// "Remove listings that are not vehicles" section of the vehicle External
// Listing Sources page.
//
// General classifieds websites (Maroc Annuaire, Maroc Annonces...) also
// publish apartments and villas. The collector now skips them, and this
// section removes the ones saved before. "Find" only counts them; "Remove"
// deletes them and remembers them so they are never collected again.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Chip, CircularProgress, Link, Stack, Typography } from "@mui/material";
import CleaningServicesOutlinedIcon from "@mui/icons-material/CleaningServicesOutlined";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";

import axiosInstance from "../../../api/axiosInstance";
import { API } from "./externalOptions";
import { SectionCard } from "./sourcesUi";

const REASON_KEYS = {
    property: ["vehicleExternal.cleanup.reasons.property", "Real estate"],
    "no-title": ["vehicleExternal.cleanup.reasons.noTitle", "No real title"],
    "not-vehicle": ["vehicleExternal.cleanup.reasons.notVehicle", "Not a vehicle"],
};

export default function VehicleNonVehicleCleanup({ disabled = false, onFinished }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const run = async (dryRun) => {
        setLoading(dryRun ? "find" : "remove");
        setError("");
        try {
            const response = await axiosInstance.post(`${API}/cleanup`, { dryRun });
            setResult(response.data);
            if (!dryRun) onFinished?.();
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("vehicleExternal.cleanup.failed", "The cleanup failed."));
        } finally {
            setLoading("");
        }
    };

    const found = result?.found || 0;

    return (
        <SectionCard
            id="non-vehicle-cleanup"
            title={t("vehicleExternal.cleanup.title", "Remove listings that are not vehicles")}
            subtitle={t(
                "vehicleExternal.cleanup.subtitle",
                "General classifieds websites also publish apartments and villas. New collections skip them; this removes the ones saved before and stops them from coming back."
            )}
        >
            <Stack spacing={1.5}>
                {error && (
                    <Alert severity="error" onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <Button
                        variant="outlined"
                        startIcon={loading === "find" ? <CircularProgress size={16} /> : <ManageSearchRoundedIcon />}
                        disabled={Boolean(loading) || disabled}
                        onClick={() => run(true)}
                    >
                        {t("vehicleExternal.cleanup.find", "Find them")}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={loading === "remove" ? <CircularProgress size={16} color="inherit" /> : <CleaningServicesOutlinedIcon />}
                        disabled={Boolean(loading) || disabled || !result?.dryRun || !found}
                        onClick={() => run(false)}
                    >
                        {t("vehicleExternal.cleanup.remove", "Remove {{count}} listings", { count: found })}
                    </Button>
                </Stack>

                {result && (
                    <Alert severity={result.dryRun ? (found ? "warning" : "success") : "success"}>
                        {result.dryRun
                            ? found
                                ? t("vehicleExternal.cleanup.foundSome", "{{found}} of {{checked}} listings are not vehicles.", { found, checked: result.checked })
                                : t("vehicleExternal.cleanup.foundNone", "All {{checked}} listings are vehicles.", { checked: result.checked })
                            : t("vehicleExternal.cleanup.removed", "{{count}} listings removed.", { count: result.removed })}
                    </Alert>
                )}

                {result?.dryRun && found > 0 && (
                    <Box>
                        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 0.75, mb: 1 }}>
                            {Object.entries(result.bySite || {}).map(([site, count]) => (
                                <Chip key={site} size="small" variant="outlined" label={`${site} · ${count}`} />
                            ))}
                        </Stack>
                        <Stack spacing={0.5}>
                            {(result.examples || []).map((item) => {
                                const [key, fallback] = REASON_KEYS[item.reason] || REASON_KEYS["not-vehicle"];
                                return (
                                    <Typography key={item.sourceUrl} variant="body2" noWrap sx={{ color: "text.secondary" }}>
                                        <Chip size="small" label={t(key, fallback)} sx={{ mr: 1, height: 20, fontSize: 11 }} />
                                        <Link href={item.sourceUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                                            {item.title || item.sourceUrl}
                                        </Link>
                                    </Typography>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Stack>
        </SectionCard>
    );
}
