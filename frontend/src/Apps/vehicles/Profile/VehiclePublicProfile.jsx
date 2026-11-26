// src/Apps/vehicles/Profile/VehiclePublicProfile.jsx
// /vehicles/profile/:userId — public profile of a vehicle publisher, same
// page as the property public profile: header with the rating, statistics,
// then tabs: vehicles, motos & bikes, spare parts, reviews (leave a review there).
// ?tab=reviews opens the reviews (from the Reviews page and the vehicle page).

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, Box, Button, CircularProgress, Container, Stack } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";

import axiosInstance from "../../../api/axiosInstance";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import VehicleProfileHeader from "./components/VehicleProfileHeader";
import VehicleProfileStats from "./components/VehicleProfileStats";
import VehicleProfileTabs from "./components/VehicleProfileTabs";
import VehicleReviewsTab from "./components/VehicleReviewsTab";

import VehiclePublicationsTab from "./VehiclePublicationsTab";
import PublicContactCard from "../../../Components/Profile/PublicContactCard";
import VehicleRequestsList from "../Requests/VehicleRequestsList";
import PortfolioSection from "../../../Components/Profile/Portfolio/PortfolioSection";
import { PROFILE_TABS, REQUESTS_TAB, REVIEWS_TAB, dealerBadge, profileTabs, useVehicleReviews } from "./vehicleProfileShared";

const EMPTY_FORM = { rating: 0, comment: "" };

export default function VehiclePublicProfile() {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const requestedTab = Math.max(0, PROFILE_TABS.indexOf(searchParams.get("tab")));
    const navigate = useNavigate();
    const { t } = useTranslation();

    const profileUser = useSelector((state) => state.profile?.user);
    const authUser = useSelector((state) => state.auth?.user);
    const loginUser = useSelector((state) => state.loginForm?.user);
    const currentUser = profileUser || authUser || loginUser;
    const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState(requestedTab);

    const [reviewForm, setReviewForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const reviews = useVehicleReviews(userId, t);

    // Portfolio (articles and videos): first tab when the user has some.
    const [portfolio, setPortfolio] = useState({ userId: null, items: [] });
    const portfolioLoading = portfolio.userId !== userId;
    const askedTab = searchParams.get("tab");
    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`/vehicles/portfolio/user/${userId}`)
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
    const { load: loadReviews } = reviews;

    // New profile or new ?tab: start again.
    const [shownKey, setShownKey] = useState(`${userId}|${requestedTab}`);
    if (shownKey !== `${userId}|${requestedTab}`) {
        if (!shownKey.startsWith(`${userId}|`)) {
            setProfile(null);
            setLoading(true);
            setError("");
        }
        setShownKey(`${userId}|${requestedTab}`);
        setActiveTab(requestedTab);
        setReviewForm(EMPTY_FORM);
        setSuccess("");
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get(`/vehicles/profiles/${userId}`);
                if (!cancelled) setProfile(data);
            } catch (requestError) {
                if (!cancelled) setError(requestError.response?.data?.message || t("publicProfile.errors.profile", "Unable to load this profile."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, t]);

    useEffect(() => {
        loadReviews(1, false);
    }, [loadReviews]);

    const submitReview = async (event) => {
        event.preventDefault();
        const rating = Number(reviewForm.rating);
        const comment = reviewForm.comment.trim();

        if (!rating || rating < 1 || rating > 5) return reviews.setError(t("publicProfile.errors.ratingRequired"));
        if (comment.length < 3 || comment.length > 1000) return reviews.setError(t("publicProfile.errors.commentLength"));

        setSubmitting(true);
        reviews.setError("");
        setSuccess("");
        try {
            const { data } = await axiosInstance.post(`/vehicles/profiles/${userId}/reviews`, { rating, comment });
            setReviewForm(EMPTY_FORM);
            setSuccess(t("publicProfile.reviews.submitSuccess"));
            setProfile((previous) =>
                previous ? { ...previous, statistics: { ...previous.statistics, totalReviews: data.rating?.totalReviews ?? previous.statistics?.totalReviews } } : previous,
            );
            await loadReviews(1, false);
        } catch (requestError) {
            reviews.setError(requestError.response?.data?.message || t("publicProfile.errors.submitReview"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !profile) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !profile) {
        return (
            <Container maxWidth={false} disableGutters sx={pagePaddingSx}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                    {t("publicProfile.back")}
                </Button>
            </Container>
        );
    }

    if (!profile) return null;

    const { user, dealer, statistics } = profile;
    const isMe = Boolean(currentUserId) && String(currentUserId) === String(userId);
    // ?tab=requests while the requests are hidden: first tab.
    const tabShown = activeTab === REQUESTS_TAB && profile.showRequests !== true ? 0 : activeTab;
    const hasPublications = (statistics?.totalVehicles || 0) + (statistics?.totalMotos || 0) + (statistics?.totalParts || 0) > 0;

    return (
        <Container maxWidth={false} disableGutters sx={pagePaddingSx}>
            <Stack spacing={3}>
                <Box>
                    <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ textTransform: "none" }}>
                        {t("publicProfile.back")}
                    </Button>
                </Box>

                <VehicleProfileHeader user={user} rating={reviews.rating} totalReviews={reviews.total} badge={dealerBadge(t, dealer)} />

                {/* Only what the user chose to show (Settings > Public profile) */}
                <PublicContactCard contact={profile.contact} socialLinks={profile.socialLinks} />

                <VehicleProfileStats statistics={{ ...statistics, totalReviews: reviews.total }} />

                <VehicleProfileTabs
                    activeTab={tabShown}
                    onChange={setActiveTab}
                    tabs={profileTabs(false, profile.showRequests === true)}
                    showPortfolio={!portfolioLoading && portfolio.items.length > 0}
                />

                <Box role="tabpanel" id={`public-profile-panel-${tabShown}`} aria-labelledby={`public-profile-tab-${tabShown}`}>
                    {tabShown === "portfolio" && <PortfolioSection api="/vehicles/portfolio" items={portfolio.items} loading={portfolioLoading} />}
                    {tabShown === REQUESTS_TAB && <VehicleRequestsList mode="public" userId={userId} />}
                    {tabShown === 0 && <VehiclePublicationsTab userId={userId} category="car" />}
                    {tabShown === 1 && <VehiclePublicationsTab userId={userId} category="moto" />}
                    {tabShown === 2 && <VehiclePublicationsTab userId={userId} category="part" />}
                    {tabShown === REVIEWS_TAB && (
                        <Stack spacing={2}>
                            {/* Reviews are for people who published at least one vehicle. */}
                            {!isMe && currentUserId && !hasPublications && (
                                <Alert severity="info">
                                    {t("vehiclesApp.profile.reviewNeedsPublication", "You can leave a review once this person has published a vehicle, moto, bike or spare part.")}
                                </Alert>
                            )}
                            {!currentUserId && (
                                <Alert severity="info">{t("vehiclesApp.profile.loginToReview", "Log in to leave a review.")}</Alert>
                            )}
                            <VehicleReviewsTab
                                reviews={reviews.reviews}
                                rating={reviews.rating}
                                totalReviews={reviews.total}
                                reviewForm={reviewForm}
                                setReviewForm={setReviewForm}
                                submitting={submitting}
                                loading={reviews.loading}
                                error={reviews.error}
                                success={success}
                                onSubmit={submitReview}
                                hasMore={reviews.hasMore}
                                onLoadMore={reviews.loadMore}
                                canReview={Boolean(currentUserId) && !isMe && hasPublications}
                            />
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Container>
    );
}
