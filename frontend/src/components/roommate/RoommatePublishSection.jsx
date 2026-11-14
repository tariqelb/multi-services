
import React from "react";
import {
    Paper,
    Stack,
    Button,
    Typography,
    Alert,
    CircularProgress,
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function RoommatePublishSection({
    loading,
    profileLoading,
    profile,
    onSubmit,
    t,
}) {
    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const emailVerified = Boolean(
        profile?.emailVerified ||
        profile?.isEmailVerified
    );

    const whatsappVerified = Boolean(
        profile?.whatsappVerified ||
        profile?.whatsapp?.verified
    );

    const canPublish = emailVerified && whatsappVerified;

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                    {translate(
                        "roommates.form.publishTitle",
                        "Publish your announcement"
                    )}
                </Typography>

                <Typography color="text.secondary">
                    {translate(
                        "roommates.form.publishDescription",
                        "Review your information before publishing your roommate announcement."
                    )}
                </Typography>

                {!profileLoading && !canPublish && (
                    <Alert severity="warning">
                        {translate(
                            "roommates.form.verificationRequired",
                            "Please verify your email address and WhatsApp number before publishing."
                        )}
                    </Alert>
                )}

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={onSubmit}
                    disabled={
                        loading ||
                        profileLoading ||
                        !canPublish
                    }
                    startIcon={
                        loading ? (
                            <CircularProgress
                                size={20}
                                color="inherit"
                            />
                        ) : (
                            <CloudUploadIcon />
                        )
                    }
                >
                    {loading
                        ? translate(
                              "roommates.form.publishing",
                              "Publishing..."
                          )
                        : translate(
                              "roommates.form.publish",
                              "Publish announcement"
                          )}
                </Button>
            </Stack>
        </Paper>
    );
}
