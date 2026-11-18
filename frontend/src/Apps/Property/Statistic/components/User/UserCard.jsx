
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
    Button,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import UserStatistic from "./UserStatistic";

export default function UserCard({ user, onViewDetails }) {
    const { t } = useTranslation();

    const fullName =
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        t("userCard.unnamedUser");

    const initials = fullName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const accountStatus = String(
        user?.accountStatus || "active"
    ).toLowerCase();

    const isSuspended = accountStatus === "suspended";

    const statusLabel = isSuspended
        ? t("userCard.suspended")
        : t("userCard.active");

    const statusColor = isSuspended ? "error" : "success";

    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                overflow: "hidden",
                transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                "&:hover": {
                    borderColor: "primary.light",
                    boxShadow: 2,
                },
            }}
        >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {/* Header */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                >
                    <Avatar
                        src={user?.profileImage || undefined}
                        sx={{
                            width: 64,
                            height: 64,
                            bgcolor: "primary.main",
                            fontSize: "1.3rem",
                            fontWeight: 700,
                        }}
                    >
                        {initials}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                            mb={1}
                        >
                            <Typography variant="h6" fontWeight={700}>
                                {fullName}
                            </Typography>

                            <Chip
                                label={statusLabel}
                                size="small"
                                color={statusColor}
                                variant="outlined"
                            />

                            {user?.role && (
                                <Chip
                                    label={user.role}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Stack>

                        <Stack spacing={0.75}>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <EmailOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                >
                                    {user?.email || t("userCard.noEmail")}
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <PhoneOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {user?.phoneNumber || t("userCard.noPhone")}
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <PersonOutlineOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                >
                                    {user?.address || t("userCard.noAddress")}
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <CalendarMonthOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {t("userCard.joined")}{" "}
                                    {user?.createdAt
                                        ? new Date(
                                              user.createdAt
                                          ).toLocaleDateString()
                                        : t("userCard.unknown")}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* View details */}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={onViewDetails}
                        disabled={!user?._id || !onViewDetails}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            minWidth: "fit-content",
                            alignSelf: { xs: "stretch", sm: "flex-start" },
                        }}
                    >
                        {t("userCard.viewProfile")}
                    </Button>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                {/* Activity */}
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    mb={1.5}
                >
                    {t("userCard.activity")}
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 1.5,
                    }}
                >
                    <UserStatistic
                        icon={<HomeWorkOutlinedIcon />}
                        label={t("userCard.publishedProperties")}
                        value={user?.publishedProperties ?? 0}
                    />

                    <UserStatistic
                        icon={<BookmarkBorderOutlinedIcon />}
                        label={t("userCard.savedProperties")}
                        value={user?.savedProperties ?? 0}
                    />

                    <UserStatistic
                        icon={<ReportProblemOutlinedIcon />}
                        label={t("userCard.submittedFeedback")}
                        value={user?.reports ?? 0}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
