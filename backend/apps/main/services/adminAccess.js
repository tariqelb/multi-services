// backend/apps/main/services/adminAccess.js
//
// Who can use the admin panel, and which parts of it.
//
// Roles (User.role):
//   client  ordinary user: no admin panel
//   member  team member: only the sections an admin gave them, each one
//           "read" (see) or "write" (see and change: delete, edit, suspend...)
//   admin   everything, read and write, and the only one who can set roles
//
// Sections (keys of User.adminPermissions; the frontend has the same list in
// src/Components/Admin/adminSections.js):

export const ADMIN_SECTIONS = [
    // Account
    { id: "users", group: "account" },
    { id: "visits", group: "account" },
    { id: "roles", group: "account", adminOnly: true },
    // Property
    { id: "propertyStatistics", group: "property" },
    { id: "externalListings", group: "property" },
    { id: "knowledge", group: "property" },
    { id: "propertyPublications", group: "property" },
    { id: "feedback", group: "property" },
    { id: "propertyRequests", group: "property" },
    // Vehicles
    { id: "vehiclePublications", group: "vehicles" },
    { id: "vehicleRequests", group: "vehicles" },
    { id: "vehicleExternalListings", group: "vehicles" },
];

export const ROLES = ["client", "member", "admin"];
export const ACCESS_LEVELS = ["read", "write"];

const SECTION_IDS = new Set(ADMIN_SECTIONS.map((section) => section.id));
/** Sections an admin can give to a member (not "roles"). */
export const GRANTABLE_SECTIONS = ADMIN_SECTIONS.filter((section) => !section.adminOnly).map((section) => section.id);

const role = (user) => String(user?.role || "").toLowerCase();

/** Plain object of a user's permissions (Mongoose Map or object). */
export function permissionsOf(user) {
    const raw = user?.adminPermissions;
    if (!raw) return {};
    const entries = raw instanceof Map ? [...raw.entries()] : Object.entries(raw);
    return Object.fromEntries(entries.filter(([section, level]) => GRANTABLE_SECTIONS.includes(section) && ACCESS_LEVELS.includes(level)));
}

/** "write", "read" or null for one section. */
export function accessLevel(user, section) {
    if (!SECTION_IDS.has(section)) return null;
    if (role(user) === "admin") return "write";
    if (role(user) !== "member") return null;
    if (ADMIN_SECTIONS.find((item) => item.id === section)?.adminOnly) return null;
    return permissionsOf(user)[section] || null;
}

export function canAccess(user, section, level = "read") {
    const granted = accessLevel(user, section);
    if (!granted) return false;
    return level === "read" || granted === "write";
}

/** What the frontend needs: every section with its level (admins: all "write"). */
export function adminAccessView(user) {
    const access = {};
    ADMIN_SECTIONS.forEach(({ id }) => {
        const level = accessLevel(user, id);
        if (level) access[id] = level;
    });
    return access;
}

/** Cleans the permissions sent by the roles page: known sections, read / write. */
export function cleanPermissions(input) {
    const result = {};
    if (!input || typeof input !== "object") return result;
    GRANTABLE_SECTIONS.forEach((section) => {
        const level = String(input[section] || "").toLowerCase();
        if (ACCESS_LEVELS.includes(level)) result[section] = level;
    });
    return result;
}
