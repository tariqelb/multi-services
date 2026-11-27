
import { accessOf } from "../../../../../Components/Admin/adminSections";
import { pagePaddingSx } from "../../../../../Components/ui/PageContainer";
import { useEffect, useState } from "react";
import {
    Navigate,
    useLocation,
    useParams,
    useRouteLoaderData,
} from "react-router-dom";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";

import {
    ArrowBack,
    Person,
    ArticleOutlined,
    NotificationsActiveOutlined,
    BookmarkBorderOutlined,
    FeedbackOutlined,
    HomeWorkOutlined,
    DirectionsCarOutlined,
    CampaignOutlined,
    AutoStoriesOutlined,
    EmailOutlined,
    PhoneOutlined,
} from "@mui/icons-material";

import { useTranslation } from "react-i18next";
import axiosInstance from "../../../../../api/axiosInstance";
import { UserSuspensionBanner, UserSuspensionButton } from "./UserSuspensionControl";
import { SocialLinksList } from "../../../../../Components/Profile/SocialLinks";
import { useGoBack } from "../../../../../Components/navigation/navHistory";

// Overview, then one tab per service (each with its own kinds), then feedback.
const tabConfig = [
    { value: "overview", label: "overview", icon: <Person /> },
    { value: "property", label: "property", icon: <HomeWorkOutlined /> },
    { value: "vehicles", label: "vehicles", icon: <DirectionsCarOutlined /> },
    { value: "feedback", label: "feedback", icon: <FeedbackOutlined /> },
];

const SERVICE_TABS = {
    property: (userId, kind) => `/property/dashboard/users/${userId}/activity?kind=${kind}`,
    vehicles: (userId, kind) => `/vehicles/admin/users/${userId}/activity?kind=${kind}`,
};
const KINDS = [
    { value: "publications", icon: <ArticleOutlined fontSize="small" /> },
    { value: "alerts", icon: <NotificationsActiveOutlined fontSize="small" /> },
    { value: "saved", icon: <BookmarkBorderOutlined fontSize="small" /> },
    { value: "requests", icon: <CampaignOutlined fontSize="small" /> },
    { value: "portfolio", icon: <AutoStoriesOutlined fontSize="small" /> },
];

function getFullName(user) {
    return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown user";
}

function getInitials(user) {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";

    return `${first}${last}`.toUpperCase() || "?";
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// Every tab shows the same simple rows: { id, type, title, description, status, createdAt, link }.
function feedbackRows(response) {
    const list = response.data?.feedback || response.data?.reports || (Array.isArray(response.data) ? response.data : []);
    return list.map((record) => ({
        id: record._id || record.id,
        type: "feedback",
        title: record.subject || record.type || "Feedback",
        description: record.description || "",
        status: record.status || "",
        priority: record.priority || "",
        createdAt: record.createdAt,
    }));
}

function InfoItem({ label, value }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
            >
                {value || "—"}
            </Typography>
        </Box>
    );
}

function StatCard({ label, value }) {
    return (
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {value ?? 0}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {label}
                </Typography>
            </CardContent>
        </Card>
    );
}

function StatGroup({ title, icon, items }) {
    return (
        <Box sx={{ mb: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                {icon}
                <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
            </Stack>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        sm: "repeat(3, minmax(0, 1fr))",
                        lg: "repeat(5, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                }}
            >
                {items.map((item) => (
                    <StatCard key={item.label} label={item.label} value={item.value} />
                ))}
            </Box>
        </Box>
    );
}

export default function UserDetailsPage() {
    const { t, i18n } = useTranslation();
    const { userId } = useParams();
    const goBack = useGoBack("/admin/users");
    const location = useLocation();

    const authenticatedUser = useRouteLoaderData("dashboard-layout");

    const [user, setUser] = useState(location.state?.user || null);
    const [statistics, setStatistics] = useState({});
    const [activeTab, setActiveTab] = useState("overview");
    const [kind, setKind] = useState("publications");

    const [loadingOverview, setLoadingOverview] = useState(true);
    const [overviewError, setOverviewError] = useState("");

    const [records, setRecords] = useState({});
    const [loadingTab, setLoadingTab] = useState(false);
    const [tabError, setTabError] = useState("");

    // Admins, and team members with the "users" section.
    const isAdmin = accessOf(authenticatedUser).can("users");

    useEffect(() => {
        let cancelled = false;

        const fetchOverview = async () => {
            try {
                setLoadingOverview(true);
                setOverviewError("");

                const response = await axiosInstance.get(
                    `/dashboard/users/${userId}`
                );

                if (cancelled) return;

                setUser(response.data?.user || null);
                setStatistics(response.data?.statistics || {});
            } catch (error) {
                if (cancelled) return;

                setOverviewError(
                    error.response?.data?.message ||
                    t("userDetails.loadError")
                );
            } finally {
                if (!cancelled) setLoadingOverview(false);
            }
        };

        if (userId && isAdmin) fetchOverview();

        return () => {
            cancelled = true;
        };
    }, [userId, isAdmin, t]);

    // Rows of the open tab ("property:saved", "vehicles:alerts", "feedback"...).
    const recordKey = SERVICE_TABS[activeTab] ? `${activeTab}:${kind}` : activeTab;

    useEffect(() => {
        if (activeTab === "overview") return;
        if (records[recordKey]) return;

        let cancelled = false;

        const fetchTab = async () => {
            try {
                setLoadingTab(true);
                setTabError("");

                const url = SERVICE_TABS[activeTab]
                    ? SERVICE_TABS[activeTab](userId, kind)
                    : `/property/dashboard/users/${userId}/feedback`;
                const response = await axiosInstance.get(url);

                if (cancelled) return;

                setRecords((previous) => ({
                    ...previous,
                    [recordKey]: SERVICE_TABS[activeTab] ? response.data?.items || [] : feedbackRows(response),
                }));
            } catch (error) {
                if (cancelled) return;

                setTabError(
                    error.response?.data?.message ||
                    t("userDetails.tabLoadError")
                );
            } finally {
                if (!cancelled) setLoadingTab(false);
            }
        };

        fetchTab();

        return () => {
            cancelled = true;
        };
    }, [activeTab, kind, recordKey, userId, records, t]);

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const propertyStats = statistics.property || {};
    const vehicleStats = statistics.vehicles || {};
    const reviewText = (stats) => (stats.reviewsReceived ? `${stats.reviewsReceived} · ${stats.averageRating}★` : 0);

    const handleTabChange = (_, nextTab) => {
        setActiveTab(nextTab);
    };

    const renderRecords = () => {
        const items = records[recordKey] || [];

        if (loadingTab) {
            return (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (tabError) {
            return <Alert severity="error">{tabError}</Alert>;
        }

        if (items.length === 0) {
            return (
                <Box sx={{ textAlign: "center", py: 5 }}>
                    <Typography sx={{ color: "text.secondary" }}>
                        {t("userDetails.noRecords")}
                    </Typography>
                </Box>
            );
        }

        return (
            <Stack spacing={2}>
                {items.map((record, index) => {
                    const title = record.title;
                    const description = record.description || t("userDetails.noDetails", "No additional details");

                    return (
                        <Card
                            key={record._id || record.id || index}
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                        >
                            <CardContent>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                                            {record.type && record.type !== "feedback" && (
                                                <Chip size="small" label={t(`userDetails.types.${record.type}`, record.type)} />
                                            )}
                                            {record.link ? (
                                                <Typography
                                                    component="a"
                                                    href={record.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ fontWeight: 700, color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main", textDecoration: "underline" } }}
                                                >
                                                    {title}
                                                </Typography>
                                            ) : (
                                                <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
                                            )}
                                        </Stack>

                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary", mt: 0.5, overflowWrap: "anywhere" }}
                                        >
                                            {description}
                                        </Typography>
                                    </Box>

                                    {record.status && (
                                        <Chip
                                            size="small"
                                            label={t(`userDetails.statusNames.${record.status}`, record.status)}
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>

                                <Divider sx={{ my: 1.5 }} />

                                <Stack
                                    direction="row" sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}
                                >
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {t("userDetails.createdAt")}: {formatDate(record.createdAt)}
                                    </Typography>

                                    {record.priority && (
                                        <Chip
                                            size="small"
                                            label={record.priority}
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    );
                })}
            </Stack>
        );
    };

    return (
        <Box sx={pagePaddingSx}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => goBack()}
                sx={{ mb: 2 }}
            >
                {t("userDetails.back", "Back")}
            </Button>

            {loadingOverview && !user ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : overviewError && !user ? (
                <Alert severity="error">{overviewError}</Alert>
            ) : (
                <>
                    {overviewError && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {overviewError}
                        </Alert>
                    )}

                    <UserSuspensionBanner user={user} locale={i18n.language} />

                    {/* User header */}
                    <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
                            >
                                <Avatar
                                    src={user?.profileImage || undefined}
                                    sx={{
                                        width: 76,
                                        height: 76,
                                        fontSize: 25,
                                        bgcolor: "primary.main",
                                    }}
                                >
                                    {getInitials(user)}
                                </Avatar>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        {getFullName(user)}
                                    </Typography>

                                    <Stack
                                        direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1, mt: 1 }}
                                    >
                                        <Chip
                                            size="small"
                                            label={user?.role || "client"}
                                        />

                                        <Chip
                                            size="small"
                                            label={t(`userCard.statuses.${user?.accountStatus || "active"}`, {
                                                defaultValue: user?.accountStatus || "active",
                                            })}
                                            color={
                                                user?.accountStatus === "suspended"
                                                    ? "error"
                                                    : "success"
                                            }
                                        />

                                        <Chip
                                            size="small"
                                            label={
                                                user?.emailVerified
                                                    ? t("userDetails.emailVerified")
                                                    : t("userDetails.emailNotVerified")
                                            }
                                            color={user?.emailVerified ? "success" : "warning"}
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Box>

                                <UserSuspensionButton
                                    user={user}
                                    onChanged={(changes) =>
                                        setUser((current) => ({ ...current, ...changes }))
                                    }
                                />
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, minmax(0, 1fr))",
                                        md: "repeat(3, minmax(0, 1fr))",
                                    },
                                    gap: 2,
                                }}
                            >
                                <InfoItem
                                    label={t("userDetails.email")}
                                    value={user?.email}
                                />

                                <InfoItem
                                    label={t("userDetails.phone")}
                                    value={user?.phoneNumber}
                                />

                                <InfoItem
                                    label={t("userDetails.whatsapp", "WhatsApp number")}
                                    value={
                                        user?.whatsappNumber
                                            ? `${user.whatsappNumber}${user.whatsappVerified ? " ✓" : ""}`
                                            : ""
                                    }
                                />

                                <InfoItem
                                    label={t("userDetails.phoneVerified")}
                                    value={
                                        user?.phoneVerified
                                            ? t("common.yes")
                                            : t("common.no")
                                    }
                                />

                                <InfoItem
                                    label={t("userDetails.address")}
                                    value={user?.address}
                                />

                                <InfoItem
                                    label={t("userDetails.language")}
                                    value={user?.language}
                                />

                                <InfoItem
                                    label={t("userDetails.joined")}
                                    value={formatDate(user?.createdAt)}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Statistics, per service */}
                    <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
                        <CardContent>
                            <StatGroup
                                title={t("userDetails.services.property", "Property")}
                                icon={<HomeWorkOutlined color="primary" />}
                                items={[
                                    { label: t("userDetails.totalPublications"), value: propertyStats.properties ?? statistics.totalPublications },
                                    { label: t("userDetails.availablePublications"), value: propertyStats.availableProperties ?? statistics.availablePublications },
                                    { label: t("userDetails.roommates", "Roommate announcements"), value: propertyStats.roommates },
                                    { label: t("userDetails.establishments", "Hotels & riads"), value: propertyStats.establishments },
                                    { label: t("userDetails.savedListings", "Saved listings"), value: propertyStats.saved ?? statistics.savedProperties },
                                    { label: t("userDetails.activeAlerts"), value: propertyStats.activeAlerts ?? statistics.activeAlerts },
                                    { label: t("userDetails.requests", "Requests posted"), value: propertyStats.requests },
                                    { label: t("userDetails.repliesSent", "Replies to requests"), value: propertyStats.repliesSent },
                                    { label: t("userDetails.portfolioItems", "Portfolio (articles / videos)"), value: `${propertyStats.portfolioArticles ?? 0} / ${propertyStats.portfolioVideos ?? 0}` },
                                    { label: t("userDetails.reviews", "Reviews received"), value: reviewText(propertyStats) },
                                ]}
                            />
                            <StatGroup
                                title={t("userDetails.services.vehicles", "Vehicles")}
                                icon={<DirectionsCarOutlined sx={{ color: "#F97316" }} />}
                                items={[
                                    { label: t("userDetails.vehicles", "Vehicles"), value: vehicleStats.vehicles ?? statistics.totalVehicles },
                                    { label: t("userDetails.availableVehicles", "Available vehicles"), value: vehicleStats.availableVehicles ?? statistics.availableVehicles },
                                    { label: t("userDetails.carsMotos", "Cars / motos"), value: `${vehicleStats.cars ?? 0} / ${vehicleStats.motos ?? 0}` },
                                    { label: t("userDetails.parts", "Spare parts"), value: vehicleStats.parts },
                                    { label: t("userDetails.savedListings", "Saved listings"), value: vehicleStats.saved },
                                    { label: t("userDetails.activeAlerts"), value: vehicleStats.activeAlerts },
                                    { label: t("userDetails.requests", "Requests posted"), value: vehicleStats.requests },
                                    { label: t("userDetails.repliesSent", "Replies to requests"), value: vehicleStats.repliesSent },
                                    { label: t("userDetails.portfolioItems", "Portfolio (articles / videos)"), value: `${vehicleStats.portfolioArticles ?? 0} / ${vehicleStats.portfolioVideos ?? 0}` },
                                    { label: t("userDetails.reviews", "Reviews received"), value: reviewText(vehicleStats) },
                                ]}
                            />
                            <StatGroup
                                title={t("userDetails.services.account", "Feedback")}
                                icon={<FeedbackOutlined color="action" />}
                                items={[
                                    { label: t("userDetails.totalFeedback"), value: statistics.totalFeedback },
                                    { label: t("userDetails.feedbackStatuses.open"), value: statistics.feedbackByStatus?.open },
                                    { label: t("userDetails.feedbackStatuses.resolved"), value: statistics.feedbackByStatus?.resolved },
                                ]}
                            />
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                        >
                            {tabConfig.map((tab) => (
                                <Tab
                                    key={tab.value}
                                    value={tab.value}
                                    icon={tab.icon}
                                    iconPosition="start"
                                    label={t(`userDetails.tabs.${tab.label}`)}
                                />
                            ))}
                        </Tabs>

                        <Divider />

                        <Box sx={{ p: { xs: 2, md: 3 } }}>
                            {activeTab === "overview" ? (
                                <Stack spacing={2}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {t("userDetails.accountOverview")}
                                    </Typography>

                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {user?.bio || t("userDetails.noBio")}
                                    </Typography>

                                    {user?.socialLinks?.length > 0 && (
                                        <Box>
                                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontWeight: 700, mb: 1 }}>
                                                {t("socialLinks.title", "Social media")}
                                            </Typography>
                                            <SocialLinksList links={user.socialLinks} showPrivate />
                                        </Box>
                                    )}

                                    <InfoItem
                                        label={t("userDetails.accountCreated")}
                                        value={formatDate(user?.createdAt)}
                                    />

                                    <InfoItem
                                        label={t("userDetails.lastUpdated")}
                                        value={formatDate(user?.updatedAt)}
                                    />

                                    {statistics.feedbackByStatus && (
                                        <>
                                            <Divider />
                                            <Typography sx={{ fontWeight: 700 }}>
                                                {t("userDetails.feedbackByStatus")}
                                            </Typography>

                                            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                                                {Object.entries(statistics.feedbackByStatus).map(
                                                    ([status, count]) => (
                                                        <Chip
                                                            key={status}
                                                            label={`${t(`userDetails.feedbackStatuses.${status}`)}: ${count}`}
                                                            variant="outlined"
                                                        />
                                                    )
                                                )}
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            ) : (
                                <Stack spacing={2}>
                                    {SERVICE_TABS[activeTab] && (
                                        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
                                            {KINDS.map((option) => (
                                                <Chip
                                                    key={option.value}
                                                    icon={option.icon}
                                                    label={t(`userDetails.kinds.${option.value}`, option.value)}
                                                    color={kind === option.value ? "primary" : "default"}
                                                    variant={kind === option.value ? "filled" : "outlined"}
                                                    onClick={() => setKind(option.value)}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                    {renderRecords()}
                                </Stack>
                            )}
                        </Box>
                    </Card>
                </>
            )}
        </Box>
    );
}
