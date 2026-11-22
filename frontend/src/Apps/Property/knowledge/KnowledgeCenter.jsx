
import { FilterGrid, FilterPanel, FilterSelect, filterFieldSx } from "../../../Components/ui/FilterKit";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../api/axiosInstance";
import PageLayout from "../Statistic/PageLayout";
import { DEFAULT_ARTICLE_IMAGE, getKnowledgeImage } from "./knowledgeImages";

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

    // Articles without an image (or with a broken one) get the default image.
    const thumbnail = imageFailed
        ? item.type === "article"
            ? DEFAULT_ARTICLE_IMAGE
            : ""
        : getKnowledgeImage(item);

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
                {thumbnail ? (
                    <CardMedia
                        component="img"
                        image={thumbnail}
                        alt={item.title}
                        loading="lazy"
                        onError={() => {
                            if (thumbnail !== DEFAULT_ARTICLE_IMAGE) setImageFailed(true);
                        }}
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
                        sx={{ alignItems: "center", flexWrap: "wrap", mb: 1 }}
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
                        sx={{ fontWeight: 700,
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
                        sx={{ color: "text.secondary",
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
                        spacing={1}
                        sx={{ justifyContent: "space-between", alignItems: "center", mt: 2 }}
                    >
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {item.language?.toUpperCase()}
                        </Typography>

                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
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

    const [activeTab, setActiveTab] = useState("video");

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
                <FilterPanel
                    title={t("searchHeading")}
                    activeCount={(category ? 1 : 0) + (language ? 1 : 0) + (submittedSearch ? 1 : 0)}
                    onClear={clearFilters}
                    clearLabel={t("clearFilters")}
                    sx={{ mb: 0 }}
                >
                        {/* Search */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1} sx={{ alignItems: "flex-start" }}
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
                                    size="small"
                                    sx={filterFieldSx}
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
                                    slotProps={{
                                        input: {
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
                                        },
                                    }}
                                />

                                {/* Search suggestions */}
                                {suggestions.length > 0 && (
                                    <Paper
                                        elevation={6}
                                        sx={{
                                            position: "absolute",
                                            top: "calc(100% + 5px)",
                                            insetInlineStart: 0,
                                            insetInlineEnd: 0,
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
                                                            }`} slotProps={{ primary: {
                                                                noWrap: true,
                                                                sx: { fontWeight: 600 },
                                                            }, secondary: {
                                                                variant: "caption",
                                                            } }}
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
                                                variant="body2" sx={{ color: "text.secondary" }}
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
                                    height: 40,
                                }}
                            >
                                {t("search")}
                            </Button>
                        </Stack>

                        {/* Filters */}
                        <FilterGrid>
                            <FilterSelect
                                label={t("category")}
                                value={category}
                                onChange={(value) => {
                                    setCategory(value);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "", label: t("allCategories") },
                                    ...categories.map((item) => ({ value: item.value, label: t(`categories.${item.key}`) })),
                                ]}
                            />
                            <FilterSelect
                                label={t("language")}
                                value={language}
                                onChange={(value) => {
                                    setLanguage(value);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "", label: t("allLanguages") },
                                    { value: "en", label: t("english") },
                                    { value: "fr", label: t("french") },
                                    { value: "ar", label: t("arabic") },
                                ]}
                            />
                        </FilterGrid>
                </FilterPanel>

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
                            value="video"
                            icon={<VideoLibraryOutlinedIcon />}
                            iconPosition="start"
                            label={t("videos")}
                        />

                        <Tab
                            value="article"
                            icon={<MenuBookOutlinedIcon />}
                            iconPosition="start"
                            label={t("articles")}
                        />
                    </Tabs>
                </Box>

                {/* Search information */}
                {submittedSearch && (
                    <Stack
                        direction="row"
                        spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}
                    >
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
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

                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {t("results", { count: totalItems })}
                        </Typography>
                    </Stack>
                )}

                {error && <Alert severity="error">{error}</Alert>}

                {/* Content list */}
                {loading ? (
                    <Stack spacing={1} sx={{ alignItems: "center", py: 8 }}>
                        <CircularProgress />

                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
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

                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {activeTab === "article"
                                ? t("noArticles")
                                : t("noVideos")}
                        </Typography>

                        <Typography sx={{ color: "text.secondary", mt: 1 }}>
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
                            <Stack sx={{ alignItems: "center", pt: 2 }}>
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
