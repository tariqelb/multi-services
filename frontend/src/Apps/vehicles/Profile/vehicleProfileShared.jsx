// src/Apps/vehicles/Profile/vehicleProfileShared.jsx
// What the vehicle profile pages share: tabs, the
// business badge and the reviews loader (same API shape as the property
// profiles, at /vehicles/profiles/:userId/reviews).

import { useCallback, useState } from "react";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import RateReview from "@mui/icons-material/RateReview";
import Campaign from "@mui/icons-material/Campaign";

import axiosInstance from "../../../api/axiosInstance";
import { optionLabel } from "../vehicleFormat";

// Order of the tabs (?tab=reviews opens the reviews).
// "requests" is last: public profiles hide it unless the user shows their requests.
export const PROFILE_TABS = ["vehicles", "motos", "parts", "reviews", "requests"];
export const REVIEWS_TAB = PROFILE_TABS.indexOf("reviews");
export const REQUESTS_TAB = PROFILE_TABS.indexOf("requests");

export const profileTabs = (mine, showRequests = true) => [
    ...profileTabsBase(mine),
    ...(showRequests ? [{ label: mine ? "vehiclesApp.profile.tabs.myRequests" : "vehiclesApp.profile.tabs.requests", icon: <Campaign fontSize="small" /> }] : []),
];

const profileTabsBase = (mine) => [
    {
        label: mine ? "vehiclesApp.profile.tabs.myVehicles" : "vehiclesApp.profile.tabs.vehicles",
        icon: <DirectionsCarOutlined fontSize="small" />,
    },
    {
        label: mine ? "vehiclesApp.profile.tabs.myMotos" : "vehiclesApp.profile.tabs.motos",
        icon: <TwoWheelerOutlined fontSize="small" />,
    },
    {
        label: mine ? "vehiclesApp.profile.tabs.myParts" : "vehiclesApp.profile.tabs.parts",
        icon: <BuildOutlined fontSize="small" />,
    },
    { label: "vehiclesApp.profile.tabs.reviews", icon: <RateReview fontSize="small" /> },
];

/** "Agency · Souss Cars" for a business, nothing for a private seller. */
export const dealerBadge = (t, dealer) =>
    dealer?.name ? `${optionLabel(t, "publisherType", dealer.type)} · ${dealer.name}` : undefined;

/** Counts from a list of spare parts (my profile: every status). */
export function countParts(parts = []) {
    return {
        totalParts: parts.length,
        availableParts: parts.filter((part) => (part.status || "Available") === "Available").length,
    };
}

/** Counts from a list of vehicles (my profile: every status). */
export function countVehicles(vehicles = []) {
    const cars = vehicles.filter((vehicle) => vehicle.category !== "moto");
    const motos = vehicles.filter((vehicle) => vehicle.category === "moto");
    const available = (list) => list.filter((vehicle) => (vehicle.status || "Available") === "Available").length;
    return {
        totalVehicles: cars.length,
        availableVehicles: available(cars),
        totalMotos: motos.length,
        availableMotos: available(motos),
    };
}

const REVIEWS_PER_PAGE = 20;

/** Reviews received by a publisher, with "load more". */
export function useVehicleReviews(userId, t) {
    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [rating, setRating] = useState(0);
    const [total, setTotal] = useState(0);

    const load = useCallback(
        async (nextPage = 1, append = false) => {
            if (!userId) return;
            setLoading(true);
            setError("");
            try {
                const { data } = await axiosInstance.get(`/vehicles/profiles/${userId}/reviews`, {
                    params: { page: nextPage, limit: REVIEWS_PER_PAGE },
                });
                const list = data.reviews || [];
                setReviews((previous) => (append ? [...previous, ...list] : list));
                setPage(Number(data.pagination?.currentPage) || nextPage);
                setHasMore(Boolean(data.pagination?.hasMore));
                setRating(Number(data.rating?.averageRating) || 0);
                setTotal(Number(data.rating?.totalReviews) || 0);
            } catch (requestError) {
                setError(requestError.response?.data?.message || t("publicProfile.errors.reviews", "Unable to load reviews."));
            } finally {
                setLoading(false);
            }
        },
        [userId, t],
    );

    const loadMore = () => {
        if (!loading && hasMore) load(page + 1, true);
    };

    return { reviews, rating, total, hasMore, loading, error, setError, load, loadMore };
}
