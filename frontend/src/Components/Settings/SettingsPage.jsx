import React, { useCallback, useEffect, useState } from "react";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Alert, Stack } from "@mui/material";

import axiosInstance from "../../api/axiosInstance";
import { updateProfile } from "../../redux/actions/profile/profileAction";

import PageLayout from "../Home/PageLayout";
import AccountProfile from "./AccountProfile";
import SettingEmailNotifications from "./SettingEmailNotifications";
import WhatsappNotifications from "./WhatsappNotifications";
import ChangePassword from "./ChangePassword";
import DeleteAccount from "./DeleteAccount";
import ContactVerification from "./ContactVerification";
import ProfessionalProfileSettings from "./ProfessionalProfileSettings";
import PublicVisibilitySettings from "./PublicVisibilitySettings";
import SocialLinksSettings from "./SocialLinksSettings";

const emptyProfile = {
    firstName: "",
    lastName: "",
    email: "",
    emailVerified: false,
    phoneNumber: "",
    phoneVerified: false,
    whatsappNumber: "",
    whatsappVerified: false,
    address: "",
    bio: "",
    profileImage: "",
};

const defaultPreferences = {
    email: {
        enabled: true,
        propertyAlerts: true,
        vehicleAlerts: true,
    },
    // Switches only: the number is in the profile (whatsappNumber).
    whatsapp: {
        enabled: false,
        propertyAlerts: false,
        vehicleAlerts: false,
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
    whatsappNumber: data.whatsappNumber ?? "",
    whatsappVerified: data.whatsappVerified === true,
    address: data.address ?? "",
    bio: data.bio ?? "",
    profileImage: data.profileImage ?? "",
    // false: account created with Google, no password yet.
    hasPassword: data.hasPassword !== false,
});

const normalizeWhatsApp = (data = {}) => ({
    enabled: data.enabled ?? false,
    propertyAlerts: data.propertyAlerts ?? false,
    vehicleAlerts: data.vehicleAlerts ?? false,
});

export default function SettingsPage() {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const authUser = useSelector(
        (state) => state.auth?.user ?? state.loginForm?.user ?? null
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


    const [notice, setNotice] = useState(null);

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deletionLoading, setDeletionLoading] = useState(false);
    const [deletionError, setDeletionError] = useState("");
    const [scheduledDeletionAt, setScheduledDeletionAt] = useState(null);

    const handleRequestDeletion = async () => {
        setDeletionLoading(true);
        setDeletionError("");

        try {
            const response = await axiosInstance.delete(
                "/profile/me/account-deletion"
            );

            setScheduledDeletionAt(response.data.scheduledDeletionAt);
            setDeleteConfirmation("");
            setDeleteDialogVisible(false);
        } catch (error) {
            setDeletionError(
                error.response?.data?.message ||
                    t("settings.deletion.scheduleError")
            );
        } finally {
            setDeletionLoading(false);
        }
    };

    const handleCancelDeletion = async () => {
        setDeletionError("");

        try {
            await axiosInstance.post("/profile/me/account-deletion/cancel");
            setScheduledDeletionAt(null);
        } catch (error) {
            setDeletionError(
                error.response?.data?.message ||
                    t("settings.deletion.cancelError")
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
                throw new Error(t("settings.errors.emptyProfile"));
            }

            const normalized = normalizeProfile(data);

            setProfile(normalized);
            setSavedProfile(normalized);
            setProfileImageChanged(false);
        } catch (error) {
            setProfileError(
                errorMessage(error, t("settings.errors.loadProfile"))
            );
            setProfile(normalizeProfile(authUser));
        } finally {
            setProfileLoading(false);
        }
    }, [authUser, t]);

    const loadPreferences = useCallback(async () => {
        setPreferencesLoading(true);
        setPreferencesError("");

        try {
            const response = await axiosInstance.get(
                "/profile/me/notification-preferences"
            );

            const data = response.data?.preferences;

            if (!data) {
                throw new Error(t("settings.errors.emptyPreferences"));
            }

            setPreferences(() => ({
                email: {
                    enabled:
                        data.email?.enabled ??
                        defaultPreferences.email.enabled,
                    propertyAlerts:
                        data.email?.propertyAlerts ??
                        defaultPreferences.email.propertyAlerts,
                    vehicleAlerts:
                        data.email?.vehicleAlerts ??
                        defaultPreferences.email.vehicleAlerts,
                },
                whatsapp: normalizeWhatsApp(data.whatsapp),
            }));
        } catch (error) {
            setPreferencesError(
                errorMessage(error, t("settings.errors.loadPreferences"))
            );
        } finally {
            setPreferencesLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (!authUser) {
            setProfileLoading(false);
            setPreferencesLoading(false);

            setProfile(emptyProfile);
            setSavedProfile(null);
            setProfileError("");
            setPreferencesError("");

            return;
        }

        loadProfile();
        loadPreferences();
    }, [authUser, loadProfile, loadPreferences]);

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

    // WhatsApp number verification (the number is saved in the profile)
    const sendWhatsAppVerificationCode = useCallback(async () => {
        const response = await axiosInstance.post(
            "/profile/me/verification/whatsapp/send"
        );
        return response.data;
    }, []);

    const confirmWhatsAppVerificationCode = useCallback(
        async (code) => {
            const response = await axiosInstance.post(
                "/profile/me/verification/whatsapp/confirm",
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
            setProfileError(t("settings.profile.notLoaded"));
            return;
        }

        const payload = {};

        for (const field of [
            "firstName",
            "lastName",
            "email",
            "phoneNumber",
            "whatsappNumber",
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
            setProfileError(t("settings.profile.noChanges"));
            return;
        }

        if (
            "email" in payload &&
            (payload.email.length > 254 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
        ) {
            setProfileError(t("settings.validation.email"));
            return;
        }

        if (
            "firstName" in payload &&
            (payload.firstName.length < 2 ||
                payload.firstName.length > 50)
        ) {
            setProfileError(t("settings.validation.firstName"));
            return;
        }

        if (
            "lastName" in payload &&
            (payload.lastName.length < 2 ||
                payload.lastName.length > 50)
        ) {
            setProfileError(t("settings.validation.lastName"));
            return;
        }

        if (
            "phoneNumber" in payload &&
            payload.phoneNumber &&
            !/^\+[1-9]\d{6,14}$/.test(payload.phoneNumber)
        ) {
            setProfileError(t("settings.validation.phoneNumber"));
            return;
        }

        if (
            "whatsappNumber" in payload &&
            payload.whatsappNumber &&
            !/^\+[1-9]\d{6,14}$/.test(payload.whatsappNumber.replace(/[\s().-]/g, ""))
        ) {
            setProfileError(t("settings.validation.whatsappPhone"));
            return;
        }

        if ("address" in payload && payload.address.length > 300) {
            setProfileError(t("settings.validation.address"));
            return;
        }

        if ("bio" in payload && payload.bio.length > 1000) {
            setProfileError(t("settings.validation.bio"));
            return;
        }

        setProfileSaving(true);

        try {
            await dispatch(updateProfile(payload)).unwrap();
            await loadProfile();
            // A new WhatsApp number may switch WhatsApp notifications off.
            if ("whatsappNumber" in payload) await loadPreferences();

            setNotice({
                type: "success",
                message: t("settings.profile.updated"),
            });
        } catch (error) {
            setProfileError(
                errorMessage(error, t("settings.errors.updateProfile"))
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
                        vehicleAlerts: saved.vehicleAlerts ?? true,
                    },
                }));
            }

            setNotice({
                type: "success",
                message:
                    response.data?.message ||
                    t("settings.emailNotifications.saved"),
            });
        } catch (error) {
            const message = errorMessage(
                error,
                t("settings.emailNotifications.saveError")
            );

            setPreferencesError(message);
            setNotice({ type: "error", message });
        } finally {
            setEmailSaving(false);
        }
    };

    const saveWhatsappPreferences = async () => {
        const whatsapp = preferences.whatsapp;

        if (
            whatsapp.enabled &&
            (!profile.whatsappNumber?.trim() || !profile.whatsappVerified)
        ) {
            setNotice({
                type: "error",
                message: t("settings.whatsapp.verifyBeforeEnable"),
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
                    vehicleAlerts: whatsapp.vehicleAlerts,
                }
            );

            const saved = response.data?.preferences?.whatsapp;

            if (saved) {
                updateWhatsApp(normalizeWhatsApp(saved));
            }

            setNotice({
                type: "success",
                message:
                    response.data?.message ||
                    t("settings.whatsapp.saved"),
            });
        } catch (error) {
            const message = errorMessage(
                error,
                t("settings.whatsapp.saveError")
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

        const firstPassword = savedProfile?.hasPassword === false;

        if ((!firstPassword && !currentPassword) || !newPassword || !confirmPassword) {
            setPasswordError(t("settings.password.required"));
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(t("settings.password.minimumLength"));
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(t("settings.password.mismatch"));
            return;
        }

        if (!firstPassword && newPassword === currentPassword) {
            setPasswordError(t("settings.password.sameAsCurrent"));
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
                response.data?.message ||
                    t("settings.password.updated")
            );

            if (firstPassword) {
                setSavedProfile((previous) => (previous ? { ...previous, hasPassword: true } : previous));
            }
        } catch (error) {
            setPasswordError(
                errorMessage(error, t("settings.password.updateError"))
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
                    ? t("settings.deletion.notConnected")
                    : t("settings.deletion.typeDelete"),
        });
    };

    return (
        <PageLayout
            icon={<SettingsOutlinedIcon />}
            title={t("settings.title")}
            subtitle={t("settings.subtitle")}
        >
            {notice && (
                <Alert
                    severity={notice.type}
                    onClose={() => setNotice(null)}
                    sx={{ mb: 3, borderRadius: "10px" }}
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
                    whatsappNumber={savedProfile?.whatsappNumber ?? profile.whatsappNumber}
                    whatsappVerified={profile.whatsappVerified}
                    onSendWhatsAppCode={sendWhatsAppVerificationCode}
                    onConfirmWhatsAppCode={confirmWhatsAppVerificationCode}
                    onSendEmailCode={sendEmailVerificationCode}
                    onConfirmEmailCode={confirmEmailVerificationCode}
                    onSendPhoneCode={sendPhoneVerificationCode}
                    onResendPhoneCode={resendPhoneVerificationCode}
                    onConfirmPhoneCode={confirmPhoneVerificationCode}
                />

                <SettingEmailNotifications
                    settings={preferences.email}
                    setSettings={(update) =>
                        setPreferences((previous) => ({
                            ...previous,
                            email:
                                typeof update === "function"
                                    ? update(previous.email)
                                    : {
                                          ...previous.email,
                                          ...update,
                                      },
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
                    whatsappNumber={savedProfile?.whatsappNumber ?? ""}
                    whatsappVerified={profile.whatsappVerified}
                    loading={preferencesLoading}
                    saving={whatsappSaving}
                    error={preferencesError}
                    onSave={saveWhatsappPreferences}
                />

                {/* What visitors see on my public profiles */}
                <PublicVisibilitySettings />

                <SocialLinksSettings />

                {/* Owners, agencies, dealers: receive "I am looking for..." requests */}
                <ProfessionalProfileSettings />

                <ChangePassword
                    passwords={passwords}
                    setPasswords={setPasswords}
                    error={passwordError}
                    success={passwordSuccess}
                    loading={passwordLoading}
                    onSubmit={changePassword}
                    hasPassword={savedProfile?.hasPassword !== false}
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
        </PageLayout>
    );
}