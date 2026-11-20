import React from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Rating,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    getImageUrl,
    getReviewAuthor,
    getUserFullName,
    formatDate,
} from "../utils/publicProfileHelpers";

export default function ReviewsTab({
    reviews = [],
    rating,
    totalReviews,
    reviewForm,
    setReviewForm,
    submitting,
    loading,
    error,
    success,
    onSubmit,
    hasMore,
    onLoadMore,
    canReview = true,
}) {
    const { t, i18n } = useTranslation();

    return (
        <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Card
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                }}
            >
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("publicProfile.reviews.ratingSummary")}
                    </Typography>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ alignItems: { xs: "flex-start", sm: "center" }, mt: 2 }}
                    >
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {Number(rating || 0).toFixed(1)}
                        </Typography>

                        <Box>
                            <Rating
                                value={Number(rating) || 0}
                                precision={0.1}
                                readOnly
                            />
                            <Typography
                                variant="body2" sx={{ color: "text.secondary" }}
                            >
                                {t("publicProfile.reviewCount", {
                                    count: totalReviews || 0,
                                })}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {canReview && (
                <Card
                    elevation={0}
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2.5,
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {t("publicProfile.reviews.writeReview")}
                        </Typography>

                        <Box
                            component="form"
                            onSubmit={onSubmit}
                            sx={{ mt: 2 }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mb: 1 }}
                            >
                                {t("publicProfile.reviews.yourRating")}
                            </Typography>

                            <Rating
                                value={Number(reviewForm.rating) || 0}
                                onChange={(_, value) =>
                                    setReviewForm((previous) => ({
                                        ...previous,
                                        rating: value || 0,
                                    }))
                                }
                            />

                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                maxRows={6}
                                label={t("publicProfile.reviews.comment")}
                                value={reviewForm.comment}
                                onChange={(event) =>
                                    setReviewForm((previous) => ({
                                        ...previous,
                                        comment: event.target.value,
                                    }))
                                }
                                inputProps={{ maxLength: 1000 }}
                                helperText={`${reviewForm.comment.length}/1000`}
                                sx={{ mt: 2 }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={
                                    submitting ||
                                    !reviewForm.rating ||
                                    reviewForm.comment.trim().length < 3
                                }
                                sx={{ mt: 2, textTransform: "none" }}
                            >
                                {submitting
                                    ? t("publicProfile.reviews.submitting")
                                    : t("publicProfile.reviews.submit")}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {t("publicProfile.reviews.allReviews")}
                </Typography>

                {loading && reviews.length === 0 ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            py: 4,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : reviews.length === 0 ? (
                    <Alert severity="info">
                        {t("publicProfile.empty.reviews")}
                    </Alert>
                ) : (
                    <Stack spacing={2}>
                        {reviews.map((review, index) => {
                            const author = getReviewAuthor(review);
                            const name = getUserFullName(author);
                            const avatar = getImageUrl(
                                author?.profileImage || author?.avatar
                            );

                            return (
                                <Card
                                    key={review._id || review.id || index}
                                    elevation={0}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2.5,
                                    }}
                                >
                                    <CardContent>
                                        <Stack
                                            direction="row"
                                            spacing={1.5} sx={{ alignItems: "center" }}
                                        >
                                            <Avatar
                                                src={avatar || undefined}
                                            >
                                                {name?.charAt(0)?.toUpperCase() ||
                                                    "U"}
                                            </Avatar>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 700 }}>
                                                    {name ||
                                                        t("publicProfile.member")}
                                                </Typography>

                                                <Typography
                                                    variant="caption" sx={{ color: "text.secondary" }}
                                                >
                                                    {formatDate(
                                                        review.createdAt ||
                                                            review.date,
                                                        i18n.language
                                                    )}
                                                </Typography>
                                            </Box>

                                            <Rating
                                                value={
                                                    Number(review.rating) || 0
                                                }
                                                readOnly
                                                size="small"
                                            />
                                        </Stack>

                                        {review.comment && (
                                            <>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        whiteSpace: "pre-line",
                                                        overflowWrap: "anywhere",
                                                    }}
                                                >
                                                    {review.comment}
                                                </Typography>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}

                {hasMore && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mt: 3,
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={onLoadMore}
                            disabled={loading}
                        >
                            {loading
                                ? t("publicProfile.loading")
                                : t("publicProfile.loadMore")}
                        </Button>
                    </Box>
                )}
            </Box>
        </Stack>
    );
}