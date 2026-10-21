
export default function getImageUrl(image) {
    const path = typeof image === "string" ? image : image?.path;

    if (!path) return "";

    if (/^https?:\/\//i.test(path)) {
        try {
            const url = new URL(path);

            if (
                url.hostname === "localhost" ||
                url.hostname === "127.0.0.1"
            ) {
                return `${url.pathname}${url.search}${url.hash}`;
            }

            return path;
        } catch {
            return path;
        }
    }

    return path.startsWith("/") ? path : `/${path}`;
}
