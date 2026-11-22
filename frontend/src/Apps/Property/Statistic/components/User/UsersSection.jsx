// admin/components/User/UsersSection.jsx

import { FilterGrid, FilterPanel, FilterSearch, FilterSelect } from "../../../../../Components/ui/FilterKit";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Box,
    Chip,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    BlockOutlined,
    HomeWorkOutlined,
    PeopleAltOutlined,
    PersonAddAltOutlined,
    SearchOutlined,
    VerifiedUserOutlined,
} from "@mui/icons-material";

import UserCard from "./UserCard";

import {
    ChartCard,
    ChartGrid,
    DonutChart,
    EmptyState,
    ErrorBanner,
    KpiGrid,
    LoadingState,
    RateBar,
    RefreshButton,
    SectionHeader,
    StatCard,
    TrendChart,
    useAnalyticsData,
} from "../shared/AnalyticsUI";

import {
    formatNumber,
    getFullName,
    getLocale,
} from "../shared/analyticsUtils";

const PAGE_SIZE = 10;

const getUserStatus = (user) =>
    String(user.accountStatus || "active").toLowerCase();

const getUserRole = (user) => String(user.role || "user").toLowerCase();

const SORTERS = {
    newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    name: (a, b) => getFullName(a).localeCompare(getFullName(b)),
    publications: (a, b) =>
        (b.publishedProperties || 0) - (a.publishedProperties || 0),
    saved: (a, b) => (b.savedProperties || 0) - (a.savedProperties || 0),
    reports: (a, b) => (b.reports || 0) - (a.reports || 0),
};

const capitalize = (value = "") =>
    value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");

export default function UsersSection() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const navigate = useNavigate();

    const { data, loading, error, reload } = useAnalyticsData("/dashboard/users");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [verificationFilter, setVerificationFilter] = useState("all");
    const [activityFilter, setActivityFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);

    const users = useMemo(() => data?.users ?? [], [data]);
    const summary = data?.summary || {};

    // Build role/status options from real data (no hard-coded mismatch).
    const roleOptions = useMemo(
        () => [...new Set(users.map(getUserRole))].sort(),
        [users]
    );

    const statusOptions = useMemo(
        () => [...new Set(users.map(getUserStatus))].sort(),
        [users]
    );

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        const result = users.filter((user) => {
            const matchesSearch =
                !query ||
                [
                    getFullName(user),
                    user.email,
                    user.phoneNumber,
                    user.address,
                ].some((value) =>
                    String(value || "").toLowerCase().includes(query)
                );

            const matchesRole =
                roleFilter === "all" || getUserRole(user) === roleFilter;

            const matchesStatus =
                statusFilter === "all" || getUserStatus(user) === statusFilter;

            const matchesVerification =
                verificationFilter === "all" ||
                (verificationFilter === "emailVerified" && user.emailVerified) ||
                (verificationFilter === "emailUnverified" && !user.emailVerified) ||
                (verificationFilter === "pendingDeletion" && user.deletionRequestedAt);

            const matchesActivity =
                activityFilter === "all" ||
                (activityFilter === "publishers" && user.publishedProperties > 0) ||
                (activityFilter === "savers" && user.savedProperties > 0) ||
                (activityFilter === "reporters" && user.reports > 0) ||
                (activityFilter === "inactive" &&
                    !user.publishedProperties &&
                    !user.savedProperties);

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus &&
                matchesVerification &&
                matchesActivity
            );
        });

        return result.sort(SORTERS[sortBy] || SORTERS.newest);
    }, [users, search, roleFilter, statusFilter, verificationFilter, activityFilter, sortBy]);

    // Back to page 1 whenever filters change.
    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter, verificationFilter, activityFilter, sortBy]);

    const pageCount = Math.ceil(filteredUsers.length / PAGE_SIZE);

    const pagedUsers = filteredUsers.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const handleViewProfile = (user) => {
        if (!user?._id) return;

        navigate(`/admin/users/${user._id}`, { state: { user } });
    };

    const clearFilters = () => {
        setSearch("");
        setRoleFilter("all");
        setStatusFilter("all");
        setVerificationFilter("all");
        setActivityFilter("all");
        setSortBy("newest");
    };

    if (loading && !data) return <LoadingState />;

    const filterSelect = (label, value, onChange, options) => (
        <FilterSelect label={label} value={value} onChange={onChange} options={options} />
    );

    const activeFilterCount =
        (search.trim() ? 1 : 0) +
        [roleFilter, statusFilter, verificationFilter, activityFilter].filter((value) => value !== "all").length;

    return (
        <Stack spacing={3} sx={{ mb: 3, minWidth: 0 }}>
            <SectionHeader
                icon={<PeopleAltOutlined />}
                title={t("usersSection.title", "Users")}
                subtitle={t(
                    "usersSection.subtitle",
                    "Accounts, growth, verification and activity."
                )}
            >
                <Chip
                    icon={<PeopleAltOutlined />}
                    label={t("usersSection.userCount", "{{count}} users", {
                        count: users.length,
                    })}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                />

                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            {/* KPIs */}
            <KpiGrid>
                <StatCard
                    title={t("usersSection.totalUsers", "Total users")}
                    value={formatNumber(summary.totalUsers, locale)}
                    description={t("usersSection.activeCount", "{{count}} active", {
                        count: formatNumber(summary.activeUsers, locale),
                    })}
                    icon={<PeopleAltOutlined />}
                    locale={locale}
                />

                <StatCard
                    title={t("usersSection.newLast30Days", "New in last 30 days")}
                    value={formatNumber(summary.newLast30Days, locale)}
                    change={summary.newUsersChange}
                    description={t("usersSection.newLast7Days", "{{count}} this week", {
                        count: formatNumber(summary.newLast7Days, locale),
                    })}
                    icon={<PersonAddAltOutlined />}
                    color="#16A34A"
                    locale={locale}
                />

                <StatCard
                    title={t("usersSection.publishers", "Publishers")}
                    value={formatNumber(summary.publishers, locale)}
                    description={t(
                        "usersSection.activePublishers",
                        "{{count}} with available listings",
                        { count: formatNumber(summary.activePublishers, locale) }
                    )}
                    icon={<HomeWorkOutlined />}
                    color="#9333EA"
                    locale={locale}
                />

                <StatCard
                    title={t("usersSection.suspendedUsers", "Suspended")}
                    value={formatNumber(summary.suspendedUsers, locale)}
                    description={t(
                        "usersSection.pendingDeletion",
                        "{{count}} pending deletion",
                        { count: formatNumber(summary.pendingDeletion, locale) }
                    )}
                    icon={<BlockOutlined />}
                    color="#DC2626"
                    locale={locale}
                />
            </KpiGrid>

            {/* Charts */}
            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("usersSection.signupTrend", "New accounts")}
                    subtitle={t("usersSection.signupTrendDescription", "Daily sign-ups over the last 30 days")}
                    height={280}
                >
                    <TrendChart
                        data={summary.signupTrend || []}
                        locale={locale}
                        series={[
                            {
                                key: "users",
                                name: t("usersSection.newUsers", "New users"),
                                color: "#16A34A",
                            },
                        ]}
                    />
                </ChartCard>

                <ChartCard
                    title={t("usersSection.quality", "Account quality")}
                    subtitle={t("usersSection.qualityDescription", "Verification and engagement rates")}
                    height={null}
                >
                    <Stack spacing={2}>
                        <RateBar
                            label={t("usersSection.emailVerified", "Email verified")}
                            value={summary.emailVerifiedRate}
                            color="#16A34A"
                            locale={locale}
                        />
                        <RateBar
                            label={t("usersSection.phoneVerified", "Phone verified")}
                            value={summary.phoneVerifiedRate}
                            color="#0891B2"
                            locale={locale}
                        />
                        <RateBar
                            label={t("usersSection.whatsappVerified", "WhatsApp verified")}
                            value={summary.whatsappVerifiedRate}
                            color="#22C55E"
                            locale={locale}
                        />
                        <RateBar
                            label={t("usersSection.publisherRate", "Published at least one property")}
                            value={summary.publisherRate}
                            color="#9333EA"
                            locale={locale}
                        />
                        <RateBar
                            label={t("usersSection.saverRate", "Saved at least one property")}
                            value={summary.saverRate}
                            color="#EC4899"
                            locale={locale}
                        />
                    </Stack>
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard
                    title={t("usersSection.roles", "Roles")}
                    height={260}
                >
                    <DonutChart
                        data={(summary.roles || []).map((item) => ({
                            ...item,
                            name: t(`usersSection.roleNames.${item.name}`, capitalize(item.name)),
                        }))}
                        locale={locale}
                    />
                </ChartCard>

                <ChartCard
                    title={t("usersSection.statuses", "Account status")}
                    height={260}
                >
                    <DonutChart
                        data={(summary.statuses || []).map((item) => ({
                            ...item,
                            name: t(`usersSection.statusNames.${item.name}`, capitalize(item.name)),
                            color:
                                item.name === "active"
                                    ? "#16A34A"
                                    : item.name === "suspended"
                                        ? "#DC2626"
                                        : undefined,
                        }))}
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            {/* Search and filters */}
            <FilterPanel
                activeCount={activeFilterCount}
                onClear={clearFilters}
                clearLabel={t("usersSection.clearFilters", "Clear filters")}
                action={
                    <Typography variant="body2" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
                        {t("usersSection.filteredCount", "{{count}} matching users", { count: filteredUsers.length })}
                    </Typography>
                }
                sx={{ mb: 0 }}
            >
                <FilterSearch
                    value={search}
                    onChange={(value) => setSearch(value)}
                    placeholder={t("usersSection.searchPlaceholder", "Search by name, email, phone or address")}
                />
                <FilterGrid min={170}>
                    {filterSelect(t("usersSection.role", "Role"), roleFilter, setRoleFilter, [
                        { value: "all", label: t("usersSection.allRoles", "All roles") },
                        ...roleOptions.map((role) => ({
                            value: role,
                            label: t(`usersSection.roleNames.${role}`, capitalize(role)),
                        })),
                    ])}

                    {filterSelect(t("usersSection.status", "Status"), statusFilter, setStatusFilter, [
                        { value: "all", label: t("usersSection.allStatuses", "All statuses") },
                        ...statusOptions.map((status) => ({
                            value: status,
                            label: t(`usersSection.statusNames.${status}`, capitalize(status)),
                        })),
                    ])}

                    {filterSelect(
                        t("usersSection.verification", "Verification"),
                        verificationFilter,
                        setVerificationFilter,
                        [
                            { value: "all", label: t("usersSection.allAccounts", "All accounts") },
                            { value: "emailVerified", label: t("usersSection.emailVerified", "Email verified") },
                            { value: "emailUnverified", label: t("usersSection.emailUnverified", "Email not verified") },
                            { value: "pendingDeletion", label: t("usersSection.pendingDeletionFilter", "Pending deletion") },
                        ]
                    )}

                    {filterSelect(
                        t("usersSection.activity", "Activity"),
                        activityFilter,
                        setActivityFilter,
                        [
                            { value: "all", label: t("usersSection.anyActivity", "Any activity") },
                            { value: "publishers", label: t("usersSection.publishers", "Publishers") },
                            { value: "savers", label: t("usersSection.savers", "Saved properties") },
                            { value: "reporters", label: t("usersSection.reporters", "Sent feedback") },
                            { value: "inactive", label: t("usersSection.noActivity", "No activity") },
                        ]
                    )}

                    {filterSelect(t("usersSection.sortBy", "Sort by"), sortBy, setSortBy, [
                        { value: "newest", label: t("usersSection.newestFirst", "Newest first") },
                        { value: "oldest", label: t("usersSection.oldestFirst", "Oldest first") },
                        { value: "name", label: t("usersSection.name", "Name") },
                        { value: "publications", label: t("usersSection.mostPublications", "Most publications") },
                        { value: "saved", label: t("usersSection.mostSaved", "Most saved properties") },
                        { value: "reports", label: t("usersSection.mostFeedback", "Most feedback") },
                    ])}
                </FilterGrid>
            </FilterPanel>

            {/* List */}
            {pagedUsers.length === 0 ? (
                <EmptyState
                    message={t("usersSection.noMatchingUsers", "No users match these filters.")}
                />
            ) : (
                <Stack spacing={2.5}>
                    {pagedUsers.map((user) => (
                        <UserCard
                            key={user._id}
                            user={user}
                            onViewDetails={() => handleViewProfile(user)}
                        />
                    ))}

                    {pageCount > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                            <Pagination
                                count={pageCount}
                                page={page}
                                onChange={(_event, value) => setPage(value)}
                                color="primary"
                                shape="rounded"
                            />
                        </Box>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
