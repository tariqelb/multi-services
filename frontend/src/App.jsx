
import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
    redirect,
    useLoaderData,
    Outlet,
} from "react-router-dom";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Box } from "@mui/material";

import axiosInstance from "./api/axiosInstance";

import Login from "./components/Login";
import NotFound from "./pages/NotFound";

import ProfileLayout from "./components/Profile";
import ProfileOverview from "./components/ProfileOverview";
import ProfilePropertyList from "./components/ProfilePropertyList";
import ProfilePropertyDetails from "./components/ProfilePropertyDetails";

import Properties from "./components/Properties";
import PropertyDetailsPage from "./components/PropertyDetailsPage";
import PublishPropertyPage from "./components/PublishPropertyPage";
import SavedPropertiesList from "./components/SavedPropertyList";
import PropertyAlert from "./components/PropertyAlert";
import NotificationPage from "./components/NotificationPage";
import SettingPage from "./components/Settings/SettingsPage";
import FeedbackPage from "./components/FeedbackPage";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import MiddleContent from "./components/MiddleContent";
import Footer from "./components/Footer";

import Dashboard from "./components/admin/Dashboard";
import VisitTracker from "./components/admin/components/VisitTracker";
import ExternalListings from "./components/admin/externalListings/ExternalListings";
import ExternalListingSources from "./components/admin/externalListings/ExternalListingSources";
import UserDetailsPage from "./components/admin/components/UserDetailsPage";

import FindByMap from "./components/FindByMap/FindByMap";
import DirectionProvider from "./components/DirectionProvider";

// Authentication loader
async function requireAuth() {
    try {
        const response = await axiosInstance.get("/auth/me", {
            withCredentials: true,
        });

        const user = response.data?.user;

        if (!user) {
            throw redirect("/login");
        }

        return user;
    } catch (error) {
        if (
            error instanceof Response &&
            error.status >= 300 &&
            error.status < 400
        ) {
            throw error;
        }

        throw redirect("/login");
    }
}

// Persistent layout with TopBar, Sidebar and Footer
function DashboardLayout() {
    const user = useLoaderData();
    const dispatch = useDispatch();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Dashboard");

    useEffect(() => {
        dispatch({
            type: "AUTH_SUCCESS",
            payload: user,
        });
    }, [dispatch, user]);

    const userData = {
        name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            "User",

        role: user.role || "Workspace Member",

        avatar:
            user.profileImage ||
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#f9fafb",
            }}
        >
            <VisitTracker />

            <TopBar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={userData}
            />

            {/* Main layout */}
            <Box
                sx={{
                    display: "flex",
                    flex: 1,
                    position: "relative",
                }}
            >
                {/* Sidebar */}
                <Sidebar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeNav={activeNav}
                    setActiveNav={setActiveNav}
                />

                {/* Page content and Footer */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {/* Current page */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Outlet />
                    </Box>

                    {/* Footer */}
                    <Footer />
                </Box>
            </Box>
        </Box>
    );
}

// Application routes
const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/signin",
        element: <Navigate to="/login" replace />,
    },

    // Authenticated application layout
    {
        id: "dashboard-layout",
        element: <DashboardLayout />,
        loader: requireAuth,
        errorElement: <Navigate to="/login" replace />,

        children: [
            {
                path: "/",
                element: <MiddleContent activeNav="Dashboard" />,
            },
            {
                path: "/properties",
                element: <Properties />,
            },
            {
                path: "/findbymap",
                element: <FindByMap />,
            },
            {
                path: "/mypublication",
                element: <ProfilePropertyList />,
            },
            {
                path: "/properties/publish",
                element: <PublishPropertyPage />,
            },
            {
                path: "/properties/:id",
                element: <PropertyDetailsPage />,
            },
            {
                path: "/property/:id",
                element: <ProfilePropertyDetails />,
            },
            {
                path: "/saved",
                element: <SavedPropertiesList />,
            },
            {
                path: "/notificationpage",
                element: <NotificationPage />,
            },
            {
                path: "/alert",
                element: <PropertyAlert />,
            },
            {
                path: "/profile",
                element: <ProfileLayout />,
                children: [
                    {
                        index: true,
                        element: <ProfileOverview />,
                    },
                ],
            },
            {
                path: "/dashboard",
                element: <Dashboard />,
            },
            {
                path: "/setting",
                element: <SettingPage />,
            },
            {
                path: "/feedback",
                element: <FeedbackPage />,
            },
            {
                path: "/externalListings",
                element: <ExternalListings />,
            },
            {
                path: "/addexternalListings",
                element: <ExternalListingSources />,
            },

            // Admin user details
            {
                path: "/admin/users/:userId",
                element: <UserDetailsPage />,
            },
        ],
    },

    // Not found
    {
        path: "*",
        element: <NotFound />,
    },
]);

export default function App() {
    return (
        <DirectionProvider>
            <RouterProvider router={router} />
        </DirectionProvider>
    );
}
