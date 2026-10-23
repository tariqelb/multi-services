import axiosInstance from "../api/axiosInstance";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
    Menu,
    X,
    UserRound,
    Settings,
    MessageCircle,
    LogOut,
    ChevronDown,
} from "lucide-react";

import NotificationMenu from "./NotificationMenu";
import { connectSocket, disconnectSocket } from "../Socket/Socket";

export default function TopBar({ sidebarOpen, setSidebarOpen }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    const profileRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get the authenticated user and latest profile from Redux.
    const user = useSelector((state) => state.auth?.user);
    const profileState = useSelector((state) => state.profile);

    const isAuthenticated = Boolean(user);

    // Support profile data stored directly or inside profileState.user.
    const profile = profileState?.user || profileState;

    const firstName =
        profile?.firstName || user?.firstName || "";

    const lastName =
        profile?.lastName || user?.lastName || "";

    const displayName =
        [firstName, lastName].filter(Boolean).join(" ") ||
        user?.name ||
        user?.email ||
        "User";

    const initials =
        [firstName, lastName]
            .filter(Boolean)
            .map((name) => name.trim().charAt(0))
            .join("")
            .toUpperCase() ||
        displayName.charAt(0).toUpperCase();

    const email = profile?.email || user?.email || "";
    const role = user?.role || "Member";

    // The backend saves the image as profileImage.
    const avatar =
        profile?.profileImage ||
        user?.profileImage ||
        user?.avatar ||
        user?.profilePicture ||
        "";

    // Connect Socket.IO while the user is authenticated.
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

    // Reset the fallback when the image changes.
    useEffect(() => {
        setAvatarError(false);
    }, [avatar]);

    // Close the profile menu when clicking outside or pressing Escape.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await axiosInstance.post("/auth/logout");
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            disconnectSocket();
            dispatch({ type: "LOGOUT" });
            setProfileOpen(false);
            navigate("/login", { replace: true });
        }
    };

    const menuItems = [
        { label: "My Profile", path: "/profile", icon: UserRound },
        { label: "Settings", path: "/settings", icon: Settings },
        { label: "Messages", path: "/messages", icon: MessageCircle },
    ];

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
            {/* Brand and mobile sidebar button */}
            <div className="flex items-center space-x-3">
                <button
                    type="button"
                    onClick={() =>
                        setSidebarOpen((open) => !open)
                    }
                    aria-label={
                        sidebarOpen ? "Close sidebar" : "Open sidebar"
                    }
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
                >
                    {sidebarOpen ? (
                        <X size={20} />
                    ) : (
                        <Menu size={20} />
                    )}
                </button>

                <Link to="/" className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14539a] text-lg font-bold text-white shadow-sm">
                        M
                    </div>

                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        MultiService
                    </span>
                </Link>
            </div>

            {/* Notifications and user profile */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                {isAuthenticated && <NotificationMenu />}

                <div
                    ref={profileRef}
                    className="relative border-l border-gray-200 pl-3 sm:pl-4"
                >
                    <button
                        type="button"
                        onClick={() =>
                            setProfileOpen((open) => !open)
                        }
                        aria-expanded={profileOpen}
                        aria-haspopup="menu"
                        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 sm:gap-3"
                    >
                        {avatar && !avatarError ? (
                            <img
                                src={avatar}
                                alt={`${displayName}'s profile`}
                                className="h-9 w-9 rounded-full object-cover"
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d3562] text-sm font-semibold text-white">
                                {initials}
                            </div>
                        )}

                        <div className="hidden text-left leading-tight sm:block">
                            <p className="max-w-36 truncate text-sm font-semibold text-gray-800">
                                {displayName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {role}
                            </p>
                        </div>

                        <ChevronDown
                            size={16}
                            className={`hidden text-gray-500 transition-transform sm:block ${
                                profileOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {profileOpen && (
                        <div
                            role="menu"
                            className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
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
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
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
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}