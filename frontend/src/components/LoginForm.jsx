import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

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

    const { loading, error } = useSelector(
        (state) => state.loginForm
    );

    const user = useSelector(
        (state) => state.auth.user
    );

    console.log("is user logged :", user);

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

            // Clear the password input.
            passwordRef.current.value = "";
            passwordRef.current.blur();

            // Clear the password from Redux.
            dispatch(setLoginPassword(""));

            console.log("User:", response.data.user);
            navigate("/");
        } catch (error) {
            console.log(error);

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
                <input
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    onChange={(event) => {
                        emailRef.current = event.target.value;
                        dispatch(setLoginEmail(event.target.value));
                    }}
                    className="h-12 w-full min-w-0 rounded border border-gray-300 bg-white px-3 text-base text-black outline-none focus:border-teal-600 sm:h-13"
                />

                <input
                    ref={passwordRef}
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    onChange={(event) => {
                        dispatch(setLoginPassword(event.target.value));
                    }}
                    className="h-12 w-full min-w-0 rounded border border-gray-300 bg-white px-3 text-base text-black outline-none focus:border-teal-600 sm:h-13"
                />

                {error && (
                    <p role="alert" className="break-words text-sm text-red-600">
                        {error}
                    </p>
                )}

                {user && (
                    <p className="break-words text-sm text-green-700">
                        Welcome, {user.firstName}!
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:h-13"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-black sm:text-base">
                Don't have an account?{" "}
                <button
                    type="button"
                    onClick={handleSignup}
                    className="font-medium text-teal-600 hover:underline"
                >
                    Signup
                </button>
            </p>
        </div>
    );
}

export default LoginForm;