// src/Components/Profile/Portfolio/PortfolioSection.jsx
//
// "Portfolio" tab of a profile: articles and YouTube videos that show who
// the user is and what they do. Property and vehicles each have their own
// (api = "/property/portfolio" or "/vehicles/portfolio").
//
//   <PortfolioSection api={API} mine />                   my profile: add, edit, delete
//   <PortfolioSection api={API} items={items} loading />   public profile: read only

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";

import axiosInstance from "../../../api/axiosInstance";
import PortfolioEditor from "./PortfolioEditor";
import PortfolioViewer from "./PortfolioViewer";
import { PORTFOLIO_MAX_ITEMS, coverOf } from "./portfolioUtils";

const dateOf = (value, locale) => {
    try {
        return new Date(value).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return "";
    }
};

export function PortfolioCard({ item, onOpen, onEdit, onDelete }) {
    const { t, i18n } = useTranslation();
    const [menu, setMenu] = useState(null);
    const isVideo = item.type === "video";

    return (
        <Card elevation={0} sx={{ position: "relative", border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardActionArea onClick={() => onOpen(item)} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" }}>
                <Box sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "grey.200" }}>
                    <Box component="img" src={coverOf(item)} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {isVideo && (
                        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                            <Box sx={{ width: 56, height: 40, borderRadius: "12px", bgcolor: "rgba(255,0,0,.92)", display: "grid", placeItems: "center", boxShadow: 3 }}>
                                <PlayArrowRoundedIcon sx={{ color: "#fff", fontSize: 30 }} />
                            </Box>
                        </Box>
                    )}
                    <Chip
                        size="small"
                        icon={isVideo ? <YouTubeIcon sx={{ color: "#FF0000 !important" }} /> : <ArticleOutlinedIcon />}
                        label={isVideo ? t("portfolio.types.videoShort", "Video") : t("portfolio.types.article", "Article")}
                        sx={{ position: "absolute", top: 10, insetInlineStart: 10, bgcolor: "rgba(255,255,255,.95)", fontWeight: 700 }}
                    />
                    {!isVideo && item.images?.length > 1 && (
                        <Chip
                            size="small"
                            icon={<PhotoLibraryOutlinedIcon />}
                            label={item.images.length}
                            sx={{ position: "absolute", bottom: 10, insetInlineEnd: 10, bgcolor: "rgba(17,24,39,.75)", color: "#fff", "& .MuiChip-icon": { color: "#fff" } }}
                        />
                    )}
                </Box>
                <Box sx={{ p: 2, pr: onEdit ? 5 : 2 }}>
                    <Typography sx={{ fontWeight: 800, mb: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>
                        {item.title}
                    </Typography>
                    {item.text && (
                        <Typography variant="body2" sx={{ color: "text.secondary", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>
                            {item.text}
                        </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 1 }}>
                        {dateOf(item.createdAt, i18n.language)}
                    </Typography>
                </Box>
            </CardActionArea>

            {onEdit && (
                <>
                    <IconButton
                        size="small"
                        aria-label={t("portfolio.actions", "Actions")}
                        onClick={(event) => setMenu(event.currentTarget)}
                        sx={{ position: "absolute", bottom: 10, insetInlineEnd: 8 }}
                    >
                        <MoreVertRoundedIcon />
                    </IconButton>
                    <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
                        <MenuItem
                            onClick={() => {
                                setMenu(null);
                                onEdit(item);
                            }}
                        >
                            <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> {t("portfolio.edit", "Edit")}
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setMenu(null);
                                onDelete(item);
                            }}
                            sx={{ color: "error.main" }}
                        >
                            <DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 1 }} /> {t("portfolio.delete", "Delete")}
                        </MenuItem>
                    </Menu>
                </>
            )}
        </Card>
    );
}

export function PortfolioGrid({ children }) {
    return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>{children}</Box>;
}

export default function PortfolioSection({ api, mine = false, items: givenItems = [], loading: givenLoading = false, error: givenError = "" }) {
    const { t } = useTranslation();

    const [ownItems, setOwnItems] = useState([]);
    const [ownLoading, setOwnLoading] = useState(mine);
    const [ownError, setOwnError] = useState("");
    const [max, setMax] = useState(PORTFOLIO_MAX_ITEMS);

    const [viewing, setViewing] = useState(null);
    const [editor, setEditor] = useState({ open: false, item: null, type: "article" });
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [notice, setNotice] = useState(null);

    const items = mine ? ownItems : givenItems;
    const loading = mine ? ownLoading : givenLoading;
    const error = mine ? ownError : givenError;

    const loadMine = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(`${api}/mine`);
            setOwnItems(data.items || []);
            setMax(data.max || PORTFOLIO_MAX_ITEMS);
            setOwnError("");
        } catch (requestError) {
            setOwnError(requestError.response?.data?.message || t("portfolio.errors.load", "Unable to load the portfolio."));
        } finally {
            setOwnLoading(false);
        }
    }, [api, t]);

    useEffect(() => {
        if (!mine) return undefined;
        let cancelled = false;
        axiosInstance
            .get(`${api}/mine`)
            .then(({ data }) => {
                if (cancelled) return;
                setOwnItems(data.items || []);
                setMax(data.max || PORTFOLIO_MAX_ITEMS);
            })
            .catch((requestError) => !cancelled && setOwnError(requestError.response?.data?.message || t("portfolio.errors.load", "Unable to load the portfolio.")))
            .finally(() => !cancelled && setOwnLoading(false));
        return () => {
            cancelled = true;
        };
    }, [api, mine, t]);

    const full = items.length >= max;

    const saved = (item, edited) => {
        setEditor((previous) => ({ ...previous, open: false }));
        setOwnItems((previous) => (edited ? previous.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...previous]));
        setNotice({ type: "success", message: edited ? t("portfolio.savedMessage", "Saved.") : t("portfolio.publishedMessage", "Published on your profile.") });
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            await axiosInstance.delete(`${api}/${deleting.id}`);
            setOwnItems((previous) => previous.filter((entry) => entry.id !== deleting.id));
            setNotice({ type: "success", message: t("portfolio.deletedMessage", "Deleted.") });
            setDeleting(null);
        } catch (requestError) {
            setNotice({ type: "error", message: requestError.response?.data?.message || t("portfolio.errors.delete", "Unable to delete.") });
            setDeleting(null);
            loadMine();
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <Box>
            {mine && (
                <Card elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
                        <Box>
                            <Typography sx={{ fontWeight: 800 }}>
                                {t("portfolio.mineTitle", "Show your work")} · {items.length}/{max}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {t("portfolio.mineHelp", "Articles with photos and YouTube videos about you and your work. Visitors of your public profile see them first.")}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                            <Button
                                variant="contained"
                                startIcon={<ArticleOutlinedIcon />}
                                disabled={full || loading}
                                onClick={() => setEditor({ open: true, item: null, type: "article" })}
                                sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                                {t("portfolio.addArticle", "Add an article")}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<YouTubeIcon sx={{ color: full ? undefined : "#FF0000" }} />}
                                disabled={full || loading}
                                onClick={() => setEditor({ open: true, item: null, type: "video" })}
                                sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                                {t("portfolio.addVideo", "Add a video")}
                            </Button>
                        </Stack>
                    </Stack>
                    {full && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {t("portfolio.full", "You reached {{max}} items. Delete one to add another.", { max })}
                        </Alert>
                    )}
                </Card>
            )}

            {notice && (
                <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
                    {notice.message}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : items.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6, px: 2, border: "1px dashed", borderColor: "divider", borderRadius: 3 }}>
                    <AutoStoriesOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                    <Typography sx={{ fontWeight: 700 }}>
                        {mine ? t("portfolio.emptyMine", "Nothing published yet") : t("portfolio.empty", "No articles or videos yet")}
                    </Typography>
                    {mine && (
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                            {t("portfolio.emptyMineHelp", "Present your agency, a finished project, a visit in video...")}
                        </Typography>
                    )}
                </Box>
            ) : (
                <PortfolioGrid>
                    {items.map((item) => (
                        <PortfolioCard
                            key={item.id}
                            item={item}
                            onOpen={setViewing}
                            onEdit={mine ? (entry) => setEditor({ open: true, item: entry, type: entry.type }) : undefined}
                            onDelete={mine ? setDeleting : undefined}
                        />
                    ))}
                </PortfolioGrid>
            )}

            <PortfolioViewer item={viewing} onClose={() => setViewing(null)} />

            {mine && (
                <>
                    <PortfolioEditor
                        open={editor.open}
                        api={api}
                        item={editor.item}
                        initialType={editor.type}
                        onClose={() => setEditor((previous) => ({ ...previous, open: false }))}
                        onSaved={saved}
                    />
                    <Dialog open={Boolean(deleting)} onClose={deleteBusy ? undefined : () => setDeleting(null)} maxWidth="xs" fullWidth>
                        <DialogTitle sx={{ fontWeight: 800 }}>{t("portfolio.deleteTitle", "Delete this item?")}</DialogTitle>
                        <DialogContent>
                            <Typography sx={{ overflowWrap: "anywhere" }}>{deleting?.title}</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleting(null)} disabled={deleteBusy} sx={{ textTransform: "none" }}>
                                {t("portfolio.cancel", "Cancel")}
                            </Button>
                            <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteBusy} sx={{ textTransform: "none", fontWeight: 700 }}>
                                {t("portfolio.delete", "Delete")}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </Box>
    );
}
