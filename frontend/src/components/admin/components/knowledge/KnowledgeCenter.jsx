
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../../api/axiosInstance";
import PageLayout from "../PageLayout";

import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    MenuItem,
    Pagination,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";

import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import StarIcon from "@mui/icons-material/Star";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { CirclePlay } from "lucide-react";

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

const PAGE_SIZE = 9;

const localeMap = {
    en: "en-GB",
    fr: "fr-FR",
    ar: "ar-MA",
};

const getThumbnail = (item) => {
    if (item.thumbnailUrl) return item.thumbnailUrl;

    if (item.type === "video" && item.youtubeVideoId) {
        return `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`;
    }

    return "";
};

const formatDate = (date, locale = "en-GB") => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(parsedDate);
};

function KnowledgeCard({ item, onClick, t, locale }) {
    const [imageFailed, setImageFailed] = useState(false);

    const thumbnail = getThumbnail(item);

    const categoryKey = categories.find(
        (category) => category.value === item.category
    )?.key;

    return (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                borderRadius: 3,
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 3,
                },
            }}
        >
            <CardActionArea
                onClick={onClick}
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                }}
            >
                {thumbnail && !imageFailed ? (
                    <CardMedia
                        component="img"
                        image={thumbnail}
                        alt={item.title}
                        onError={() => setImageFailed(true)}
                        sx={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            objectFit: "cover",
                            bgcolor: "action.hover",
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "action.hover",
                        }}
                    >
                        {item.type === "video" ? (
                            <VideoLibraryOutlinedIcon
                                sx={{
                                    fontSize: 58,
                                    color: "text.secondary",
                                }}
                            />
                        ) : (
                            <ArticleOutlinedIcon
                                sx={{
                                    fontSize: 58,
                                    color: "text.secondary",
                                }}
                            />
                        )}
                    </Box>
                )}

                <CardContent sx={{ width: "100%", flexGrow: 1 }}>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ mb: 1 }}
                    >
                        <Chip
                            size="small"
                            icon={
                                item.type === "video" ? (
                                    <CirclePlay size={20} />
                                ) : (
                                    <ArticleOutlinedIcon />
                                )
                            }
                            label={
                                item.type === "video"
                                    ? t("video")
                                    : t("article")
                            }
                            variant="outlined"
                        />

                        {item.category && (
                            <Chip
                                size="small"
                                label={
                                    categoryKey
                                        ? t(`categories.${categoryKey}`)
                                        : item.category
                                }
                                color="primary"
                                variant="outlined"
                            />
                        )}

                        {item.isFeatured && (
                            <Chip
                                size="small"
                                icon={<StarIcon />}
                                label={t("featured")}
                                color="warning"
                            />
                        )}
                    </Stack>

                    <Typography
                        variant="h6"
                        component="h2"
                        fontWeight={700}
                        sx={{
                            mb: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            overflowWrap: "anywhere",
                            minHeight: "3.5rem",
                        }}
                    >
                        {item.title}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: "3.75rem",
                            overflowWrap: "anywhere",
                        }}
                    >
                        {item.description || t("descriptionFallback")}
                    </Typography>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 2 }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {item.language?.toUpperCase()}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            {formatDate(item.publishedAt, locale)}
                        </Typography>
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

export default function KnowledgeCenter() {
    const navigate = useNavigate();

    const { t: translate, i18n } = useTranslation();

    const t = (key, options) =>
        translate(`knowledgeCenter.${key}`, options);

    const currentLanguage =
        i18n.resolvedLanguage?.split("-")[0] ||
        i18n.language?.split("-")[0] ||
        "en";

    const locale = localeMap[currentLanguage] || "en-GB";

    const [activeTab, setActiveTab] = useState("article");

    const [items, setItems] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

    const [searchInput, setSearchInput] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");

    const [category, setCategory] = useState("");
    const [language, setLanguage] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const [loading, setLoading] = useState(true);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [error, setError] = useState("");

    const searchRequestRef = useRef(0);

    const loadContent = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                type: activeTab,
                page,
                limit: PAGE_SIZE,
            };

            if (category) params.category = category;
            if (language) params.language = language;

            let response;

            if (submittedSearch.trim()) {
                response = await axiosInstance.get("/knowledge/search", {
                    params: {
                        ...params,
                        q: submittedSearch.trim(),
                    },
                });
            } else {
                response = await axiosInstance.get("/knowledge", {
                    params,
                });
            }

            setItems(response.data?.items || []);
            setTotalPages(response.data?.pagination?.totalPages || 0);
            setTotalItems(response.data?.pagination?.total || 0);
        } catch (requestError) {
            console.error("Knowledge Center loading error:", requestError);

            setError(
                requestError.response?.data?.message ||
                    t("loadError")
            );

            setItems([]);
            setTotalPages(0);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [
        activeTab,
        page,
        category,
        language,
        submittedSearch,
        currentLanguage,
    ]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    // Suggestions are retrieved only from published content in our database.
    useEffect(() => {
        const query = searchInput.trim();

        if (query.length < 2) {
            searchRequestRef.current += 1;
            setSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }

        const requestId = ++searchRequestRef.current;

        const timeoutId = setTimeout(async () => {
            try {
                setSuggestionsLoading(true);

                const response = await axiosInstance.get(
                    "/knowledge/search",
                    {
                        params: {
                            q: query,
                            type: activeTab,
                            category: category || undefined,
                            language: language || undefined,
                            page: 1,
                            limit: 6,
                        },
                    }
                );

                if (requestId === searchRequestRef.current) {
                    setSuggestions(response.data?.items || []);
                }
            } catch (requestError) {
                console.error(
                    "Knowledge search suggestions error:",
                    requestError
                );

                if (requestId === searchRequestRef.current) {
                    setSuggestions([]);
                }
            } finally {
                if (requestId === searchRequestRef.current) {
                    setSuggestionsLoading(false);
                }
            }
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [searchInput, activeTab, category, language]);

    const handleSearchSubmit = () => {
        setSubmittedSearch(searchInput.trim());
        setPage(1);
        setSuggestions([]);
    };

    const handleSuggestionSelect = (selectedItem) => {
        if (!selectedItem?._id) return;

        setSearchInput(selectedItem.title || "");
        setSuggestions([]);
        navigate(`/knowledge/${selectedItem._id}`);
    };

    const handleTabChange = (_, nextTab) => {
        setActiveTab(nextTab);
        setPage(1);
        setSubmittedSearch("");
        setSearchInput("");
        setSuggestions([]);
    };

    const clearFilters = () => {
        setCategory("");
        setLanguage("");
        setPage(1);
        setSubmittedSearch("");
        setSearchInput("");
        setSuggestions([]);
    };

    return (
        <PageLayout
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<MenuBookOutlinedIcon color="primary" />}
        >
            <Stack spacing={3}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 3,
                    }}
                >
                    <Stack spacing={2}>
                        <Typography variant="h6" fontWeight={700}>
                            {t("searchHeading")}
                        </Typography>

                        {/* Search */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems="flex-start"
                        >
                            <Box
                                sx={{
                                    flex: 1,
                                    width: "100%",
                                    minWidth: 0,
                                    position: "relative",
                                }}
                            >
                                <TextField
                                    fullWidth
                                    value={searchInput}
                                    placeholder={t("searchPlaceholder")}
                                    onChange={(event) => {
                                        setSearchInput(event.target.value);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            handleSearchSubmit();
                                        }

                                        if (event.key === "Escape") {
                                            setSuggestions([]);
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchOutlinedIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: suggestionsLoading ? (
                                            <InputAdornment position="end">
                                                <CircularProgress size={18} />
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />

                                {/* Search suggestions */}
                                {suggestions.length > 0 && (
                                    <Paper
                                        elevation={6}
                                        sx={{
                                            position: "absolute",
                                            top: "calc(100% + 5px)",
                                            left: 0,
                                            right: 0,
                                            zIndex: 1300,
                                            maxHeight: 320,
                                            overflowY: "auto",
                                            borderRadius: 2,
                                        }}
                                    >
                                        <List disablePadding>
                                            {suggestions.map((item, index) => (
                                                <Box key={item._id}>
                                                    <ListItemButton
                                                        onClick={() =>
                                                            handleSuggestionSelect(item)
                                                        }
                                                        sx={{
                                                            py: 1.25,
                                                            px: 2,
                                                        }}
                                                    >
                                                        {item.type === "video" ? (
                                                            <VideoLibraryOutlinedIcon
                                                                color="action"
                                                                sx={{ mr: 1.5 }}
                                                            />
                                                        ) : (
                                                            <ArticleOutlinedIcon
                                                                color="action"
                                                                sx={{ mr: 1.5 }}
                                                            />
                                                        )}

                                                        <ListItemText
                                                            primary={item.title}
                                                            secondary={`${item.category || ""} · ${
                                                                item.language?.toUpperCase() || ""
                                                            }`}
                                                            primaryTypographyProps={{
                                                                fontWeight: 600,
                                                                noWrap: true,
                                                            }}
                                                            secondaryTypographyProps={{
                                                                variant: "caption",
                                                            }}
                                                        />
                                                    </ListItemButton>

                                                    {index !== suggestions.length - 1 && (
                                                        <Divider />
                                                    )}
                                                </Box>
                                            ))}
                                        </List>
                                    </Paper>
                                )}

                                {searchInput.trim().length >= 2 &&
                                    !suggestionsLoading &&
                                    suggestions.length === 0 && (
                                        <Paper
                                            elevation={2}
                                            sx={{
                                                position: "absolute",
                                                top: "calc(100% + 5px)",
                                                left: 0,
                                                right: 0,
                                                zIndex: 1300,
                                                p: 2,
                                                borderRadius: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {t("noMatchingContent")}
                                            </Typography>
                                        </Paper>
                                    )}
                            </Box>

                            <Button
                                variant="contained"
                                onClick={handleSearchSubmit}
                                sx={{
                                    minWidth: { xs: "100%", sm: 120 },
                                    minHeight: 56,
                                }}
                            >
                                {t("search")}
                            </Button>
                        </Stack>

                        {/* Filters */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                        >
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label={t("category")}
                                value={category}
                                onChange={(event) => {
                                    setCategory(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <MenuItem value="">
                                    {t("allCategories")}
                                </MenuItem>

                                {categories.map((item) => (
                                    <MenuItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {t(`categories.${item.key}`)}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                fullWidth
                                size="small"
                                label={t("language")}
                                value={language}
                                onChange={(event) => {
                                    setLanguage(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <MenuItem value="">
                                    {t("allLanguages")}
                                </MenuItem>
                                <MenuItem value="en">
                                    {t("english")}
                                </MenuItem>
                                <MenuItem value="fr">
                                    {t("french")}
                                </MenuItem>
                                <MenuItem value="ar">
                                    {t("arabic")}
                                </MenuItem>
                            </TextField>

                            <Button
                                color="inherit"
                                onClick={clearFilters}
                                sx={{ minWidth: 120 }}
                            >
                                {t("clearFilters")}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Content tabs */}
                <Box>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            borderBottom: 1,
                            borderColor: "divider",
                        }}
                    >
                        <Tab
                            value="article"
                            icon={<MenuBookOutlinedIcon />}
                            iconPosition="start"
                            label={t("articles")}
                        />

                        <Tab
                            value="video"
                            icon={<VideoLibraryOutlinedIcon />}
                            iconPosition="start"
                            label={t("videos")}
                        />
                    </Tabs>
                </Box>

                {/* Search information */}
                {submittedSearch && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        flexWrap="wrap"
                        spacing={1}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {t("searchResultsFor")}
                        </Typography>

                        <Chip
                            label={submittedSearch}
                            onDelete={() => {
                                setSearchInput("");
                                setSubmittedSearch("");
                                setPage(1);
                            }}
                        />

                        <Typography variant="body2" color="text.secondary">
                            {t("results", { count: totalItems })}
                        </Typography>
                    </Stack>
                )}

                {error && <Alert severity="error">{error}</Alert>}

                {/* Content list */}
                {loading ? (
                    <Stack alignItems="center" spacing={1} sx={{ py: 8 }}>
                        <CircularProgress />

                        <Typography variant="body2" color="text.secondary">
                            {t("loading")}
                        </Typography>
                    </Stack>
                ) : items.length === 0 ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            py: 8,
                            px: 2,
                            textAlign: "center",
                            borderRadius: 3,
                        }}
                    >
                        {activeTab === "article" ? (
                            <MenuBookOutlinedIcon
                                sx={{
                                    fontSize: 48,
                                    color: "text.secondary",
                                    mb: 1,
                                }}
                            />
                        ) : (
                            <VideoLibraryOutlinedIcon
                                sx={{
                                    fontSize: 48,
                                    color: "text.secondary",
                                    mb: 1,
                                }}
                            />
                        )}

                        <Typography variant="h6" fontWeight={700}>
                            {activeTab === "article"
                                ? t("noArticles")
                                : t("noVideos")}
                        </Typography>

                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            {t("emptyHint")}
                        </Typography>
                    </Paper>
                ) : (
                    <>
                        <Grid container spacing={2.5}>
                            {items.map((item) => (
                                <Grid
                                    key={item._id}
                                    size={{ xs: 12, sm: 6, lg: 4 }}
                                >
                                    <KnowledgeCard
                                        item={item}
                                        t={t}
                                        locale={locale}
                                        onClick={() =>
                                            navigate(`/knowledge/${item._id}`)
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {totalPages > 1 && (
                            <Stack alignItems="center" sx={{ pt: 2 }}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    color="primary"
                                    onChange={(_, nextPage) =>
                                        setPage(nextPage)
                                    }
                                />
                            </Stack>
                        )}
                    </>
                )}

                <Alert severity="info" icon={<MenuBookOutlinedIcon />}>
                    {t("disclaimer")}
                </Alert>
            </Stack>
        </PageLayout>
    );
}
