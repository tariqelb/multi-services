// Images of knowledge content: own image, YouTube thumbnail, or the default
// article image.

import defaultArticleImage from "../../../assets/knowledge-article-default.svg";

export const DEFAULT_ARTICLE_IMAGE = defaultArticleImage;

/** Best image for an article or video ("" only for a video without any). */
export function getKnowledgeImage(item) {
    if (!item) return "";

    if (item.thumbnailUrl) return item.thumbnailUrl;

    if (item.type === "video" && item.youtubeVideoId) {
        return `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`;
    }

    return item.type === "article" ? DEFAULT_ARTICLE_IMAGE : "";
}
