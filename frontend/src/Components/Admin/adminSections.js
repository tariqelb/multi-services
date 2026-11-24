// src/Components/Admin/adminSections.js
//
// The admin panel: groups (Account, Property, Vehicles, other services) and
// their pages. Each page is one access section; the backend has the same list
// (backend/apps/main/services/adminAccess.js).
//
// Roles: client (no admin panel), member (sections given by an admin, each
// "read" or "write"), admin (everything). /auth/me returns
// user.adminAccess = { users: "write", vehiclePublications: "read", ... }.

import { useRouteLoaderData } from "react-router-dom";

export const ADMIN_GROUPS = [
    {
        id: "account",
        labelKey: "adminPanel.groups.account",
        label: "Account",
        icon: "account",
        items: [
            { section: "users", path: "/admin/users", labelKey: "adminPanel.items.users", label: "Users", icon: "users" },
            { section: "visits", path: "/admin/visits", labelKey: "adminPanel.items.visits", label: "Visits", icon: "visits" },
            { section: "roles", path: "/admin/roles", labelKey: "adminPanel.items.roles", label: "Roles & access", icon: "roles", adminOnly: true },
        ],
    },
    {
        id: "property",
        labelKey: "adminPanel.groups.property",
        label: "Property",
        icon: "property",
        items: [
            { section: "propertyStatistics", path: "/dashboard", labelKey: "sidebar.statistics", label: "Statistics", icon: "statistics" },
            { section: "externalListings", path: "/addexternalListings", labelKey: "sidebar.addExternalListing", label: "Add External listing", icon: "externalListings" },
            { section: "knowledge", path: "/admin/knowledge", labelKey: "sidebar.knowledgeManagement", label: "Knowledge Management", icon: "knowledge" },
            { section: "propertyPublications", path: "/admin/publications", labelKey: "sidebar.publicationReviews", label: "Publication Reviews", icon: "publications" },
            { section: "feedback", path: "/admin/feedback", labelKey: "sidebar.feedbackReviews", label: "Feedback Reviews", icon: "feedback" },
        ],
    },
    {
        id: "vehicles",
        labelKey: "adminPanel.groups.vehicles",
        label: "Vehicles",
        icon: "vehicles",
        items: [
            { section: "vehiclePublications", path: "/admin/vehicles/publications", labelKey: "sidebar.publicationReviews", label: "Publication Reviews", icon: "publications" },
        ],
    },
    // Other services: no admin pages yet.
    { id: "dailyWorker", labelKey: "adminPanel.groups.dailyWorker", label: "Daily Worker", icon: "dailyWorker", items: [] },
    { id: "deliveryMan", labelKey: "adminPanel.groups.deliveryMan", label: "Delivery Man", icon: "deliveryMan", items: [] },
    { id: "driver", labelKey: "adminPanel.groups.driver", label: "Driver", icon: "driver", items: [] },
    { id: "servicesCompanies", labelKey: "adminPanel.groups.servicesCompanies", label: "Services & Companies", icon: "servicesCompanies", items: [] },
];

export const ADMIN_ITEMS = ADMIN_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.id })));

/** Sections a member can be given (not "Roles & access"). */
export const GRANTABLE_ITEMS = ADMIN_ITEMS.filter((item) => !item.adminOnly);

const matches = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

/** True on an admin panel page (the admin sidebar replaces the service sidebar). */
export const isAdminPath = (pathname) => pathname === "/admin" || ADMIN_ITEMS.some((item) => matches(pathname, item.path));

/** The admin item of a path (for the active state and access checks). */
export const adminItemForPath = (pathname) =>
    [...ADMIN_ITEMS].sort((a, b) => b.path.length - a.path.length).find((item) => matches(pathname, item.path)) || null;

/** Access of a user: role + level per section ("read" / "write"). */
export function accessOf(user) {
    const role = String(user?.role || "").toLowerCase();
    const sections = role === "admin"
        ? Object.fromEntries(ADMIN_ITEMS.map((item) => [item.section, "write"]))
        : role === "member"
          ? { ...(user?.adminAccess || {}) }
          : {};
    delete sections.roles;
    if (role === "admin") sections.roles = "write";

    return {
        role,
        isAdmin: role === "admin",
        sections,
        level: (section) => sections[section] || null,
        can: (section, level = "read") => Boolean(sections[section]) && (level === "read" || sections[section] === "write"),
        hasPanel: Object.keys(sections).length > 0,
        firstPath: ADMIN_ITEMS.find((item) => sections[item.section])?.path || null,
    };
}

/** Access of the logged-in user (from the layout loader: /auth/me). */
export function useAdminAccess() {
    const user = useRouteLoaderData("dashboard-layout");
    return accessOf(user);
}
