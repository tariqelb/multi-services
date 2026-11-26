// src/Components/Dashboard/dashboardNavigation.js
//
// Dashboard: the default sidebar (after login, on "/" and on the pages shared
// by every service). It presents every service: what it is, what each entry of
// its sidebar does and how, and the top bar menu.
//
// Item: { path, labelKey, label, icon, exact }   (icon: key in ServiceSidebar ITEM_ICONS)

// Not under "/dashboard": that is the admin dashboard.
export const ABOUT_BASE = "/about-services";

export const DASHBOARD_NAV = [
    { path: "/", exact: true, labelKey: "dashboardSidebar.overview", label: "Overview", icon: "dashboard" },
    { path: `${ABOUT_BASE}/property`, exact: true, labelKey: "dashboardSidebar.aboutProperty", label: "About Property", icon: "aboutProperty" },
    { path: `${ABOUT_BASE}/vehicles`, exact: true, labelKey: "dashboardSidebar.aboutVehicles", label: "About Vehicles", icon: "browse" },
    { path: `${ABOUT_BASE}/services-companies`, exact: true, labelKey: "dashboardSidebar.aboutServicesCompanies", label: "About Services & Companies", icon: "aboutCompanies" },
    { path: `${ABOUT_BASE}/daily-worker`, exact: true, labelKey: "dashboardSidebar.aboutDailyWorker", label: "About Daily Worker", icon: "aboutWorker" },
    { path: `${ABOUT_BASE}/delivery-man`, exact: true, labelKey: "dashboardSidebar.aboutDeliveryMan", label: "About Delivery Man", icon: "aboutDelivery" },
    { path: `${ABOUT_BASE}/driver`, exact: true, labelKey: "dashboardSidebar.aboutDriver", label: "About Driver", icon: "aboutDriver" },
    // The top bar: language, notifications and the profile menu.
    { path: `${ABOUT_BASE}/account`, exact: true, labelKey: "dashboardSidebar.aboutAccount", label: "Top bar & my account", icon: "aboutAccount" },
];

// Pages shared by every service: they keep the dashboard sidebar.
const SHARED_PAGES = ["/setting", "/notificationpage", "/feedback"];

/** Pages that show the dashboard sidebar. */
export const isDashboardPath = (pathname) =>
    pathname === "/" ||
    pathname === ABOUT_BASE ||
    pathname.startsWith(`${ABOUT_BASE}/`) ||
    SHARED_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
