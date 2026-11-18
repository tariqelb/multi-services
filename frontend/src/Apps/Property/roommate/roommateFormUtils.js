
export const getAvailablePlaces = (totalPeople, currentPeople) => {
    return Math.max(
        0,
        Number(totalPeople || 0) - Number(currentPeople || 0)
    );
};

export const isValidUrl = (value) => {
    try {
        const url = new URL(value);

        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

export const isValidYouTubeUrl = (value) => {
    try {
        const url = new URL(value.trim());

        const hostname = url.hostname
            .toLowerCase()
            .replace(/^www\./, "");

        let videoId = "";

        if (!["http:", "https:"].includes(url.protocol)) {
            return false;
        }

        if (hostname === "youtu.be") {
            videoId = url.pathname.slice(1).split("/")[0];
        } else if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com" ||
            hostname === "youtube-nocookie.com"
        ) {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v") || "";
            } else if (
                url.pathname.startsWith("/embed/") ||
                url.pathname.startsWith("/shorts/")
            ) {
                videoId = url.pathname.split("/")[2] || "";
            }
        }

        return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
    } catch {
        return false;
    }
};
