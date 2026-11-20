import React from "react";
import { Stack, Alert } from "@mui/material";

import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";

import { FormSubmitBar } from "../../../Components/ui/FormKit";

export default function RoommatePublishSection({
    loading,
    profileLoading,
    profile,
    onSubmit,
    onReset,
    t,
}) {
    const translate = (key, fallback) => t(key, { defaultValue: fallback });

    const emailVerified = Boolean(profile?.emailVerified || profile?.isEmailVerified);
    const whatsappVerified = Boolean(profile?.whatsappVerified || profile?.whatsapp?.verified);
    const canPublish = emailVerified && whatsappVerified;

    return (
        <Stack spacing={2}>
            {!profileLoading && !canPublish && (
                <Alert severity="warning" variant="outlined">
                    {translate(
                        "roommates.form.verificationRequired",
                        "Please verify your email address and WhatsApp number before publishing."
                    )}
                </Alert>
            )}

            <FormSubmitBar
                title={translate("roommates.form.publishTitle", "Publish your announcement")}
                subtitle={translate(
                    "roommates.form.publishDescription",
                    "Review your information before publishing your roommate announcement."
                )}
                loading={loading}
                disabled={profileLoading || !canPublish}
                submitLabel={translate("roommates.form.publish", "Publish announcement")}
                loadingLabel={translate("roommates.form.publishing", "Publishing...")}
                submitIcon={<RocketLaunchOutlinedIcon />}
                onSubmit={onSubmit}
                onReset={onReset}
            />
        </Stack>
    );
}
