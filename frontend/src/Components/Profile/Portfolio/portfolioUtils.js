// src/Components/Profile/Portfolio/portfolioUtils.js
//
// Portfolio of a profile (articles and YouTube videos). Property and vehicles
// each have their own: pass their API base ("/property/portfolio" or
// "/vehicles/portfolio") to the components.

export const PORTFOLIO_MAX_ITEMS = 20;
export const PORTFOLIO_MAX_IMAGES = 4;
export const TITLE_MAX = 120;
export const ARTICLE_TEXT_MAX = 5000;
export const VIDEO_TEXT_MAX = 1000;

const YOUTUBE_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com"];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Same reading as the server: watch?v=, youtu.be/, /shorts/, /embed/, /live/. */
export function parseYoutubeId(input) {
    let value = String(input || "").trim();
    if (!value || value.length > 300) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;
    let url;
    try {
        url = new URL(value);
    } catch {
        return "";
    }
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))) return "";
    let id = "";
    if (host === "youtu.be" || host.endsWith(".youtu.be")) id = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (url.searchParams.get("v")) id = url.searchParams.get("v");
    else {
        const [section, candidate] = url.pathname.split("/").filter(Boolean);
        if (["shorts", "embed", "live", "v"].includes(section)) id = candidate || "";
    }
    return YOUTUBE_ID.test(id) ? id : "";
}

export const youtubeThumbnail = (id) => (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
// Privacy-enhanced player: no YouTube cookies until the visitor presses play.
export const youtubeEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;

/** Cover picture of an item. */
export const coverOf = (item) => (item?.type === "video" ? item.thumbnail || youtubeThumbnail(item.youtubeId) : item?.images?.[0]?.path || "");
