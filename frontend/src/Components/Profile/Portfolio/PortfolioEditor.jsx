// src/Components/Profile/Portfolio/PortfolioEditor.jsx
//
// Add or edit a portfolio item.
//   Article: title, text, 1 to 4 photos (the first one is the cover).
//   Video:   title, YouTube link (preview shown at once), short description.
// The type is chosen when adding and cannot change afterwards.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import axiosInstance from "../../../api/axiosInstance";
import { ARTICLE_TEXT_MAX, PORTFOLIO_MAX_IMAGES, TITLE_MAX, VIDEO_TEXT_MAX, parseYoutubeId, youtubeThumbnail } from "./portfolioUtils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

const EMPTY = { type: "article", title: "", text: "", youtubeUrl: "" };

export default function PortfolioEditor({ open, api, item = null, initialType = "article", onClose, onSaved }) {
    const { t } = useTranslation();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const editing = Boolean(item);

    const [form, setForm] = useState(EMPTY);
    const [kept, setKept] = useState([]); // photos already saved
    const [files, setFiles] = useState([]); // [{ file, url }]
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Fill the form each time the dialog opens.
    const [openedFor, setOpenedFor] = useState(null);
    const openKey = open ? item?.id || `new-${initialType}` : null;
    if (openKey !== openedFor) {
        setOpenedFor(openKey);
        if (open) {
            setForm(item ? { type: item.type, title: item.title, text: item.text || "", youtubeUrl: item.youtubeUrl || "" } : { ...EMPTY, type: initialType });
            setKept(item?.images || []);
            setFiles([]);
            setError("");
        }
    }

    // Preview addresses of new photos, freed when the editor goes away.
    const previews = useRef(new Set());
    useEffect(() => {
        const created = previews.current;
        return () => created.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const youtubeId = useMemo(() => parseYoutubeId(form.youtubeUrl), [form.youtubeUrl]);
    const isVideo = form.type === "video";
    const photoCount = kept.length + files.length;
    const textMax = isVideo ? VIDEO_TEXT_MAX : ARTICLE_TEXT_MAX;

    const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

    const addFiles = (event) => {
        const picked = [...(event.target.files || [])];
        event.target.value = "";
        const room = PORTFOLIO_MAX_IMAGES - photoCount;
        const accepted = [];
        for (const file of picked) {
            if (!ACCEPT.split(",").includes(file.type)) {
                setError(t("portfolio.errors.fileType", "Only JPG, PNG and WEBP photos."));
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                setError(t("portfolio.errors.fileSize", "Each photo can be up to 5 MB."));
                continue;
            }
            if (accepted.length >= room) {
                setError(t("portfolio.errors.maxPhotos", "Up to {{max}} photos.", { max: PORTFOLIO_MAX_IMAGES }));
                break;
            }
            const url = URL.createObjectURL(file);
            previews.current.add(url);
            accepted.push({ file, url });
        }
        if (accepted.length) setFiles((previous) => [...previous, ...accepted]);
    };

    const localError = () => {
        if (form.title.trim().length < 3) return t("portfolio.errors.title", "The title needs at least 3 characters.");
        if (isVideo && !youtubeId) return t("portfolio.errors.youtube", "Paste a YouTube video link (youtube.com or youtu.be).");
        if (!isVideo && form.text.trim().length < 20) return t("portfolio.errors.text", "Write at least 20 characters.");
        if (!isVideo && photoCount < 1) return t("portfolio.errors.photo", "Add at least one photo.");
        return "";
    };

    const submit = async () => {
        const problem = localError();
        if (problem) {
            setError(problem);
            return;
        }
        setSaving(true);
        setError("");
        try {
            const body = new FormData();
            body.append("type", form.type);
            body.append("title", form.title.trim());
            body.append("text", form.text.trim());
            if (isVideo) body.append("youtubeUrl", form.youtubeUrl.trim());
            if (editing) body.append("keepImages", JSON.stringify(kept.map((image) => image.filename)));
            if (!isVideo) files.forEach((entry) => body.append("images", entry.file));

            const { data } = editing ? await axiosInstance.put(`${api}/${item.id}`, body) : await axiosInstance.post(api, body);
            onSaved?.(data.item, editing);
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("portfolio.errors.save", "Unable to save. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
            <DialogTitle sx={{ fontWeight: 800 }}>
                {editing
                    ? t("portfolio.editTitle", "Edit")
                    : isVideo
                      ? t("portfolio.addVideo", "Add a video")
                      : t("portfolio.addArticle", "Add an article")}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2.25}>
                    {error && (
                        <Alert severity="error" onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {!editing && (
                        <ToggleButtonGroup
                            exclusive
                            fullWidth
                            size="small"
                            value={form.type}
                            onChange={(_, value) => value && setForm((previous) => ({ ...previous, type: value }))}
                        >
                            <ToggleButton value="article" sx={{ textTransform: "none", gap: 1 }}>
                                <ArticleOutlinedIcon fontSize="small" /> {t("portfolio.types.article", "Article")}
                            </ToggleButton>
                            <ToggleButton value="video" sx={{ textTransform: "none", gap: 1 }}>
                                <YouTubeIcon fontSize="small" sx={{ color: "#FF0000" }} /> {t("portfolio.types.video", "YouTube video")}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    )}

                    <TextField
                        label={t("portfolio.fields.title", "Title")}
                        value={form.title}
                        onChange={set("title")}
                        required
                        fullWidth
                        slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
                        helperText={`${form.title.length}/${TITLE_MAX}`}
                    />

                    {isVideo && (
                        <Box>
                            <TextField
                                label={t("portfolio.fields.youtube", "YouTube link")}
                                placeholder="https://www.youtube.com/watch?v=…"
                                value={form.youtubeUrl}
                                onChange={set("youtubeUrl")}
                                required
                                fullWidth
                                error={Boolean(form.youtubeUrl.trim()) && !youtubeId}
                                helperText={
                                    form.youtubeUrl.trim() && !youtubeId
                                        ? t("portfolio.errors.youtube", "Paste a YouTube video link (youtube.com or youtu.be).")
                                        : t("portfolio.youtubeHelp", "Only YouTube videos: watch, youtu.be and Shorts links work.")
                                }
                                slotProps={{ htmlInput: { dir: "ltr", inputMode: "url", spellCheck: false } }}
                            />
                            {youtubeId && (
                                <Box
                                    component="img"
                                    src={youtubeThumbnail(youtubeId)}
                                    alt=""
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                    }}
                                    sx={{ mt: 1.5, width: "100%", maxWidth: 360, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 2, display: "block" }}
                                />
                            )}
                        </Box>
                    )}

                    <TextField
                        label={isVideo ? t("portfolio.fields.description", "Description (optional)") : t("portfolio.fields.text", "Text")}
                        value={form.text}
                        onChange={set("text")}
                        required={!isVideo}
                        fullWidth
                        multiline
                        minRows={isVideo ? 3 : 6}
                        maxRows={16}
                        slotProps={{ htmlInput: { maxLength: textMax } }}
                        helperText={`${form.text.length}/${textMax}`}
                    />

                    {!isVideo && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {t("portfolio.fields.photos", "Photos")} ({photoCount}/{PORTFOLIO_MAX_IMAGES})
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                                {t("portfolio.photosHelp", "1 to 4 photos, JPG, PNG or WEBP, 5 MB max. The first one is the cover.")}
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 1 }}>
                                {[...kept.map((image) => ({ key: image.filename, url: image.path, kept: true })), ...files.map((entry) => ({ key: entry.url, url: entry.url }))].map((photo, index) => (
                                    <Box key={photo.key} sx={{ position: "relative", aspectRatio: "1", borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: index === 0 ? "primary.main" : "divider" }}>
                                        <Box component="img" src={photo.url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        {index === 0 && (
                                            <Typography variant="caption" sx={{ position: "absolute", bottom: 0, insetInlineStart: 0, right: 0, bgcolor: "rgba(37,99,235,.9)", color: "#fff", textAlign: "center", fontWeight: 700 }}>
                                                {t("portfolio.cover", "Cover")}
                                            </Typography>
                                        )}
                                        <IconButton
                                            size="small"
                                            aria-label={t("portfolio.removePhoto", "Remove photo")}
                                            onClick={() =>
                                                photo.kept
                                                    ? setKept((previous) => previous.filter((image) => image.filename !== photo.key))
                                                    : setFiles((previous) => previous.filter((entry) => entry.url !== photo.key))
                                            }
                                            sx={{ position: "absolute", top: 4, insetInlineEnd: 4, bgcolor: "rgba(255,255,255,.9)", "&:hover": { bgcolor: "#fff" }, p: 0.25 }}
                                        >
                                            <CloseRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                                {photoCount < PORTFOLIO_MAX_IMAGES && (
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        sx={{ aspectRatio: "1", borderStyle: "dashed", flexDirection: "column", gap: 0.5, textTransform: "none", fontSize: 12 }}
                                    >
                                        <AddPhotoAlternateOutlinedIcon />
                                        {t("portfolio.addPhoto", "Add")}
                                        <input hidden type="file" accept={ACCEPT} multiple onChange={addFiles} />
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
                    {t("portfolio.cancel", "Cancel")}
                </Button>
                <Button variant="contained" onClick={submit} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ textTransform: "none", fontWeight: 700, px: 3 }}>
                    {editing ? t("portfolio.save", "Save") : t("portfolio.publish", "Publish")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
