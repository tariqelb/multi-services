
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { CirclePlay } from "lucide-react";
import StarIcon from "@mui/icons-material/Star";

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

const localeMap = {
    en: "en-GB",
    fr: "fr-FR",
    ar: "ar-MA",
};

const isSafeHttpUrl = (value) => {
    try {
        const url = new URL(value);

        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

const formatDate = (date, locale = "en-GB") => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(parsedDate);
};

function RelatedContentCard({ item, onClick, t }) {
    const thumbnail =
        item.thumbnailUrl ||
        (item.type === "video" && item.youtubeVideoId
            ? `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`
            : "");

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
                transition: "transform 0.2s",
                "&:hover": {
                    transform: "translateY(-3px)",
                },
            }}
        >
            <CardActionArea
                onClick={onClick}
                sx={{ height: "100%" }}
            >
                {thumbnail ? (
                    <Box
                        component="img"
                        src={thumbnail}
                        alt={item.title}
                        sx={{
                            display: "block",
                            width: "100%",
                            aspectRatio: "16 / 9",
                            objectFit: "cover",
                            bgcolor: "action.hover",
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            aspectRatio: "16 / 9",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "action.hover",
                        }}
                    >
                        {item.type === "video" ? (
                            <VideoLibraryOutlinedIcon
                                sx={{ fontSize: 48 }}
                            />
                        ) : (
                            <ArticleOutlinedIcon
                                sx={{ fontSize: 48 }}
                            />
                        )}
                    </Box>
                )}

                <CardContent>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            overflowWrap: "anywhere",
                            mb: 1,
                        }}
                    >
                        {item.title}
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                    >
                        <Chip
                            size="small"
                            label={
                                item.type === "video"
                                    ? t("video")
                                    : t("article")
                            }
                        />

                        {item.category && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {categoryKey
                                    ? t(`categories.${categoryKey}`)
                                    : item.category}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

export default function KnowledgeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { t: translate, i18n } = useTranslation();

    const t = (key, options) =>
        translate(`knowledgeCenter.${key}`, options);

    const currentLanguage =
        i18n.resolvedLanguage?.split("-")[0] ||
        i18n.language?.split("-")[0] ||
        "en";

    const locale = localeMap[currentLanguage] || "en-GB";

    const [item, setItem] = useState(null);
    const [relatedItems, setRelatedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadDetails = async () => {
            try {
                setLoading(true);
                setError("");
                setItem(null);
                setRelatedItems([]);

                const response = await axiosInstance.get(
                    `/knowledge/${id}`
                );

                if (!active) return;

                setItem(response.data?.item || null);
                setRelatedItems(response.data?.relatedItems || []);
            } catch (requestError) {
                console.error(
                    "Knowledge details loading error:",
                    requestError
                );

                if (!active) return;

                setError(
                    requestError.response?.data?.message ||
                    t("detailsLoadError")
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadDetails();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <PageLayout
                title={t("title")}
                icon={<MenuBookOutlinedIcon color="primary" />}
            >
                <Stack
                    alignItems="center"
                    spacing={2}
                    sx={{ py: 10 }}
                >
                    <CircularProgress />

                    <Typography color="text.secondary">
                        {t("loading")}
                    </Typography>
                </Stack>
            </PageLayout>
        );
    }

    if (error || !item) {
        return (
            <PageLayout
                title={t("title")}
                icon={<MenuBookOutlinedIcon color="primary" />}
            >
                <Stack spacing={2}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/knowledge")}
                        sx={{ alignSelf: "flex-start" }}
                    >
                        {t("backToKnowledge")}
                    </Button>

                    <Alert severity="error">
                        {error || t("contentNotFound")}
                    </Alert>
                </Stack>
            </PageLayout>
        );
    }

    const safeSourceUrl =
        item.type === "article" && isSafeHttpUrl(item.sourceUrl)
            ? item.sourceUrl
            : "";

    const videoId =
        item.type === "video" &&
        /^[a-zA-Z0-9_-]{11}$/.test(item.youtubeVideoId || "")
            ? item.youtubeVideoId
            : "";

    const categoryKey = categories.find(
        (category) => category.value === item.category
    )?.key;

    return (
        <PageLayout
            title={t("title")}
            subtitle={t("detailsSubtitle")}
            icon={<MenuBookOutlinedIcon color="primary" />}
            action={
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/knowledge")}
                    variant="outlined"
                >
                    {t("back")}
                </Button>
            }
        >
            <Stack spacing={3}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 3,
                    }}
                >
                    <Stack spacing={2.5}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                        >
                            <Chip
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
                                    label={
                                        categoryKey
                                            ? t(`categories.${categoryKey}`)
                                            : item.category
                                    }
                                    color="primary"
                                    variant="outlined"
                                />
                            )}

                            <Chip
                                label={item.language?.toUpperCase()}
                                variant="outlined"
                            />

                            {item.isFeatured && (
                                <Chip
                                    icon={<StarIcon />}
                                    label={t("featured")}
                                    color="warning"
                                />
                            )}
                        </Stack>

                        <Typography
                            variant="h4"
                            component="h1"
                            fontWeight={700}
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {item.title}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {formatDate(item.publishedAt, locale)}
                        </Typography>

                        {item.type === "video" ? (
                            videoId ? (
                                <Box
                                    sx={{
                                        width: "100%",
                                        maxWidth: 1000,
                                        mx: "auto",
                                        aspectRatio: "16 / 9",
                                        overflow: "hidden",
                                        borderRadius: 3,
                                        bgcolor: "black",
                                    }}
                                >
                                    <Box
                                        component="iframe"
                                        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                                        title={item.title}
                                        loading="lazy"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            border: 0,
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Alert severity="warning">
                                    {t("invalidVideo")}
                                </Alert>
                            )
                        ) : (
                            <Box
                                sx={{
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 2,
                                    bgcolor: "action.hover",
                                }}
                            >
                                <Stack spacing={1.5}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                    >
                                        {t("originalArticle")}
                                    </Typography>

                                    <Typography color="text.secondary">
                                        {item.sourceName
                                            ? t("publishedBy", {
                                                  source: item.sourceName,
                                              })
                                            : t("originalWebsite")}
                                    </Typography>

                                    {safeSourceUrl ? (
                                        <Button
                                            component="a"
                                            href={safeSourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="contained"
                                            endIcon={<OpenInNewIcon />}
                                            sx={{ alignSelf: "flex-start" }}
                                        >
                                            {t("readOriginalArticle")}
                                        </Button>
                                    ) : (
                                        <Alert severity="warning">
                                            {t("sourceUnavailable")}
                                        </Alert>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {item.description && (
                            <Box>
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{ mb: 1 }}
                                >
                                    {t(
                                        item.type === "video"
                                            ? "aboutVideo"
                                            : "aboutArticle"
                                    )}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    sx={{
                                        whiteSpace: "pre-line",
                                        overflowWrap: "anywhere",
                                        lineHeight: 1.8,
                                    }}
                                >
                                    {item.description}
                                </Typography>
                            </Box>
                        )}

                        {item.tags?.length > 0 && (
                            <Stack spacing={1}>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                >
                                    {t("relatedKeywords")}
                                </Typography>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    useFlexGap
                                >
                                    {item.tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Paper>

                <Alert severity="info">
                    {t("detailsDisclaimer")}
                </Alert>

                {relatedItems.length > 0 && (
                    <Box>
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                        >
                            {t("relatedContent")}
                        </Typography>

                        <Grid container spacing={2.5}>
                            {relatedItems.map((relatedItem) => (
                                <Grid
                                    key={relatedItem._id}
                                    size={{ xs: 12, sm: 6, lg: 3 }}
                                >
                                    <RelatedContentCard
                                        item={relatedItem}
                                        t={t}
                                        onClick={() =>
                                            navigate(
                                                `/knowledge/${relatedItem._id}`
                                            )
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Stack>
        </PageLayout>
    );
}
