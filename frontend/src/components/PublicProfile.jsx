
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Rating,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";

import {
    ArrowBack,
    HomeWork,
    LocationOn,
    CalendarMonth,
    Visibility,
    RateReview,
    Send,
} from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";

const ITEMS_PER_PAGE = 12;
const REVIEWS_PER_PAGE = 20;

export default function PublicProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const loggedInUser = useSelector((state) => {
        const authUser =
            state.loginForm?.user ||
            state.auth?.user ||
            state.user?.user ||
            state.user;

        return authUser?.user || authUser;
    });

    const loggedInUserId = String(
        loggedInUser?._id ||
        loggedInUser?.id ||
        loggedInUser?.userId ||
        loggedInUser?.user?._id ||
        loggedInUser?.user?.id ||
        ""
    );

    const publisherId = String(
        userId || ""
    );

    const isOwnProfile =
        Boolean(loggedInUserId) &&
        loggedInUserId === publisherId;

    const canReview =
        Boolean(loggedInUser) &&
        Boolean(loggedInUserId) &&
        !isOwnProfile;

    const [activeTab, setActiveTab] = useState(0);

    const [user, setUser] = useState(null);
    const [properties, setProperties] = useState([]);

    const [statistics, setStatistics] = useState({
        totalProperties: 0,
        availableProperties: 0,
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
    });

    const [reviews, setReviews] = useState([]);

    const [ratingSummary, setRatingSummary] = useState({
        averageRating: 0,
        totalReviews: 0,
    });

    const [reviewPagination, setReviewPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
    });

    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");

    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

    const [error, setError] = useState("");

    const currentLanguage =
        i18n.resolvedLanguage?.split("-")[0] ||
        i18n.language?.split("-")[0] ||
        "en";

    const localeMap = {
        en: "en-GB",
        fr: "fr-FR",
        ar: "ar-MA",
    };

    const locale = localeMap[currentLanguage] || "en-GB";

    const pageTitle = t("publicProfile.title", {
        defaultValue: "Publisher profile",
    });

    const pageSubtitle = t("publicProfile.subtitle", {
        defaultValue: "View publisher information and property listings.",
    });

    const formatDate = (date) => {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "";

        return new Intl.DateTimeFormat(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(parsedDate);
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return "";

        return new Intl.NumberFormat(locale, {
            maximumFractionDigits: 0,
        }).format(price);
    };

    const getPropertyId = (property) =>
        property?._id || property?.id;

    const getPropertyImage = (property) =>
        property?.images?.[0]?.path || "";

    // Load publisher information and properties.
    const loadProfile = useCallback(
        async (page = 1, append = false) => {
            try {
                if (append) {
                    setLoadingMore(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response = await axiosInstance.get(
                    `/profile/${userId}`,
                    {
                        params: {
                            page,
                            limit: ITEMS_PER_PAGE,
                        },
                    }
                );

                const data = response.data;

                setUser(data.user || null);

                setStatistics(
                    data.statistics || {
                        totalProperties: 0,
                        availableProperties: 0,
                    }
                );

                setProperties((previous) =>
                    append
                        ? [...previous, ...(data.properties || [])]
                        : data.properties || []
                );

                setPagination(
                    data.pagination || {
                        currentPage: page,
                        totalPages: 1,
                        hasMore: false,
                    }
                );
            } catch (err) {
                console.error("Public profile loading error:", err);

                setError(
                    err.response?.data?.message ||
                        t("publicProfile.loadError", {
                            defaultValue: "Unable to load this profile.",
                        })
                );
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [userId, t]
    );

    // Load publisher reviews and rating summary.
    const loadReviews = useCallback(
        async (page = 1, append = false) => {
            try {
                if (append) {
                    setLoadingMoreReviews(true);
                } else {
                    setLoadingReviews(true);
                }

                setReviewError("");

                const response = await axiosInstance.get(
                    `/profile/${userId}/reviews`,
                    {
                        params: {
                            page,
                            limit: REVIEWS_PER_PAGE,
                        },
                    }
                );

                const data = response.data;

                setReviews((previous) =>
                    append
                        ? [...previous, ...(data.reviews || [])]
                        : data.reviews || []
                );

                setRatingSummary(
                    data.rating || {
                        averageRating: 0,
                        totalReviews: 0,
                    }
                );

                setReviewPagination(
                    data.pagination || {
                        currentPage: page,
                        totalPages: 1,
                        hasMore: false,
                    }
                );
            } catch (err) {
                console.error("Reviews loading error:", err);

                setReviewError(
                    err.response?.data?.message ||
                        t("publicProfile.reviewsLoadError", {
                            defaultValue: "Unable to load reviews.",
                        })
                );
            } finally {
                setLoadingReviews(false);
                setLoadingMoreReviews(false);
            }
        },
        [userId, t]
    );

    useEffect(() => {
        setUser(null);
        setProperties([]);
        setReviews([]);
        setActiveTab(0);

        setReviewRating(0);
        setReviewComment("");
        setReviewError("");
        setReviewSuccess("");

        setPagination({
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
        });

        setReviewPagination({
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
        });

        loadProfile(1, false);
        loadReviews(1, false);
    }, [loadProfile, loadReviews]);

    const handleLoadMoreProperties = () => {
        if (loadingMore || !pagination.hasMore) return;

        loadProfile(pagination.currentPage + 1, true);
    };

    const handleLoadMoreReviews = () => {
        if (loadingMoreReviews || !reviewPagination.hasMore) return;

        loadReviews(reviewPagination.currentPage + 1, true);
    };

    // Submit a review.
    const handleSubmitReview = async (event) => {
        event.preventDefault();

        setReviewError("");
        setReviewSuccess("");

        if (!canReview) {
            setReviewError(
                t("publicProfile.reviewNotAllowed", {
                    defaultValue: "You cannot review this profile.",
                })
            );
            return;
        }

        if (reviewRating < 1 || reviewRating > 5) {
            setReviewError(
                t("publicProfile.ratingRequired", {
                    defaultValue: "Please select a rating.",
                })
            );
            return;
        }

        const cleanComment = reviewComment.trim();

        if (cleanComment.length < 3 || cleanComment.length > 1000) {
            setReviewError(
                t("publicProfile.commentValidation", {
                    defaultValue:
                        "Your review must contain between 3 and 1000 characters.",
                })
            );
            return;
        }

        try {
            setSubmittingReview(true);

            const response = await axiosInstance.post(
                `/profile/${userId}/reviews`,
                {
                    rating: reviewRating,
                    comment: cleanComment,
                }
            );

            setReviewRating(0);
            setReviewComment("");

            setReviewSuccess(
                response.data.message ||
                    t("publicProfile.reviewSuccess", {
                        defaultValue:
                            "Your review was submitted successfully.",
                    })
            );

            // Refresh the list and rating summary.
            await loadReviews(1, false);
        } catch (err) {
            setReviewError(
                err.response?.data?.message ||
                    t("publicProfile.reviewSubmitError", {
                        defaultValue: "Unable to submit your review.",
                    })
            );
        } finally {
            setSubmittingReview(false);
        }
    };

    const fullName = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
        : "";

    const initials =
        `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`
            .toUpperCase() || "U";

    // Shared page container: no PageLayout or fixed max-width.
    const pageContainerSx = {
        display: "block",
        width: "100%",
        minWidth: 0,
        maxWidth: "none",
        boxSizing: "border-box",
        flex: "1 1 0%",
        alignSelf: "stretch",
        p: {
            xs: 2,
            sm: 3,
            md: 4,
        },
        overflowX: "hidden",
    };

    // Loading state.
    if (loading) {
        return (
            <Box sx={pageContainerSx}>
                <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={700}
                    sx={{ mb: 3 }}
                >
                    {pageTitle}
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{ mb: 4 }}
                >
                    {pageSubtitle}
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 300,
                    }}
                >
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    // Error state.
    if (error || !user) {
        return (
            <Box sx={pageContainerSx}>
                <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={700}
                    sx={{ mb: 3 }}
                >
                    {pageTitle}
                </Typography>

                <Alert severity="error" sx={{ mb: 3 }}>
                    {error ||
                        t("publicProfile.notFound", {
                            defaultValue: "Publisher not found.",
                        })}
                </Alert>

                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(-1)}
                >
                    {t("publicProfile.back", {
                        defaultValue: "Go back",
                    })}
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={pageContainerSx}>
            {/* Page heading */}
            <Box sx={{ width: "100%", minWidth: 0, mb: 3 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={700}
                    sx={{
                        whiteSpace: "normal",
                        wordBreak: "normal",
                        overflowWrap: "break-word",
                    }}
                >
                    {pageTitle}
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{ mt: 0.75 }}
                >
                    {pageSubtitle}
                </Typography>
            </Box>

            {/* Back button */}
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{ mb: 3 }}
            >
                {t("publicProfile.back", {
                    defaultValue: "Back",
                })}
            </Button>

            {/* Publisher information */}
            <Card
                variant="outlined"
                sx={{
                    borderRadius: 3,
                    mb: 3,
                    width: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        background:
                            "linear-gradient(120deg, #eff6ff, #ffffff)",
                        p: {
                            xs: 2.5,
                            sm: 3,
                            md: 4,
                        },
                    }}
                >
                    <Stack
                        direction={{
                            xs: "column",
                            sm: "row",
                        }}
                        spacing={3}
                        alignItems="center"
                        textAlign={{
                            xs: "center",
                            sm: "left",
                        }}
                    >
                        <Avatar
                            src={user.profileImage || undefined}
                            alt={fullName}
                            sx={{
                                width: {
                                    xs: 88,
                                    sm: 104,
                                },
                                height: {
                                    xs: 88,
                                    sm: 104,
                                },
                                flexShrink: 0,
                                fontSize: 32,
                                fontWeight: 700,
                                bgcolor: "#2563eb",
                            }}
                        >
                            {initials}
                        </Avatar>

                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                width: "100%",
                            }}
                        >
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                color="text.primary"
                                sx={{ overflowWrap: "anywhere" }}
                            >
                                {fullName}
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                {t("publicProfile.publisher", {
                                    defaultValue: "Property publisher",
                                })}
                            </Typography>

                            {user.createdAt && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent={{
                                        xs: "center",
                                        sm: "flex-start",
                                    }}
                                    spacing={0.75}
                                    sx={{ mt: 1.5 }}
                                >
                                    <CalendarMonth
                                        fontSize="small"
                                        color="action"
                                    />

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {t("publicProfile.memberSince", {
                                            defaultValue:
                                                "Member since {{date}}",
                                            date: formatDate(user.createdAt),
                                        })}
                                    </Typography>
                                </Stack>
                            )}

                            {/* Publisher rating */}
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent={{
                                    xs: "center",
                                    sm: "flex-start",
                                }}
                                spacing={1}
                                sx={{ mt: 1.5 }}
                            >
                                <Rating
                                    value={ratingSummary.averageRating}
                                    precision={0.1}
                                    readOnly
                                    size="small"
                                />

                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                >
                                    {ratingSummary.averageRating.toFixed(1)}
                                    {" "}
                                    ({ratingSummary.totalReviews})
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>

                    {/* Publisher bio */}
                    {user.bio && (
                        <Box sx={{ mt: 3 }}>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                sx={{ mb: 1 }}
                            >
                                {t("publicProfile.about", {
                                    defaultValue: "About the publisher",
                                })}
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {user.bio}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Publisher statistics */}
                <Grid
                    container
                    sx={{
                        borderTop: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Grid size={{ xs: 6 }}>
                        <Box
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                                textAlign: "center",
                            }}
                        >
                            <Typography
                                variant="h4"
                                fontWeight={700}
                                color="primary"
                            >
                                {statistics.totalProperties}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {t("publicProfile.totalProperties", {
                                    defaultValue: "Published properties",
                                })}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <Box
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                                textAlign: "center",
                                borderLeft: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography
                                variant="h4"
                                fontWeight={700}
                                color="success.main"
                            >
                                {statistics.availableProperties}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {t("publicProfile.availableProperties", {
                                    defaultValue: "Available properties",
                                })}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Card>

            {/* Properties and reviews tabs */}
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    width: "100%",
                    minWidth: 0,
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, value) => setActiveTab(value)}
                    variant="fullWidth"
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        "& .MuiTab-root": {
                            minHeight: 58,
                            fontWeight: 700,
                            textTransform: "none",
                            minWidth: 0,
                            fontSize: {
                                xs: "0.8rem",
                                sm: "0.95rem",
                            },
                        },
                    }}
                >
                    <Tab
                        icon={<HomeWork />}
                        iconPosition="start"
                        label={t("publicProfile.propertiesTab", {
                            defaultValue: "Properties",
                        })}
                    />

                    <Tab
                        icon={<RateReview />}
                        iconPosition="start"
                        label={t("publicProfile.reviewsTab", {
                            defaultValue: "Reviews",
                        })}
                    />
                </Tabs>

                {/* ================= PROPERTIES TAB ================= */}
                {activeTab === 0 && (
                    <Box
                        sx={{
                            p: {
                                xs: 2,
                                sm: 3,
                            },
                            width: "100%",
                            minWidth: 0,
                        }}
                    >
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                            >
                                {t("publicProfile.propertiesTitle", {
                                    defaultValue: "Published properties",
                                })}
                            </Typography>

                            <Typography
                                color="text.secondary"
                                variant="body2"
                                sx={{ mt: 0.5 }}
                            >
                                {t("publicProfile.propertiesSubtitle", {
                                    defaultValue:
                                        "Explore this publisher's property listings.",
                                })}
                            </Typography>
                        </Box>

                        {properties.length === 0 ? (
                            <Alert severity="info">
                                {t("publicProfile.noProperties", {
                                    defaultValue:
                                        "This publisher has no published properties yet.",
                                })}
                            </Alert>
                        ) : (
                            <>
                                <Grid container spacing={3}>
                                    {properties.map((property) => {
                                        const propertyId =
                                            getPropertyId(property);

                                        const image =
                                            getPropertyImage(property);

                                        return (
                                            <Grid
                                                key={propertyId}
                                                size={{
                                                    xs: 12,
                                                    sm: 6,
                                                    md: 4,
                                                    lg: 4,
                                                    xl: 3,
                                                }}
                                            >
                                                <Card
                                                    variant="outlined"
                                                    sx={{
                                                        height: "100%",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        borderRadius: 3,
                                                        overflow: "hidden",
                                                        transition: "0.2s",
                                                        "&:hover": {
                                                            boxShadow: 4,
                                                            transform:
                                                                "translateY(-3px)",
                                                        },
                                                    }}
                                                >
                                                    {/* Fixed-size property image */}
                                                    {image ? (
                                                        <CardMedia
                                                            component="img"
                                                            image={image}
                                                            alt={
                                                                property.title ||
                                                                "Property"
                                                            }
                                                            sx={{
                                                                display: "block",
                                                                width: "100%",
                                                                height: {
                                                                    xs: 200,
                                                                    sm: 210,
                                                                    md: 220,
                                                                },
                                                                objectFit: "cover",
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                width: "100%",
                                                                height: {
                                                                    xs: 200,
                                                                    sm: 210,
                                                                    md: 220,
                                                                },
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                bgcolor:
                                                                    "action.hover",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <HomeWork
                                                                sx={{
                                                                    fontSize: 60,
                                                                    color: "text.disabled",
                                                                }}
                                                            />
                                                        </Box>
                                                    )}

                                                    <CardContent
                                                        sx={{
                                                            flex: 1,
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 1.5,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                            flexWrap="wrap"
                                                            gap={1}
                                                        >
                                                            <Chip
                                                                size="small"
                                                                label={
                                                                    property.status
                                                                }
                                                                color={
                                                                    property.status ===
                                                                    "Available"
                                                                        ? "success"
                                                                        : "default"
                                                                }
                                                            />

                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {
                                                                    property.propertyType
                                                                }
                                                            </Typography>
                                                        </Stack>

                                                        <Typography
                                                            variant="h6"
                                                            fontWeight={700}
                                                            sx={{
                                                                display:
                                                                    "-webkit-box",
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient:
                                                                    "vertical",
                                                                overflow:
                                                                    "hidden",
                                                                minHeight:
                                                                    "3.2em",
                                                                overflowWrap:
                                                                    "anywhere",
                                                            }}
                                                        >
                                                            {property.title}
                                                        </Typography>

                                                        <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            spacing={0.5}
                                                            sx={{
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <LocationOn
                                                                fontSize="small"
                                                                color="action"
                                                            />

                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                noWrap
                                                            >
                                                                {[
                                                                    property.neighborhood,
                                                                    property.city,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(", ")}
                                                            </Typography>
                                                        </Stack>

                                                        <Typography
                                                            variant="h6"
                                                            color="primary"
                                                            fontWeight={700}
                                                        >
                                                            {formatPrice(
                                                                property.price
                                                            )}{" "}
                                                            MAD
                                                        </Typography>

                                                        <Box sx={{ mt: "auto" }}>
                                                            <Button
                                                                fullWidth
                                                                variant="outlined"
                                                                startIcon={
                                                                    <Visibility />
                                                                }
                                                                disabled={
                                                                    !propertyId
                                                                }
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/properties/${propertyId}`
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    "publicProfile.viewProperty",
                                                                    {
                                                                        defaultValue:
                                                                            "View property",
                                                                    }
                                                                )}
                                                            </Button>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>

                                {pagination.hasMore && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            mt: 4,
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            onClick={
                                                handleLoadMoreProperties
                                            }
                                            disabled={loadingMore}
                                        >
                                            {loadingMore ? (
                                                <CircularProgress
                                                    size={22}
                                                    color="inherit"
                                                />
                                            ) : (
                                                t("publicProfile.loadMore", {
                                                    defaultValue: "Load more",
                                                })
                                            )}
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                )}

                {/* ================= REVIEWS TAB ================= */}
                {activeTab === 1 && (
                    <Box
                        sx={{
                            p: {
                                xs: 2,
                                sm: 3,
                            },
                            width: "100%",
                            minWidth: 0,
                        }}
                    >
                        {/* Rating summary */}
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                            >
                                {t("publicProfile.reviewsTitle", {
                                    defaultValue: "Publisher reviews",
                                })}
                            </Typography>

                            <Stack
                                direction={{
                                    xs: "column",
                                    sm: "row",
                                }}
                                alignItems={{
                                    xs: "flex-start",
                                    sm: "center",
                                }}
                                spacing={1.5}
                                sx={{ mt: 1 }}
                            >
                                <Rating
                                    value={ratingSummary.averageRating}
                                    precision={0.1}
                                    readOnly
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {ratingSummary.averageRating.toFixed(1)}
                                    {" / 5 · "}
                                    {ratingSummary.totalReviews}{" "}
                                    {t("publicProfile.reviewsCount", {
                                        defaultValue: "reviews",
                                    })}
                                </Typography>
                            </Stack>
                        </Box>

                        {/* New review form */}
                        {canReview && (
                            <Paper
                                component="form"
                                onSubmit={handleSubmitReview}
                                variant="outlined"
                                sx={{
                                    p: {
                                        xs: 2,
                                        sm: 3,
                                    },
                                    mb: 4,
                                    borderRadius: 3,
                                    bgcolor: "background.default",
                                    width: "100%",
                                    boxSizing: "border-box",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{ mb: 2 }}
                                >
                                    {t("publicProfile.writeReview", {
                                        defaultValue: "Write a review",
                                    })}
                                </Typography>

                                {reviewError && (
                                    <Alert
                                        severity="error"
                                        sx={{ mb: 2 }}
                                        onClose={() =>
                                            setReviewError("")
                                        }
                                    >
                                        {reviewError}
                                    </Alert>
                                )}

                                {reviewSuccess && (
                                    <Alert
                                        severity="success"
                                        sx={{ mb: 2 }}
                                        onClose={() =>
                                            setReviewSuccess("")
                                        }
                                    >
                                        {reviewSuccess}
                                    </Alert>
                                )}

                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    sx={{ mb: 1 }}
                                >
                                    {t("publicProfile.yourRating", {
                                        defaultValue: "Your rating",
                                    })}
                                </Typography>

                                <Rating
                                    value={reviewRating}
                                    onChange={(_, value) =>
                                        setReviewRating(value || 0)
                                    }
                                    size="large"
                                />

                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    maxRows={6}
                                    label={t(
                                        "publicProfile.reviewPlaceholder",
                                        {
                                            defaultValue:
                                                "Share your experience with this publisher...",
                                        }
                                    )}
                                    value={reviewComment}
                                    onChange={(event) =>
                                        setReviewComment(
                                            event.target.value
                                        )
                                    }
                                    inputProps={{
                                        maxLength: 1000,
                                    }}
                                    helperText={`${reviewComment.length}/1000`}
                                    sx={{
                                        mt: 2,
                                        mb: 2,
                                    }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<Send />}
                                    disabled={
                                        submittingReview ||
                                        reviewRating < 1 ||
                                        reviewComment.trim().length < 3
                                    }
                                >
                                    {submittingReview ? (
                                        <CircularProgress
                                            size={22}
                                            color="inherit"
                                        />
                                    ) : (
                                        t(
                                            "publicProfile.submitReview",
                                            {
                                                defaultValue:
                                                    "Submit review",
                                            }
                                        )
                                    )}
                                </Button>
                            </Paper>
                        )}

                        {/* Own profile message */}
                        {isOwnProfile && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                {t("publicProfile.ownProfileReview", {
                                    defaultValue:
                                        "You cannot write a review for your own profile.",
                                })}
                            </Alert>
                        )}

                        {/* Guest message */}
                        {!loggedInUser && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                {t("publicProfile.loginToReview", {
                                    defaultValue: "Log in to write a review.",
                                })}
                            </Alert>
                        )}

                        {/* Reviews list */}
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                        >
                            {t("publicProfile.reviewsList", {
                                defaultValue: "Reviews",
                            })}
                        </Typography>

                        {reviewError && !canReview && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {reviewError}
                            </Alert>
                        )}

                        {loadingReviews ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 5,
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        ) : reviews.length === 0 ? (
                            <Alert severity="info">
                                {t("publicProfile.noReviews", {
                                    defaultValue:
                                        "No reviews have been submitted yet.",
                                })}
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {reviews.map((review) => {
                                    const reviewerName = [
                                        review.reviewer?.firstName,
                                        review.reviewer?.lastName,
                                    ]
                                        .filter(Boolean)
                                        .join(" ");

                                    return (
                                        <Paper
                                            key={review._id}
                                            variant="outlined"
                                            sx={{
                                                p: {
                                                    xs: 2,
                                                    sm: 2.5,
                                                },
                                                borderRadius: 3,
                                                width: "100%",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                alignItems="flex-start"
                                            >
                                                <Avatar
                                                    src={
                                                        review.reviewer
                                                            ?.profileImage ||
                                                        undefined
                                                    }
                                                    alt={reviewerName}
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {reviewerName
                                                        ?.charAt(0)
                                                        ?.toUpperCase() ||
                                                        "U"}
                                                </Avatar>

                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Stack
                                                        direction={{
                                                            xs: "column",
                                                            sm: "row",
                                                        }}
                                                        justifyContent="space-between"
                                                        alignItems={{
                                                            xs: "flex-start",
                                                            sm: "center",
                                                        }}
                                                        spacing={0.5}
                                                    >
                                                        <Typography
                                                            fontWeight={700}
                                                        >
                                                            {reviewerName ||
                                                                t(
                                                                    "publicProfile.anonymousReviewer",
                                                                    {
                                                                        defaultValue:
                                                                            "User",
                                                                    }
                                                                )}
                                                        </Typography>

                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {formatDate(
                                                                review.createdAt
                                                            )}
                                                        </Typography>
                                                    </Stack>

                                                    <Rating
                                                        value={
                                                            review.rating || 0
                                                        }
                                                        readOnly
                                                        size="small"
                                                        sx={{ mt: 0.5 }}
                                                    />

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            mt: 1,
                                                            whiteSpace:
                                                                "pre-wrap",
                                                            overflowWrap:
                                                                "anywhere",
                                                        }}
                                                    >
                                                        {review.comment}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        )}

                        {/* Load more reviews */}
                        {reviewPagination.hasMore && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    mt: 3,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={handleLoadMoreReviews}
                                    disabled={loadingMoreReviews}
                                >
                                    {loadingMoreReviews ? (
                                        <CircularProgress
                                            size={22}
                                            color="inherit"
                                        />
                                    ) : (
                                        t("publicProfile.loadMore", {
                                            defaultValue: "Load more",
                                        })
                                    )}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
