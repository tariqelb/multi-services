
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../../api/axiosInstance";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";

import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";

const categories = [
    { value: "Buying", key: "buying" },
    { value: "Renting", key: "renting" },
    { value: "Selling", key: "selling" },
    { value: "Ownership", key: "ownership" },
    { value: "Legal procedures", key: "legalProcedures" },
    { value: "Real estate taxes", key: "realEstateTaxes" },
    { value: "Co-ownership", key: "coOwnership" },
    { value: "Real estate advice", key: "realEstateAdvice" },
];

const initialForm = {
    type: "article",
    title: "",
    description: "",
    sourceUrl: "",
    sourceName: "",
    youtubeUrl: "",
    thumbnailUrl: "",
    category: "Buying",
    language: "en",
    tags: "",
    isFeatured: false,
    status: "draft",
};

const getYouTubeId = (value = "") => {
    const input = value.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    try {
        const url = new URL(input);
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        const parts = url.pathname.split("/").filter(Boolean);

        let id = "";

        if (host === "youtu.be") {
            id = parts[0] || "";
        } else if (
            ["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)
        ) {
            if (url.pathname === "/watch") {
                id = url.searchParams.get("v") || "";
            } else if (
                ["embed", "shorts", "live"].includes(parts[0])
            ) {
                id = parts[1] || "";
            }
        }

        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
    } catch {
        return "";
    }
};

export default function KnowledgeForm({
    open,
    onClose,
    onSaved,
    editingItem = null,
}) {
    const { t: translate } = useTranslation();

    const t = (key, options) =>
        translate(`knowledgeCenter.form.${key}`, options);

    const categoryT = (key) =>
        translate(`knowledgeCenter.categories.${key}`);

    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEditing = Boolean(editingItem);

    useEffect(() => {
        if (!open) return;

        if (editingItem) {
            setForm({
                type: editingItem.type || "article",
                title: editingItem.title || "",
                description: editingItem.description || "",
                sourceUrl: editingItem.sourceUrl || "",
                sourceName: editingItem.sourceName || "",
                youtubeUrl: editingItem.youtubeVideoId || "",
                thumbnailUrl: editingItem.thumbnailUrl || "",
                category: editingItem.category || "Buying",
                language: editingItem.language || "en",
                tags: Array.isArray(editingItem.tags)
                    ? editingItem.tags.join(", ")
                    : "",
                isFeatured: Boolean(editingItem.isFeatured),
                status: editingItem.status || "draft",
            });
        } else {
            setForm(initialForm);
        }

        setError("");
    }, [open, editingItem]);

    const youtubeId = useMemo(
        () => getYouTubeId(form.youtubeUrl),
        [form.youtubeUrl]
    );

    const previewThumbnail =
        form.thumbnailUrl.trim() ||
        (youtubeId
            ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
            : "");

    const updateField = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleTypeChange = (type) => {
        setForm((previous) => ({
            ...previous,
            type,
            sourceUrl: "",
            sourceName: "",
            youtubeUrl: "",
            thumbnailUrl: "",
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.title.trim()) {
            setError(t("validation.titleRequired"));
            return;
        }

        if (!form.category.trim()) {
            setError(t("validation.categoryRequired"));
            return;
        }

        if (form.type === "article" && !form.sourceUrl.trim()) {
            setError(t("validation.sourceUrlRequired"));
            return;
        }

        if (form.type === "video" && !youtubeId) {
            setError(t("validation.youtubeUrlInvalid"));
            return;
        }

        const payload = {
            type: form.type,
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            language: form.language,
            tags: form.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            isFeatured: form.isFeatured,
            status: form.status,
        };

        if (form.type === "article") {
            payload.sourceUrl = form.sourceUrl.trim();
            payload.sourceName = form.sourceName.trim();
        } else {
            payload.youtubeUrl = form.youtubeUrl.trim();
            payload.thumbnailUrl = form.thumbnailUrl.trim();
        }

        try {
            setLoading(true);

            if (isEditing) {
                await axiosInstance.put(
                    `/knowledge/${editingItem._id}`,
                    payload
                );
            } else {
                await axiosInstance.post("/knowledge", payload);
            }

            onSaved?.();
            onClose?.();
        } catch (requestError) {
            console.error("Knowledge content save error:", requestError);

            setError(
                requestError.response?.data?.message ||
                t("saveError")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            fullWidth
            maxWidth="md"
            scroll="paper"
        >
            <Box component="form" onSubmit={handleSubmit}>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {form.type === "article" ? (
                            <ArticleOutlinedIcon color="primary" />
                        ) : (
                            <VideoLibraryOutlinedIcon color="primary" />
                        )}

                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                {isEditing
                                    ? t("editTitle")
                                    : t("addTitle")}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                {t("subtitle")}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        {error && (
                            <Alert severity="error">
                                {error}
                            </Alert>
                        )}

                        <FormControl fullWidth>
                            <InputLabel id="knowledge-type-label">
                                {t("contentType")}
                            </InputLabel>

                            <Select
                                labelId="knowledge-type-label"
                                value={form.type}
                                label={t("contentType")}
                                disabled={loading}
                                onChange={(event) =>
                                    handleTypeChange(event.target.value)
                                }
                            >
                                <MenuItem value="article">
                                    {t("article")}
                                </MenuItem>

                                <MenuItem value="video">
                                    {t("youtubeVideo")}
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label={t("title")}
                            value={form.title}
                            onChange={(event) =>
                                updateField("title", event.target.value)
                            }
                            required
                            fullWidth
                            inputProps={{ maxLength: 200 }}
                        />

                        <TextField
                            label={t("description")}
                            value={form.description}
                            onChange={(event) =>
                                updateField("description", event.target.value)
                            }
                            multiline
                            minRows={3}
                            maxRows={7}
                            fullWidth
                            inputProps={{ maxLength: 3000 }}
                            helperText={t("characterCount", {
                                count: form.description.length,
                                max: 3000,
                            })}
                        />

                        {form.type === "article" ? (
                            <>
                                <TextField
                                    label={t("sourceUrl")}
                                    type="url"
                                    value={form.sourceUrl}
                                    onChange={(event) =>
                                        updateField("sourceUrl", event.target.value)
                                    }
                                    placeholder="https://example.com/article"
                                    required
                                    fullWidth
                                />

                                <TextField
                                    label={t("sourceName")}
                                    value={form.sourceName}
                                    onChange={(event) =>
                                        updateField("sourceName", event.target.value)
                                    }
                                    placeholder={t("sourceNamePlaceholder")}
                                    fullWidth
                                />

                                <Alert severity="info">
                                    {t("articleInfo")}
                                </Alert>
                            </>
                        ) : (
                            <>
                                <TextField
                                    label={t("youtubeUrl")}
                                    value={form.youtubeUrl}
                                    onChange={(event) =>
                                        updateField("youtubeUrl", event.target.value)
                                    }
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    required
                                    fullWidth
                                />

                                <TextField
                                    label={t("thumbnailUrl")}
                                    type="url"
                                    value={form.thumbnailUrl}
                                    onChange={(event) =>
                                        updateField("thumbnailUrl", event.target.value)
                                    }
                                    placeholder="https://example.com/thumbnail.jpg"
                                    fullWidth
                                    helperText={t("thumbnailHelper")}
                                />

                                {previewThumbnail && (
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 1 }}
                                        >
                                            {t("thumbnailPreview")}
                                        </Typography>

                                        <Box
                                            component="img"
                                            src={previewThumbnail}
                                            alt={t("thumbnailAlt")}
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                            }}
                                            sx={{
                                                display: "block",
                                                width: "100%",
                                                maxWidth: 420,
                                                aspectRatio: "16 / 9",
                                                objectFit: "cover",
                                                borderRadius: 2,
                                                bgcolor: "action.hover",
                                            }}
                                        />
                                    </Box>
                                )}

                                <Alert severity="info">
                                    {t("videoInfo")}
                                </Alert>
                            </>
                        )}

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                        >
                            <FormControl fullWidth>
                                <InputLabel id="knowledge-category-label">
                                    {t("category")}
                                </InputLabel>

                                <Select
                                    labelId="knowledge-category-label"
                                    value={form.category}
                                    label={t("category")}
                                    onChange={(event) =>
                                        updateField("category", event.target.value)
                                    }
                                >
                                    {categories.map((category) => (
                                        <MenuItem
                                            key={category.value}
                                            value={category.value}
                                        >
                                            {categoryT(category.key)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel id="knowledge-language-label">
                                    {t("language")}
                                </InputLabel>

                                <Select
                                    labelId="knowledge-language-label"
                                    value={form.language}
                                    label={t("language")}
                                    onChange={(event) =>
                                        updateField("language", event.target.value)
                                    }
                                >
                                    <MenuItem value="en">
                                        {t("english")}
                                    </MenuItem>
                                    <MenuItem value="fr">
                                        {t("french")}
                                    </MenuItem>
                                    <MenuItem value="ar">
                                        {t("arabic")}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <TextField
                            label={t("tags")}
                            value={form.tags}
                            onChange={(event) =>
                                updateField("tags", event.target.value)
                            }
                            placeholder={t("tagsPlaceholder")}
                            fullWidth
                            helperText={t("tagsHelper")}
                        />

                        <FormControl fullWidth>
                            <InputLabel id="knowledge-status-label">
                                {t("publicationStatus")}
                            </InputLabel>

                            <Select
                                labelId="knowledge-status-label"
                                value={form.status}
                                label={t("publicationStatus")}
                                onChange={(event) =>
                                    updateField("status", event.target.value)
                                }
                            >
                                <MenuItem value="draft">
                                    {t("draft")}
                                </MenuItem>
                                <MenuItem value="published">
                                    {t("published")}
                                </MenuItem>
                                <MenuItem value="archived">
                                    {t("archived")}
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.isFeatured}
                                    onChange={(event) =>
                                        updateField(
                                            "isFeatured",
                                            event.target.checked
                                        )
                                    }
                                />
                            }
                            label={t("featureContent")}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={onClose}
                        color="inherit"
                        disabled={loading}
                    >
                        {t("cancel")}
                    </Button>

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={
                            loading ? (
                                <CircularProgress size={17} color="inherit" />
                            ) : null
                        }
                    >
                        {loading
                            ? t("saving")
                            : isEditing
                                ? t("saveChanges")
                                : t("createContent")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}
