
import { useCallback, useEffect, useState } from "react";
import { useRouteLoaderData, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../../api/axiosInstance";
import PageLayout from "../PageLayout";
import KnowledgeForm from "./KnowledgeForm";

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnpublishedOutlinedIcon from "@mui/icons-material/UnpublishedOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import StarIcon from "@mui/icons-material/Star";

const statusColors = {
    draft: "default",
    published: "success",
    archived: "warning",
};

const categoryKeys = {
    Buying: "buying",
    Renting: "renting",
    Selling: "selling",
    Ownership: "ownership",
    "Legal procedures": "legalProcedures",
    "Real estate taxes": "realEstateTaxes",
    "Co-ownership": "coOwnership",
    "Real estate advice": "realEstateAdvice",
    Other: "other",
};

const formatDate = (date, locale) => {
    if (!date) return "—";

    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date));
};

export default function KnowledgeManagement() {
    const user = useRouteLoaderData("dashboard-layout");
    const { t: translate, i18n } = useTranslation();

    const t = (key, options) =>
        translate(`knowledgeCenter.management.${key}`, options);

    const categoryT = (category) => {
        const key = categoryKeys[category];

        return key
            ? translate(`knowledgeCenter.categories.${key}`)
            : category || "—";
    };

    const currentLanguage =
        i18n.resolvedLanguage?.split("-")[0] ||
        i18n.language?.split("-")[0] ||
        "en";

    const localeMap = {
        en: "en-GB",
        fr: "fr-FR",
        ar: "ar-MA",
    };

    const locale = localeMap[currentLanguage] || "en-GB";

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 9,
        total: 0,
        totalPages: 0,
    });

    const [type, setType] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [notice, setNotice] = useState("");

    // Frontend access guard. Backend routes are also protected.
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const loadContent = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get("/knowledge/admin", {
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    ...(type && { type }),
                    ...(status && { status }),
                    ...(search.trim() && { search: search.trim() }),
                },
            });

            setItems(response.data?.items || []);

            setPagination((previous) => ({
                ...previous,
                ...(response.data?.pagination || {}),
            }));
        } catch (requestError) {
            console.error("Knowledge management loading error:", requestError);

            setError(
                requestError.response?.data?.message ||
                t("loadError")
            );
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, type, status, search]);

    useEffect(() => {
        if (isAdmin) {
            loadContent();
        }
    }, [isAdmin, loadContent]);

    const openCreateForm = () => {
        setEditingItem(null);
        setFormOpen(true);
    };

    const openEditForm = (item) => {
        setEditingItem(item);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingItem(null);
    };

    const handleSaved = async () => {
        setNotice(
            editingItem
                ? t("updatedSuccess")
                : t("createdSuccess")
        );

        await loadContent();
    };

    const handleStatusChange = async (item, nextStatus) => {
        const labels = {
            published: t("actions.publish"),
            draft: t("actions.returnToDraft"),
            archived: t("actions.archive"),
        };

        const confirmed = window.confirm(
            t("confirmStatusChange", {
                action: labels[nextStatus],
                title: item.title,
            })
        );

        if (!confirmed) return;

        try {
            setActionLoading(item._id);
            setError("");

            await axiosInstance.patch(
                `/knowledge/${item._id}/status`,
                { status: nextStatus }
            );

            const successMessages = {
                published: t("publishedSuccess"),
                draft: t("draftSuccess"),
                archived: t("archivedSuccess"),
            };

            setNotice(successMessages[nextStatus]);

            await loadContent();
        } catch (requestError) {
            console.error("Knowledge status update error:", requestError);

            setError(
                requestError.response?.data?.message ||
                t("statusUpdateError")
            );
        } finally {
            setActionLoading("");
        }
    };

    const handleDelete = async (item) => {
        const confirmed = window.confirm(
            t("confirmDelete", { title: item.title })
        );

        if (!confirmed) return;

        try {
            setActionLoading(item._id);
            setError("");

            await axiosInstance.delete(`/knowledge/${item._id}`);

            setNotice(t("deletedSuccess"));

            if (items.length === 1 && pagination.page > 1) {
                setPagination((previous) => ({
                    ...previous,
                    page: previous.page - 1,
                }));
            } else {
                await loadContent();
            }
        } catch (requestError) {
            console.error("Knowledge deletion error:", requestError);

            setError(
                requestError.response?.data?.message ||
                t("deleteError")
            );
        } finally {
            setActionLoading("");
        }
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPagination((previous) => ({
            ...previous,
            page: 1,
        }));
    };

    const handleFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setPagination((previous) => ({
            ...previous,
            page: 1,
        }));
    };

    if (!isAdmin) {
        return <Navigate to="/knowledge" replace />;
    }

    return (
        <PageLayout
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<VideoLibraryOutlinedIcon color="primary" />}
            action={
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateForm}
                >
                    {t("addContent")}
                </Button>
            }
        >
            <Stack spacing={2.5}>
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError("")}
                    >
                        {error}
                    </Alert>
                )}

                {notice && (
                    <Alert
                        severity="success"
                        onClose={() => setNotice("")}
                    >
                        {notice}
                    </Alert>
                )}

                <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 3 }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ md: "center" }}
                    >
                        <TextField
                            label={t("searchContent")}
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={handleSearchChange}
                            size="small"
                            fullWidth
                            sx={{ flex: 2 }}
                        />

                        <TextField
                            select
                            label={t("contentType")}
                            value={type}
                            onChange={handleFilterChange(setType)}
                            size="small"
                            sx={{ minWidth: { xs: "100%", md: 160 } }}
                        >
                            <MenuItem value="">
                                {t("allTypes")}
                            </MenuItem>
                            <MenuItem value="article">
                                {t("articles")}
                            </MenuItem>
                            <MenuItem value="video">
                                {t("videos")}
                            </MenuItem>
                        </TextField>

                        <TextField
                            select
                            label={t("status")}
                            value={status}
                            onChange={handleFilterChange(setStatus)}
                            size="small"
                            sx={{ minWidth: { xs: "100%", md: 160 } }}
                        >
                            <MenuItem value="">
                                {t("allStatuses")}
                            </MenuItem>
                            <MenuItem value="draft">
                                {t("draft")}
                            </MenuItem>
                            <MenuItem value="published">
                                {t("published")}
                            </MenuItem>
                            <MenuItem value="archived">
                                {t("archived")}
                            </MenuItem>
                        </TextField>

                        <Tooltip title={t("refresh")}>
                            <span>
                                <IconButton
                                    onClick={loadContent}
                                    disabled={loading}
                                    color="primary"
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                </Paper>

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="body2" color="text.secondary">
                        {t("contentCount", { count: pagination.total })}
                    </Typography>
                </Stack>

                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 3 }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t("table.content")}</TableCell>
                                <TableCell>{t("table.type")}</TableCell>
                                <TableCell>{t("table.category")}</TableCell>
                                <TableCell>{t("table.language")}</TableCell>
                                <TableCell>{t("table.status")}</TableCell>
                                <TableCell>{t("table.updated")}</TableCell>
                                <TableCell align="right">
                                    {t("table.actions")}
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Stack
                                            alignItems="center"
                                            spacing={1}
                                            sx={{ py: 5 }}
                                        >
                                            <CircularProgress />
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {t("loading")}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Box sx={{ py: 5, textAlign: "center" }}>
                                            <Typography
                                                fontWeight={600}
                                                gutterBottom
                                            >
                                                {t("emptyTitle")}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {t("emptySubtitle")}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const isBusy =
                                        actionLoading === item._id;

                                    return (
                                        <TableRow
                                            key={item._id}
                                            hover
                                        >
                                            <TableCell sx={{ minWidth: 220 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    {item.type === "article" ? (
                                                        <ArticleOutlinedIcon
                                                            color="action"
                                                        />
                                                    ) : (
                                                        <VideoLibraryOutlinedIcon
                                                            color="action"
                                                        />
                                                    )}

                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.5}
                                                            alignItems="center"
                                                        >
                                                            <Typography
                                                                fontWeight={600}
                                                                sx={{
                                                                    overflowWrap: "anywhere",
                                                                }}
                                                            >
                                                                {item.title}
                                                            </Typography>

                                                            {item.isFeatured && (
                                                                <Tooltip title={t("featured")}>
                                                                    <StarIcon
                                                                        fontSize="small"
                                                                        color="warning"
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                        </Stack>

                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {item.tags?.slice(0, 3).join(", ") || t("noTags")}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={
                                                        item.type === "article"
                                                            ? t("article")
                                                            : t("video")
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell>
                                                {categoryT(item.category)}
                                            </TableCell>

                                            <TableCell>
                                                {t(`languages.${item.language}`, {
                                                    defaultValue: item.language?.toUpperCase() || "—",
                                                })}
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    color={statusColors[item.status] || "default"}
                                                    label={t(`statuses.${item.status}`, {
                                                        defaultValue: item.status,
                                                    })}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {formatDate(item.updatedAt, locale)}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">
                                                <Stack
                                                    direction="row"
                                                    spacing={0.25}
                                                    justifyContent="flex-end"
                                                >
                                                    <Tooltip title={t("actions.edit")}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                openEditForm(item)
                                                            }
                                                            disabled={isBusy}
                                                        >
                                                            <EditOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {item.status !== "published" && (
                                                        <Tooltip title={t("actions.publish")}>
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        item,
                                                                        "published"
                                                                    )
                                                                }
                                                                disabled={isBusy}
                                                            >
                                                                <PublishOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {item.status === "published" && (
                                                        <Tooltip title={t("actions.returnToDraft")}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        item,
                                                                        "draft"
                                                                    )
                                                                }
                                                                disabled={isBusy}
                                                            >
                                                                <UnpublishedOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {item.status !== "archived" && (
                                                        <Tooltip title={t("actions.archive")}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        item,
                                                                        "archived"
                                                                    )
                                                                }
                                                                disabled={isBusy}
                                                            >
                                                                <ArchiveOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title={t("actions.delete")}>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() =>
                                                                handleDelete(item)
                                                            }
                                                            disabled={isBusy}
                                                        >
                                                            {isBusy ? (
                                                                <CircularProgress size={17} />
                                                            ) : (
                                                                <DeleteIcon fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!loading && pagination.totalPages > 1 && (
                    <Stack alignItems="center" sx={{ py: 1 }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={pagination.page}
                            onChange={(_, page) =>
                                setPagination((previous) => ({
                                    ...previous,
                                    page,
                                }))
                            }
                            color="primary"
                        />
                    </Stack>
                )}
            </Stack>

            <KnowledgeForm
                open={formOpen}
                onClose={closeForm}
                onSaved={handleSaved}
                editingItem={editingItem}
            />
        </PageLayout>
    );
}
