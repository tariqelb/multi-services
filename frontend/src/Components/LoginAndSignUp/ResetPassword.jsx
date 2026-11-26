
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import loginBackground from "../../assets/Login_backgound.jpeg";
import LoginLanguageSwitcher from "../language/LoginLanguageSwitcher";

import {
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";

import axiosInstance from "../../api/axiosInstance";

function ResetPassword() {
    const navigate = useNavigate();
    const { token } = useParams();
    const { t } = useTranslation();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        if (password.length < 8) {
            setStatus({
                type: "error",
                message: t("auth.passwordMinLength"),
            });
            return;
        }

        if (password !== confirmPassword) {
            setStatus({
                type: "error",
                message: t("auth.passwordMismatch"),
            });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const response = await axiosInstance.post(
                "/auth/reset-password",
                {
                    token,
                    password,
                    confirmPassword,
                }
            );

            setStatus({
                type: "success",
                message:
                    response.data?.message ||
                    t("auth.resetPassword.success"),
            });

            setPassword("");
            setConfirmPassword("");

            // Redirect to login after displaying success.
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1800);
        } catch (error) {
            setStatus({
                type: "error",
                message:
                    error.response?.data?.message ||
                    t("auth.resetPassword.error"),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8 sm:px-6"
            style={{ backgroundImage: `url(${loginBackground})` }}
        >
            {/* Language Switcher */}
            <div className="absolute right-4 top-4 z-20 sm:right-6">
                <LoginLanguageSwitcher />
            </div>

            {/* Reset Password Form */}
            <div className="w-full min-w-0 max-w-lg rounded-2xl border-2 border-white/50 bg-white/85 p-4 shadow-lg backdrop-blur-sm sm:p-6 md:p-10">
                <h2 className="mb-3 text-center text-xl font-bold text-black">
                    {t("auth.resetPassword.title")}
                </h2>

                <p className="mb-6 text-center text-sm leading-6 text-slate-600">
                    {t("auth.resetPassword.description")}
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5"
                >
                    {/* New password */}
                    <div className="relative w-full">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder={t("auth.resetPassword.newPassword")}
                            autoComplete="new-password"
                            minLength={8}
                            required
                            disabled={loading}
                            className="h-13 w-full rounded-[10px] border border-slate-300 bg-white px-3 pe-12 text-base text-black outline-none focus:border-blue-600 disabled:bg-slate-100"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((previous) => !previous)
                            }
                            aria-label={
                                showPassword
                                    ? t("auth.hidePassword")
                                    : t("auth.showPassword")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-600"
                        >
                            {showPassword
                                ? <VisibilityOff fontSize="small" />
                                : <Visibility fontSize="small" />}
                        </button>
                    </div>

                    {/* Confirm password */}
                    <div className="relative w-full">
                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            placeholder={t("auth.resetPassword.confirmPassword")}
                            autoComplete="new-password"
                            minLength={8}
                            required
                            disabled={loading}
                            className="h-13 w-full rounded-[10px] border border-slate-300 bg-white px-3 pe-12 text-base text-black outline-none focus:border-blue-600 disabled:bg-slate-100"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword((previous) => !previous)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? t("auth.hidePassword")
                                    : t("auth.showPassword")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-600"
                        >
                            {showConfirmPassword
                                ? <VisibilityOff fontSize="small" />
                                : <Visibility fontSize="small" />}
                        </button>
                    </div>

                    {status && (
                        <div
                            role={status.type === "error" ? "alert" : "status"}
                            aria-live="polite"
                            className={`rounded-lg border p-3 text-sm ${
                                status.type === "success"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                            }`}
                        >
                            {status.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-13 w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading
                            ? t("auth.resetPassword.saving")
                            : t("auth.resetPassword.submit")}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-6 w-full text-center text-sm font-medium text-blue-600 hover:underline"
                >
                    {t("auth.forgotPassword.backToLogin")}
                </button>
            </div>
        </div>
    );
}

export default ResetPassword;
