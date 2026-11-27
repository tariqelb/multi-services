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
    onCancel,
    isEdit = false,
    t,
}) {
    const translate = (key, fallback) => t(key, { defaultValue: fallback });

    const emailVerified = Boolean(profile?.emailVerified || profile?.isEmailVerified);
    const whatsappVerified = Boolean(profile?.whatsappVerified || profile?.whatsapp?.verified);
    // Editing an existing announcement needs no new verification.
    const canPublish = isEdit || (emailVerified && whatsappVerified);

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
                title={
                    isEdit
                        ? translate("roommates.edit.saveTitle", "Save your changes")
                        : translate("roommates.form.publishTitle", "Publish your announcement")
                }
                subtitle={
                    isEdit
                        ? translate("roommates.edit.saveDescription", "Your announcement is updated right away.")
                        : translate(
                            "roommates.form.publishDescription",
                            "Review your information before publishing your roommate announcement."
                        )
                }
                loading={loading}
                disabled={(!isEdit && profileLoading) || !canPublish}
                submitLabel={
                    isEdit
                        ? translate("roommates.edit.save", "Save changes")
                        : translate("roommates.form.publish", "Publish announcement")
                }
                loadingLabel={
                    isEdit
                        ? translate("roommates.edit.saving", "Saving...")
                        : translate("roommates.form.publishing", "Publishing...")
                }
                submitIcon={<RocketLaunchOutlinedIcon />}
                onSubmit={onSubmit}
                onReset={onReset}
                onCancel={onCancel}
                cancelLabel={translate("roommates.edit.cancel", "Cancel")}
            />
        </Stack>
    );
}
