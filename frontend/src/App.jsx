// /home/tariq/multi-services/app/frontend/src/App.jsx
import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
    redirect,
    useLoaderData,
    Outlet,
    useRouteLoaderData,
    useLocation,
} from "react-router-dom";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Box } from "@mui/material";

import axiosInstance from "./api/axiosInstance";

import Login from "./Apps/Property/LoginAndSignUp/Login";
import NotFound from "./pages/NotFound";


import MainSideBar from "./Components/Home/MainSideBar";

import CarsDescription from "./Apps/cars/Components/Descriprion/Description";
import DailyWorkerDescription from "./Apps/DailyWorker/Components/Descriprion/Description";
import DeliveryManDescription from "./Apps/DelivryMan/Components/Descriprion/Description";
import DriverDescription from "./Apps/Driver/Components/Descriprion/Description";
import ServicesCompaniesDescription from "./Apps/Services&Companies/Components/Description/Description";



import ProfileLayout from "./Apps/Property/MyProfile/Profile";
import ProfileOverview from "./Apps/Property/MyProfile/ProfileOverview";
import ProfilePropertyList from "./Apps/Property/MyProfile/ProfilePropertyList";
import ProfilePropertyDetails from "./Apps/Property/properties/ProfilePropertyDetails";

import Properties from "./Apps/Property/properties/Properties";
import PropertyDetailsPage from "./Apps/Property/properties/PropertyDetailsPage";
import PublishPropertyPage from "./Apps/Property/propertyInsertForm/PublishPropertyPage";
import SavedPropertiesList from "./Apps/Property/saved/SavedPropertyList";
import Alert from "./Apps/Property/Alert/Alert";
import NotificationPage from "./Apps/Property/Notification/NotificationPage";
import SettingPage from "./Apps/Property/Settings/SettingsPage";
import FeedbackPage from "./Apps/Property/Feedback/FeedbackPage";

// Roommate components
import RoommatePage from "./Apps/Property/roommate/RoommatePage";
import RoommateDetailsPage from "./Apps/Property/roommate/RoommateDetailsPage";
import RoommateProfileDetails from "./Apps/Property/roommate/RoommateProfileDetails";

import TopBar from "./Components/Home/TopBar";
import Sidebar from "./Apps/Property/Sidebar/Sidebar";
import MiddleContent from "./Components/Home/MiddleContent";
import Footer from "./Apps/Property/Footer/Footer";

import Dashboard from "./Apps/Property/Statistic/Dashboard";
import VisitTracker from "./Apps/Property/Statistic/components/Visit/VisitTracker";
import ExternalListings from "./Apps/Property/externalListings/ExternalListings";
import ExternalListingSources from "./Apps/Property/externalListings/ExternalListingSources";
import UserDetailsPage from "./Apps/Property/Statistic/components/User/UserDetailsPage";

import FindByMap from "./Apps/Property/FindByMap/FindByMap";
import SearchPage from "./Apps/Property/Search/SearchPage";
import ReviewsRankingPage from "./Apps/Property/Reviews/ReviewsRankingPage";
import DirectionProvider from "./Components/Home/DirectionProvider";

import KnowledgeCenter from "./Apps/Property/knowledge/KnowledgeCenter";
import KnowledgeDetails from "./Apps/Property/knowledge/KnowledgeDetails";
import KnowledgeManagement from "./Apps/Property/knowledge/KnowledgeManagement";

import PublicProfile from "./Apps/Property/PublicProfile/PublicProfile";


import FurnishedProperties from "./Apps/Property/FurnishedRental/FurnishedProperties";
import FurnishedPropertyDetailsPage from "./Apps/Property/FurnishedRental/FurnishedPropertyDetailsPage";


import Establishments from "./Apps/Property/Establishment/Establishments";
import EstablishmentDetailsPage from "./Apps/Property/Establishment/EstablishmentDetailsPage";
import EstablishmentInsertForm from "./Apps/Property/Establishment/EstablishmentInsertForm";

import ForgotPassword from "./Apps/Property/LoginAndSignUp/ForgotPassword";
import ResetPassword from "./Apps/Property/LoginAndSignUp/ResetPassword";

import ScrollToTop from "./Components/Home/ScrollToTop";
import EditPropertyPage from "./Apps/Property/propertyInsertForm/EditPropertyPage";
import RoommateEditPage from "./Apps/Property/roommate/RoommateEditPage";
import EstablishmentEditPage from "./Apps/Property/Establishment/EstablishmentEditPage";
import PublicLayout from "./Apps/Property/Info/PublicLayout";
import { AboutPage, ContactPage, PrivacyPage, TermsPage } from "./Apps/Property/Info/InfoPages";


import PublicationsReviewSection from "./Apps/Property/PublicationReviews/PublicationsReviewSection";
import FeedbackSection from "./Apps/Property/FeedbackReviews/FeedbackSection";

import ServiceSidebar from "./Components/Home/ServiceSidebar";

// -----------------------------------------------------------------------------
// Authentication loader
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Persistent layout with TopBar, Sidebar and Footer
// -----------------------------------------------------------------------------

function AdminOnly({ children }) {
    const user = useRouteLoaderData("dashboard-layout");

    if (user?.role?.toLowerCase() !== "admin") {
        return <Navigate to="/" replace />;
    }

    return children;
}



function DashboardLayout() {
    const user = useLoaderData();
    const dispatch = useDispatch();
    const location = useLocation();

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


    const serviceSidebarConfig = [
        {
            prefix: "/daily-worker",
            title: "Daily Worker",
            descriptionPath: "/daily-worker/description",
            translationKey: "dailyWorker",
        },
        {
            prefix: "/cars",
            title: "Cars",
            descriptionPath: "/cars/description",
            translationKey: "cars",
        },
        {
            prefix: "/delivery-man",
            title: "Delivery Man",
            descriptionPath: "/delivery-man/description",
            translationKey: "deliveryMan",
        },
        {
            prefix: "/driver",
            title: "Driver",
            descriptionPath: "/driver/description",
            translationKey: "driver",
        },
        {
            prefix: "/services-companies",
            title: "Services & Companies",
            descriptionPath: "/services-companies/description",
            translationKey: "servicesCompanies",
        },
    ];

    const activeServiceSidebar = serviceSidebarConfig.find((service) =>
        location.pathname.startsWith(service.prefix)
    );
    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                overflowX: "clip",
                bgcolor: "background.default",
            }}
        >
            <VisitTracker />

            <TopBar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={userData}
            />

            {/* Main application layout */}
            <Box
                sx={{
                    display: "flex",

                    // Mobile: main services bar above the content.
                    // Desktop: main services bar on the left.
                    flexDirection: {
                        xs: "column",
                        md: "row",
                    },

                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    width: "100%",
                    maxWidth: "100%",
                    overflowX: "clip",
                    position: "relative",
                }}
            >
                {/* Main services navigation */}
                <MainSideBar />

                {/* Property sidebar + page content */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        flex: 1,
                        minWidth: 0,
                        minHeight: 0,
                        width: "100%",
                        maxWidth: "100%",
                        position: "relative",
                    }}
                >
                    {/* Mobile backdrop */}
                    {sidebarOpen && (
                        <Box
                            onClick={() => setSidebarOpen(false)}
                            sx={{
                                display: {
                                    xs: "block",
                                    md: "none",
                                },
                                position: "fixed",
                                inset: "4rem 0 0",
                                bgcolor: "rgba(0, 0, 0, 0.4)",
                                zIndex: 40,
                            }}
                        />
                    )}

                    {/* Property sidebar */}
                    {activeServiceSidebar ? (
                        <ServiceSidebar
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            title={activeServiceSidebar.title}
                            descriptionPath={activeServiceSidebar.descriptionPath}
                            translationKey={activeServiceSidebar.translationKey}
                        />
                    ) : (
                        <Sidebar
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            activeNav={activeNav}
                            setActiveNav={setActiveNav}
                        />
                    )}

                    {/* Page content and Footer */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minWidth: 0,
                            width: "100%",
                            maxWidth: "100%",
                        }}
                    >
                        {/* Page content */}
                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                width: "100%",
                                maxWidth: "100%",
                                overflowX: "clip",
                            }}
                        >
                            <ScrollToTop />
                            <Outlet />
                        </Box>

                        {/* Footer */}
                        <Footer />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}


// -----------------------------------------------------------------------------
// Application routes
// -----------------------------------------------------------------------------

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/forgot-password",
        element: <ForgotPassword />,
    },
    {
        path: "/reset-password/:token",
        element: <ResetPassword />,
    },
    {
        path: "/signin",
        element: <Navigate to="/login" replace />,
    },

    // Public pages (no login needed)
    {
        element: <PublicLayout />,
        children: [
            { path: "/about", element: <AboutPage /> },
            { path: "/contact", element: <ContactPage /> },
            { path: "/privacy", element: <PrivacyPage /> },
            { path: "/terms", element: <TermsPage /> },
        ],
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

            // -----------------------------------------------------------------
            // Properties
            // -----------------------------------------------------------------

            {
                path: "/properties",
                element: <Properties />,
            },
            {
                path: "/properties/:id/edit",
                element: <EditPropertyPage />,
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
            // -----------------------------------------------------------------
            // Furnished Properties
            // -----------------------------------------------------------------

            {
                path: "/furnishedproperties",
                element: <FurnishedProperties />,
            },
            {
                path: "/furnishedproperties/:id",
                element: (
                    <FurnishedPropertyDetailsPage
                        // DetailsComponent={FurnishedPropertyDetails}
                    />
                ),
            },
            // -----------------------------------------------------------------
            // Hotels, Riads and other establishments
            // -----------------------------------------------------------------

            {
                path: "/establishments",
                element: <Establishments />,
            },
            {
                path: "/establishments/publish",
                element: <EstablishmentInsertForm />,
            },
            {
                path: "/establishments/:id/edit",
                element: <EstablishmentEditPage />,
            },
            {
                path: "/establishments/:id",
                element: <EstablishmentDetailsPage />,
            },

            // -----------------------------------------------------------------
            // Roommates
            // -----------------------------------------------------------------

            {
                path: "/roommates",
                element: <RoommatePage />,
            },
            {
                path: "/roommates/:id",
                element: <RoommateDetailsPage />,
            },
            {
                path: "/roommates/:id/edit",
                element: <RoommateEditPage />,
            },
            {
                path: "/roommates/profile/:id",
                element: (
                    <RoommateDetailsPage
                        DetailsComponent={RoommateProfileDetails}
                    />
                ),
            },

            // -----------------------------------------------------------------
            // Other application pages
            // -----------------------------------------------------------------

            {
                path: "/findbymap",
                element: <FindByMap />,
            },
            {
                path: "/search",
                element: <SearchPage />,
            },
            {
                path: "/reviews",
                element: <ReviewsRankingPage />,
            },
            {
                path: "/mypublication",
                element: <ProfilePropertyList />,
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
                element: <Alert />,
            },

            // -----------------------------------------------------------------
            // Profile
            // -----------------------------------------------------------------

            {
                path: "/profile",
                element: <ProfileLayout />,
                children: [
                    {
                        index: true,
                        element: <ProfileOverview />,
                    },
                    {
                        path: ":userId",
                        element: <PublicProfile />,
                    },
                ],
            },

            // -----------------------------------------------------------------
            // Dashboard and settings
            // -----------------------------------------------------------------

            {
                path: "/dashboard",
                element: (
                    <AdminOnly>
                        <Dashboard />
                    </AdminOnly>
                ),
            },
            {
                path: "/setting",
                element: <SettingPage />,
            },
            {
                path: "/feedback",
                element: <FeedbackPage />,
            },

            // -----------------------------------------------------------------
            // External listings
            // -----------------------------------------------------------------

            {
                path: "/externalListings",
                element: <ExternalListings />,
            },
            {
                path: "/addexternalListings",
                element: (
                    <AdminOnly>
                        <ExternalListingSources />
                    </AdminOnly>
                ),
            },

            // -----------------------------------------------------------------
            // Admin
            // -----------------------------------------------------------------

            {
                path: "/admin/users/:userId",
                element: (
                    <AdminOnly>
                        <UserDetailsPage />
                    </AdminOnly>
                ),
            },
            {
                path: "/admin/knowledge",
                element: (
                    <AdminOnly>
                        <KnowledgeManagement />
                    </AdminOnly>
                ),
            },
            // -----------------------------------------------------------------
            // Admin moderation
            // -----------------------------------------------------------------

            {
                path: "/admin/publications",
                element: (
                    <AdminOnly>
                        <PublicationsReviewSection />
                    </AdminOnly>
                ),
            },
            {
                path: "/admin/feedback",
                element: (
                    <AdminOnly>
                        <FeedbackSection />
                    </AdminOnly>
                ),
            },

            // -----------------------------------------------------------------
            // Knowledge center
            // -----------------------------------------------------------------

            {
                path: "/knowledge",
                element: <KnowledgeCenter />,
            },
            {
                path: "/knowledge/:id",
                element: <KnowledgeDetails />,
            },
            // -----------------------------------------------------------------
            // Other services - Description pages
            // -----------------------------------------------------------------

            {
                path: "/cars/description",
                element: <CarsDescription />,
            },
            {
                path: "/daily-worker/description",
                element: <DailyWorkerDescription />,
            },
            {
                path: "/delivery-man/description",
                element: <DeliveryManDescription />,
            },
            {
                path: "/driver/description",
                element: <DriverDescription />,
            },
            {
                path: "/services-companies/description",
                element: <ServicesCompaniesDescription />,
            },
        ],
    },

    // Not found
    {
        path: "*",
        element: <NotFound />,
    },
]);

// -----------------------------------------------------------------------------
// App
// -----------------------------------------------------------------------------

export default function App() {
    return (
        <DirectionProvider>
            <RouterProvider router={router} />
        </DirectionProvider>
    );
}
