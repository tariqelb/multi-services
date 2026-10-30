
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import UserStatistic from "./UserStatistic";

export default function UserCard({ user }) {
    const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Unnamed User";

    const initials = fullName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
            }}
        >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                >
                    <Avatar
                        src={user.profileImage || undefined}
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
                            <Typography variant="h6" fontWeight={800}>
                                {fullName}
                            </Typography>

                            <Chip
                                label={user.status || "Active"}
                                size="small"
                                color={
                                    user.status === "Inactive"
                                        ? "default"
                                        : "success"
                                }
                                variant="outlined"
                            />
                        </Stack>

                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <EmailOutlinedIcon fontSize="small" color="action" />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflowWrap: "anywhere" }}
                                >
                                    {user.email || "No email"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <PhoneOutlinedIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {user.phoneNumber || "No phone number"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <PersonOutlineOutlinedIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {user.role || "User"}
                                    {user.address ? ` · ${user.address}` : ""}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <CalendarMonthOutlinedIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    Joined{" "}
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString()
                                        : "Unknown"}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Typography variant="subtitle2" fontWeight={800} mb={1.5}>
                    User Activity
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
                        label="Published Properties"
                        value={user.publishedProperties ?? 0}
                    />

                    <UserStatistic
                        icon={<BookmarkBorderOutlinedIcon />}
                        label="Saved Properties"
                        value={user.savedProperties ?? 0}
                    />

                    <UserStatistic
                        icon={<ReportProblemOutlinedIcon />}
                        label="Submitted Feedback"
                        value={user.reports ?? 0}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
