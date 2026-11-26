import dns from "node:dns/promises";
import net from "node:net";

const ALLOWED_PROTOCOLS = new Set([
    "http:",
    "https:",
]);

function isPrivateIPv4(ip) {
    const parts = ip.split(".").map(Number);

    if (
        parts.length !== 4 ||
        parts.some(
            (part) =>
                !Number.isInteger(part) ||
                part < 0 ||
                part > 255
        )
    ) {
        return true;
    }

    const [a, b] = parts;

    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a >= 224 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 198 && (b === 18 || b === 19))
    );
}

function isPrivateIPv6(ip) {
    const normalized = ip.toLowerCase();

    return (
        normalized === "::" ||
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        /^fe[89ab]/.test(normalized) ||
        normalized.startsWith("::ffff:")
    );
}

function isPrivateAddress(address) {
    const family = net.isIP(address);

    if (family === 4) {
        return isPrivateIPv4(address);
    }

    if (family === 6) {
        return isPrivateIPv6(address);
    }

    return true;
}

export async function validateExternalUrl(
    input,
    allowedHosts = []
) {
    let url;

    try {
        url = new URL(input);
    } catch {
        throw new Error("Invalid URL.");
    }

    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
        throw new Error(
            "Only HTTP and HTTPS URLs are supported."
        );
    }

    if (url.username || url.password) {
        throw new Error(
            "URLs containing credentials are not allowed."
        );
    }

    const hostname = url.hostname
        .toLowerCase()
        .replace(/^\[|\]$/g, "");

    if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal")
    ) {
        throw new Error(
            "Private or local destinations are not allowed."
        );
    }

    // For a source-specific parser, restrict requests
    // to the configured source hosts.
    if (
        allowedHosts.length > 0 &&
        !allowedHosts.includes(hostname)
    ) {
        throw new Error(
            "This website is not an approved source."
        );
    }

    if (net.isIP(hostname)) {
        if (isPrivateAddress(hostname)) {
            throw new Error(
                "Private IP destinations are not allowed."
            );
        }
    } else {
        const addresses = await dns.lookup(
            hostname,
            { all: true, verbatim: true }
        );

        if (!addresses.length) {
            throw new Error(
                "The hostname could not be resolved."
            );
        }

        if (
            addresses.some(({ address }) =>
                isPrivateAddress(address)
            )
        ) {
            throw new Error(
                "The hostname resolves to a private address."
            );
        }
    }

    return url;
}