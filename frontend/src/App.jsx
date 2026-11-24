// /home/tariq/multi-services/app/frontend/src/App.jsx
import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
    redirect,
    useLoaderData,
    Outlet,
    useLocation,
} from "react-router-dom";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Box } from "@mui/material";

import axiosInstance from "./api/axiosInstance";

import Login from "./Apps/Property/LoginAndSignUp/Login";
import NotFound from "./pages/NotFound";


import MainSideBar from "./Components/Home/MainSideBar";

import VehiclesDescription from "./Apps/vehicles/Components/Descriprion/Description";
import VehiclesPage from "./Apps/vehicles/VehicleList/VehiclesPage";
import VehicleDetailsPage from "./Apps/vehicles/VehicleDetails/VehicleDetailsPage";
import PublishVehiclePage from "./Apps/vehicles/VehicleForm/PublishVehiclePage";
import PublishMotoPage from "./Apps/vehicles/VehicleForm/PublishMotoPage";
import VehiclesMapPage from "./Apps/vehicles/VehicleMap/VehiclesMapPage";
import EditVehiclePage from "./Apps/vehicles/VehicleForm/EditVehiclePage";
import MyVehiclesPage from "./Apps/vehicles/MyVehicles/MyVehiclesPage";
import VehicleAlertsPage from "./Apps/vehicles/VehicleAlerts/VehicleAlertsPage";
import MyVehicleProfile from "./Apps/vehicles/Profile/MyVehicleProfile";
import VehiclePublicProfile from "./Apps/vehicles/Profile/VehiclePublicProfile";
import VehicleReviewsPage from "./Apps/vehicles/Reviews/VehicleReviewsPage";
import SavedVehiclesPage from "./Apps/vehicles/Saved/SavedVehiclesPage";
import SparePartsPage from "./Apps/vehicles/SpareParts/SparePartsPage";
import VehicleSearchPage from "./Apps/vehicles/Search/VehicleSearchPage";
import VehiclePublicationsReview from "./Apps/vehicles/Admin/VehiclePublicationsReview";
import SparePartForm, { EditSparePartPage } from "./Apps/vehicles/SpareParts/SparePartForm";
import SparePartDetailsPage from "./Apps/vehicles/SpareParts/SparePartDetailsPage";
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
import SavedPage from "./Apps/Property/saved/SavedPage";
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
import { VEHICLE_NAV } from "./Components/Home/serviceNavigation";
import AdminSidebar from "./Components/Admin/AdminSidebar";
import AdminRoute, { AdminHome } from "./Components/Admin/AdminRoute";
import AdminRolesPage from "./Components/Admin/AdminRolesPage";
import { AdminUsersPage, AdminVisitsPage } from "./Components/Admin/AdminSectionPages";
import { isAdminPath } from "./Components/Admin/adminSections";

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




// Vehicles sidebar items: see Components/Home/serviceNavigation.js
// (shared with the vehicles top bar).

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
            prefix: "/vehicles",
            // Motos are part of the vehicles service.
            prefixes: ["/vehicles", "/motos"],
            title: "Vehicles",
            descriptionPath: "/vehicles/description",
            translationKey: "vehicles",
            items: VEHICLE_NAV,
            itemsFirst: true,
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
        (service.prefixes || [service.prefix]).some((prefix) => location.pathname.startsWith(prefix))
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

                    {/* Admin panel sidebar, service sidebar, or the property sidebar */}
                    {isAdminPath(location.pathname) ? (
                        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                    ) : activeServiceSidebar ? (
                        <ServiceSidebar
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            title={activeServiceSidebar.title}
                            descriptionPath={activeServiceSidebar.descriptionPath}
                            translationKey={activeServiceSidebar.translationKey}
                            items={activeServiceSidebar.items}
                            itemsFirst={activeServiceSidebar.itemsFirst}
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
                element: <SavedPage />,
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
                    <AdminRoute section="propertyStatistics">
                        <Dashboard />
                    </AdminRoute>
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
                    <AdminRoute section="externalListings">
                        <ExternalListingSources />
                    </AdminRoute>
                ),
            },

            // -----------------------------------------------------------------
            // Admin
            // -----------------------------------------------------------------

            // Admin panel home: first page this user can open.
            { path: "/admin", element: <AdminHome /> },
            {
                path: "/admin/users",
                element: (
                    <AdminRoute section="users">
                        <AdminUsersPage />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin/visits",
                element: (
                    <AdminRoute section="visits">
                        <AdminVisitsPage />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin/roles",
                element: (
                    <AdminRoute section="roles">
                        <AdminRolesPage />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin/vehicles/publications",
                element: (
                    <AdminRoute section="vehiclePublications">
                        <VehiclePublicationsReview />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin/users/:userId",
                element: (
                    <AdminRoute section="users">
                        <UserDetailsPage />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin/knowledge",
                element: (
                    <AdminRoute section="knowledge">
                        <KnowledgeManagement />
                    </AdminRoute>
                ),
            },
            // -----------------------------------------------------------------
            // Admin moderation
            // -----------------------------------------------------------------

            {
                path: "/admin/publications",
                element: (
                    <AdminRoute section="propertyPublications">
                        <PublicationsReviewSection />
                    </AdminRoute>
                ),
            },
            {
                path: "/admin/feedback",
                element: (
                    <AdminRoute section="feedback">
                        <FeedbackSection />
                    </AdminRoute>
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
                path: "/vehicles/description",
                element: <VehiclesDescription />,
            },

            // Vehicles service
            // key: /vehicles and /motos are two pages (filters reset on switch).
            { path: "/vehicles", element: <VehiclesPage key="car" category="car" /> },
            { path: "/vehicles/publish", element: <PublishVehiclePage /> },
            { path: "/motos", element: <VehiclesPage key="moto" category="moto" /> },
            { path: "/motos/publish", element: <PublishMotoPage /> },
            { path: "/vehicles/map", element: <VehiclesMapPage /> },
            { path: "/vehicles/search", element: <VehicleSearchPage /> },
            // Old address of the vehicles publication reviews (now in the admin panel).
            { path: "/vehicles/admin/publications", element: <Navigate to="/admin/vehicles/publications" replace /> },
            { path: "/vehicles/mine", element: <MyVehiclesPage /> },
            { path: "/vehicles/alerts", element: <VehicleAlertsPage /> },
            { path: "/vehicles/reviews", element: <VehicleReviewsPage /> },
            { path: "/vehicles/saved", element: <SavedVehiclesPage /> },
            // Car and motorcycle spare parts (before /vehicles/:id).
            { path: "/vehicles/parts", element: <SparePartsPage /> },
            { path: "/vehicles/parts/publish", element: <SparePartForm /> },
            { path: "/vehicles/parts/:id", element: <SparePartDetailsPage /> },
            { path: "/vehicles/parts/:id/edit", element: <EditSparePartPage /> },
            { path: "/vehicles/profile", element: <MyVehicleProfile /> },
            { path: "/vehicles/profile/:userId", element: <VehiclePublicProfile /> },
            { path: "/vehicles/:id", element: <VehicleDetailsPage /> },
            { path: "/vehicles/:id/edit", element: <EditVehiclePage /> },
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
