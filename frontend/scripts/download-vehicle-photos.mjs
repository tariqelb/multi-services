// scripts/download-vehicle-photos.mjs
// Downloads the free Unsplash photos of the vehicle / moto categories into
// src/assets/vehicles/<name>.jpg, so the app serves them itself instead of
// loading them from Unsplash. Run once (needs internet):
//
//   npm run vehicle-photos            (existing files are kept)
//   npm run vehicle-photos -- --force (download them all again)
//
// The list of photos is in src/Apps/vehicles/vehiclePhotos.js.

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "src", "assets", "vehicles");
const force = process.argv.includes("--force");

// Read the sources from vehiclePhotos.js (it uses import.meta.glob, which
// only works inside Vite, so the object is parsed instead of imported).
const code = await readFile(join(root, "src", "Apps", "vehicles", "vehiclePhotos.js"), "utf8");
const sources = [...code.matchAll(/"?([\w-]+)"?:\s*\{\s*id:\s*"([^"]+)",\s*image:\s*"([^"]+)"/g)].map(([, name, id, image]) => ({ name, id, image }));
const extra = [{ name: "motos-banner", from: "all-motos", width: 1600, height: 640 }];

const exists = (file) => stat(file).then(() => true, () => false);

async function download(url) {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
    return Buffer.from(await response.arrayBuffer());
}

async function save({ name, id, image }, width = 640, height = 440) {
    const file = join(target, `${name}.jpg`);
    if (!force && (await exists(file))) return console.log(`  = ${name}.jpg (already there)`);
    const urls = [
        `${image}?w=${width}&h=${height}&fit=crop&fm=jpg&q=80`,
        // Official Unsplash download link, if the image address changed.
        `https://unsplash.com/photos/${id}/download?force=true&w=${width}`,
    ];
    const errors = [];
    for (const url of urls) {
        try {
            await writeFile(file, await download(url));
            return console.log(`  ✓ ${name}.jpg`);
        } catch (error) {
            errors.push(error.message);
        }
    }
    console.log(`  ✗ ${name}: not downloaded (${errors.join(" / ")}); the app will use the Unsplash photo or the icon`);
}

await mkdir(target, { recursive: true });
console.log(`Downloading ${sources.length + extra.length} photos into src/assets/vehicles`);
for (const source of sources) await save(source);
for (const { name, from, width, height } of extra) {
    const source = sources.find((item) => item.name === from);
    if (source) await save({ ...source, name }, width, height);
}
console.log("Done. Restart `npm run dev` (or build) to use them.");
