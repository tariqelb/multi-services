
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    DeleteOutlineOutlined,
    CalendarMonthOutlined,
    RestoreOutlined,
} from "@mui/icons-material";

export default function DeleteAccount({
    confirmation = "",
    setConfirmation = () => {},
    visible = false,
    setVisible = () => {},
    onConfirm,
    onCancelDeletion,
    scheduledDeletionAt = null,
    loading = false,
    error = "",
}) {
    const { t } = useTranslation();
    const [cancelLoading, setCancelLoading] = useState(false);

    const isPending = Boolean(scheduledDeletionAt);

    const formattedDeletionDate = scheduledDeletionAt
        ? new Date(scheduledDeletionAt).toLocaleString(undefined, {
              dateStyle: "long",
              timeStyle: "short",
          })
        : "";

    const handleConfirm = async () => {
        if (confirmation.trim() !== "DELETE" || loading) {
            return;
        }

        await onConfirm?.();
    };

    const handleCancelDeletion = async () => {
        if (!onCancelDeletion || cancelLoading) {
            return;
        }

        setCancelLoading(true);

        try {
            await onCancelDeletion();
            setConfirmation("");
            setVisible(false);
        } finally {
            setCancelLoading(false);
        }
    };

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: "16px",
                borderColor: isPending ? "#fcd34d" : "#fecaca",
            }}
        >
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack
                    direction="row"
                    spacing={2.5}
                    alignItems="center"
                    sx={{ mb: 4 }}
                >
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "10px",
                            bgcolor: isPending ? "#fef3c7" : "#fef2f2",
                            color: isPending ? "#92400e" : "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {isPending ? (
                            <CalendarMonthOutlined sx={{ fontSize: 26 }} />
                        ) : (
                            <DeleteOutlineOutlined sx={{ fontSize: 26 }} />
                        )}
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mb: 0.5 }}
                        >
                            {t("settings.deleteAccount.title")}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {t(
                                isPending
                                    ? "settings.deleteAccount.pendingSubtitle"
                                    : "settings.deleteAccount.subtitle"
                            )}
                        </Typography>
                    </Box>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {isPending ? (
                    <Stack spacing={3}>
                        <Alert severity="warning">
                            {t("settings.deleteAccount.scheduledMessage", {
                                date: formattedDeletionDate,
                            })}
                        </Alert>

                        <Typography variant="body2" color="text.secondary">
                            {t("settings.deleteAccount.permanentDeletionInfo")}
                        </Typography>

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={
                                cancelLoading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <RestoreOutlined />
                                )
                            }
                            onClick={handleCancelDeletion}
                            disabled={
                                cancelLoading || !onCancelDeletion
                            }
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1.25,
                                px: 3,
                                borderRadius: "10px",
                                alignSelf: "flex-start",
                            }}
                        >
                            {cancelLoading
                                ? t("settings.deleteAccount.cancelling")
                                : t("settings.deleteAccount.cancelRequest")}
                        </Button>
                    </Stack>
                ) : !visible ? (
                    <Stack spacing={2}>
                        <Alert severity="warning" sx={{ py: 1.5 }}>
                            {t("settings.deleteAccount.warning")}
                        </Alert>

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineOutlined />}
                            onClick={() => setVisible(true)}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1.25,
                                px: 3,
                                borderRadius: "10px",
                                alignSelf: "flex-start",
                            }}
                        >
                            {t("settings.deleteAccount.deleteButton")}
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={3}>
                        <Alert severity="error">
                            {t("settings.deleteAccount.confirmationWarning")}
                        </Alert>

                        <Typography variant="body1">
                            {t("settings.deleteAccount.confirmationInstruction")}{" "}
                            <strong>DELETE</strong>
                        </Typography>

                        <TextField
                            label={t("settings.deleteAccount.confirmationLabel")}
                            value={confirmation}
                            onChange={(event) =>
                                setConfirmation(event.target.value)
                            }
                            fullWidth
                            disabled={loading}
                            autoComplete="off"
                        />

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2.5}
                        >
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={
                                    loading ? (
                                        <CircularProgress
                                            size={18}
                                            color="inherit"
                                        />
                                    ) : (
                                        <DeleteOutlineOutlined />
                                    )
                                }
                                onClick={handleConfirm}
                                disabled={
                                    loading ||
                                    confirmation.trim() !== "DELETE"
                                }
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    py: 1.25,
                                    px: 3,
                                    borderRadius: "10px",
                                }}
                            >
                                {loading
                                    ? t("settings.deleteAccount.scheduling")
                                    : t("settings.deleteAccount.confirmButton")}
                            </Button>

                            <Button
                                variant="outlined"
                                disabled={loading}
                                onClick={() => {
                                    setVisible(false);
                                    setConfirmation("");
                                }}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    py: 1.25,
                                    px: 3,
                                    borderRadius: "10px",
                                }}
                            >
                                {t("settings.deleteAccount.cancel")}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
