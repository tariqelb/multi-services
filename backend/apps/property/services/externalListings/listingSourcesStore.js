
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// import {
//     getSourceConfig,
//     registerSupportedSource,
//     supportsExternalListingUrl,
// } from "./sources/externalListingSource.js";

import {
    getSourceConfig,
    inspectListingUrl,
    registerSupportedSource,
} from "./sources/externalListingSource.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const SOURCES_FILE = path.resolve(
    currentDirectory,
    "../../data/externalListingSources.json"
);

async function ensureSourcesFile() {
    await fs.mkdir(path.dirname(SOURCES_FILE), {
        recursive: true,
    });

    try {
        await fs.access(SOURCES_FILE);
    } catch {
        await fs.writeFile(
            SOURCES_FILE,
            JSON.stringify({ urls: [] }, null, 2) + "\n",
            "utf8"
        );
    }
}

async function readSourcesFile() {
    await ensureSourcesFile();

    const content = await fs.readFile(SOURCES_FILE, "utf8");
    const data = JSON.parse(content);

    return Array.isArray(data.urls) ? data.urls : [];
}

async function writeSourcesFile(urls) {
    await ensureSourcesFile();

    await fs.writeFile(
        SOURCES_FILE,
        JSON.stringify(
            { urls: [...new Set(urls)] },
            null,
            2
        ) + "\n",
        "utf8"
    );
}

export async function getListingSourceUrls() {
    const urls = await readSourcesFile();

    return [
        ...new Set(
            urls
                .filter((url) => typeof url === "string")
                .map((url) => url.trim())
                .filter(Boolean)
        ),
    ];
}
export async function addListingSourceUrl(inputUrl) {
    const inspected = inspectListingUrl(inputUrl);

    if (!inspected) {
        throw new Error(
            "Please provide a valid HTTPS listing URL."
        );
    }

    // Check whether this website is already registered.
    let source = getSourceConfig(inspected.normalizedUrl);

    // Automatically register previously unknown websites.
    if (!source) {
        await registerSupportedSource(inspected.normalizedUrl);
        source = getSourceConfig(inspected.normalizedUrl);
    }

    if (!source) {
        throw new Error(
            "Could not register this listing website."
        );
    }

    const urls = await readSourcesFile();

    const existingUrl = urls.find(
        (item) => item === inspected.normalizedUrl
    );

    if (existingUrl) {
        return {
            url: existingUrl,
            added: false,
        };
    }

    urls.push(inspected.normalizedUrl);
    await writeSourcesFile(urls);

    return {
        url: inspected.normalizedUrl,
        added: true,
        sourceName: source.sourceName,
    };
}

export async function removeListingSourceUrl(inputUrl) {
    if (typeof inputUrl !== "string") {
        return false;
    }

    const urls = await readSourcesFile();

    const remaining = urls.filter(
        (url) => url !== inputUrl
    );

    if (remaining.length === urls.length) {
        return false;
    }

    await writeSourcesFile(remaining);

    return true;
}
