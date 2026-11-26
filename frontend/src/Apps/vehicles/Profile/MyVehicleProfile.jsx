// src/Apps/vehicles/Profile/MyVehicleProfile.jsx
// /vehicles/profile — my profile in the vehicles service, same page as the
// property "My profile": header with my vehicle rating, statistics of my
// vehicles and motos & bikes, my personal information, then tabs:
// my vehicles, my motos & bikes, my spare parts (same cards and actions as
// My Publication)
// and the reviews I received.

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Container, Stack } from "@mui/material";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";

import axiosInstance from "../../../api/axiosInstance";
import { getProfile } from "../../../redux/actions/profile/profileAction";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import VehicleProfileHeader from "./components/VehicleProfileHeader";
import VehicleProfileStats from "./components/VehicleProfileStats";
import VehicleProfileTabs from "./components/VehicleProfileTabs";
import PortfolioSection from "../../../Components/Profile/Portfolio/PortfolioSection";
import VehicleReviewsTab from "./components/VehicleReviewsTab";
import VehiclePersonalInfo from "./components/VehiclePersonalInfo";
import { MySocialLinksCard } from "../../../Components/Profile/SocialLinks";

import MyVehiclesPage from "../MyVehicles/MyVehiclesPage";
import VehicleRequestsList from "../Requests/VehicleRequestsList";
import { PROFILE_TABS, REQUESTS_TAB, REVIEWS_TAB, countParts, countVehicles, dealerBadge, profileTabs, useVehicleReviews } from "./vehicleProfileShared";

const getUserId = (user) => user?._id || user?.id || user?.userId || null;

export default function MyVehicleProfile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();

    const profileState = useSelector((state) => state.profile ?? {});
    const authUser = useSelector((state) => state.auth?.user);
    const loginUser = useSelector((state) => state.loginForm?.user);
    // Both reducer shapes: { firstName, ... } and { user: {...} }.
    const profile = profileState.user || profileState.profile || profileState;
    const userId = getUserId(profile) || getUserId(authUser) || getUserId(loginUser);

    const [activeTab, setActiveTab] = useState(Math.max(0, PROFILE_TABS.indexOf(searchParams.get("tab"))));
    const [statistics, setStatistics] = useState(countVehicles([]));
    const [partStatistics, setPartStatistics] = useState(countParts([]));
    const [statsError, setStatsError] = useState("");
    const [dealer, setDealer] = useState(null);
    const reviews = useVehicleReviews(userId, t);
    const { load: loadReviews } = reviews;

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    // Statistics (every status, I am the owner) and my business profile.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [mine, business, parts] = await Promise.allSettled([
                axiosInstance.get("/vehicles/mine"),
                axiosInstance.get("/vehicles/dealers/me"),
                axiosInstance.get("/vehicles/parts/mine"),
            ]);
            if (cancelled) return;
            if (mine.status === "fulfilled") setStatistics(countVehicles(mine.value.data?.vehicles));
            else setStatsError(mine.reason?.response?.data?.message || t("vehiclesApp.mine.error", "Unable to load your vehicles."));
            if (business.status === "fulfilled") setDealer(business.value.data?.dealer || null);
            if (parts.status === "fulfilled") setPartStatistics(countParts(parts.value.data?.parts));
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    useEffect(() => {
        if (userId) loadReviews(1, false);
    }, [userId, loadReviews]);

    // Edits, status changes and deletes in the tabs update the statistics.
    const onVehiclesChange = useCallback((vehicles) => setStatistics(countVehicles(vehicles)), []);
    const onPartsChange = useCallback((parts) => setPartStatistics(countParts(parts)), []);

    if (profileState.loading && !profile?.firstName && !profile?.email) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    const user = { ...profile, _id: userId || profile?._id };

    return (
        <Container maxWidth={false} disableGutters sx={pagePaddingSx}>
            <Stack spacing={3}>
                {profileState.error && <Alert severity="warning">{profileState.error}</Alert>}
                {statsError && <Alert severity="error">{statsError}</Alert>}

                <VehicleProfileHeader user={user} rating={reviews.rating} totalReviews={reviews.total} badge={dealerBadge(t, dealer)} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
                    {userId && (
                        <Button
                            variant="outlined"
                            startIcon={<VisibilityOutlined />}
                            onClick={() => navigate(`/vehicles/profile/${userId}`)}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                            {t("vehiclesApp.profile.seePublic", "See my public profile")}
                        </Button>
                    )}
                </Stack>

                <VehicleProfileStats statistics={{ ...statistics, ...partStatistics, totalReviews: reviews.total }} />

                <VehiclePersonalInfo profile={profile} />

                <MySocialLinksCard links={profile?.socialLinks} />

                <VehicleProfileTabs activeTab={activeTab} onChange={setActiveTab} tabs={profileTabs(true)} showPortfolio />

                <Box role="tabpanel" id={`public-profile-panel-${activeTab}`} aria-labelledby={`public-profile-tab-${activeTab}`}>
                    {activeTab === 0 && <MyVehiclesPage key="vehicles" embedded section="vehicles" onVehiclesChange={onVehiclesChange} />}
                    {activeTab === 1 && <MyVehiclesPage key="motos" embedded section="motos" onVehiclesChange={onVehiclesChange} />}
                    {activeTab === 2 && <MyVehiclesPage key="parts" embedded section="parts" onPartsChange={onPartsChange} />}
                    {/* My vehicle requests ("I am looking for...") */}
                    {activeTab === REQUESTS_TAB && <VehicleRequestsList mode="mine" />}
                    {/* Articles and videos: add, edit, delete */}
                    {activeTab === "portfolio" && <PortfolioSection api="/vehicles/portfolio" mine />}
                    {activeTab === REVIEWS_TAB && (
                        <VehicleReviewsTab
                            reviews={reviews.reviews}
                            rating={reviews.rating}
                            totalReviews={reviews.total}
                            reviewForm={{ rating: 0, comment: "" }}
                            setReviewForm={() => {}}
                            submitting={false}
                            loading={reviews.loading}
                            error={reviews.error}
                            success=""
                            onSubmit={(event) => event.preventDefault()}
                            hasMore={reviews.hasMore}
                            onLoadMore={reviews.loadMore}
                            canReview={false}
                        />
                    )}
                </Box>
            </Stack>
        </Container>
    );
}
