import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import CheckIcon from "@mui/icons-material/Check";
import CircleIcon from "@mui/icons-material/Circle";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

function VerificationStatus({ verified }) {
    const { t } = useTranslation();

    return (
        <Chip
            size="small"
            icon={verified ? <CheckIcon /> : <CircleIcon />}
            label={
                verified
                    ? t("settings.verification.verified")
                    : t("settings.verification.notVerified")
            }
            color={verified ? "success" : "warning"}
            variant="outlined"
        />
    );
}

function VerificationStep({
    type,
    value,
    verified,
    onSendCode,
    onResendCode,
    onConfirmCode,
}) {
    const { t } = useTranslation();

    const [step, setStep] = useState("initial");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const isEmail = type === "email";
    const isWhatsApp = type === "whatsapp";

    const label = isEmail
        ? t("settings.verification.emailAddress")
        : isWhatsApp
          ? t("settings.verification.whatsappNumber", "WhatsApp number")
          : t("settings.verification.phoneNumber");

    const Icon = isEmail
        ? EmailOutlinedIcon
        : isWhatsApp
          ? WhatsAppIcon
          : PhoneAndroidOutlinedIcon;

    useEffect(() => {
        setStep("initial");
        setCode("");
        setError("");
        setMessage("");
    }, [value, verified]);

    async function handleSendCode(isResend = false) {
        const callback = isResend ? onResendCode : onSendCode;

        if (!value) {
            setError(
                t("settings.verification.addContact", {
                    contact: label.toLowerCase(),
                })
            );
            return;
        }

        if (typeof callback !== "function") {
            setError(t("settings.verification.actionNotConfigured"));
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const result = await callback();

            setStep("code");

            setMessage(
                isEmail
                    ? t("settings.verification.emailCodeSent")
                    : isWhatsApp && !result?.sandboxCode
                      ? t("settings.verification.whatsappCodeSent", "We sent a code to your WhatsApp.")
                      : result?.sandboxCode
                      ? t("settings.verification.sandboxCodeMessage", {
                            code: result.sandboxCode,
                        })
                      : isResend
                        ? t("settings.verification.smsCodeResent")
                        : t("settings.verification.smsCodeSent")
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    t("settings.verification.sendCodeError")
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirmCode() {
        if (!/^\d{6}$/.test(code)) {
            setError(t("settings.verification.invalidCode"));
            return;
        }

        if (typeof onConfirmCode !== "function") {
            setError(t("settings.verification.confirmNotConfigured"));
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            await onConfirmCode(code);
            setStep("initial");
            setCode("");
            setMessage(t("settings.verification.contactVerified"));
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    t("settings.verification.invalidOrExpiredCode")
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box
            sx={{
                p: 2.5,
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
            }}
        >
            <Stack
                direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}
            >
                <Stack
                    direction="row"
                    sx={{ alignItems: "center", gap: 1.5, minWidth: 0 }}
                >
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            bgcolor: "#EFF6FF",
                            color: "#1D4ED8",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }}>
                            {label}
                        </Typography>

                        <Typography
                            sx={{ color: "text.secondary", overflowWrap: "anywhere" }}
                        >
                            {value ||
                                (isWhatsApp
                                    ? t(
                                          "settings.verification.noWhatsapp",
                                          "Add your WhatsApp number in your profile above."
                                      )
                                    : t("settings.verification.noContact", {
                                          contact: label.toLowerCase(),
                                      }))}
                        </Typography>
                    </Box>
                </Stack>

                <VerificationStatus verified={verified} />
            </Stack>

            {message && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {!verified && (
                <Box sx={{ mt: 2 }}>
                    {step === "initial" ? (
                        <>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mb: 1.5 }}
                            >
                                {isEmail
                                    ? t("settings.verification.emailStepOne")
                                    : isWhatsApp
                                      ? t(
                                            "settings.verification.whatsappStepOne",
                                            "We will send a 6-digit code to this number on WhatsApp."
                                        )
                                      : t("settings.verification.phoneStepOne")}
                            </Typography>

                            <Button
                                variant="outlined"
                                onClick={() => handleSendCode(false)}
                                disabled={!value || loading}
                            >
                                {loading ? (
                                    <CircularProgress size={20} />
                                ) : isEmail ? (
                                    t("settings.verification.sendEmailCode")
                                ) : isWhatsApp ? (
                                    t("settings.verification.sendWhatsappCode", "Send WhatsApp code")
                                ) : (
                                    t("settings.verification.sendSmsCode")
                                )}
                            </Button>
                        </>
                    ) : (
                        <Stack spacing={2}>
                            <Typography
                                variant="body2" sx={{ color: "text.secondary" }}
                            >
                                {t("settings.verification.stepTwo")}
                            </Typography>

                            <TextField
                                label={t("settings.verification.codeLabel")}
                                value={code}
                                onChange={(event) =>
                                    setCode(
                                        event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                slotProps={{
                                    htmlInput: {
                                        inputMode: "numeric",
                                        maxLength: 6,
                                        autoComplete: "one-time-code",
                                    },
                                }}
                                fullWidth
                            />

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                            >
                                <Button
                                    variant="contained"
                                    onClick={handleConfirmCode}
                                    disabled={loading || code.length !== 6}
                                >
                                    {loading ? (
                                        <CircularProgress
                                            size={20}
                                            color="inherit"
                                        />
                                    ) : (
                                        t("settings.verification.confirmCode")
                                    )}
                                </Button>

                                <Button
                                    onClick={() => handleSendCode(true)}
                                    disabled={loading}
                                >
                                    {loading && (
                                        <CircularProgress
                                            size={16}
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    {t("settings.verification.resendCode")}
                                </Button>

                                <Button
                                    onClick={() => {
                                        setStep("initial");
                                        setCode("");
                                        setError("");
                                        setMessage("");
                                    }}
                                    disabled={loading}
                                >
                                    {t("settings.verification.cancel")}
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </Box>
            )}
        </Box>
    );
}

export default function ContactVerification({
    email,
    emailVerified = false,
    phoneNumber,
    phoneVerified = false,
    whatsappNumber,
    whatsappVerified = false,
    onSendWhatsAppCode,
    onConfirmWhatsAppCode,
    onSendEmailCode,
    onConfirmEmailCode,
    onSendPhoneCode,
    onResendPhoneCode,
    onConfirmPhoneCode,
}) {
    const { t } = useTranslation();

    const allVerified = emailVerified && phoneVerified && whatsappVerified;

    return (
        <Box
            sx={{
                p: 3,
                border: "1px solid #E2E8F0",
                borderRadius: "16px",
                bgcolor: "white",
            }}
        >
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mb: 1 }}>
                <VerifiedUserOutlinedIcon
                    sx={{ color: "#1D4ED8", fontSize: 30 }}
                />

                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("settings.verification.title")}
                </Typography>
            </Stack>

            <Box sx={{ pt: 2, pb: 2 }}>
                <Typography sx={{ color: "text.secondary", mb: 3 }}>
                    {t("settings.verification.subtitle")}
                </Typography>
            </Box>

            {allVerified && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {t("settings.verification.allVerified")}
                </Alert>
            )}

            <Stack spacing={2}>
                <VerificationStep
                    type="email"
                    value={email}
                    verified={emailVerified}
                    onSendCode={onSendEmailCode}
                    onConfirmCode={onConfirmEmailCode}
                />

                <VerificationStep
                    type="phone"
                    value={phoneNumber}
                    verified={phoneVerified}
                    onSendCode={onSendPhoneCode}
                    onResendCode={onResendPhoneCode || onSendPhoneCode}
                    onConfirmCode={onConfirmPhoneCode}
                />

                <VerificationStep
                    type="whatsapp"
                    value={whatsappNumber}
                    verified={whatsappVerified}
                    onSendCode={onSendWhatsAppCode}
                    onResendCode={onSendWhatsAppCode}
                    onConfirmCode={onConfirmWhatsAppCode}
                />
            </Stack>
        </Box>
    );
}