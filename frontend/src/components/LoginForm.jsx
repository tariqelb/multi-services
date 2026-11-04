
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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

    const emailRef = useRef("");
    const passwordRef = useRef(null);

    const [showPassword, setShowPassword] = useState(false);

    const { loading, error } = useSelector(
        (state) => state.loginForm
    );

    const user = useSelector((state) => state.auth.user);

    const handleSubmit = async (event) => {
        event.preventDefault();

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
                    "Unable to log in. Please try again."
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
            <h2 className="mb-5 text-center text-xl font-bold text-black">
                Login
            </h2>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 sm:gap-6"
            >
                {/* Email */}
                <input
                    type="email"
                    placeholder="Enter your email"
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
                        placeholder="Enter your password"
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
                                ? "Hide password"
                                : "Show password"
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

                {/* Error */}
                {error && (
                    <p
                        role="alert"
                        className="break-words text-sm text-red-600"
                    >
                        {error}
                    </p>
                )}

                {/* Logged-in user */}
                {user && (
                    <p className="break-words text-sm text-green-700">
                        Welcome, {user.firstName}!
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="h-13 w-full rounded-[10px] bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            {/* Signup */}
            <p className="mt-4 text-center text-sm text-black sm:text-base">
                Don't have an account?{" "}
                <button
                    type="button"
                    onClick={handleSignup}
                    className="font-medium text-blue-600 hover:underline"
                >
                    Signup
                </button>
            </p>
        </div>
    );
}

export default LoginForm;
