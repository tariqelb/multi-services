import React, { useEffect, useState } from "react";
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

function VerificationStatus({ verified }) {
    return (
        <Chip
            size="small"
            icon={verified ? <CheckIcon /> : <CircleIcon />}
            label={verified ? "Verified" : "Not verified"}
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
    const [step, setStep] = useState("initial");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const isEmail = type === "email";
    const label = isEmail ? "Email address" : "Phone number";
    const Icon = isEmail
        ? EmailOutlinedIcon
        : PhoneAndroidOutlinedIcon;

    // Reset the verification form if the contact changes or becomes verified.
    useEffect(() => {
        setStep("initial");
        setCode("");
        setError("");
        setMessage("");
    }, [value, verified]);

    async function handleSendCode(isResend = false) {
        const callback = isResend ? onResendCode : onSendCode;

        if (!value) {
            setError(`Please add your ${label.toLowerCase()} first.`);
            return;
        }

        if (typeof callback !== "function") {
            setError("This verification action is not configured yet.");
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
                    ? "Verification code sent to your email."
                    : result?.sandboxCode
                      ? `Sandbox mode: use code ${result.sandboxCode}. No real SMS may be sent in sandbox mode.`
                      : isResend
                        ? "A new SMS verification code has been requested."
                        : "SMS verification code requested."
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Could not send the verification code. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirmCode() {
        if (!/^\d{6}$/.test(code)) {
            setError("Enter the 6-digit verification code.");
            return;
        }

        if (typeof onConfirmCode !== "function") {
            setError("Code confirmation is not configured yet.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            await onConfirmCode(code);
            setStep("initial");
            setCode("");
            setMessage("Your contact has been verified successfully.");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Invalid or expired code. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box
            sx={{
                p: 2.5,
                border: "1px solid #e5e7eb",
                borderRadius: 2.5,
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={2}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    gap={1.5}
                    sx={{ minWidth: 0 }}
                >
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            bgcolor: "#ecfdf5",
                            color: "#047857",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700}>
                            {label}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {value || `No ${label.toLowerCase()} added`}
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
                                color="text.secondary"
                                sx={{ mb: 1.5 }}
                            >
                                {isEmail
                                    ? "Step 1: Send a verification code to your email address."
                                    : "Step 1: Receive a verification code by SMS."}
                            </Typography>

                            <Button
                                variant="outlined"
                                onClick={() => handleSendCode(false)}
                                disabled={!value || loading}
                            >
                                {loading ? (
                                    <CircularProgress size={20} />
                                ) : isEmail ? (
                                    "Send email code"
                                ) : (
                                    "Send SMS code"
                                )}
                            </Button>
                        </>
                    ) : (
                        <Stack spacing={2}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Step 2: Enter the 6-digit code we sent you.
                            </Typography>

                            <TextField
                                label="Verification code"
                                value={code}
                                onChange={(event) =>
                                    setCode(
                                        event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                inputProps={{
                                    inputMode: "numeric",
                                    maxLength: 6,
                                    autoComplete: "one-time-code",
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
                                    sx={{
                                        bgcolor: "#047857",
                                        "&:hover": {
                                            bgcolor: "#065f46",
                                        },
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress
                                            size={20}
                                            color="inherit"
                                        />
                                    ) : (
                                        "Confirm code"
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
                                    Resend code
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
                                    Cancel
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
    onSendEmailCode,
    onConfirmEmailCode,
    onSendPhoneCode,
    onResendPhoneCode,
    onConfirmPhoneCode,
}) {
    const allVerified = emailVerified && phoneVerified;

    return (
        <Box
            sx={{
                p: 3,
                border: "1px solid #e5e7eb",
                borderRadius: 3,
                bgcolor: "white",
            }}
        >
            <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
                <VerifiedUserOutlinedIcon
                    sx={{ color: "#047857", fontSize: 30 }}
                />
                <Typography variant="h6" fontWeight={800}>
                    Contact verification
                </Typography>
            </Stack>
            
            <Box sx={{ pt : 2 , pb: 2}}>
                <Typography color="text.secondary" mb={3}>
                    Verify your email and phone number to help secure
                    your account and prepare to publish properties.
                </Typography>
            </Box>

            {allVerified && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Both contact methods are verified.
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
            </Stack>
        </Box>
    );
}