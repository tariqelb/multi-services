// backend/apps/main/utils/googleMapsLocation.js
//
// Shared by every service: read a Google Maps link and return { lat, lng }.

// Google Maps domains accepted by the backend.
const isAllowedGoogleMapsHost = (hostname) => {
    return (
        hostname === "maps.app.goo.gl" ||
        hostname === "goo.gl" ||
        hostname === "google.com" ||
        hostname.endsWith(".google.com") ||
        hostname === "google.co.ma" ||
        hostname.endsWith(".google.co.ma")
    );
};

// Extract latitude and longitude from a Google Maps URL.
const parseGoogleMapsCoordinates = (url) => {
    const coordinatePatterns = [
        /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
        /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
        /\/maps\/(?:search|place)\/(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/i,
        /\/maps\/dir\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of coordinatePatterns) {
        const match = url.match(pattern);

        if (match) {
            return {
                lat: Number(match[1]),
                lng: Number(match[2]),
            };
        }
    }

    try {
        const parsedUrl = new URL(url);

        const parameters = [
            "q",
            "query",
            "ll",
            "center",
            "destination",
            "daddr",
        ];

        for (const parameter of parameters) {
            const value = parsedUrl.searchParams.get(parameter);

            if (!value) continue;

            const match = value.match(
                /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/
            );

            if (match) {
                return {
                    lat: Number(match[1]),
                    lng: Number(match[2]),
                };
            }
        }
    } catch {
        return null;
    }

    return null;
};

// Resolve Google Maps redirects and extract coordinates.
export const extractGoogleMapsLocation = async (mapLink) => {
    let currentUrl;

    try {
        currentUrl = new URL(mapLink);
    } catch {
        throw new Error("Invalid Google Maps URL.");
    }

    if (
        !["http:", "https:"].includes(currentUrl.protocol) ||
        !isAllowedGoogleMapsHost(currentUrl.hostname)
    ) {
        throw new Error("Please provide a valid Google Maps link.");
    }

    // A link that already holds coordinates (e.g. https://www.google.com/maps?q=lat,lng
    // from the form's map picker) is read directly, with no request to Google.
    let finalUrl = parseGoogleMapsCoordinates(currentUrl.toString())
        ? currentUrl.toString()
        : "";

    for (let attempt = 0; !finalUrl && attempt < 10; attempt++) {
        if (!isAllowedGoogleMapsHost(currentUrl.hostname)) {
            throw new Error(
                "The Google Maps link redirected to an invalid domain."
            );
        }

        const response = await fetch(currentUrl.toString(), {
            method: "GET",
            redirect: "manual",
            signal: AbortSignal.timeout(15000),
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; LocationResolver/1.0)",
                Accept: "text/html,application/xhtml+xml",
            },
        });

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const redirectLocation = response.headers.get("location");

            await response.body?.cancel();

            if (!redirectLocation) {
                throw new Error("Google Maps returned an invalid redirect.");
            }

            currentUrl = new URL(redirectLocation, currentUrl);
            continue;
        }

        if (!response.ok) {
            await response.body?.cancel();

            throw new Error(
                `Google Maps could not resolve the link (HTTP ${response.status}).`
            );
        }

        finalUrl = response.url || currentUrl.toString();

        await response.body?.cancel();
        break;
    }

    if (!finalUrl) {
        throw new Error("Too many Google Maps redirects.");
    }

    const coordinates = parseGoogleMapsCoordinates(finalUrl);

    if (!coordinates) {
        throw new Error(
            "Could not extract coordinates from this Google Maps link. Please use a link pointing to a specific location."
        );
    }

    const { lat, lng } = coordinates;

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < 20 ||
        lat > 36 ||
        lng < -18 ||
        lng > -0.5
    ) {
        throw new Error("The selected location must be within Morocco.");
    }

    return { lat, lng };
};