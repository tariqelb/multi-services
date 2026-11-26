import React, { useCallback, useEffect, useState } from "react";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from "@mui/material";

import { ArrowBack } from "@mui/icons-material";

import axiosInstance from "../../../api/axiosInstance";

import PublicProfileHeader from "./components/PublicProfileHeader";
import PublicProfileStats from "./components/PublicProfileStats";
import PublicProfileTabs from "./components/PublicProfileTabs";
import PropertyListingsTab from "./components/PropertyListingsTab";
import RoommateListingsTab from "./components/RoommateListingsTab";
import EstablishmentListingsTab from "./components/EstablishmentListingsTab";
import ReviewsTab from "./components/ReviewsTab";
import PublicContactCard from "../../../Components/Profile/PublicContactCard";
import PropertyRequestsList from "../Requests/PropertyRequestsList";
import PortfolioSection from "../../../Components/Profile/Portfolio/PortfolioSection";

// Order of the tabs in PublicProfileTabs.
const PROFILE_TABS = ["properties", "roommates", "establishments", "reviews", "requests"];

const ITEMS_PER_PAGE = 12;
const REVIEWS_PER_PAGE = 20;

const initialStatistics = {
    totalProperties: 0,
    availableProperties: 0,
    totalRoommates: 0,
    totalEstablishments: 0,
    totalReviews: 0,
};

export default function PublicProfile() {
    const { userId } = useParams();

    // ?tab=reviews (from the Reviews page) opens that tab directly.
    const [searchParams] = useSearchParams();
    const requestedTab = Math.max(0, PROFILE_TABS.indexOf(searchParams.get("tab")));
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Every hook runs on every render (no short-circuit between hooks).
    const profileUser = useSelector((state) => state.profile?.user);
    const authUser = useSelector((state) => state.auth?.user);
    const loginUser = useSelector((state) => state.loginForm?.user);
    const currentUser = profileUser || authUser || loginUser;

    const currentUserId =
        currentUser?._id || currentUser?.id || currentUser?.userId;

    // Profile
    const [user, setUser] = useState(null);
    // What the user chose to show (Settings > Public profile).
    const [contact, setContact] = useState(null);
    const [socialLinks, setSocialLinks] = useState([]);
    const [showRequests, setShowRequests] = useState(false);
    const [statistics, setStatistics] = useState(initialStatistics);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState("");

    // Properties
    const [properties, setProperties] = useState([]);
    const [propertiesPage, setPropertiesPage] = useState(1);
    const [propertiesHasMore, setPropertiesHasMore] = useState(false);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [propertiesError, setPropertiesError] = useState("");

    // Roommates
    const [roommateListings, setRoommateListings] = useState([]);
    const [roommatesPage, setRoommatesPage] = useState(1);
    const [roommatesHasMore, setRoommatesHasMore] = useState(false);
    const [roommatesLoading, setRoommatesLoading] = useState(false);
    const [roommatesError, setRoommatesError] = useState("");

    // Establishments
    const [establishments, setEstablishments] = useState([]);
    const [establishmentsPage, setEstablishmentsPage] = useState(1);
    const [establishmentsHasMore, setEstablishmentsHasMore] =
        useState(false);
    const [establishmentsLoading, setEstablishmentsLoading] =
        useState(false);
    const [establishmentsError, setEstablishmentsError] = useState("");

    // Reviews
    const [reviews, setReviews] = useState([]);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsHasMore, setReviewsHasMore] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    // Tabs and review form
    const [activeTab, setActiveTab] = useState(0);

    // Portfolio (articles and videos): first tab when the user has some.
    const [portfolio, setPortfolio] = useState({ userId: null, items: [] });
    const portfolioLoading = portfolio.userId !== userId;
    const askedTab = searchParams.get("tab");
    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`/property/portfolio/user/${userId}`)
            .then(({ data }) => {
                if (cancelled) return;
                const items = data.items || [];
                setPortfolio({ userId, items });
                if (items.length && !askedTab) setActiveTab("portfolio");
            })
            .catch(() => !cancelled && setPortfolio({ userId, items: [] }));
        return () => {
            cancelled = true;
        };
    }, [userId, askedTab]);
    const [reviewForm, setReviewForm] = useState({
        rating: 0,
        comment: "",
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState("");

    // --------------------------------------------------
    // Profile
    // --------------------------------------------------

    const loadProfile = useCallback(async () => {
        if (!userId) return;

        setProfileLoading(true);
        setProfileError("");

        try {
            const response = await axiosInstance.get(`/property/profiles/${userId}`);
            const data = response.data;

            setUser(data.user || null);
            setContact(data.contact || null);
            setSocialLinks(Array.isArray(data.socialLinks) ? data.socialLinks : []);
            setShowRequests(data.showRequests === true);
            // ?tab=requests when the requests are hidden: first tab.
            if (data.showRequests !== true) setActiveTab((tab) => (tab === PROFILE_TABS.indexOf("requests") ? 0 : tab));
            setProperties(data.properties || []);

            setStatistics({
                ...initialStatistics,
                ...(data.statistics || {}),
            });

            const pagination = data.pagination || {};

            setPropertiesPage(
                Number(pagination.currentPage) || 1
            );

            setPropertiesHasMore(
                pagination.hasNextPage ??
                    pagination.hasMore ??
                    (Number(pagination.currentPage || 1) <
                        Number(pagination.totalPages || 1))
            );
        } catch (error) {
            console.error("Error loading public profile:", error);

            setProfileError(
                error.response?.data?.message ||
                    t("publicProfile.errors.profile")
            );
        } finally {
            setProfileLoading(false);
        }
    }, [userId, t]);

    // --------------------------------------------------
    // Roommate listings
    // --------------------------------------------------

    const loadRoommateListings = useCallback(
        async (page = 1, append = false) => {
            if (!userId) return;

            setRoommatesLoading(true);
            setRoommatesError("");

            try {
                const response = await axiosInstance.get(
                    `/property/roommates/user/${userId}`,
                    {
                        params: {
                            page,
                            limit: ITEMS_PER_PAGE,
                        },
                    }
                );

                const data = response.data;
                const newListings = Array.isArray(data)
                    ? data
                    : data.listings || [];

                setRoommateListings((previous) =>
                    append
                        ? [...previous, ...newListings]
                        : newListings
                );

                const pagination = data.pagination || {};

                setRoommatesPage(
                    Number(pagination.currentPage) || page
                );

                setRoommatesHasMore(
                    pagination.hasNextPage ??
                        pagination.hasMore ??
                        (Number(pagination.currentPage || page) <
                            Number(pagination.totalPages || page))
                );

                setStatistics((previous) => ({
                    ...previous,
                    totalRoommates:
                        pagination.totalListings ??
                        pagination.total ??
                        pagination.totalRoommates ??
                        (append
                            ? previous.totalRoommates
                            : newListings.length),
                }));
            } catch (error) {
                console.error("Error loading roommate listings:", error);

                setRoommatesError(
                    error.response?.data?.message ||
                        t("publicProfile.errors.roommates")
                );
            } finally {
                setRoommatesLoading(false);
            }
        },
        [userId, t]
    );

    // --------------------------------------------------
    // Establishments
    // --------------------------------------------------

    const loadEstablishments = useCallback(
        async (page = 1, append = false) => {
            if (!userId) return;

            setEstablishmentsLoading(true);
            setEstablishmentsError("");

            try {
                const response = await axiosInstance.get(
                    `/property/establishments/user/${userId}`,
                    {
                        params: {
                            page,
                            limit: ITEMS_PER_PAGE,
                        },
                    }
                );

                const data = response.data;

                const newEstablishments = Array.isArray(data)
                    ? data
                    : data.establishments || [];

                setEstablishments((previous) =>
                    append
                        ? [...previous, ...newEstablishments]
                        : newEstablishments
                );

                const pagination = data.pagination || {};

                setEstablishmentsPage(
                    Number(pagination.currentPage) || page
                );

                setEstablishmentsHasMore(
                    pagination.hasNextPage ??
                        pagination.hasMore ??
                        (Number(pagination.currentPage || page) <
                            Number(pagination.totalPages || page))
                );

                setStatistics((previous) => ({
                    ...previous,
                    totalEstablishments:
                        pagination.totalEstablishments ??
                        pagination.total ??
                        pagination.totalListings ??
                        (append
                            ? previous.totalEstablishments
                            : newEstablishments.length),
                }));
            } catch (error) {
                console.error("Error loading establishments:", error);

                setEstablishmentsError(
                    error.response?.data?.message ||
                        t("publicProfile.errors.establishments")
                );
            } finally {
                setEstablishmentsLoading(false);
            }
        },
        [userId, t]
    );

    // --------------------------------------------------
    // Reviews
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
                            limit: REVIEWS_PER_PAGE,
                        },
                    }
                );

                const data = response.data;
                const newReviews = data.reviews || [];

                setReviews((previous) =>
                    append
                        ? [...previous, ...newReviews]
                        : newReviews
                );

                const pagination = data.pagination || {};

                setReviewsPage(
                    Number(pagination.currentPage) || page
                );

                setReviewsHasMore(
                    pagination.hasNextPage ??
                        pagination.hasMore ??
                        (Number(pagination.currentPage || page) <
                            Number(pagination.totalPages || page))
                );

                setReviewRating(
                    Number(
                        data.rating?.average ??
                            data.rating?.averageRating ??
                            data.averageRating ??
                            0
                    )
                );

                setTotalReviews(
                    Number(
                        data.rating?.totalReviews ??
                            data.rating?.count ??
                            data.totalReviews ??
                            pagination.totalReviews ??
                            newReviews.length
                    )
                );

                setStatistics((previous) => ({
                    ...previous,
                    totalReviews:
                        Number(
                            data.rating?.totalReviews ??
                                data.rating?.count ??
                                data.totalReviews ??
                                pagination.totalReviews ??
                                newReviews.length
                        ) || 0,
                }));
            } catch (error) {
                console.error("Error loading reviews:", error);

                setReviewsError(
                    error.response?.data?.message ||
                        t("publicProfile.errors.reviews")
                );
            } finally {
                setReviewsLoading(false);
            }
        },
        [userId, t]
    );

    // --------------------------------------------------
    // Initial loading
    // --------------------------------------------------

    useEffect(() => {
        setUser(null);
        setProperties([]);
        setRoommateListings([]);
        setEstablishments([]);
        setReviews([]);
        setStatistics(initialStatistics);

        setPropertiesPage(1);
        setRoommatesPage(1);
        setEstablishmentsPage(1);
        setReviewsPage(1);

        setActiveTab(requestedTab);

        setReviewForm({
            rating: 0,
            comment: "",
        });

        loadProfile();
        loadRoommateListings(1, false);
        loadEstablishments(1, false);
        loadReviews(1, false);
    }, [
        userId,
        requestedTab,
        loadProfile,
        loadRoommateListings,
        loadEstablishments,
        loadReviews,
    ]);

    // --------------------------------------------------
    // Load more
    // --------------------------------------------------

    const handleLoadMoreProperties = () => {
        if (!propertiesLoading && propertiesHasMore) {
            loadProfilePage(propertiesPage + 1);
        }
    };

    const loadProfilePage = async (page) => {
        setPropertiesLoading(true);
        setPropertiesError("");

        try {
            const response = await axiosInstance.get(
                `/property/profiles/${userId}`,
                {
                    params: {
                        page,
                        limit: ITEMS_PER_PAGE,
                    },
                }
            );

            const data = response.data;
            const newProperties = data.properties || [];
            const pagination = data.pagination || {};

            setProperties((previous) => [
                ...previous,
                ...newProperties,
            ]);

            setPropertiesPage(
                Number(pagination.currentPage) || page
            );

            setPropertiesHasMore(
                pagination.hasNextPage ??
                    pagination.hasMore ??
                    (Number(pagination.currentPage || page) <
                        Number(pagination.totalPages || page))
            );
        } catch (error) {
            console.error("Error loading more properties:", error);

            setPropertiesError(
                error.response?.data?.message ||
                    t("publicProfile.errors.properties")
            );
        } finally {
            setPropertiesLoading(false);
        }
    };

    const handleLoadMoreRoommates = () => {
        if (!roommatesLoading && roommatesHasMore) {
            loadRoommateListings(roommatesPage + 1, true);
        }
    };

    const handleLoadMoreEstablishments = () => {
        if (!establishmentsLoading && establishmentsHasMore) {
            loadEstablishments(establishmentsPage + 1, true);
        }
    };

    const handleLoadMoreReviews = () => {
        if (!reviewsLoading && reviewsHasMore) {
            loadReviews(reviewsPage + 1, true);
        }
    };

    // --------------------------------------------------
    // Review submission
    // --------------------------------------------------

    const handleSubmitReview = async (event) => {
        event.preventDefault();

        const rating = Number(reviewForm.rating);
        const comment = reviewForm.comment.trim();

        if (!rating || rating < 1 || rating > 5) {
            setReviewsError(t("publicProfile.errors.ratingRequired"));
            return;
        }

        if (comment.length < 3 || comment.length > 1000) {
            setReviewsError(t("publicProfile.errors.commentLength"));
            return;
        }

        setSubmittingReview(true);
        setReviewsError("");
        setReviewSuccess("");

        try {
            await axiosInstance.post(
                `/property/profiles/${userId}/reviews`,
                {
                    rating,
                    comment,
                }
            );

            setReviewForm({
                rating: 0,
                comment: "",
            });

            setReviewSuccess(
                t("publicProfile.reviews.submitSuccess")
            );

            // Refresh the first review page and its rating summary.
            await loadReviews(1, false);
        } catch (error) {
            console.error("Error submitting review:", error);

            setReviewsError(
                error.response?.data?.message ||
                    t("publicProfile.errors.submitReview")
            );
        } finally {
            setSubmittingReview(false);
        }
    };

    // --------------------------------------------------
    // Navigation
    // --------------------------------------------------

    const handleViewProperty = (id) => {
        if (id) navigate(`/properties/${id}`);
    };

    const handleViewRoommate = (id) => {
        if (id) navigate(`/roommates/${id}`);
    };

    const handleViewEstablishment = (id) => {
        if (id) navigate(`/establishments/${id}`);
    };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    if (profileLoading && !user) {
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

    if (profileError && !user) {
        return (
            <Container maxWidth={false} disableGutters sx={pagePaddingSx}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {profileError}
                </Alert>

                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(-1)}
                >
                    {t("publicProfile.back")}
                </Button>
            </Container>
        );
    }

    if (!user) return null;

    const canReview =
        Boolean(currentUserId) &&
        String(currentUserId) !== String(userId);

    return (
        <Container maxWidth={false} disableGutters sx={pagePaddingSx}>
            <Stack spacing={3}>
                <Box>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(-1)}
                        sx={{ textTransform: "none" }}
                    >
                        {t("publicProfile.back")}
                    </Button>
                </Box>

                <PublicProfileHeader
                    user={user}
                    rating={reviewRating}
                    totalReviews={totalReviews}
                />

                <PublicContactCard contact={contact} socialLinks={socialLinks} />

                <PublicProfileStats statistics={statistics} />

                <PublicProfileTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    showRequests={showRequests}
                    showPortfolio={!portfolioLoading && portfolio.items.length > 0}
                />

                <Box
                    role="tabpanel"
                    id={`public-profile-panel-${activeTab}`}
                    aria-labelledby={`public-profile-tab-${activeTab}`}
                >
                    {activeTab === 0 && (
                        <PropertyListingsTab
                            properties={properties}
                            loading={propertiesLoading}
                            error={propertiesError}
                            hasMore={propertiesHasMore}
                            onLoadMore={handleLoadMoreProperties}
                            onView={handleViewProperty}
                        />
                    )}

                    {activeTab === 1 && (
                        <RoommateListingsTab
                            listings={roommateListings}
                            loading={roommatesLoading}
                            error={roommatesError}
                            hasMore={roommatesHasMore}
                            onLoadMore={handleLoadMoreRoommates}
                            onView={handleViewRoommate}
                        />
                    )}

                    {activeTab === 2 && (
                        <EstablishmentListingsTab
                            establishments={establishments}
                            loading={establishmentsLoading}
                            error={establishmentsError}
                            hasMore={establishmentsHasMore}
                            onLoadMore={handleLoadMoreEstablishments}
                            onView={handleViewEstablishment}
                        />
                    )}

                    {activeTab === "portfolio" && (
                        <PortfolioSection api="/property/portfolio" items={portfolio.items} loading={portfolioLoading} />
                    )}

                    {activeTab === 4 && showRequests && (
                        <PropertyRequestsList mode="public" userId={userId} />
                    )}

                    {activeTab === 3 && (
                        <ReviewsTab
                            reviews={reviews}
                            rating={reviewRating}
                            totalReviews={totalReviews}
                            reviewForm={reviewForm}
                            setReviewForm={setReviewForm}
                            submitting={submittingReview}
                            loading={reviewsLoading}
                            error={reviewsError}
                            success={reviewSuccess}
                            onSubmit={handleSubmitReview}
                            hasMore={reviewsHasMore}
                            onLoadMore={handleLoadMoreReviews}
                            canReview={canReview}
                        />
                    )}
                </Box>
            </Stack>
        </Container>
    );
}
