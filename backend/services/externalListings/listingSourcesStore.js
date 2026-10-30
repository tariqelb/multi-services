
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supportsExternalListingUrl } from "./sources/aqariSource.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const SOURCES_FILE = path.resolve(
    currentDirectory,
    "../../data/externalListingSources.json"
);

async function readSourcesFile() {
    const content = await fs.readFile(SOURCES_FILE, "utf8");
    const data = JSON.parse(content);

    return Array.isArray(data.urls) ? data.urls : [];
}

export async function getListingSourceUrls() {
    const urls = await readSourcesFile();

    return [
        ...new Set(
            urls
                .filter((url) => typeof url === "string")
                .map((url) => url.trim())
                .filter(supportsExternalListingUrl)
        ),
    ];
}

export async function addListingSourceUrl(inputUrl) {
    if (typeof inputUrl !== "string" || !inputUrl.trim()) {
        throw new Error("A listing URL is required.");
    }

    const url = inputUrl.trim();

    if (!supportsExternalListingUrl(url)) {
        throw new Error(
            "Only supported Aqari Annonces and Mr Semsar listing URLs are allowed."
        );
    }

    const urls = await readSourcesFile();

    if (urls.includes(url)) {
        return { url, added: false };
    }

    urls.push(url);

    await fs.writeFile(
        SOURCES_FILE,
        JSON.stringify({ urls }, null, 2) + "\n",
        "utf8"
    );

    return { url, added: true };
}

export async function removeListingSourceUrl(inputUrl) {
    const urls = await readSourcesFile();
    const remaining = urls.filter((url) => url !== inputUrl);

    if (remaining.length === urls.length) {
        return false;
    }

    await fs.writeFile(
        SOURCES_FILE,
        JSON.stringify({ urls: remaining }, null, 2) + "\n",
        "utf8"
    );

    return true;
}
