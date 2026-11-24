// src/Components/Admin/AdminRolesPage.jsx
//
// Admin panel > Account > Roles & access (admins only).
// Find a user, then make them:
//   client  ordinary user, no admin panel
//   member  team member: choose their sections, each "View" or "View & edit"
//   admin   everything (read and write), can set roles
// The server refuses changing your own role and removing the last admin.

import { useEffect, useMemo, useState } from "react";
import { useRouteLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Pagination,
    Snackbar,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import axiosInstance from "../../api/axiosInstance";
import getImageUrl from "../../utils/getImageUrl";
import PageLayout from "../../Apps/Property/Statistic/PageLayout";
import { FilterChips, FilterSearch } from "../ui/FilterKit";
import { ADMIN_GROUPS, GRANTABLE_ITEMS } from "./adminSections";

const ROLES = ["client", "member", "admin"];
const ROLE_META = {
    client: { color: "default", icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
    member: { color: "info", icon: <BadgeOutlinedIcon fontSize="small" /> },
    admin: { color: "primary", icon: <AdminPanelSettingsOutlinedIcon fontSize="small" /> },
};
const PER_PAGE = 20;

const fullName = (user) => [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

export default function AdminRolesPage() {
    const { t } = useTranslation();
    const me = useRouteLoaderData("dashboard-layout");
    const myId = String(me?.id || me?._id || "");

    const [role, setRole] = useState("all");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ users: [], counts: {}, pagination: { totalPages: 1 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(null);
    const [notice, setNotice] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    // Search a moment after typing stops.
    useEffect(() => {
        const next = search.trim();
        if (next === query) return undefined;
        const timer = setTimeout(() => {
            setLoading(true);
            setPage(1);
            setQuery(next);
        }, 350);
        return () => clearTimeout(timer);
    }, [search, query]);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/dashboard/roles", { params: { role, q: query, page, limit: PER_PAGE } })
            .then((response) => {
                if (!cancelled) {
                    setData(response.data);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!cancelled) setError(requestError.response?.data?.message || t("adminRoles.loadError", "Unable to load the users."));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [role, query, page, reloadKey, t]);

    const changeRole = (value) => {
        setLoading(true);
        setRole(value);
        setPage(1);
    };

    const onSaved = (user) => {
        setEditing(null);
        setNotice(t("adminRoles.saved", "{{name}} is now: {{role}}.", { name: fullName(user), role: t(`adminRoles.roles.${user.role}`) }));
        setLoading(true);
        setReloadKey((key) => key + 1);
    };

    const { users = [], counts = {}, pagination = {} } = data;

    return (
        <PageLayout
            icon={<ManageAccountsOutlinedIcon />}
            title={t("adminRoles.title", "Roles & access")}
            subtitle={t("adminRoles.subtitle", "Give team members access to parts of the admin panel, or make someone an administrator.")}
        >
            {/* What each role can do */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5, mb: 3 }}>
                {ROLES.map((value) => (
                    <Card key={value} variant="outlined" sx={{ p: 2, borderRadius: "14px" }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                            {ROLE_META[value].icon}
                            <Typography sx={{ fontWeight: 700 }}>{t(`adminRoles.roles.${value}`)}</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t(`adminRoles.roleHelp.${value}`)}
                        </Typography>
                    </Card>
                ))}
            </Box>

            <Box
                sx={(theme) => ({
                    p: { xs: 1.5, sm: 2 },
                    mb: 3,
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: "14px",
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                })}
            >
                <FilterChips
                    label={t("adminRoles.filter", "Role")}
                    value={role}
                    onChange={changeRole}
                    options={["all", ...ROLES].map((value) => ({
                        value,
                        label: t(`adminRoles.filters.${value}`),
                        count: counts[value],
                        icon: ROLE_META[value]?.icon,
                    }))}
                />
                <Box sx={{ minWidth: { md: 320 } }}>
                    <FilterSearch value={search} onChange={setSearch} placeholder={t("adminRoles.search", "Name or email…")} />
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && !users.length ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : !users.length ? (
                <Box sx={{ py: 6, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: "16px" }}>
                    <Typography sx={{ fontWeight: 700 }}>{t("adminRoles.empty", "No user matches.")}</Typography>
                </Box>
            ) : (
                <Stack spacing={1.5} sx={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>
                    {users.map((user) => (
                        <RoleRow key={user.id} user={user} isMe={user.id === myId} onEdit={() => setEditing(user)} />
                    ))}
                </Stack>
            )}

            {pagination.totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                        color="primary"
                        page={page}
                        count={pagination.totalPages}
                        onChange={(_event, value) => {
                            setLoading(true);
                            setPage(value);
                        }}
                    />
                </Box>
            )}

            {editing && <RoleDialog user={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}

            <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert severity="success" variant="filled" onClose={() => setNotice("")}>
                    {notice}
                </Alert>
            </Snackbar>
        </PageLayout>
    );
}

function RoleRow({ user, isMe, onEdit }) {
    const { t } = useTranslation();
    const meta = ROLE_META[user.role] || ROLE_META.client;
    const granted = GRANTABLE_ITEMS.filter((item) => user.permissions?.[item.section]);

    return (
        <Card variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: "14px" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0, flex: 1 }}>
                    <Avatar src={user.profileImage ? getImageUrl(user.profileImage) : undefined} sx={{ width: 42, height: 42 }}>
                        {(user.firstName || user.email || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                            <Typography sx={{ fontWeight: 700 }} noWrap>
                                {fullName(user)}
                            </Typography>
                            <Chip size="small" color={meta.color} icon={meta.icon} label={t(`adminRoles.roles.${user.role}`)} sx={{ fontWeight: 700 }} />
                            {isMe && <Chip size="small" variant="outlined" label={t("adminRoles.you", "You")} />}
                            {user.accountStatus === "suspended" && <Chip size="small" color="error" variant="outlined" label={t("adminRoles.suspended", "Suspended")} />}
                        </Stack>
                        <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
                            {user.email}
                        </Typography>
                    </Box>
                </Stack>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlinedIcon />}
                    onClick={onEdit}
                    disabled={isMe}
                    sx={{ textTransform: "none", whiteSpace: "nowrap", alignSelf: { xs: "flex-start", sm: "center" } }}
                >
                    {t("adminRoles.change", "Change role")}
                </Button>
            </Stack>

            {user.role === "member" && granted.length > 0 && (
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", mt: 1.5, paddingInlineStart: { sm: "56px" } }}>
                    {granted.map((item) => (
                        <Chip
                            key={item.section}
                            size="small"
                            variant="outlined"
                            color={user.permissions[item.section] === "write" ? "primary" : "default"}
                            label={`${sectionLabel(item, t)} · ${t(`adminRoles.levels.${user.permissions[item.section]}`)}`}
                        />
                    ))}
                </Stack>
            )}
        </Card>
    );
}

/** "Property · Publication Reviews" */
function sectionLabel(item, t) {
    const group = ADMIN_GROUPS.find((entry) => entry.id === item.group);
    return `${t(group.labelKey, { defaultValue: group.label })} · ${t(item.labelKey, { defaultValue: item.label })}`;
}

function RoleDialog({ user, onClose, onSaved }) {
    const { t } = useTranslation();
    const [role, setRole] = useState(user.role || "client");
    const [permissions, setPermissions] = useState(user.permissions || {});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const groups = useMemo(
        () => ADMIN_GROUPS.map((group) => ({ ...group, items: GRANTABLE_ITEMS.filter((item) => item.group === group.id) })).filter((group) => group.items.length),
        []
    );
    const grantedCount = Object.values(permissions).filter(Boolean).length;

    const setLevel = (section, level) =>
        setPermissions((previous) => {
            const next = { ...previous };
            if (level) next[section] = level;
            else delete next[section];
            return next;
        });
    const setAll = (level) => setPermissions(level ? Object.fromEntries(GRANTABLE_ITEMS.map((item) => [item.section, level])) : {});

    const save = async () => {
        if (role === "member" && !grantedCount) {
            setError(t("adminRoles.needSection", "Give this member access to at least one section."));
            return;
        }
        setSaving(true);
        setError("");
        try {
            const response = await axiosInstance.patch(`/dashboard/users/${user.id}/role`, { role, permissions: role === "member" ? permissions : {} });
            onSaved(response.data.user);
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("adminRoles.saveError", "Unable to change the role."));
            setSaving(false);
        }
    };

    return (
        <Dialog open onClose={() => !saving && onClose()} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
                {t("adminRoles.dialogTitle", "Role of {{name}}", { name: fullName(user) })}
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {user.email}
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {/* Role */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                    {ROLES.map((value) => {
                        const selected = role === value;
                        return (
                            <Card
                                key={value}
                                variant="outlined"
                                role="radio"
                                aria-checked={selected}
                                tabIndex={0}
                                onClick={() => setRole(value)}
                                onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setRole(value)}
                                sx={(theme) => ({
                                    p: 1.75,
                                    cursor: "pointer",
                                    borderRadius: "12px",
                                    borderWidth: selected ? 2 : 1,
                                    borderColor: selected ? "primary.main" : "divider",
                                    bgcolor: selected ? alpha(theme.palette.primary.main, 0.05) : "background.paper",
                                })}
                            >
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                                    {ROLE_META[value].icon}
                                    <Typography sx={{ fontWeight: 700, flex: 1 }}>{t(`adminRoles.roles.${value}`)}</Typography>
                                    {selected && <CheckCircleRoundedIcon color="primary" fontSize="small" />}
                                </Stack>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {t(`adminRoles.roleHelp.${value}`)}
                                </Typography>
                            </Card>
                        );
                    })}
                </Box>

                {/* Sections of a member */}
                {role === "member" && (
                    <Box sx={{ mt: 3 }}>
                        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>{t("adminRoles.sectionsTitle", "Admin panel access")}</Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {t("adminRoles.sectionsHelp", "View: see the page. View & edit: also delete, change status, edit.")}
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Button size="small" onClick={() => setAll("read")} sx={{ textTransform: "none" }}>
                                    {t("adminRoles.allView", "View all")}
                                </Button>
                                <Button size="small" color="inherit" onClick={() => setAll(null)} sx={{ textTransform: "none" }}>
                                    {t("adminRoles.clear", "Clear")}
                                </Button>
                            </Stack>
                        </Stack>

                        <Stack spacing={2}>
                            {groups.map((group) => (
                                <Box key={group.id}>
                                    <Typography variant="overline" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "0.8px" }}>
                                        {t(group.labelKey, { defaultValue: group.label })}
                                    </Typography>
                                    <Stack spacing={1}>
                                        {group.items.map((item) => (
                                            <Stack
                                                key={item.section}
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={1}
                                                sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: "10px" }}
                                            >
                                                <Typography sx={{ fontWeight: 600 }}>{t(item.labelKey, { defaultValue: item.label })}</Typography>
                                                <ToggleButtonGroup
                                                    size="small"
                                                    exclusive
                                                    value={permissions[item.section] || "none"}
                                                    onChange={(_event, value) => value && setLevel(item.section, value === "none" ? null : value)}
                                                    sx={{ "& .MuiToggleButton-root": { textTransform: "none", px: 1.5 } }}
                                                >
                                                    <ToggleButton value="none">{t("adminRoles.levels.none", "No access")}</ToggleButton>
                                                    <ToggleButton value="read">{t("adminRoles.levels.read", "View")}</ToggleButton>
                                                    <ToggleButton value="write">{t("adminRoles.levels.write", "View & edit")}</ToggleButton>
                                                </ToggleButtonGroup>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                        <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "text.secondary" }}>
                            {t("adminRoles.rolesNote", "Roles & access always stays reserved to administrators.")}
                        </Typography>
                    </Box>
                )}

                {role === "admin" && user.role !== "admin" && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        {t("adminRoles.adminWarning", "An administrator can see and change everything, including roles.")}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
                    {t("adminRoles.cancel", "Cancel")}
                </Button>
                <Button
                    variant="contained"
                    onClick={save}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                >
                    {t("adminRoles.save", "Save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
