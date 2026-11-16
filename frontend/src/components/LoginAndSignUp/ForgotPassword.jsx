
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import loginBackground from "../../assets/Login_backgound.jpeg";
import axiosInstance from "../../api/axiosInstance";
import LoginLanguageSwitcher from "../language/LoginLanguageSwitcher";

function ForgotPassword() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setLoading(true);
        setStatus(null);

        try {
            const response = await axiosInstance.post(
                "/auth/forgot-password",
                { email: email.trim() }
            );

            setStatus({
                type: "success",
                message:
                    response.data?.message ||
                    t("auth.forgotPassword.success"),
            });
        } catch (error) {
            setStatus({
                type: "error",
                message:
                    error.response?.data?.message ||
                    t("auth.forgotPassword.error"),
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

            {/* Forgot Password Form */}
            <div className="w-full min-w-0 max-w-lg rounded-2xl border-2 border-white/50 bg-white/85 p-4 shadow-lg backdrop-blur-sm sm:p-6 md:p-10">
                <h2 className="mb-3 text-center text-xl font-bold text-black">
                    {t("auth.forgotPassword.title")}
                </h2>

                <p className="mb-6 text-center text-sm leading-6 text-gray-600">
                    {t("auth.forgotPassword.description")}
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("auth.emailPlaceholder")}
                        autoComplete="email"
                        required
                        disabled={loading}
                        className="h-13 w-full rounded-[10px] border border-gray-300 bg-white px-3 text-base text-black outline-none transition-colors focus:border-blue-600 disabled:bg-gray-100"
                    />

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
                            ? t("auth.forgotPassword.sending")
                            : t("auth.forgotPassword.submit")}
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

export default ForgotPassword;
