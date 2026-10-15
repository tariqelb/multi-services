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

import axiosInstance from "./api/axiosInstance";
import Login from "./components/Login";
import NotFound from "./pages/NotFound";
import Profile from "./components/Profile";
import Properties from "./components/Properties";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import MiddleContent from "./components/MiddleContent";
import { Box } from "@mui/material";

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
        if (error instanceof Response && error.status >= 300 && error.status < 400) {
            throw error;
        }
        throw redirect("/login");
    }
}

// Persistent Layout with TopBar & Sidebar
function DashboardLayout() {
    const user = useLoaderData();
    const dispatch = useDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState('Dashboard');

    useEffect(() => {
        dispatch({
            type: "AUTH_SUCCESS",
            payload: user,
        });
    }, [dispatch, user]);

    const userData = {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        role: user.role || 'Workspace Member',
        avatar: user.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f9fafb' }}>
            <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={userData} />
            <Box sx={{ display: 'flex', flex: 1, position: 'relative' }}>
                <Sidebar 
                    sidebarOpen={sidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    activeNav={activeNav} 
                    setActiveNav={setActiveNav} 
                />
                {/* <Outlet /> renders whichever sub-page matches the active URL */}
                <Outlet />
            </Box>
        </Box>
    );
}

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/signin",
        element: <Navigate to="/login" replace />,
    },
    {
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
                path: "/profile",
                element: <Profile />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);

export default function App() {
    return <RouterProvider router={router} />;
}