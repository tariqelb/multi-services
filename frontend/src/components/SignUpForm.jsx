
import axiosInstance from "../api/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { activeFormAction } from "../redux/actions/activeFormAction";
import { useState } from "react";

import { Visibility, VisibilityOff } from "@mui/icons-material";

import {
    setSignupFirstName,
    setSignupLastName,
    setSignupEmail,
    setSignupPassword,
    setSignupConfirmPassword,
    resetSignupForm,
} from "../redux/actions/signupAction";

function SignUpForm() {
    const dispatch = useDispatch();

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [validation, setValidation] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
    } = useSelector((state) => state.signup);

    const handleLogin = () => {
        dispatch(activeFormAction("login"));
    };

    const validateForm = () => {
        const errors = {};

        if (firstName.trim().length < 2) {
            errors.firstName =
                "First name must contain at least 2 characters.";
        }

        if (lastName.trim().length < 2) {
            errors.lastName =
                "Last name must contain at least 2 characters.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.email = "Please enter a valid email address.";
        }

        if (password.length < 8) {
            errors.password =
                "Password must contain at least 8 characters.";
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
        }

        setValidation(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await axiosInstance.post("/auth/signup", {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                confirmPassword,
            });

            setSuccess(
                response.data.message || "Account created successfully."
            );

            dispatch(resetSignupForm());
            setValidation({});
            handleLogin();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to create your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field) =>
        `h-13 w-full min-w-0 rounded border bg-white px-3 text-base text-black outline-none transition-colors focus:border-teal-600 ${
            validation[field]
                ? "border-red-500"
                : "border-gray-600"
        }`;

    const passwordInputClass = (field) =>
        `${inputClass(field)} pr-12`;

    return (
        <div className="m-0 w-full min-w-0 max-w-full rounded-2xl p-5 sm:p-8 md:p-10 lg:p-15">
            <h2 className="mb-5 text-center text-2xl font-bold text-black">
                Signup
            </h2>

            <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-4"
            >
                {/* First name */}
                <div className="flex min-w-0 flex-col gap-1">
                    <input
                        type="text"
                        placeholder="Enter your first name"
                        value={firstName}
                        required
                        minLength={2}
                        autoComplete="given-name"
                        onChange={(event) => {
                            dispatch(setSignupFirstName(event.target.value));
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
                        placeholder="Enter your last name"
                        value={lastName}
                        required
                        minLength={2}
                        autoComplete="family-name"
                        onChange={(event) => {
                            dispatch(setSignupLastName(event.target.value));
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
                        placeholder="Enter your email"
                        value={email}
                        required
                        autoComplete="email"
                        onChange={(event) => {
                            dispatch(setSignupEmail(event.target.value));
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
                            placeholder="Create a password"
                            value={password}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            onChange={(event) => {
                                dispatch(setSignupPassword(event.target.value));
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
                                showPassword ? "Hide password" : "Show password"
                            }
                            aria-pressed={showPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-600"
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
                                showConfirmPassword ? "text" : "password"
                            }
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            required
                            autoComplete="new-password"
                            onChange={(event) => {
                                dispatch(
                                    setSignupConfirmPassword(event.target.value)
                                );
                                setValidation((prev) => ({
                                    ...prev,
                                    confirmPassword: "",
                                }));
                            }}
                            className={passwordInputClass("confirmPassword")}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? "Hide confirm password"
                                    : "Show confirm password"
                            }
                            aria-pressed={showConfirmPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-600"
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

                {/* API messages */}
                {error && (
                    <p role="alert" className="break-words text-sm text-red-600">
                        {error}
                    </p>
                )}

                {success && (
                    <p role="status" className="break-words text-sm text-green-700">
                        {success}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="h-13 w-full rounded bg-teal-600 text-base font-bold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Creating account..." : "Signup"}
                </button>
            </form>

            {/* Login link */}
            <p className="mt-4 text-center text-base text-black">
                Already have an account?{" "}
                <button
                    type="button"
                    onClick={handleLogin}
                    className="text-teal-600 hover:underline"
                >
                    Login
                </button>
            </p>
        </div>
    );
}

export default SignUpForm;
