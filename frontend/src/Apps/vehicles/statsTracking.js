// src/Apps/vehicles/statsTracking.js
//
// Tells the server what visitors do on the vehicles pages (admin
// Vehicles › Statistics). Fire and forget: never blocks or breaks a page.
//   trackVehicleView("vehicle" | "part", id)
//   trackVehicleContact("vehicle" | "part", id, "phone" | "whatsapp" | "email")

import axiosInstance from "../../api/axiosInstance";

const send = (path, body) => {
    axiosInstance.post(path, body).catch(() => {});
};

export const trackVehicleView = (itemType, itemId) => {
    if (itemId) send("/vehicles/stats/view", { itemType, itemId });
};

export const trackVehicleContact = (itemType, itemId, channel) => {
    if (itemId) send("/vehicles/stats/contact", { itemType, itemId, channel });
};
