
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
    const [loginStatus, setLoginStatus] = useState(null);

    const { loading, error } = useSelector(
        (state) => state.loginForm
    );

    const user = useSelector(
        (state) =>
            state.auth?.user ??
            state.loginForm?.user ??
            null
    );

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setLoginStatus(null);

        dispatch(clearLoginStatus());
        dispatch(loginRequest());

        try {
            const response = await axiosInstance.post("/auth/login", {
                email: emailRef.current.trim(),
                password: passwordRef.current?.value || "",
            });

            const loggedInUser = response.data.user;

            dispatch(
                loginSuccess({
                    user: loggedInUser,
                    token: response.data.token,
                })
            );

            setLoginStatus({
                type: "success",
                code: `HTTP ${response.status}`,
                title: "Login successful",
                message: `Welcome ${loggedInUser.firstName || "back"}! You are now logged in.`,
            });

            if (passwordRef.current) {
                passwordRef.current.value = "";
                passwordRef.current.blur();
            }

            dispatch(setLoginPassword(""));

            navigate("/");
        } catch (requestError) {
            const status = requestError.response?.status;
            const backendMessage =
                requestError.response?.data?.message;

            let code;
            let title;
            let message;

            if (requestError.response) {
                code = `HTTP ${status}`;

                if (status === 400) {
                    title = "Invalid request";
                    message =
                        backendMessage ||
                        "Please check the information you entered.";
                } else if (status === 401) {
                    title = "Authentication failed";
                    message =
                        backendMessage ||
                        "Your email or password is incorrect.";
                } else if (status === 403) {
                    title = "Access denied";
                    message =
                        backendMessage ||
                        "You are not allowed to log in.";
                } else if (status === 404) {
                    title = "Service not found";
                    message =
                        backendMessage ||
                        "The login endpoint could not be found.";
                } else if (status >= 500) {
                    title = "Server error";
                    message =
                        backendMessage ||
                        "Something went wrong on the server. Please try again later.";
                } else {
                    title = "Login failed";
                    message =
                        backendMessage ||
                        "The login request could not be completed.";
                }
            } else if (requestError.request) {
                code = "NETWORK ERROR";
                title = "Connection problem";
                message =
                    "Unable to connect to the server. Check your internet connection or try again later.";
            } else {
                code = "REQUEST ERROR";
                title = "Unexpected error";
                message =
                    requestError.message ||
                    "An unexpected error occurred.";
            }

            setLoginStatus({
                type: "error",
                code,
                title,
                message,
            });

            dispatch(loginFailure(message));

            console.error("Login failed:", {
                status,
                message,
                error: requestError.message,
            });
        }
    };

    const handleSignup = () => {
        setLoginStatus(null);
        dispatch(clearLoginStatus());
        dispatch(activeFormAction("signup"));
    };

    const statusStyles = {
        success: {
            container: "border-green-200 bg-green-50",
            badge: "bg-green-100 text-green-700",
            title: "text-green-800",
            message: "text-green-700",
            icon: "✓",
        },
        error: {
            container: "border-red-200 bg-red-50",
            badge: "bg-red-100 text-red-700",
            title: "text-red-800",
            message: "text-red-700",
            icon: "!",
        },
    };

    const statusStyle = loginStatus
        ? statusStyles[loginStatus.type]
        : null;

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
                    disabled={loading}
                    value={undefined}
                    onChange={(event) => {
                        emailRef.current = event.target.value;
                        dispatch(setLoginEmail(event.target.value));
                    }}
                    className="h-13 w-full min-w-0 rounded-[10px] border border-gray-300 bg-white px-3 text-base text-black outline-none transition-colors focus:border-blue-600 disabled:bg-gray-100"
                />

                {/* Password */}
                <div className="relative w-full">
                    <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.passwordPlaceholder")}
                        autoComplete="current-password"
                        required
                        disabled={loading}
                        onChange={(event) => {
                            dispatch(
                                setLoginPassword(event.target.value)
                            );
                        }}
                        className="h-13 w-full min-w-0 rounded-[10px] border border-gray-300 bg-white px-3 pr-12 text-base text-black outline-none transition-colors focus:border-blue-600 disabled:bg-gray-100"
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

                {/* Loading status */}
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

                {/* Login result status */}
                {loginStatus && !loading && (
                    <div
                        role={loginStatus.type === "error" ? "alert" : "status"}
                        aria-live="polite"
                        className={`rounded-lg border p-3 ${statusStyle.container}`}
                    >
                        <div className="flex items-start gap-3">

                            {/* Status icon */}
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${statusStyle.badge}`}>
                                {statusStyle.icon}
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <p className={`text-sm font-semibold ${statusStyle.title}`}>
                                        {loginStatus.title}
                                    </p>

                                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${statusStyle.badge}`}>
                                        {loginStatus.code}
                                    </span>
                                </div>

                                <p className={`break-words text-sm ${statusStyle.message}`}>
                                    {loginStatus.message}
                                </p>
                            </div>
                        </div>
                    </div>
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
