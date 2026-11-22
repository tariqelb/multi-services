// Admin: suspend or reactivate a user (user details page).
//
// Suspended users cannot log in, are signed out everywhere and their
// publications are hidden from visitors.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouteLoaderData } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    TextField,
} from "@mui/material";

import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";

import axiosInstance from "../../../../../api/axiosInstance";

/** Action button (header). */
export function UserSuspensionButton({ user, onChanged }) {
    const { t } = useTranslation();
    const currentUser = useRouteLoaderData("dashboard-layout");

    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [notify, setNotify] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    if (!user?._id) return null;

    const isSelf = String(currentUser?._id || currentUser?.id) === String(user._id);
    const isAdmin = String(user.role || "").toLowerCase() === "admin";
    const suspended = user.accountStatus === "suspended";

    // Admins (and yourself) cannot be suspended; reactivation stays possible.
    if (isSelf || (isAdmin && !suspended)) return null;

    const handleOpen = () => {
        setReason("");
        setNotify(true);
        setError("");
        setOpen(true);
    };

    const handleConfirm = async () => {
        if (!suspended && !reason.trim()) {
            setError(t("userSuspension.reasonRequired", "Please give a reason."));
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response = await axiosInstance.patch(
                `/dashboard/users/${user._id}/status`,
                {
                    status: suspended ? "active" : "suspended",
                    reason: reason.trim(),
                    notify,
                }
            );

            onChanged?.(response.data?.user || {}, response.data);
            setOpen(false);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    t("userSuspension.error", "Could not change the account status.")
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Button
                variant={suspended ? "contained" : "outlined"}
                color={suspended ? "success" : "error"}
                startIcon={suspended ? <LockOpenOutlinedIcon /> : <BlockOutlinedIcon />}
                onClick={handleOpen}
                sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
            >
                {suspended
                    ? t("userSuspension.reactivate", "Reactivate account")
                    : t("userSuspension.suspend", "Suspend account")}
            </Button>

            <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {suspended
                        ? t("userSuspension.reactivateTitle", "Reactivate this account?")
                        : t("userSuspension.suspendTitle", "Suspend this account?")}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {suspended
                            ? t(
                                  "userSuspension.reactivateText",
                                  "The user can log in again and their publications become visible again."
                              )
                            : t(
                                  "userSuspension.suspendText",
                                  "The user is signed out everywhere, cannot log in, and their publications are hidden from visitors. Nothing is deleted."
                              )}
                    </DialogContentText>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {!suspended && (
                        <TextField
                            autoFocus
                            fullWidth
                            multiline
                            minRows={2}
                            label={t("userSuspension.reason", "Reason")}
                            placeholder={t("userSuspension.reasonPlaceholder", "e.g. Fake listings, repeated reports")}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            helperText={t("userSuspension.reasonHelp", "The user sees this reason when trying to log in.")}
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                        />
                    )}

                    <FormControlLabel
                        sx={{ mt: 1 }}
                        control={<Checkbox checked={notify} onChange={(event) => setNotify(event.target.checked)} />}
                        label={t("userSuspension.notify", "Send an email to the user")}
                    />
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpen(false)} disabled={saving}>
                        {t("userSuspension.cancel", "Cancel")}
                    </Button>
                    <Button
                        variant="contained"
                        color={suspended ? "success" : "error"}
                        onClick={handleConfirm}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {suspended
                            ? t("userSuspension.confirmReactivate", "Reactivate")
                            : t("userSuspension.confirmSuspend", "Suspend")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

/** Banner shown on a suspended user's page. */
export function UserSuspensionBanner({ user, locale }) {
    const { t } = useTranslation();

    if (user?.accountStatus !== "suspended") return null;

    const date = user.suspendedAt
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(user.suspendedAt)
          )
        : "";

    return (
        <Alert severity="error" icon={<BlockOutlinedIcon />} sx={{ mb: 3 }}>
            <Box sx={{ fontWeight: 700 }}>
                {date
                    ? t("userSuspension.bannerSince", "Account suspended since {{date}}", { date })
                    : t("userSuspension.banner", "Account suspended")}
            </Box>
            {user.suspendedReason && (
                <Box>
                    {t("userSuspension.reason", "Reason")}: {user.suspendedReason}
                </Box>
            )}
        </Alert>
    );
}
