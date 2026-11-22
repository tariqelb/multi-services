// src/Apps/Property/LoginAndSignUp/GoogleSignInButton.jsx
//
// "Continue with Google" (Google Identity Services, popup).
// Google gives an ID token; the backend checks it (POST /auth/google)
// and opens the same session as the email/password login.
//
// Hidden when VITE_GOOGLE_CLIENT_ID is not set.

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../api/axiosInstance";
import { loginFailure, loginSuccess } from "../../../redux/actions/loginFormAction";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise = null;

function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();

    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => {
                scriptPromise = null;
                reject(new Error("Google script failed to load"));
            };
            document.head.appendChild(script);
        });
    }

    return scriptPromise;
}

export default function GoogleSignInButton({ text = "continue_with" }) {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const containerRef = useRef(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const language = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);

    // Latest handler for the Google callback (set once at initialize).
    const handlerRef = useRef(null);

    handlerRef.current = async ({ credential }) => {
        if (!credential) return;

        setError("");
        setLoading(true);

        try {
            const response = await axiosInstance.post("/auth/google", {
                credential,
                language,
            });

            dispatch(
                loginSuccess({
                    user: response.data.user,
                    token: response.data.token,
                })
            );

            navigate("/");
        } catch (requestError) {
            const data = requestError.response?.data || {};

            const message =
                data.code === "ACCOUNT_SUSPENDED"
                    ? t("auth.suspended.message", "Your account has been suspended.")
                    : requestError.response?.status === 429
                        ? t("auth.tooManyAttempts.message", "Too many login attempts. Please wait 15 minutes and try again.")
                        : t(`auth.google.errors.${data.code}`, {
                            defaultValue: data.message || t("auth.google.failed", "Google sign-in failed. Please try again."),
                        });

            setError(message);
            dispatch(loginFailure(message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!CLIENT_ID) return undefined;

        let cancelled = false;

        loadGoogleScript()
            .then(() => {
                if (cancelled || !containerRef.current) return;

                window.google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: (response) => handlerRef.current?.(response),
                    ux_mode: "popup",
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                containerRef.current.innerHTML = "";

                window.google.accounts.id.renderButton(containerRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    shape: "rectangular",
                    text,
                    logo_alignment: "center",
                    locale: language,
                    width: Math.min(400, containerRef.current.offsetWidth || 320),
                });
            })
            .catch(() => {
                if (!cancelled) setError(t("auth.google.unavailable", "Google sign-in is not available right now."));
            });

        return () => {
            cancelled = true;
        };
    }, [language, text, t]);

    if (!CLIENT_ID) return null;

    return (
        <div className="mt-4">
            {/* "or" separator */}
            <div className="mb-4 flex items-center gap-3 text-xs font-medium uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                {t("auth.google.or", "or")}
                <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className={`flex justify-center ${loading ? "pointer-events-none opacity-60" : ""}`}>
                <div ref={containerRef} className="w-full max-w-[400px] flex justify-center" />
            </div>

            {error && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}
