
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Stack,
} from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";
import { getProfile } from "../../../redux/actions/profile/profileAction";

import PublicProfileHeader from "../PublicProfile/components/PublicProfileHeader";
import PublicProfileStats from "../PublicProfile/components/PublicProfileStats";
import PublicProfileTabs from "../PublicProfile/components/PublicProfileTabs";
import ReviewsTab from "../PublicProfile/components/ReviewsTab";

import DisplayProfile from "./DisplayProfile";
import { MySocialLinksCard } from "../../../Components/Profile/SocialLinks";
import ProfilePropertyList from "./ProfilePropertyList";
import PropertyRequestsList from "../Requests/PropertyRequestsList";
import PortfolioSection from "../../../Components/Profile/Portfolio/PortfolioSection";

const initialStatistics = {
    totalProperties: 0,
    availableProperties: 0,
    totalRoommates: 0,
    totalEstablishments: 0,
    totalReviews: 0,
};

const getUserId = (user) =>
    user?._id || user?.id || user?.userId || null;

export default function ProfileContent() {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const profileState = useSelector(
        (state) => state.profile ?? {}
    );

    // Every selector runs on every render (hooks must keep the same order;
    // "a || useSelector(...)" skipped some once the profile had loaded).
    const profileUser = useSelector((state) => state.profile?.user);
    const authUser = useSelector((state) => state.auth?.user);
    const loginUser = useSelector((state) => state.loginForm?.user);
    const currentUser = profileUser || authUser || loginUser;

    // Support both profile reducer shapes:
    // { firstName, lastName, ... } and { user: {...} }
    const profile =
        profileState.user ||
        profileState.profile ||
        profileState;

    const userId =
        getUserId(profile) ||
        getUserId(currentUser);

    const navigate = useNavigate();
    const profileLoading = Boolean(profileState.loading);
    const profileError = profileState.error;

    const [activeTab, setActiveTab] = useState(0);

    const [statistics, setStatistics] = useState({
        ...initialStatistics,
        ...(profile?.statistics || {}),
    });

    const [reviews, setReviews] = useState([]);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsHasMore, setReviewsHasMore] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    // --------------------------------------------------
    // Load reviews received by this user
    // --------------------------------------------------

    const loadReviews = useCallback(
        async (page = 1, append = false) => {
            if (!userId) return;

            setReviewsLoading(true);
            setReviewsError("");

            try {
                const response = await axiosInstance.get(
                    `/property/profiles/${userId}/reviews`,
                    {
                        params: {
                            page,
                            limit: 20,
                        },
                    }
                );

                const data = response.data || {};
                const newReviews = data.reviews || [];
                const pagination = data.pagination || {};

                setReviews((previous) =>
                    append
                        ? [...previous, ...newReviews]
                        : newReviews
                );

                setReviewsPage(
                    Number(pagination.currentPage) || page
                );

                setReviewsHasMore(
                    pagination.hasNextPage ??
                    pagination.hasMore ??
                    (
                        Number(pagination.currentPage || page) <
                        Number(pagination.totalPages || page)
                    )
                );

                const average = Number(
                    data.rating?.average ??
                    data.rating?.averageRating ??
                    data.averageRating ??
                    0
                );

                const count = Number(
                    data.rating?.totalReviews ??
                    data.rating?.count ??
                    data.totalReviews ??
                    pagination.totalReviews ??
                    newReviews.length
                );

                setReviewRating(average);
                setTotalReviews(count);

                setStatistics((previous) => ({
                    ...previous,
                    totalReviews: count,
                }));
            } catch (error) {
                console.error("Error loading profile reviews:", error);

                setReviewsError(
                    error.response?.data?.message ||
                    t("publicProfile.errors.reviews", {
                        defaultValue: "Unable to load reviews.",
                    })
                );
            } finally {
                setReviewsLoading(false);
            }
        },
        [userId, t]
    );

    useEffect(() => {
        if (!userId) return;

        setReviews([]);
        setReviewsPage(1);
        setReviewsHasMore(false);
        setReviewRating(0);
        setTotalReviews(0);

        loadReviews(1, false);
    }, [userId, loadReviews]);

    const handleLoadMoreReviews = () => {
        if (!reviewsLoading && reviewsHasMore) {
            loadReviews(reviewsPage + 1, true);
        }
    };

    // --------------------------------------------------
    // Publication statistics
    // --------------------------------------------------

    const handleStatisticsChange = useCallback((publicationStats) => {
        setStatistics((previous) => ({
            ...previous,
            ...publicationStats,
        }));
    }, []);

    // --------------------------------------------------
    // Tabs
    // --------------------------------------------------

    const handleTabChange = (_event, newValue) => {
        setActiveTab(newValue);
    };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    if (profileLoading && !profile?.firstName && !profile?.email) {
        return (
            <Box
                sx={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (profileError && !profile?.email && !profile?.firstName) {
        return (
            <Container maxWidth={false} disableGutters sx={pagePaddingSx}>
                <Alert severity="error">
                    {profileError}
                </Alert>
            </Container>
        );
    }

    const user = {
        ...profile,
        _id: userId || profile?._id,
    };

    return (
        <Container maxWidth={false} disableGutters sx={pagePaddingSx}>
            <Stack spacing={3}>
                {profileError && (
                    <Alert severity="warning">
                        {profileError}
                    </Alert>
                )}

                {/* Same header as PublicProfile */}
                <PublicProfileHeader
                    user={user}
                    rating={reviewRating}
                    totalReviews={totalReviews}
                />

                {/* Same place as in the vehicles profile */}
                {userId && (
                    <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "flex-end" }}>
                        <Button
                            variant="outlined"
                            startIcon={<VisibilityOutlined />}
                            onClick={() => navigate(`/profile/${userId}`)}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                            {t("myProfile.seePublic", "See my public profile")}
                        </Button>
                    </Stack>
                )}

                {/* Same statistics cards as PublicProfile */}
                <PublicProfileStats
                    statistics={statistics}
                />

                {/* Personal information */}
                <DisplayProfile profile={profile} />

                {/* Social media links (public or private, Settings > Social media) */}
                <MySocialLinksCard links={profile?.socialLinks} />

                {/* Same four-tab navigation as PublicProfile */}
                <PublicProfileTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    showPortfolio
                />

                <Box
                    role="tabpanel"
                    id={`public-profile-panel-${activeTab}`}
                    aria-labelledby={`public-profile-tab-${activeTab}`}
                >
                    {/* Properties */}
                    {activeTab === 0 && (
                        <ProfilePropertyList
                            refreshTrigger={refreshTrigger}
                            onStatisticsChange={handleStatisticsChange}
                            activeTab="properties"
                            showTabs={false}
                        />
                    )}

                    {/* Roommates */}
                    {activeTab === 1 && (
                        <ProfilePropertyList
                            refreshTrigger={refreshTrigger}
                            onStatisticsChange={handleStatisticsChange}
                            activeTab="roommates"
                            showTabs={false}
                        />
                    )}

                    {/* Establishments */}
                    {activeTab === 2 && (
                        <ProfilePropertyList
                            refreshTrigger={refreshTrigger}
                            onStatisticsChange={handleStatisticsChange}
                            activeTab="establishments"
                            showTabs={false}
                        />
                    )}

                    {/* My property requests ("I am looking for...") */}
                    {activeTab === 4 && <PropertyRequestsList mode="mine" />}

                    {/* Articles and videos: add, edit, delete */}
                    {activeTab === "portfolio" && <PortfolioSection api="/property/portfolio" mine />}

                    {/* Reviews received */}
                    {activeTab === 3 && (
                        <ReviewsTab
                            reviews={reviews}
                            rating={reviewRating}
                            totalReviews={totalReviews}
                            reviewForm={{
                                rating: 0,
                                comment: "",
                            }}
                            setReviewForm={() => {}}
                            submitting={false}
                            loading={reviewsLoading}
                            error={reviewsError}
                            success=""
                            onSubmit={(event) => event.preventDefault()}
                            hasMore={reviewsHasMore}
                            onLoadMore={handleLoadMoreReviews}
                            canReview={false}
                        />
                    )}
                </Box>
            </Stack>
        </Container>
    );
}
