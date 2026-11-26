// admin/components/User/UserCard.jsx

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
// import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { CheckCircle } from "lucide-react";

import UserStatistic from "./UserStatistic";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";

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

    const statusLabel = t(
        `userCard.statuses.${accountStatus}`,
        accountStatus.charAt(0).toUpperCase() +
            accountStatus.slice(1).replace(/_/g, " ")
    );

    const statusColor =
        accountStatus === "suspended"
            ? "error"
            : accountStatus === "active"
                ? "success"
                : "warning";

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
                    spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
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
                            useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", mb: 1 }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
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

                            <Chip
                                size="small"
                                variant="outlined"
                                color={user?.emailVerified ? "success" : "warning"}
                                label={
                                    user?.emailVerified
                                        ? t("userCard.emailVerified", "Email verified")
                                        : t("userCard.emailNotVerified", "Email not verified")
                                }
                            />

                            {user?.deletionRequestedAt && (
                                <Chip
                                    size="small"
                                    color="error"
                                    label={t("userCard.pendingDeletion", "Deletion requested")}
                                />
                            )}
                        </Stack>

                        <Stack spacing={0.75}>
                            <Stack
                                direction="row"
                                spacing={1} sx={{ alignItems: "center" }}
                            >
                                <EmailOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", overflowWrap: "anywhere" }}
                                >
                                    {user?.email || t("userCard.noEmail")}
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1} sx={{ alignItems: "center" }}
                            >
                                <PhoneOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2" sx={{ color: "text.secondary" }}
                                >
                                    {user?.phoneNumber || t("userCard.noPhone")}
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1} sx={{ alignItems: "center" }}
                            >
                                <PersonOutlineOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", overflowWrap: "anywhere" }}
                                >
                                    {user?.address || t("userCard.noAddress")}
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1} sx={{ alignItems: "center" }}
                            >
                                <CalendarMonthOutlinedIcon
                                    fontSize="small"
                                    color="action"
                                />

                                <Typography
                                    variant="body2" sx={{ color: "text.secondary" }}
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
                    variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}
                >
                    {t("userCard.activity")}
                </Typography>

                {/* Per service: property (properties, roommates, hotels & riads)
                    and vehicles (vehicles, motos, spare parts). */}
                <Stack spacing={1.5}>
                    {[
                        {
                            key: "property",
                            title: t("userCard.services.property", "Property"),
                            items: [
                                { icon: <HomeWorkOutlinedIcon />, label: t("userCard.publishedProperties"), value: user?.publishedProperties },
                                {
                                    icon: <CheckCircle />,
                                    label: t("userCard.roommatesAndHotels", "Roommates, hotels & riads"),
                                    value: (user?.publishedRoommates || 0) + (user?.publishedEstablishments || 0),
                                },
                                { icon: <BookmarkBorderOutlinedIcon />, label: t("userCard.savedListings", "Saved"), value: user?.savedProperties },
                                { icon: <NotificationsNoneOutlinedIcon />, label: t("userCard.alerts", "Alerts"), value: user?.propertyAlerts },
                            ],
                        },
                        {
                            key: "vehicles",
                            title: t("userCard.services.vehicles", "Vehicles"),
                            items: [
                                { icon: <DirectionsCarOutlinedIcon />, label: t("userCard.publishedVehicles", "Vehicles"), value: user?.publishedVehicles },
                                { icon: <BuildOutlinedIcon />, label: t("userCard.publishedParts", "Spare parts"), value: user?.publishedParts },
                                { icon: <BookmarkBorderOutlinedIcon />, label: t("userCard.savedListings", "Saved"), value: user?.savedVehicles },
                                { icon: <NotificationsNoneOutlinedIcon />, label: t("userCard.alerts", "Alerts"), value: user?.vehicleAlerts },
                            ],
                        },
                        {
                            key: "other",
                            title: t("userCard.services.other", "Requests, portfolio & feedback"),
                            items: [
                                {
                                    icon: <CampaignOutlinedIcon />,
                                    label: t("userCard.requests", "Requests"),
                                    value: (user?.propertyRequests || 0) + (user?.vehicleRequests || 0),
                                },
                                {
                                    icon: <AutoStoriesOutlinedIcon />,
                                    label: t("userCard.portfolio", "Portfolio items"),
                                    value: (user?.propertyPortfolio || 0) + (user?.vehiclePortfolio || 0),
                                },
                                { icon: <ReportProblemOutlinedIcon />, label: t("userCard.submittedFeedback"), value: user?.reports },
                            ],
                        },
                    ].map((group) => (
                        <Box key={group.key}>
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontWeight: 700, mb: 0.75 }}>
                                {group.title}
                            </Typography>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "repeat(2, minmax(0, 1fr))",
                                        md: "repeat(4, minmax(0, 1fr))",
                                    },
                                    gap: 1.5,
                                }}
                            >
                                {group.items.map((item) => (
                                    <UserStatistic key={item.label} icon={item.icon} label={item.label} value={item.value ?? 0} />
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}
