
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import axiosInstance from "../api/axiosInstance";
import { activeFormAction } from "../redux/actions/activeFormAction";

import {
    setSignupFirstName,
    setSignupLastName,
    setSignupEmail,
    setSignupPassword,
    setSignupConfirmPassword,
} from "../redux/actions/signupAction";

import { Visibility, VisibilityOff } from "@mui/icons-material";

function SignUpForm() {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [validation, setValidation] = useState({});

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        firstName = "",
        lastName = "",
        email = "",
        password = "",
        confirmPassword = "",
    } = useSelector((state) => state.signup);

    const handleLogin = () => {
        dispatch(activeFormAction("login"));
    };

    const validateForm = () => {
        const errors = {};

        if (firstName.trim().length < 2) {
            errors.firstName = t("auth.validation.firstName");
        }

        if (lastName.trim().length < 2) {
            errors.lastName = t("auth.validation.lastName");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.email = t("auth.validation.email");
        }

        if (password.length < 8) {
            errors.password = t("auth.validation.password");
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = t("auth.validation.confirmPassword");
        }

        setValidation(errors);

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setError("");

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await axiosInstance.post("/auth/signup", {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                password,
                confirmPassword,
            });

            console.log("Signup successful:", response.data);

            setValidation({});

            // Display the email verification component.
            dispatch(activeFormAction("verify"));

        } catch (error) {
            console.error("Signup error:", error);

            setError(
                error.response?.data?.message ||
                t("auth.signupError")
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field) =>
        `h-13 w-full min-w-0 rounded-[10px] border bg-white px-3 text-base text-black outline-none transition-colors focus:border-blue-600 ${
            validation[field]
                ? "border-red-500"
                : "border-gray-300"
        }`;

    const passwordInputClass = (field) =>
        `${inputClass(field)} pr-12`;

    return (
        <div className="m-0 w-full min-w-0 max-w-full rounded-2xl p-5 sm:p-8 md:p-10 lg:p-15">

            {/* Title */}
            <h2 className="mb-5 text-center text-2xl font-bold text-black">
                {t("auth.signupTitle")}
            </h2>

            <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-4"
            >

                {/* First name */}
                <div className="flex min-w-0 flex-col gap-1">
                    <input
                        type="text"
                        placeholder={t("auth.firstNamePlaceholder")}
                        value={firstName}
                        required
                        minLength={2}
                        autoComplete="given-name"
                        onChange={(event) => {
                            dispatch(
                                setSignupFirstName(event.target.value)
                            );

                            setValidation((prev) => ({
                                ...prev,
                                firstName: "",
                            }));
                        }}
                        className={inputClass("firstName")}
                    />

                    <span className="text-sm text-red-600">
                        {validation.firstName || ""}
                    </span>
                </div>

                {/* Last name */}
                <div className="flex min-w-0 flex-col gap-1">
                    <input
                        type="text"
                        placeholder={t("auth.lastNamePlaceholder")}
                        value={lastName}
                        required
                        minLength={2}
                        autoComplete="family-name"
                        onChange={(event) => {
                            dispatch(
                                setSignupLastName(event.target.value)
                            );

                            setValidation((prev) => ({
                                ...prev,
                                lastName: "",
                            }));
                        }}
                        className={inputClass("lastName")}
                    />

                    <span className="text-sm text-red-600">
                        {validation.lastName || ""}
                    </span>
                </div>

                {/* Email */}
                <div className="flex min-w-0 flex-col gap-1">
                    <input
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={email}
                        required
                        autoComplete="email"
                        onChange={(event) => {
                            dispatch(
                                setSignupEmail(event.target.value)
                            );

                            setValidation((prev) => ({
                                ...prev,
                                email: "",
                            }));
                        }}
                        className={inputClass("email")}
                    />

                    <span className="text-sm text-red-600">
                        {validation.email || ""}
                    </span>
                </div>

                {/* Password */}
                <div className="flex min-w-0 flex-col gap-1">
                    <div className="relative w-full">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.createPasswordPlaceholder")}
                            value={password}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            onChange={(event) => {
                                dispatch(
                                    setSignupPassword(event.target.value)
                                );

                                setValidation((prev) => ({
                                    ...prev,
                                    password: "",
                                    confirmPassword: "",
                                }));
                            }}
                            className={passwordInputClass("password")}
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

                    <span className="text-sm text-red-600">
                        {validation.password || ""}
                    </span>
                </div>

                {/* Confirm password */}
                <div className="flex min-w-0 flex-col gap-1">
                    <div className="relative w-full">
                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder={t("auth.confirmPasswordPlaceholder")}
                            value={confirmPassword}
                            required
                            autoComplete="new-password"
                            onChange={(event) => {
                                dispatch(
                                    setSignupConfirmPassword(
                                        event.target.value
                                    )
                                );

                                setValidation((prev) => ({
                                    ...prev,
                                    confirmPassword: "",
                                }));
                            }}
                            className={passwordInputClass(
                                "confirmPassword"
                            )}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? t("auth.hideConfirmPassword")
                                    : t("auth.showConfirmPassword")
                            }
                            aria-pressed={showConfirmPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600"
                        >
                            {showConfirmPassword ? (
                                <VisibilityOff fontSize="small" />
                            ) : (
                                <Visibility fontSize="small" />
                            )}
                        </button>
                    </div>

                    <span className="text-sm text-red-600">
                        {validation.confirmPassword || ""}
                    </span>
                </div>

                {/* API error */}
                {error && (
                    <p
                        role="alert"
                        className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 text-base font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {loading
                        ? t("auth.sendingVerification")
                        : t("auth.continue")}
                </button>
            </form>

            {/* Login link */}
            <p className="mt-4 text-center text-base text-black">
                {t("auth.alreadyAccount")}{" "}

                <button
                    type="button"
                    onClick={handleLogin}
                    className="text-blue-600 hover:underline"
                >
                    {t("auth.loginLink")}
                </button>
            </p>
        </div>
    );
}

export default SignUpForm;
