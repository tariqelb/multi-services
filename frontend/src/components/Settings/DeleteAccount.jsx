
import React, { useState } from "react";
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
    confirmation,
    setConfirmation,
    visible,
    setVisible,
    onConfirm,
    onCancelDeletion,
    scheduledDeletionAt = null,
    loading = false,
    error = "",
}) {
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
                borderRadius: 3.5,
                borderColor: isPending ? "#fcd34d" : "#fecaca",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
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
                            borderRadius: 2.5,
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
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                            Delete Account
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {isPending
                                ? "Your account is scheduled for deletion."
                                : "Schedule permanent removal of your account and associated data."}
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
                            Your account is scheduled for deletion on{" "}
                            <strong>{formattedDeletionDate}</strong>.
                            If you log in before this deadline, your deletion
                            request will be cancelled automatically.
                        </Alert>

                        <Typography variant="body2" color="text.secondary">
                            After the deadline, your account and associated
                            data will be permanently deleted by the scheduled
                            cleanup process.
                        </Typography>

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={
                                cancelLoading ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <RestoreOutlined />
                                )
                            }
                            onClick={handleCancelDeletion}
                            disabled={cancelLoading || !onCancelDeletion}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1.25,
                                px: 3,
                                borderRadius: 2.5,
                                alignSelf: "flex-start",
                            }}
                        >
                            Cancel deletion request
                        </Button>
                    </Stack>
                ) : !visible ? (
                    <Stack spacing={2}>
                        <Alert severity="warning" sx={{ py: 1.5 }}>
                            Your account will be scheduled for permanent
                            deletion 30 days after you confirm. Logging in
                            during this period cancels the request.
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
                                borderRadius: 2.5,
                                alignSelf: "flex-start",
                            }}
                        >
                            Delete my account
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={3}>
                        <Alert severity="error">
                            This action schedules the deletion of your account
                            and associated data. You can cancel by logging in
                            within 30 days.
                        </Alert>

                        <Typography variant="body1">
                            To confirm your request, type{" "}
                            <strong>DELETE</strong> below.
                        </Typography>

                        <TextField
                            label={'Type "DELETE" to confirm'}
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
                                    borderRadius: 2.5,
                                }}
                            >
                                {loading
                                    ? "Scheduling..."
                                    : "Confirm deletion request"}
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
                                    borderRadius: 2.5,
                                }}
                            >
                                Cancel
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
