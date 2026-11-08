
import axiosInstance from "../api/axiosInstance";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Menu,
    X,
    UserRound,
    Settings,
    LogOut,
    ChevronDown,
    Languages,
    Bell,
} from "lucide-react";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import logo from "../assets/iconlogo.png";
import { getProfile } from "../redux/actions/profile/profileAction";
import NotificationMenu from "./NotificationMenu";
import { connectSocket, disconnectSocket } from "../Socket/Socket";
import NotificationsPage from "./NotificationPage";

export default function TopBar({ sidebarOpen, setSidebarOpen }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [languageOpen, setLanguageOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [languageSaving, setLanguageSaving] = useState(false);

    const profileRef = useRef(null);
    const languageRef = useRef(null);
    const languageManuallyChanged = useRef(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { t, i18n } = useTranslation();

    const currentLanguage = i18n.resolvedLanguage || "en";

    const languages = [
        { code: "en", label: "English" },
        { code: "fr", label: "Français" },
        { code: "ar", label: "العربية" },
    ];

    // Get authenticated user and profile from Redux.
    const user = useSelector(
        (state) => state.auth?.user ?? state.loginForm?.user ?? null
    );

    const profile = useSelector((state) => state.profile);

    const isAuthenticated = Boolean(user);

    // Load the profile as soon as the user is authenticated.
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getProfile());
        }
    }, [isAuthenticated, dispatch]);

    // Apply the language saved in the user's profile.
    // Apply the saved language when the profile is loaded or updated.
    // Apply the saved language when the profile is loaded.
    useEffect(() => {
        if (!isAuthenticated || languageManuallyChanged.current) return;

        const savedLanguage =
            profile?.language ||
            profile?.user?.language;

        if (
            savedLanguage &&
            ["en", "fr", "ar"].includes(savedLanguage) &&
            savedLanguage !== (i18n.resolvedLanguage || "en")
        ) {
            i18n.changeLanguage(savedLanguage);
        }
    }, [
        isAuthenticated,
        profile?.language,
        profile?.user?.language,
        i18n,
    ]);

    // Save language preference and update the interface.
    const handleLanguageChange = async (language) => {
        if (languageSaving || language === currentLanguage) {
            setLanguageOpen(false);
            return;
        }

        setLanguageSaving(true);

        try {
            // Change the interface immediately.
            await i18n.changeLanguage(language);

            // Prevent the old Redux profile language from overriding it.
            languageManuallyChanged.current = true;

            if (isAuthenticated) {
                await axiosInstance.patch("/profile/me/language", {
                    language,
                });
            }

            setLanguageOpen(false);
        } catch (error) {
            console.error(
                "Language preference update failed:",
                error.response?.data?.message || error.message
            );

            // Restore the previous language if saving failed.
            languageManuallyChanged.current = false;

            if (isAuthenticated) {
                const savedLanguage =
                    profile?.language ||
                    profile?.user?.language ||
                    "en";

                await i18n.changeLanguage(savedLanguage);
            }
        } finally {
            setLanguageSaving(false);
        }
    };

    // Connect or disconnect the user's socket.
    useEffect(() => {
        if (isAuthenticated) {
            connectSocket();
        } else {
            disconnectSocket();
        }

        return () => {
            disconnectSocket();
        };
    }, [isAuthenticated]);

    const firstName = profile?.firstName || user?.firstName || "";
    const lastName = profile?.lastName || user?.lastName || "";

    const displayName =
        [firstName, lastName].filter(Boolean).join(" ") ||
        user?.name ||
        user?.email ||
        t("topbar.user");

    const initials =
        [firstName, lastName]
            .filter(Boolean)
            .map((name) => name.trim().charAt(0))
            .join("")
            .toUpperCase() ||
        displayName.charAt(0).toUpperCase();

    const email = profile?.email || user?.email || "";
    const role = user?.role || profile?.role || t("topbar.member");

    const avatar =
        profile?.profileImage ||
        user?.profileImage ||
        user?.avatar ||
        user?.profilePicture ||
        "";

    // Support Base64, Blob, external URLs and relative backend paths.
    const getAvatarUrl = (image) => {
        if (!image) return "";

        const imagePath =
            typeof image === "string"
                ? image.trim()
                : image?.url || image?.path || "";

        if (!imagePath) return "";

        if (
            imagePath.startsWith("data:image/") ||
            imagePath.startsWith("blob:")
        ) {
            return imagePath;
        }

        if (/^https?:\/\//i.test(imagePath)) {
            return imagePath;
        }

        const apiBaseUrl =
            axiosInstance.defaults.baseURL ||
            import.meta.env.VITE_API_URL ||
            "";

        try {
            const backendOrigin = new URL(
                apiBaseUrl,
                window.location.origin
            ).origin;

            return `${backendOrigin}/${imagePath.replace(/^\/+/, "")}`;
        } catch (error) {
            console.error("Invalid profile image URL:", error);
            return "";
        }
    };

    const avatarUrl = getAvatarUrl(avatar);

    // Reset image error when the image changes.
    useEffect(() => {
        setAvatarError(false);
    }, [avatarUrl]);

    // Close menus when clicking outside or pressing Escape.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }

            if (
                languageRef.current &&
                !languageRef.current.contains(event.target)
            ) {
                setLanguageOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setProfileOpen(false);
                setLanguageOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleLogout = async () => {
        setProfileOpen(false);

        try {
            await axiosInstance.post("/auth/logout");
        } catch (error) {
            console.error(
                "Logout request failed:",
                error.response?.data?.message || error.message
            );
        } finally {
            disconnectSocket();
            dispatch({ type: "LOGOUT" });
            navigate("/login", { replace: true });
        }
    };

    const menuItems = [
        {
            label: t("topbar.myProfile"),
            path: "/profile",
            icon: UserRound,
        },
        
        {
            label: t("topbar.notification"),
            path: "/notificationpage",
            icon: Bell,
        },
        {
            label: t("topbar.settings"),
            path: "/setting",
            icon: Settings,
        },
    ];

    return (
        <header className="sticky top-0 z-[60] flex h-16 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-2 sm:px-4 md:px-6">

            {/* Brand and mobile sidebar button */}
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                <button
                    type="button"
                    data-sidebar-toggle
                    onClick={() => setSidebarOpen((open) => !open)}
                    aria-label={
                        sidebarOpen ? "Close sidebar" : "Open sidebar"
                    }
                    aria-expanded={sidebarOpen}
                    className="shrink-0 rounded-[10px] p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden"
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <Link
                    to="/"
                    className="flex min-w-0 items-center gap-2 sm:gap-3"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#0B2E5C] shadow-sm">
                        <img
                            src={logo}
                            alt="MultiService logo"
                            className="h-full w-full object-contain"
                        />
                    </div>

                    <span className="truncate text-base font-bold tracking-tight text-gray-900 sm:text-xl">
                        MultiService
                    </span>
                </Link>
            </div>

            {/* Language, notifications and user profile */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">

                {/* Language selector */}
                <div
                    ref={languageRef}
                    className="relative"
                >
                    <button
                        type="button"
                        onClick={() => {
                            setProfileOpen(false);
                            setLanguageOpen((open) => !open);
                        }}
                        aria-label="Change language"
                        aria-expanded={languageOpen}
                        aria-haspopup="menu"
                        className="flex items-center gap-1.5 rounded-[10px] px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:gap-2"
                    >
                        <Languages size={19} />

                        <span className="uppercase">
                            {currentLanguage}
                        </span>

                        <ChevronDown
                            size={14}
                            className={`transition-transform ${
                                languageOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {languageOpen && (
                        <div
                            role="menu"
                            aria-label="Select language"
                            className="absolute right-0 z-[70] mt-2 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
                        >
                            {languages.map((language) => (
                                <button
                                    key={language.code}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={
                                        currentLanguage === language.code
                                    }
                                    disabled={languageSaving}
                                    onClick={() =>
                                        handleLanguageChange(language.code)
                                    }
                                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50 ${
                                        currentLanguage === language.code
                                            ? "bg-blue-50 font-semibold text-blue-700"
                                            : "text-gray-700"
                                    }`}
                                >
                                    <span>{language.label}</span>

                                    {currentLanguage === language.code && (
                                        <span className="text-blue-600">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {isAuthenticated && <NotificationMenu />}

                {/* User profile */}
                <div
                    ref={profileRef}
                    className="relative border-l border-gray-200 pl-2 sm:pl-3 md:pl-4"
                >
                    <button
                        type="button"
                        onClick={() => {
                            setSidebarOpen(false);
                            setLanguageOpen(false);
                            setProfileOpen((open) => !open);
                        }}
                        aria-expanded={profileOpen}
                        aria-haspopup="menu"
                        className="flex items-center gap-1.5 rounded-[10px] p-1 transition-colors hover:bg-gray-100 sm:gap-3 sm:p-1.5"
                    >
                        {avatarUrl && !avatarError ? (
                            <img
                                src={avatarUrl}
                                alt={`${displayName}'s profile`}
                                className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
                                onError={() => {
                                    console.error(
                                        "Failed to load profile image:",
                                        avatarUrl
                                    );
                                    setAvatarError(true);
                                }}
                            />
                        ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B2E5C] text-sm font-semibold text-white sm:h-9 sm:w-9">
                                {initials}
                            </div>
                        )}

                        <div className="hidden max-w-36 text-left leading-tight sm:block">
                            <p className="truncate text-sm font-semibold text-gray-800">
                                {displayName}
                            </p>

                            <p className="truncate text-xs text-gray-500">
                                {role}
                            </p>
                        </div>

                        <ChevronDown
                            size={16}
                            className={`hidden shrink-0 text-gray-500 transition-transform sm:block ${
                                profileOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {profileOpen && (
                        <div
                            role="menu"
                            className="absolute right-0 mt-3 w-[min(16rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
                        >
                            <div className="border-b border-gray-100 px-4 py-3">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {displayName}
                                </p>

                                <p className="truncate text-xs text-gray-500">
                                    {email}
                                </p>
                            </div>

                            <div className="py-2">
                                {menuItems.map(
                                    ({ label, path, icon: Icon }) => (
                                        <Link
                                            key={path}
                                            to={path}
                                            role="menuitem"
                                            onClick={() =>
                                                setProfileOpen(false)
                                            }
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600"
                                        >
                                            <Icon size={18} />
                                            {label}
                                        </Link>
                                    )
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-2">
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <LogOut size={18} />
                                    {t("topbar.logout")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
