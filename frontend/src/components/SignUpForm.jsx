
import axiosInstance from "../api/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { activeFormAction } from "../redux/actions/activeFormAction";
import { useState } from "react";

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
        console.log(confirmPassword, password)

        if (firstName.trim().length < 2) {
            errors.firstName = "First name must contain at least 2 characters.";
        }

        if (lastName.trim().length < 2) {
            errors.lastName = "Last name must contain at least 2 characters.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.email = "Please enter a valid email address.";
        }

        if (password.length < 8) {
            errors.password = "Password must contain at least 8 characters.";
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

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post("/auth/signup", {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                confirmPassword,
            });

            console.log("user created")
            setSuccess(
                response.data.message || "Account created successfully."
            );
            dispatch(resetSignupForm());
            setValidation({});
            handleLogin();
        } catch (error) {
            console.log("The error", error)
            setError(
                error.response?.data?.message ||
                "Unable to create your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field) =>
        `h-13 rounded border bg-white px-3 text-md text-black outline-none focus:border-teal-600 ${
            validation[field] ? "border-red-500" : "border-gray-600"
        }`;

    return (
        <div className="m-0 min-w-lg rounded-2xl  p-15">
            <h2 className="mb-5 text-center text-2xl font-bold text-black">
                Signup
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <input
                        type="text"
                        placeholder="Enter your first name"
                        value={firstName}
                        required
                        minLength={2}
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

                <div className="flex flex-col gap-1">
                    <input
                        type="text"
                        placeholder="Enter your last name"
                        value={lastName}
                        required
                        minLength={2}
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

                <div className="flex flex-col gap-1">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        required
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

                <div className="flex flex-col gap-1">
                    <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        required
                        minLength={8}
                        onChange={(event) => {
                            dispatch(setSignupPassword(event.target.value));
                            setValidation((prev) => ({
                                ...prev,
                                password: "",
                                confirmPassword: "",
                            }));
                        }}
                        className={inputClass("password")}
                    />
                    <span className="text-sm text-red-600">
                        {validation.password || ""}
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        required
                        onChange={(event) => {
                            dispatch(
                                setSignupConfirmPassword(event.target.value)
                            );
                            setValidation((prev) => ({
                                ...prev,
                                confirmPassword: "",
                            }));
                        }}
                        className={inputClass("confirmPassword")}
                    />
                    <span className="text-sm text-red-600">
                        {validation.confirmPassword || ""}
                    </span>
                </div>

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                {success && (
                    <p role="status" className="text-sm text-green-700">
                        {success}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="h-13 rounded bg-teal-600 text-md font-bold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                    {loading ? "Creating account..." : "Signup"}
                </button>
            </form>

            <p className="mt-4 text-center text-[16px] text-black">
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