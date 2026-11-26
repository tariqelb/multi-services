
import { accessOf } from "../../../../../Components/Admin/adminSections";
import { pagePaddingSx } from "../../../../../Components/ui/PageContainer";
import { useEffect, useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate,
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
    EmailOutlined,
    PhoneOutlined,
} from "@mui/icons-material";

import { useTranslation } from "react-i18next";
import axiosInstance from "../../../../../api/axiosInstance";
import { UserSuspensionBanner, UserSuspensionButton } from "./UserSuspensionControl";
import { SocialLinksList } from "../../../../../Components/Profile/SocialLinks";

const tabConfig = [
    { value: "overview", label: "overview", icon: <Person /> },
    { value: "publications", label: "publications", icon: <ArticleOutlined /> },
    { value: "alerts", label: "alerts", icon: <NotificationsActiveOutlined /> },
    { value: "saved-properties", label: "savedProperties", icon: <BookmarkBorderOutlined /> },
    { value: "feedback", label: "feedback", icon: <FeedbackOutlined /> },
];

const endpointByTab = {
    publications: "publications",
    alerts: "alerts",
    "saved-properties": "saved-properties",
    feedback: "feedback",
};

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

function getRecords(response, tab) {
    const data = response.data;

    const possibleKeys = {
        publications: ["properties", "publications"],
        alerts: ["alerts"],
        "saved-properties": ["savedProperties", "savedPropertiesList", "properties"],
        feedback: ["feedback", "reports"],
    };

    for (const key of possibleKeys[tab] || []) {
        if (Array.isArray(data?.[key])) return data[key];
    }

    if (Array.isArray(data)) return data;

    return [];
}

function getRecordTitle(record, tab) {
    if (tab === "alerts") {
        return record.title || record.city || "Property alert";
    }

    if (tab === "feedback") {
        return record.subject || record.type || "Feedback";
    }

    const property = record.propertyId || record.propertyInfo || record;

    return property.title || property.name || "Untitled property";
}

function getRecordDescription(record, tab) {
    if (tab === "alerts") {
        const cities = record.city || "Any city";
        const types = record.propertyTypes?.join(", ") || "Any property type";
        const listings = record.listingTypes?.join(", ") || "Any listing type";

        return `${cities} · ${types} · ${listings}`;
    }

    if (tab === "feedback") {
        return record.description || "No description provided";
    }

    const property = record.propertyId || record.propertyInfo || record;

    return [
        property.city,
        property.neighborhood,
        property.listingType,
        property.propertyType,
    ].filter(Boolean).join(" · ") || "No additional details";
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

export default function UserDetailsPage() {
    const { t, i18n } = useTranslation();
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const authenticatedUser = useRouteLoaderData("dashboard-layout");

    const [user, setUser] = useState(location.state?.user || null);
    const [statistics, setStatistics] = useState({});
    const [activeTab, setActiveTab] = useState("overview");

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

    useEffect(() => {
        if (activeTab === "overview" || !endpointByTab[activeTab]) return;

        if (records[activeTab]) return;

        let cancelled = false;

        const fetchTab = async () => {
            try {
                setLoadingTab(true);
                setTabError("");

                const response = await axiosInstance.get(
                    `/property/dashboard/users/${userId}/${endpointByTab[activeTab]}`
                );

                if (cancelled) return;

                setRecords((previous) => ({
                    ...previous,
                    [activeTab]: getRecords(response, activeTab),
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
    }, [activeTab, userId, records, t]);

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleTabChange = (_, nextTab) => {
        setActiveTab(nextTab);
    };

    const renderRecords = () => {
        const items = records[activeTab] || [];

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
                    const title = getRecordTitle(record, activeTab);
                    const description = getRecordDescription(record, activeTab);

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
                                        <Typography sx={{ fontWeight: 700 }}>
                                            {title}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary", mt: 0.5, overflowWrap: "anywhere" }}
                                        >
                                            {description}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={
                                            record.status ||
                                            (record.isArchived
                                                ? t("userDetails.archived")
                                                : t("userDetails.active"))
                                        }
                                        variant="outlined"
                                    />
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
                onClick={() => navigate("/dashboard")}
                sx={{ mb: 2 }}
            >
                {t("userDetails.backToDashboard")}
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

                    {/* Statistics */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, minmax(0, 1fr))",
                                sm: "repeat(3, minmax(0, 1fr))",
                                lg: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: 1.5,
                            mb: 3,
                        }}
                    >
                        <StatCard
                            label={t("userDetails.totalPublications")}
                            value={statistics.totalPublications}
                        />

                        <StatCard
                            label={t("userDetails.availablePublications")}
                            value={statistics.availablePublications}
                        />

                        <StatCard
                            label={t("userDetails.activeAlerts")}
                            value={statistics.activeAlerts}
                        />

                        <StatCard
                            label={t("userDetails.archivedAlerts")}
                            value={statistics.archivedAlerts}
                        />

                        <StatCard
                            label={t("userDetails.savedProperties")}
                            value={statistics.savedProperties}
                        />

                        <StatCard
                            label={t("userDetails.totalFeedback")}
                            value={statistics.totalFeedback}
                        />
                    </Box>

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
                                renderRecords()
                            )}
                        </Box>
                    </Card>
                </>
            )}
        </Box>
    );
}
