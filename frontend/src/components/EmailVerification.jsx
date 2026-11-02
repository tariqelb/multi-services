
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import axiosInstance from "../api/axiosInstance";
import { activeFormAction } from "../redux/actions/activeFormAction";
import { resetSignupForm } from "../redux/actions/signupAction";

function EmailVerification() {
    const dispatch = useDispatch();

    const email = useSelector((state) => state.signup.email);

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleCodeChange = (event) => {
        const value = event.target.value.replace(/\D/g, "").slice(0, 6);

        setCode(value);
        setError("");
    };

    const handleVerify = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (code.length !== 6) {
            setError("Please enter the complete 6-digit verification code.");
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post(
                "/auth/verify-email",
                {
                    email: email.trim().toLowerCase(),
                    code,
                }
            );

            setSuccess(
                response.data.message ||
                "Your email has been successfully verified."
            );

            dispatch(resetSignupForm());
            dispatch(activeFormAction("login"));
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Verification failed. Please check your code and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError("");
        setSuccess("");
        setResending(true);

        try {
            const response = await axiosInstance.post(
                "/auth/resend-code",
                {
                    email: email.trim().toLowerCase(),
                }
            );

            setCode("");

            setSuccess(
                response.data.message ||
                "A new verification code has been sent to your email."
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to resend the verification code."
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="m-0 w-full min-w-0 max-w-full rounded-2xl p-5 sm:p-8 md:p-10 lg:p-15">

            <h2 className="mb-3 text-center text-2xl font-bold text-black">
                Verify your email
            </h2>

            <p className="mb-6 text-center text-sm text-gray-600">
                We sent a 6-digit verification code to:
                <span className="mt-1 block break-all font-semibold text-black">
                    {email}
                </span>
            </p>

            <form
                onSubmit={handleVerify}
                className="flex w-full flex-col gap-4"
            >
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="verificationCode"
                        className="text-sm font-semibold text-gray-700"
                    >
                        Verification code
                    </label>

                    <input
                        id="verificationCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={handleCodeChange}
                        maxLength={6}
                        required
                        className="h-14 w-full rounded border border-gray-600 bg-white px-4 text-center text-2xl font-bold tracking-[0.5em] text-black outline-none transition-colors focus:border-teal-600"
                    />

                    <p className="text-xs text-gray-500">
                        The verification code expires after 10 minutes.
                    </p>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="break-words text-sm text-red-600"
                    >
                        {error}
                    </p>
                )}

                {success && (
                    <p
                        role="status"
                        className="break-words text-sm text-green-700"
                    >
                        {success}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="h-13 w-full rounded bg-teal-600 text-base font-bold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Verifying..." : "Verify email"}
                </button>
            </form>

            <div className="mt-5 text-center">
                <p className="text-sm text-gray-600">
                    Didn't receive the code?
                </p>

                <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resending}
                    className="mt-2 font-semibold text-teal-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {resending ? "Sending..." : "Resend verification code"}
                </button>
            </div>

            <div className="mt-5 text-center">
                <button
                    type="button"
                    onClick={() => dispatch(activeFormAction("signup"))}
                    className="text-sm text-gray-600 hover:text-teal-600"
                >
                    Back to signup
                </button>
            </div>
        </div>
    );
}

export default EmailVerification;
