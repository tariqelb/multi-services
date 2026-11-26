// src/Components/Profile/profilePaths.js
//
// Public profile address of a publisher, per service:
//   property  /profile/:userId
//   vehicles  /vehicles/profile/:userId

export const publicProfilePath = (service, userId, tab = "") => {
    const base = service === "vehicles" ? `/vehicles/profile/${userId}` : `/profile/${userId}`;
    return tab ? `${base}?tab=${encodeURIComponent(tab)}` : base;
};

/** Publisher id from a populated or plain reference ({ _id }, { id } or the id). */
export const ownerIdOf = (value) => (value && typeof value === "object" ? value._id || value.id || "" : value || "");
