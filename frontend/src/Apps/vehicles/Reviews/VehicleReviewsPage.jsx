// src/Apps/vehicles/Reviews/VehicleReviewsPage.jsx
//
// /vehicles/reviews — vehicle publishers (owners, agencies, showrooms)
// ranked by their vehicle reviews, best first. Same page as the property
// Reviews page, but its own data (vehicle reviews only).
//   ?q=     name search (first name, last name, any order)
//   ?page=  page of the ranking
// A row opens the publisher's profile on its Reviews tab, so a client can
// check who they are dealing with before making contact.

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Pagination,
    Paper,
    Rating,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ReviewsOutlinedIcon from "@mui/icons-material/ReviewsOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";

import axiosInstance from "../../../api/axiosInstance";
import PageHeader from "../../../Components/ui/PageHeader";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { FilterPanel, FilterSearch } from "../../../Components/ui/FilterKit";
import { formatDate, getImageUrl } from "../Profile/profileHelpers";

const PAGE_SIZE = 15;
const MEDALS = ["#E0A100", "#9AA4AE", "#B87333"];

const flipRtl = { transform: (theme) => (theme.direction === "rtl" ? "scaleX(-1)" : "none") };

const fullName = (user) => `${user.firstName} ${user.lastName}`.trim();
const initials = (user) => `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

function RankBadge({ rank }) {
    if (!rank) return null;
    const medal = MEDALS[rank - 1];

    return (
        <Box
            aria-label={`#${rank}`}
            sx={(theme) => ({
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: rank > 99 ? 12 : 14,
                color: medal ? "#fff" : "text.secondary",
                bgcolor: medal || alpha(theme.palette.text.primary, 0.06),
                boxShadow: medal ? `0 2px 6px ${alpha(medal, 0.45)}` : "none",
            })}
        >
            {rank}
        </Box>
    );
}

function UserRow({ user, onOpen }) {
    const { t, i18n } = useTranslation();
    const hasReviews = user.totalReviews > 0;
    const verified = user.emailVerified || user.phoneVerified;

    return (
        <Paper
            variant="outlined"
            component="article"
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen();
                }
            }}
            sx={(theme) => ({
                p: { xs: 1.75, sm: 2.25 },
                borderRadius: "16px",
                cursor: "pointer",
                transition: "border-color .15s, box-shadow .15s, transform .15s",
                "&:hover, &:focus-visible": {
                    borderColor: "primary.main",
                    boxShadow: theme.customShadows?.sm || "0 4px 14px rgba(0,0,0,.08)",
                    outline: "none",
                },
            })}
        >
            <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} sx={{ alignItems: "center", minWidth: 0 }}>
                <RankBadge rank={user.rank} />

                <Avatar
                    src={getImageUrl(user.profileImage) || undefined}
                    alt={fullName(user)}
                    sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, fontWeight: 700, bgcolor: "primary.main" }}
                >
                    {initials(user)}
                </Avatar>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, minWidth: 0 }} dir="auto">
                            {fullName(user)}
                        </Typography>
                        {verified && (
                            <Tooltip
                                title={[
                                    user.emailVerified && t("reviewsRanking.emailVerified", "Email verified"),
                                    user.phoneVerified && t("reviewsRanking.phoneVerified", "Phone verified"),
                                ].filter(Boolean).join(" · ")}
                            >
                                <VerifiedRoundedIcon color="primary" sx={{ fontSize: 18, flexShrink: 0 }} />
                            </Tooltip>
                        )}
                    </Stack>

                    {hasReviews ? (
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.25 }}>
                            <Rating value={user.averageRating} precision={0.1} readOnly size="small" />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {user.averageRating.toLocaleString(i18n.language, { minimumFractionDigits: 1 })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t("reviewsRanking.reviewCount", "{{count}} reviews", { count: user.totalReviews })}
                            </Typography>
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            {t("reviewsRanking.noReviewsYet", "No reviews yet")}
                        </Typography>
                    )}

                    {user.lastComment && (
                        <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ mt: 0.75, color: "text.secondary", alignItems: "flex-start", display: { xs: "none", sm: "flex" } }}
                        >
                            <FormatQuoteRoundedIcon sx={{ fontSize: 16, mt: "2px", flexShrink: 0 }} />
                            <Typography variant="body2" dir="auto" sx={{ fontStyle: "italic", overflowWrap: "anywhere" }}>
                                {user.lastComment}
                            </Typography>
                        </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                        {[
                            user.memberSince &&
                                t("reviewsRanking.memberSince", "Member since {{date}}", {
                                    date: formatDate(user.memberSince, i18n.language),
                                }),
                            user.lastReviewAt &&
                                t("reviewsRanking.lastReview", "Last review {{date}}", {
                                    date: formatDate(user.lastReviewAt, i18n.language),
                                }),
                        ].filter(Boolean).join(" · ")}
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    size="small"
                    endIcon={<ChevronRightRoundedIcon sx={flipRtl} />}
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpen();
                    }}
                    sx={{ flexShrink: 0, display: { xs: "none", sm: "inline-flex" }, borderRadius: "10px" }}
                >
                    {t("reviewsRanking.seeReviews", "See reviews")}
                </Button>
                <ChevronRightRoundedIcon
                    sx={{ ...flipRtl, display: { xs: "block", sm: "none" }, color: "text.secondary", flexShrink: 0 }}
                />
            </Stack>
        </Paper>
    );
}

function RowSkeleton() {
    return (
        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: "16px" }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Skeleton variant="circular" width={56} height={56} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton width="40%" height={26} />
                    <Skeleton width="30%" />
                    <Skeleton width="70%" />
                </Box>
            </Stack>
        </Paper>
    );
}

const API_PATH = "/vehicles/reviews/users";
const profileLink = (user) => `/vehicles/profile/${user.id}?tab=reviews`;

export default function VehicleReviewsPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    const q = params.get("q") || "";
    const page = Math.max(1, Number(params.get("page")) || 1);

    const [text, setText] = useState(q);
    const [data, setData] = useState({ users: [], pagination: { total: 0, totalPages: 1 }, summary: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Back / forward: the box follows the address.
    const [textSource, setTextSource] = useState(q);
    if (textSource !== q) {
        setTextSource(q);
        setText(q);
    }

    // Typing searches after a short pause.
    useEffect(() => {
        const value = text.trim();
        if (value === q) return undefined;

        const timer = setTimeout(() => {
            setParams(value ? { q: value } : {}, { replace: true });
        }, 400);
        return () => clearTimeout(timer);
    }, [text, q, setParams]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError("");
                const response = await axiosInstance.get(API_PATH, {
                    params: { q: q || undefined, page, limit: PAGE_SIZE },
                });
                if (!cancelled) setData(response.data);
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError.response?.data?.message ||
                            t("reviewsRanking.errors.load", "Unable to load reviews. Please try again.")
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [q, page, t]);

    const submit = () => {
        const value = text.trim();
        setParams(value ? { q: value } : {});
    };

    const changePage = (_, next) => {
        const nextParams = new URLSearchParams(params);
        if (next > 1) nextParams.set("page", String(next));
        else nextParams.delete("page");
        setParams(nextParams);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const openReviews = (user) => navigate(profileLink(user));

    const { users, pagination, summary } = data;

    return (
        <Box sx={{ ...pagePaddingSx, maxWidth: 1000, mx: "auto", width: "100%", boxSizing: "border-box" }}>
            <PageHeader
                icon={<ReviewsOutlinedIcon />}
                title={t("vehiclesApp.reviews.title", "Vehicle reviews")}
                subtitle={t(
                    "vehiclesApp.reviews.subtitle",
                    "See how sellers, agencies and showrooms are rated by other clients before you contact them."
                )}
                action={
                    summary?.totalReviews ? (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                            <Chip
                                variant="outlined"
                                label={t("reviewsRanking.siteAverage", "Average {{value}} / 5", {
                                    value: summary.averageRating.toLocaleString(i18n.language, {
                                        minimumFractionDigits: 1,
                                    }),
                                })}
                            />
                            <Chip
                                variant="outlined"
                                label={t("reviewsRanking.totalReviews", "{{count}} reviews", {
                                    count: summary.totalReviews,
                                })}
                            />
                        </Stack>
                    ) : null
                }
            />

            <FilterPanel title={t("reviewsRanking.searchTitle", "Find a publisher")}>
                <FilterSearch
                    value={text}
                    onChange={setText}
                    onSubmit={submit}
                    placeholder={t("reviewsRanking.searchPlaceholder", "Search by first or last name")}
                    inputProps={{ "aria-label": t("reviewsRanking.searchPlaceholder", "Search by first or last name"), maxLength: 80 }}
                />
            </FilterPanel>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5, color: "text.secondary" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {q
                        ? t("reviewsRanking.resultsFor", "{{count}} people found for “{{q}}”", {
                              count: pagination.total,
                              q,
                          })
                        : t("reviewsRanking.rankedCount", "{{count}} rated publishers, best first", {
                              count: pagination.total,
                          })}
                </Typography>
                <Tooltip
                    title={t(
                        "reviewsRanking.howRanked",
                        "Ranking uses the rating and the number of reviews: one 5-star review does not beat many very good ones. The stars show the real average."
                    )}
                >
                    <InfoOutlinedIcon sx={{ fontSize: 18, cursor: "help" }} />
                </Tooltip>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Stack spacing={1.5}>
                {loading
                    ? Array.from({ length: 5 }, (_, index) => <RowSkeleton key={index} />)
                    : users.map((user) => <UserRow key={user.id} user={user} onOpen={() => openReviews(user)} />)}
            </Stack>

            {!loading && !error && users.length === 0 && (
                <Paper variant="outlined" sx={{ p: 5, borderRadius: "16px", textAlign: "center" }}>
                    <PersonSearchRoundedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
                        {q
                            ? t("reviewsRanking.emptySearch", "Nobody found with this name")
                            : t("reviewsRanking.empty", "No reviews yet")}
                    </Typography>
                    <Typography color="text.secondary">
                        {q
                            ? t("reviewsRanking.emptySearchHint", "Check the spelling or try only the first or last name.")
                            : t("reviewsRanking.emptyHint", "Rated publishers will appear here.")}
                    </Typography>
                </Paper>
            )}

            {pagination.totalPages > 1 && (
                <Stack sx={{ alignItems: "center", mt: 3 }}>
                    <Pagination
                        count={pagination.totalPages}
                        page={Math.min(page, pagination.totalPages)}
                        onChange={changePage}
                        color="primary"
                        shape="rounded"
                    />
                </Stack>
            )}
        </Box>
    );
}
