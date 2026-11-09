import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import axiosInstance from "../../../api/axiosInstance";
import UserCard from "./UserCard";

export default function UsersSection() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get("/dashboard/users");

            setUsers(response.data.users ?? []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("usersSection.loadError")
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getUserStatus = (user) =>
        String(user.accountStatus || "active").toLowerCase();

    const getUserRole = (user) =>
        String(user.role || "User").toLowerCase();

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        const result = users.filter((user) => {
            const fullName =
                `${user.firstName || ""} ${user.lastName || ""}`.trim();

            const matchesSearch =
                !normalizedSearch ||
                [
                    fullName,
                    user.firstName,
                    user.lastName,
                    user.email,
                    user.phoneNumber,
                    user.address,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(normalizedSearch)
                );

            const matchesRole =
                roleFilter === "all" ||
                getUserRole(user) === roleFilter.toLowerCase();

            const matchesStatus =
                statusFilter === "all" ||
                getUserStatus(user) === statusFilter.toLowerCase();

            return matchesSearch && matchesRole && matchesStatus;
        });

        result.sort((a, b) => {
            if (sortBy === "name") {
                const nameA =
                    `${a.firstName || ""} ${a.lastName || ""}`.trim();
                const nameB =
                    `${b.firstName || ""} ${b.lastName || ""}`.trim();

                return nameA.localeCompare(nameB);
            }

            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            return sortBy === "oldest"
                ? dateA - dateB
                : dateB - dateA;
        });

        return result;
    }, [users, search, roleFilter, statusFilter, sortBy]);

    const activeUsers = users.filter(
        (user) => getUserStatus(user) === "active"
    ).length;

    const suspendedUsers = users.filter(
        (user) => getUserStatus(user) === "suspended"
    ).length;

    const handleViewProfile = (user) => {
        if (!user?._id) return;

        navigate(`/admin/users/${user._id}`, {
            state: { user },
        });
    };

    const clearFilters = () => {
        setSearch("");
        setRoleFilter("all");
        setStatusFilter("all");
        setSortBy("newest");
    };

    return (
        <Box sx={{ mb: 3, minWidth: 0 }}>
            {/* Header */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                mb={3}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        {t("usersSection.title")}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        {t("usersSection.subtitle")}
                    </Typography>
                </Box>

                <Chip
                    icon={<PeopleAltOutlinedIcon />}
                    label={t("usersSection.userCount", {
                        count: users.length,
                    })}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                />
            </Stack>

            {/* User statistics */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h5" fontWeight={700}>
                        {users.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t("usersSection.totalUsers")}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                    }}
                >
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        color="success.main"
                    >
                        {activeUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t("usersSection.activeUsers")}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h5" fontWeight={700} color="error.main">
                        {suspendedUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t("usersSection.suspendedUsers")}
                    </Typography>
                </Box>
            </Box>

            {/* Search and filters */}
            <Stack spacing={2} mb={3}>
                <TextField
                    fullWidth
                    size="small"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("usersSection.searchPlaceholder")}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlinedIcon color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

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
                    <FormControl fullWidth size="small">
                        <InputLabel>
                            {t("usersSection.role")}
                        </InputLabel>
                        <Select
                            value={roleFilter}
                            label={t("usersSection.role")}
                            onChange={(event) =>
                                setRoleFilter(event.target.value)
                            }
                        >
                            <MenuItem value="all">
                                {t("usersSection.allRoles")}
                            </MenuItem>
                            <MenuItem value="client">
                                {t("usersSection.client")}
                            </MenuItem>
                            <MenuItem value="admin">
                                {t("usersSection.admin")}
                            </MenuItem>
                            <MenuItem value="active">
                                {t("usersSection.active")}
                            </MenuItem>

                            <MenuItem value="suspended">
                                {t("usersSection.suspended")}
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>
                            {t("usersSection.status")}
                        </InputLabel>
                        <Select
                            value={statusFilter}
                            label={t("usersSection.status")}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                        >
                            <MenuItem value="all">
                                {t("usersSection.allStatuses")}
                            </MenuItem>
                            <MenuItem value="active">
                                {t("usersSection.active")}
                            </MenuItem>
                            <MenuItem value="inactive">
                                {t("usersSection.inactive")}
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>
                            {t("usersSection.sortBy")}
                        </InputLabel>
                        <Select
                            value={sortBy}
                            label={t("usersSection.sortBy")}
                            onChange={(event) =>
                                setSortBy(event.target.value)
                            }
                        >
                            <MenuItem value="newest">
                                {t("usersSection.newestFirst")}
                            </MenuItem>
                            <MenuItem value="oldest">
                                {t("usersSection.oldestFirst")}
                            </MenuItem>
                            <MenuItem value="name">
                                {t("usersSection.name")}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                >
                    <Typography variant="body2" color="text.secondary">
                        {t("usersSection.filteredCount", {
                            count: filteredUsers.length,
                        })}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                        <Chip
                            label={t("usersSection.clearFilters")}
                            variant="outlined"
                            size="small"
                            onClick={clearFilters}
                            clickable
                        />

                        <Chip
                            icon={<RefreshOutlinedIcon />}
                            label={t("usersSection.refresh")}
                            variant="outlined"
                            size="small"
                            onClick={fetchUsers}
                            clickable
                            disabled={loading}
                        />
                    </Stack>
                </Stack>
            </Stack>

            {/* Content */}
            {loading ? (
                <Box display="flex" justifyContent="center" py={5}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : filteredUsers.length === 0 ? (
                <Box py={4} textAlign="center">
                    <PeopleAltOutlinedIcon
                        sx={{ fontSize: 42, color: "text.disabled", mb: 1 }}
                    />
                    <Typography color="text.secondary">
                        {t("usersSection.noMatchingUsers")}
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2.5}>
                    {filteredUsers.map((user) => (
                        <UserCard
                            key={user._id}
                            user={user}
                            onViewDetails={() => handleViewProfile(user)}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}