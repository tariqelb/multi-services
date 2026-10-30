

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, Stack, Typography } from "@mui/material";
import axiosInstance from "../../api/axiosInstance";
import { updateProfile } from "../../redux/actions/profile/profileAction";

import AccountProfile from "./AccountProfile";
import EmailNotifications from "./EmailNotifications";
import WhatsappNotifications from "./WhatsappNotifications";
import ChangePassword from "./ChangePassword";
import DeleteAccount from "./DeleteAccount";
import ContactVerification from "./ContactVerification";

const emptyProfile = {
    firstName: "",
    lastName: "",
    email: "",
    emailVerified: false,
    phoneNumber: "",
    phoneVerified: false,
    address: "",
    bio: "",
    profileImage: "",
};

const defaultPreferences = {
    email: {
        enabled: true,
        propertyAlerts: true,
    },
    whatsapp: {
        enabled: false,
        propertyAlerts: false,
        phoneNumber: "",
        verified: false,
        verificationCodeSent: false,
        verificationCode: "",
        sandboxCode: "",
        resendAfterSeconds: 0,
        verificationExpires: "",
    },
};

const errorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.message ||
    fallback;

const extractProfile = (responseData) => {
    let data = responseData;

    if (data?.user) data = data.user;
    else if (data?.profile) data = data.profile;
    else if (data?.data?.user) data = data.data.user;
    else if (data?.data?.profile) data = data.data.profile;
    else if (data?.data) data = data.data;

    return data && typeof data === "object" ? data : null;
};

const normalizeProfile = (data = {}) => ({
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    emailVerified: data.emailVerified ?? false,
    phoneNumber: data.phoneNumber ?? "",
    phoneVerified: data.phoneVerified ?? false,
    address: data.address ?? "",
    bio: data.bio ?? "",
    profileImage: data.profileImage ?? "",
});

const normalizeWhatsApp = (data = {}) => ({
    enabled: data.enabled ?? false,
    propertyAlerts: data.propertyAlerts ?? false,
    phoneNumber: data.phoneNumber ?? "",
    verified: data.verified === true,

    // These are temporary UI fields, not persisted preferences.
    verificationCodeSent: false,
    verificationCode: "",
    sandboxCode: "",
    resendAfterSeconds: 0,
    verificationExpires: "",
});

export default function SettingsPage() {
    const dispatch = useDispatch();

    const authUser = useSelector(
        (state) => state.loginForm?.user ?? state.auth?.user ?? {}
    );

    const [profile, setProfile] = useState(emptyProfile);
    const [savedProfile, setSavedProfile] = useState(null);
    const [profileImageChanged, setProfileImageChanged] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState("");

    const [preferences, setPreferences] = useState(defaultPreferences);
    const [preferencesLoading, setPreferencesLoading] = useState(true);
    const [emailSaving, setEmailSaving] = useState(false);
    const [whatsappSaving, setWhatsappSaving] = useState(false);
    const [preferencesError, setPreferencesError] = useState("");

    const [sendingCode, setSendingCode] = useState(false);
    const [confirmingCode, setConfirmingCode] = useState(false);

    const [notice, setNotice] = useState(null);

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    // const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deletionLoading, setDeletionLoading] = useState(false);
    const [deletionError, setDeletionError] = useState("");
    const [scheduledDeletionAt, setScheduledDeletionAt] = useState(null);

    const handleRequestDeletion = async () => {
        setDeletionLoading(true);
        setDeletionError("");

        try {
            const response = await axiosInstance.delete("/profile/me/account-deletion");

            setScheduledDeletionAt(response.data.scheduledDeletionAt);
            setDeleteConfirmation("");
            setDeleteDialogVisible(false);
        } catch (error) {
            setDeletionError(
                error.response?.data?.message ||
                    "Could not schedule account deletion."
            );
        } finally {
            setDeletionLoading(false);
        }
    };

    const handleCancelDeletion = async () => {
        setDeletionError("");

        try {
            await axiosInstance.post("/api/account/deletion/cancel");
            setScheduledDeletionAt(null);
        } catch (error) {
            setDeletionError(
                error.response?.data?.message ||
                    "Could not cancel account deletion."
            );

            throw error;
        }
    };

    const updateWhatsApp = useCallback((update) => {
        setPreferences((previous) => ({
            ...previous,
            whatsapp:
                typeof update === "function"
                    ? update(previous.whatsapp)
                    : { ...previous.whatsapp, ...update },
        }));
    }, []);

    const loadProfile = useCallback(async () => {
        setProfileLoading(true);
        setProfileError("");

        try {
            const response = await axiosInstance.get("/profile/me");
            const data = extractProfile(response.data);

            if (!data) {
                throw new Error("The server returned an empty profile.");
            }

            const normalized = normalizeProfile(data);
            setProfile(normalized);
            setSavedProfile(normalized);
            setProfileImageChanged(false);
        } catch (error) {
            setProfileError(
                errorMessage(error, "Unable to load your saved profile.")
            );
            setProfile(normalizeProfile(authUser));
        } finally {
            setProfileLoading(false);
        }
    }, [authUser]);

    const loadPreferences = useCallback(async () => {
        setPreferencesLoading(true);
        setPreferencesError("");

        try {
            const response = await axiosInstance.get(
                "/profile/me/notification-preferences"
            );

            const data = response.data?.preferences;

            if (!data) {
                throw new Error(
                    "The server did not return notification preferences."
                );
            }

            setPreferences((previous) => ({
                email: {
                    enabled:
                        data.email?.enabled ??
                        defaultPreferences.email.enabled,
                    propertyAlerts:
                        data.email?.propertyAlerts ??
                        defaultPreferences.email.propertyAlerts,
                },
                whatsapp: {
                    ...normalizeWhatsApp(data.whatsapp),
                    // Preserve an active verification form if preferences
                    // are refreshed while the user is working.
                    verificationCodeSent:
                        previous.whatsapp.verificationCodeSent,
                    verificationCode:
                        previous.whatsapp.verificationCode,
                    sandboxCode: previous.whatsapp.sandboxCode,
                    resendAfterSeconds:
                        previous.whatsapp.resendAfterSeconds,
                    verificationExpires:
                        previous.whatsapp.verificationExpires,
                },
            }));
        } catch (error) {
            setPreferencesError(
                errorMessage(
                    error,
                    "Unable to load notification preferences."
                )
            );
        } finally {
            setPreferencesLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    // Email verification
    const sendEmailVerificationCode = useCallback(async () => {
        const response = await axiosInstance.post(
            "/profile/me/verification/email/send"
        );
        return response.data;
    }, []);

    const confirmEmailVerificationCode = useCallback(
        async (code) => {
            const response = await axiosInstance.post(
                "/profile/me/verification/email/confirm",
                { code }
            );
            await loadProfile();
            return response.data;
        },
        [loadProfile]
    );

    // Account phone verification
    const sendPhoneVerificationCode = useCallback(async () => {
        const response = await axiosInstance.post(
            "/profile/me/verification/phone/send"
        );
        return response.data;
    }, []);

    const resendPhoneVerificationCode = useCallback(async () => {
        const response = await axiosInstance.post(
            "/profile/me/verification/phone/resend"
        );
        return response.data;
    }, []);

    const confirmPhoneVerificationCode = useCallback(
        async (code) => {
            const response = await axiosInstance.post(
                "/profile/me/verification/phone/confirm",
                { code }
            );
            await loadProfile();
            return response.data;
        },
        [loadProfile]
    );

    const saveProfile = async (event) => {
        event.preventDefault();
        setProfileError("");
        setNotice(null);

        if (!savedProfile) {
            setProfileError("Your saved profile has not loaded yet.");
            return;
        }

        const payload = {};

        for (const field of [
            "firstName",
            "lastName",
            "email",
            "phoneNumber",
            "address",
            "bio",
        ]) {
            const newValue = (profile[field] ?? "").trim();
            const oldValue = (savedProfile[field] ?? "").trim();

            if (newValue !== oldValue) {
                payload[field] =
                    field === "email" ? newValue.toLowerCase() : newValue;
            }
        }

        if (
            profileImageChanged &&
            profile.profileImage !== (savedProfile.profileImage ?? "")
        ) {
            payload.profileImage = profile.profileImage;
        }

        if (!Object.keys(payload).length) {
            setProfileError("No changes to save.");
            return;
        }

        if (
            "email" in payload &&
            (payload.email.length > 254 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
        ) {
            setProfileError("Please enter a valid email address.");
            return;
        }

        if (
            "firstName" in payload &&
            (payload.firstName.length < 2 ||
                payload.firstName.length > 50)
        ) {
            setProfileError("First name must contain 2–50 characters.");
            return;
        }

        if (
            "lastName" in payload &&
            (payload.lastName.length < 2 ||
                payload.lastName.length > 50)
        ) {
            setProfileError("Last name must contain 2–50 characters.");
            return;
        }

        if (
            "phoneNumber" in payload &&
            payload.phoneNumber &&
            !/^\+[1-9]\d{6,14}$/.test(payload.phoneNumber)
        ) {
            setProfileError(
                "Enter a valid international phone number, including its country code."
            );
            return;
        }

        if ("address" in payload && payload.address.length > 300) {
            setProfileError("Address cannot exceed 300 characters.");
            return;
        }

        if ("bio" in payload && payload.bio.length > 1000) {
            setProfileError("Biography cannot exceed 1000 characters.");
            return;
        }

        setProfileSaving(true);

        try {
            await dispatch(updateProfile(payload)).unwrap();
            await loadProfile();

            setNotice({
                type: "success",
                message: "Profile updated successfully.",
            });
        } catch (error) {
            setProfileError(
                errorMessage(error, "Unable to update your profile.")
            );
        } finally {
            setProfileSaving(false);
        }
    };

    const saveEmailPreferences = async () => {
        setEmailSaving(true);
        setPreferencesError("");
        setNotice(null);

        try {
            const response = await axiosInstance.patch(
                "/profile/me/notification-preferences",
                { email: preferences.email }
            );

            const saved = response.data?.preferences?.email;

            if (saved) {
                setPreferences((previous) => ({
                    ...previous,
                    email: {
                        enabled: saved.enabled ?? true,
                        propertyAlerts: saved.propertyAlerts ?? true,
                    },
                }));
            }

            setNotice({
                type: "success",
                message:
                    response.data?.message ||
                    "Email preferences saved successfully.",
            });
        } catch (error) {
            const message = errorMessage(
                error,
                "Unable to save email preferences."
            );
            setPreferencesError(message);
            setNotice({ type: "error", message });
        } finally {
            setEmailSaving(false);
        }
    };

    const handleSendWhatsAppVerification = async () => {
        const whatsapp = preferences.whatsapp;
        const phoneNumber = whatsapp.phoneNumber?.trim() ?? "";

        if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
            setPreferencesError(
                "Enter a valid international number, such as +212612345678."
            );
            return;
        }

        setSendingCode(true);
        setPreferencesError("");
        setNotice(null);

        try {
            const response = await axiosInstance.post(
                "/profile/me/verification/whatsapp/send",
                { phoneNumber }
            );

            const data = response.data ?? {};

            updateWhatsApp((previous) => ({
                ...previous,
                phoneNumber,
                verified: false,
                enabled: false,
                propertyAlerts: false,
                verificationCodeSent: true,
                verificationCode: "",

                // The backend should include this only for sandbox requests.
                sandboxCode:
                    import.meta.env.DEV && data.sandbox
                        ? data.sandboxCode ?? ""
                        : "",
                resendAfterSeconds: data.resendAfterSeconds ?? 60,
                verificationExpires: data.expiresAt ?? "",
            }));

            setNotice({
                type: "success",
                message:
                    data.message ||
                    "Verification request accepted. Check WhatsApp if live delivery is enabled.",
            });

            // Safe metadata only: never log phone numbers or verification codes.
            console.info("[WhatsApp UI] Verification request accepted", {
                status: response.status,
                sandbox: data.sandbox === true,
                sandboxCodeReturned: Boolean(data.sandboxCode),
                resendAfterSeconds: data.resendAfterSeconds,
            });
        } catch (error) {
            const message = errorMessage(
                error,
                "Unable to send the WhatsApp verification code."
            );

            setPreferencesError(message);
            setNotice({ type: "error", message });
        } finally {
            setSendingCode(false);
        }
    };

    const handleConfirmWhatsAppVerification = async () => {
        const code = preferences.whatsapp.verificationCode?.trim() ?? "";

        if (!/^\d{6}$/.test(code)) {
            setPreferencesError("Enter the 6-digit verification code.");
            return;
        }

        setConfirmingCode(true);
        setPreferencesError("");
        setNotice(null);

        try {
            const response = await axiosInstance.post(
                "/profile/me/verification/whatsapp/confirm",
                { code }
            );

            const saved = response.data?.preferences?.whatsapp;

            if (
                response.data?.verified === false ||
                saved?.verified === false
            ) {
                throw new Error(
                    "The server did not confirm WhatsApp verification."
                );
            }

            updateWhatsApp((previous) => ({
                ...previous,
                ...(saved ?? {}),
                verified: true,
                enabled: false,
                propertyAlerts: false,
                verificationCodeSent: false,
                verificationCode: "",
                sandboxCode: "",
            }));

            setNotice({
                type: "success",
                message:
                    "WhatsApp number verified successfully. You can now enable notifications.",
            });
        } catch (error) {
            const message = errorMessage(
                error,
                "Unable to verify your WhatsApp number."
            );

            setPreferencesError(message);
            setNotice({ type: "error", message });
        } finally {
            setConfirmingCode(false);
        }
    };

    const saveWhatsappPreferences = async () => {
        const whatsapp = preferences.whatsapp;

        if (
            whatsapp.enabled &&
            (!whatsapp.phoneNumber.trim() || !whatsapp.verified)
        ) {
            setNotice({
                type: "error",
                message:
                    "Verify your WhatsApp number before enabling notifications.",
            });
            return;
        }

        setWhatsappSaving(true);
        setPreferencesError("");
        setNotice(null);

        try {
            const response = await axiosInstance.put(
                "/profile/me/verification/whatsapp",
                {
                    enabled: whatsapp.enabled,
                    propertyAlerts: whatsapp.propertyAlerts,
                    phoneNumber: whatsapp.phoneNumber.trim(),
                }
            );

            const saved = response.data?.preferences?.whatsapp;

            if (saved) {
                updateWhatsApp((previous) => ({
                    ...previous,
                    enabled: saved.enabled ?? false,
                    propertyAlerts: saved.propertyAlerts ?? false,
                    phoneNumber: saved.phoneNumber ?? "",
                    verified: saved.verified === true,
                }));
            }

            setNotice({
                type: "success",
                message:
                    response.data?.message ||
                    "WhatsApp preferences saved successfully.",
            });
        } catch (error) {
            const message = errorMessage(
                error,
                "Unable to save WhatsApp preferences."
            );
            setPreferencesError(message);
            setNotice({ type: "error", message });
        } finally {
            setWhatsappSaving(false);
        }
    };

    const changePassword = async (event) => {
        event.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = passwords;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Please fill in all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "Your new password must contain at least 8 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("The new passwords do not match.");
            return;
        }

        if (newPassword === currentPassword) {
            setPasswordError(
                "Your new password must be different from your current password."
            );
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await axiosInstance.patch(
                "/profile/me/password",
                { currentPassword, newPassword, confirmPassword }
            );

            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setPasswordSuccess(
                response.data?.message || "Password updated successfully."
            );
        } catch (error) {
            setPasswordError(
                errorMessage(error, "Unable to update your password.")
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    const confirmDeleteAccount = () => {
        setNotice({
            type: deleteConfirmation === "DELETE" ? "warning" : "error",
            message:
                deleteConfirmation === "DELETE"
                    ? "Account deletion is not connected yet. Implement a secure backend deletion endpoint before enabling this action."
                    : 'Type "DELETE" to confirm account deletion.',
        });
    };

    return (
        <Box
            sx={{
                width: "100%",
                px: { xs: 2.5, md: 5 },
                py: { xs: 4, md: 6 },
            }}
        >
            <Box mb={5}>
                <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{
                        color: "#064e3b",
                        mb: 1,
                        fontSize: { xs: "2rem", md: "2.35rem" },
                    }}
                >
                    Settings
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{ fontSize: "1.05rem" }}
                >
                    Manage your profile, notification preferences, and
                    account security.
                </Typography>
            </Box>

            {notice && (
                <Alert
                    severity={notice.type}
                    onClose={() => setNotice(null)}
                    sx={{ mb: 4, py: 1.5 }}
                >
                    {notice.message}
                </Alert>
            )}

            <Stack spacing={4}>
                <AccountProfile
                    profile={profile}
                    setProfile={setProfile}
                    profileLoading={profileLoading}
                    profileSaving={profileSaving}
                    profileError={profileError}
                    savedProfile={savedProfile}
                    onSave={saveProfile}
                    onRetry={loadProfile}
                    onNotice={setNotice}
                    onImageChanged={setProfileImageChanged}
                />

                <ContactVerification
                    email={profile.email}
                    emailVerified={profile.emailVerified}
                    phoneNumber={profile.phoneNumber}
                    phoneVerified={profile.phoneVerified}
                    onSendEmailCode={sendEmailVerificationCode}
                    onConfirmEmailCode={confirmEmailVerificationCode}
                    onSendPhoneCode={sendPhoneVerificationCode}
                    onResendPhoneCode={resendPhoneVerificationCode}
                    onConfirmPhoneCode={confirmPhoneVerificationCode}
                />

                <EmailNotifications
                    settings={preferences.email}
                    setSettings={(update) =>
                        setPreferences((previous) => ({
                            ...previous,
                            email:
                                typeof update === "function"
                                    ? update(previous.email)
                                    : update,
                        }))
                    }
                    loading={preferencesLoading}
                    saving={emailSaving}
                    error={preferencesError}
                    onSave={saveEmailPreferences}
                    onRetry={loadPreferences}
                />

                <WhatsappNotifications
                    settings={preferences.whatsapp}
                    setSettings={updateWhatsApp}
                    loading={preferencesLoading}
                    saving={whatsappSaving}
                    error={preferencesError}
                    onSave={saveWhatsappPreferences}
                    onSendVerification={handleSendWhatsAppVerification}
                    onConfirmVerification={handleConfirmWhatsAppVerification}
                    sendingCode={sendingCode}
                    confirmingCode={confirmingCode}
                />

                <ChangePassword
                    passwords={passwords}
                    setPasswords={setPasswords}
                    error={passwordError}
                    success={passwordSuccess}
                    loading={passwordLoading}
                    onSubmit={changePassword}
                />

                <DeleteAccount
                    confirmation={deleteConfirmation}
                    setConfirmation={setDeleteConfirmation}
                    visible={deleteDialogVisible}
                    setVisible={setDeleteDialogVisible}
                    onConfirm={handleRequestDeletion}
                    onCancelDeletion={handleCancelDeletion}
                    scheduledDeletionAt={scheduledDeletionAt}
                    loading={deletionLoading}
                    error={deletionError}
                />
            </Stack>
        </Box>
    );
}
