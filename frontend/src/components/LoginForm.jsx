
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Visibility, VisibilityOff } from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";

import {
    setLoginEmail,
    setLoginPassword,
    loginRequest,
    loginSuccess,
    loginFailure,
    clearLoginStatus,
} from "../redux/actions/loginFormAction";

import { activeFormAction } from "../redux/actions/activeFormAction";

function LoginForm() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { t } = useTranslation();

    const emailRef = useRef("");
    const passwordRef = useRef(null);

    const [showPassword, setShowPassword] = useState(false);

    const { loading, error } = useSelector(
        (state) => state.loginForm
    );

    const user = useSelector((state) => state.auth.user);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        dispatch(clearLoginStatus());
        dispatch(loginRequest());

        try {
            const response = await axiosInstance.post("/auth/login", {
                email: emailRef.current.trim(),
                password: passwordRef.current.value,
            });

            dispatch(
                loginSuccess({
                    user: response.data.user,
                    token: response.data.token,
                })
            );

            passwordRef.current.value = "";
            passwordRef.current.blur();

            dispatch(setLoginPassword(""));

            navigate("/");
        } catch (error) {
            dispatch(
                loginFailure(
                    error.response?.data?.message ||
                    t("auth.loginError")
                )
            );
        }
    };

    const handleSignup = () => {
        dispatch(clearLoginStatus());
        dispatch(activeFormAction("signup"));
    };

    return (
        <div className="mx-auto w-full min-w-0 max-w-lg rounded-2xl p-4 sm:p-6 md:p-10">

            {/* Title */}
            <h2 className="mb-5 text-center text-xl font-bold text-black">
                {t("auth.loginTitle")}
            </h2>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 sm:gap-6"
            >
                {/* Email */}
                <input
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    autoComplete="email"
                    required
                    onChange={(event) => {
                        emailRef.current = event.target.value;

                        dispatch(setLoginEmail(event.target.value));
                    }}
                    className="h-13 w-full min-w-0 rounded-[10px] border border-gray-300 bg-white px-3 text-base text-black outline-none focus:border-blue-600"
                />

                {/* Password */}
                <div className="relative w-full">
                    <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.passwordPlaceholder")}
                        autoComplete="current-password"
                        required
                        onChange={(event) => {
                            dispatch(setLoginPassword(event.target.value));
                        }}
                        className="h-13 w-full min-w-0 rounded-[10px] border border-gray-300 bg-white px-3 pr-12 text-base text-black outline-none focus:border-blue-600"
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword((prev) => !prev)
                        }
                        aria-label={
                            showPassword
                                ? t("auth.hidePassword")
                                : t("auth.showPassword")
                        }
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600"
                    >
                        {showPassword ? (
                            <VisibilityOff fontSize="small" />
                        ) : (
                            <Visibility fontSize="small" />
                        )}
                    </button>
                </div>

                {/* Login status */}
                {loading && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700"
                    >
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />

                        <span>
                            {t("auth.loggingIn")}
                        </span>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div
                        role="alert"
                        className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {/* Logged-in user */}
                {user && (
                    <p className="break-words text-sm text-green-700">
                        {t("auth.welcomeUser", {
                            name: user.firstName,
                        })}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {loading
                        ? t("auth.loggingIn")
                        : t("auth.loginButton")}
                </button>
            </form>

            {/* Signup */}
            <p className="mt-4 text-center text-sm text-black sm:text-base">
                {t("auth.noAccount")}{" "}

                <button
                    type="button"
                    onClick={handleSignup}
                    className="font-medium text-blue-600 hover:underline"
                >
                    {t("auth.signupLink")}
                </button>
            </p>
        </div>
    );
}

export default LoginForm;
