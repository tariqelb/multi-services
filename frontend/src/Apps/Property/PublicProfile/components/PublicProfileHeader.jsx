import React from "react";
import { useTranslation } from "react-i18next";

import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Rating,
    Stack,
    Typography,
} from "@mui/material";

import {
    CalendarMonth,
    RateReview,
} from "@mui/icons-material";

import {
    formatDate,
    getImageUrl,
    getUserFullName,
} from "../utils/publicProfileHelpers";

export default function PublicProfileHeader({
    user,
    rating,
    totalReviews,
}) {
    const { t, i18n } = useTranslation();

    const fullName = getUserFullName(user);
    const avatar = getImageUrl(
        user?.profileImage || user?.avatar || user?.image
    );

    const memberSince = formatDate(
        user?.createdAt || user?.dateJoined,
        i18n.language
    );

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2.5}
                    alignItems={{ xs: "center", sm: "flex-start" }}
                >
                    <Avatar
                        src={avatar || undefined}
                        alt={fullName}
                        sx={{
                            width: { xs: 100, sm: 120 },
                            height: { xs: 100, sm: 120 },
                            fontSize: 36,
                            bgcolor: "primary.main",
                        }}
                    >
                        {fullName?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>

                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            textAlign: { xs: "center", sm: "left" },
                        }}
                    >
                        <Typography variant="h5" fontWeight={700}>
                            {fullName || t("publicProfile.unknownUser")}
                        </Typography>

                        <Chip
                            size="small"
                            color="primary"
                            variant="outlined"
                            label={
                                user?.role
                                    ? t(`publicProfile.roles.${user.role}`, {
                                          defaultValue: user.role,
                                      })
                                    : t("publicProfile.member")
                            }
                            sx={{ mt: 1 }}
                        />

                        {user?.bio && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: 2,
                                    whiteSpace: "pre-line",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {user.bio}
                            </Typography>
                        )}

                        <Stack
                            direction="row"
                            spacing={2}
                            useFlexGap
                            flexWrap="wrap"
                            justifyContent={{
                                xs: "center",
                                sm: "flex-start",
                            }}
                            alignItems="center"
                            sx={{ mt: 2 }}
                        >
                            {memberSince && (
                                <Stack
                                    direction="row"
                                    spacing={0.7}
                                    alignItems="center"
                                >
                                    <CalendarMonth
                                        fontSize="small"
                                        color="action"
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {t("publicProfile.memberSince", {
                                            date: memberSince,
                                        })}
                                    </Typography>
                                </Stack>
                            )}

                            <Stack
                                direction="row"
                                spacing={0.7}
                                alignItems="center"
                            >
                                <Rating
                                    value={Number(rating) || 0}
                                    precision={0.1}
                                    readOnly
                                    size="small"
                                />

                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                >
                                    {Number(rating || 0).toFixed(1)}
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={0.7}
                                alignItems="center"
                            >
                                <RateReview
                                    fontSize="small"
                                    color="action"
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {t("publicProfile.reviewCount", {
                                        count: totalReviews || 0,
                                    })}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}