
import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function Password() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordMessageType, setPasswordMessageType] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordMessageType("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage("Please fill in all password fields.");
            setPasswordMessageType("error");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage(
                "Your new password must contain at least 8 characters."
            );
            setPasswordMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage("The new passwords do not match.");
            setPasswordMessageType("error");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordMessage(
                "Your new password must be different from your current password."
            );
            setPasswordMessageType("error");
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await axiosInstance.patch(
                "/profile/me/password",
                {
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }
            );

            setPasswordMessage(
                response.data?.message ||
                    "Password updated successfully."
            );
            setPasswordMessageType("success");
        } catch (err) {
            console.error(
                "Password update error:",
                err.response?.data || err
            );

            setPasswordMessage(
                err.response?.data?.message ||
                    (err.response
                        ? `Request failed (${err.response.status}).`
                        : "Unable to connect to the server. Check your API connection.")
            );
            setPasswordMessageType("error");
        } finally {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordLoading(false);
        }
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Change password
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Update your password securely using your current password.
                </p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-5">
                    <div>
                        <label
                            htmlFor="currentPassword"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Current password
                        </label>

                        <input
                            id="currentPassword"
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) =>
                                setCurrentPassword(event.target.value)
                            }
                            disabled={passwordLoading}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="newPassword"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            New password
                        </label>

                        <input
                            id="newPassword"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) =>
                                setNewPassword(event.target.value)
                            }
                            disabled={passwordLoading}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Confirm new password
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            disabled={passwordLoading}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                        />
                    </div>
                </div>

                {passwordMessage && (
                    <p
                        role={
                            passwordMessageType === "error"
                                ? "alert"
                                : "status"
                        }
                        aria-live="polite"
                        className={`mt-4 text-sm ${
                            passwordMessageType === "success"
                                ? "text-green-700"
                                : "text-red-600"
                        }`}
                    >
                        {passwordMessage}
                    </p>
                )}

                <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
                    <button
                        type="submit"
                        disabled={passwordLoading}
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {passwordLoading ? "Updating..." : "Update password"}
                    </button>
                </div>
            </form>
        </section>
    );
}