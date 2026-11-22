#!/usr/bin/env node
// find-unused-files.mjs
//
// Finds files that nothing in your project uses any more, and lets you mark
// them for deletion by renaming them "name.ext.delete".
//
// Put this file in the folder that holds "backend" and "frontend", then:
//
//   node find-unused-files.mjs backend             list unused files (changes nothing)
//   node find-unused-files.mjs frontend
//
//   node find-unused-files.mjs backend --rename    rename the unused files to "*.delete"
//                                                  -> test the application
//   node find-unused-files.mjs backend --restore   something broke? rename them back
//   node find-unused-files.mjs backend --purge     all good? delete every "*.delete" file
//
// How it works: starting from the files your application really runs
// (server.js / index.html -> main.jsx, package.json scripts, config files),
// it follows every import / require / import() / CSS @import / url().
// A file never reached is unused. Imports inside comments do not count.
//
// Three groups are reported:
//   UNUSED        never reached and its name is written nowhere: safe to rename.
//   MAYBE USED    never reached by an import, but its name appears in the code
//                 (read with fs, built URL, lazy path...): check by hand,
//                 never renamed automatically.
//   MANUAL        scripts you run yourself (scripts/ folder): kept.
//
// A report is also written to "unused-files-report.txt" in the scanned folder.
// No dependency needed (Node 18+).

import fs from "node:fs";
import path from "node:path";

/* --------------------------------------------------
   Settings
-------------------------------------------------- */

const IGNORED_DIRS = new Set([
    "node_modules", ".git", "dist", "build", "coverage", ".vercel", ".next",
    "uploads", "private_uploads", "public", ".idea", ".vscode",
]);

const IGNORED_FILES = new Set([
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "vercel.json", "index.html", "unused-files-report.txt",
    "find-unused-files.mjs",
]);

const CODE_EXT = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"];
const STYLE_EXT = [".css", ".scss", ".sass", ".less"];
const DATA_EXT = [".json"];
const ASSET_EXT = [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico", ".bmp",
    ".woff", ".woff2", ".ttf", ".otf", ".eot", ".mp3", ".mp4", ".webm", ".wav", ".pdf",
];
const SCANNED_EXT = new Set([...CODE_EXT, ...STYLE_EXT, ...DATA_EXT, ...ASSET_EXT]);
const RESOLVE_EXT = [...CODE_EXT, ".json", ...STYLE_EXT];

// Root files always considered used.
const CONFIG_FILE = /^(vite|vitest|eslint|tailwind|postcss|babel|jest|prettier|webpack|rollup|svelte|nodemon)\.config\.(js|cjs|mjs|ts)$|^\.(eslintrc|prettierrc|babelrc)(\.(js|cjs|json))?$/;

// Folders of scripts you run by hand.
const MANUAL_DIRS = ["scripts"];

/* --------------------------------------------------
   Arguments
-------------------------------------------------- */

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--"));
const mode = args.includes("--rename")
    ? "rename"
    : args.includes("--restore")
      ? "restore"
      : args.includes("--purge")
        ? "purge"
        : "list";

if (!target || args.includes("--help")) {
    console.log(`Usage:
  node find-unused-files.mjs <folder>            list unused files
  node find-unused-files.mjs <folder> --rename   rename unused files to "*.delete"
  node find-unused-files.mjs <folder> --restore  rename every "*.delete" file back
  node find-unused-files.mjs <folder> --purge    delete every "*.delete" file`);
    process.exit(target ? 0 : 1);
}

const ROOT = path.resolve(target);

if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) {
    console.error(`Folder not found: ${ROOT}`);
    process.exit(1);
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");

/* --------------------------------------------------
   Walk
-------------------------------------------------- */

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".env")) continue;

        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) walk(full, out);
        } else if (entry.isFile()) {
            out.push(full);
        }
    }

    return out;
}

/* --------------------------------------------------
   restore / purge
-------------------------------------------------- */

if (mode === "restore" || mode === "purge") {
    const marked = walk(ROOT).filter((file) => file.endsWith(".delete"));

    if (!marked.length) {
        console.log('No "*.delete" files found.');
        process.exit(0);
    }

    for (const file of marked) {
        if (mode === "restore") {
            const original = file.slice(0, -".delete".length);

            if (fs.existsSync(original)) {
                console.log(`skipped (a file with the original name exists): ${rel(file)}`);
                continue;
            }

            fs.renameSync(file, original);
            console.log(`restored  ${rel(original)}`);
        } else {
            fs.unlinkSync(file);
            console.log(`deleted   ${rel(file)}`);
        }
    }

    console.log(`\n${marked.length} file(s) ${mode === "restore" ? "restored" : "deleted"}.`);
    process.exit(0);
}

/* --------------------------------------------------
   Remove comments (keeps strings, templates, regex literals)
-------------------------------------------------- */

const REGEX_BEFORE = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^"]);
const REGEX_KEYWORDS = /(?:^|[^\w$])(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

export function stripComments(source) {
    let out = "";
    let i = 0;
    const n = source.length;
    const templateDepth = []; // brace depth when entering ${ ... }
    let braceDepth = 0;
    let lastSignificant = "";

    const pushChar = (ch) => {
        out += ch;
        if (!/\s/.test(ch)) lastSignificant = ch;
    };

    const readString = (quote) => {
        out += source[i++];
        while (i < n) {
            const ch = source[i];
            out += ch;
            i += 1;
            if (ch === "\\") {
                out += source[i] ?? "";
                i += 1;
            } else if (ch === quote || ch === "\n") {
                break;
            }
        }
        lastSignificant = quote;
    };

    // Inside a template literal until ` or ${
    const readTemplate = () => {
        while (i < n) {
            const ch = source[i];
            if (ch === "\\") {
                out += ch + (source[i + 1] ?? "");
                i += 2;
            } else if (ch === "`") {
                out += ch;
                i += 1;
                lastSignificant = "`";
                return;
            } else if (ch === "$" && source[i + 1] === "{") {
                out += "${";
                i += 2;
                templateDepth.push(braceDepth);
                braceDepth += 1;
                lastSignificant = "{";
                return;
            } else {
                out += ch;
                i += 1;
            }
        }
    };

    while (i < n) {
        const ch = source[i];
        const next = source[i + 1];

        if (ch === "/" && next === "/") {
            while (i < n && source[i] !== "\n") i += 1;
            continue;
        }

        if (ch === "/" && next === "*") {
            const end = source.indexOf("*/", i + 2);
            const stop = end === -1 ? n : end + 2;
            out += source.slice(i, stop).replace(/[^\n]/g, " ");
            i = stop;
            continue;
        }

        if (ch === '"' || ch === "'") {
            readString(ch);
            continue;
        }

        if (ch === "`") {
            out += ch;
            i += 1;
            readTemplate();
            continue;
        }

        if (ch === "{") {
            braceDepth += 1;
            pushChar(ch);
            i += 1;
            continue;
        }

        if (ch === "}") {
            braceDepth -= 1;
            pushChar(ch);
            i += 1;

            if (templateDepth.length && templateDepth[templateDepth.length - 1] === braceDepth) {
                templateDepth.pop();
                readTemplate();
            }
            continue;
        }

        // Regex literal?
        if (ch === "/") {
            const before = out.replace(/\s+$/, "");
            const isRegex =
                !lastSignificant ||
                REGEX_BEFORE.has(lastSignificant) ||
                REGEX_KEYWORDS.test(before);

            if (isRegex) {
                let inClass = false;
                out += ch;
                i += 1;
                while (i < n) {
                    const c = source[i];
                    out += c;
                    i += 1;
                    if (c === "\\") {
                        out += source[i] ?? "";
                        i += 1;
                    } else if (c === "[") {
                        inClass = true;
                    } else if (c === "]") {
                        inClass = false;
                    } else if ((c === "/" && !inClass) || c === "\n") {
                        break;
                    }
                }
                lastSignificant = "/";
                continue;
            }
        }

        pushChar(ch);
        i += 1;
    }

    return out;
}

/* --------------------------------------------------
   References inside one file
-------------------------------------------------- */

function findSpecifiers(file, text) {
    const ext = path.extname(file).toLowerCase();
    const found = []; // { spec, glob? }

    if (STYLE_EXT.includes(ext)) {
        const css = text.replace(/\/\*[\s\S]*?\*\//g, " ");
        for (const m of css.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)["']?\s*\)?/g)) found.push({ spec: m[1] });
        for (const m of css.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/g)) found.push({ spec: m[1] });
        return found;
    }

    if (!CODE_EXT.includes(ext)) return found;

    const code = stripComments(text);

    const patterns = [
        /\bimport\s+(?:[\w$*{}\s,]+?\s+from\s+)?["']([^"']+)["']/g,
        /\bexport\s+(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s+from\s+["']([^"']+)["']/g,
        /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
        /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
        /\brequire\.resolve\s*\(\s*["']([^"']+)["']\s*\)/g,
        /\bnew\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g,
    ];

    for (const regex of patterns) {
        for (const m of code.matchAll(regex)) found.push({ spec: m[1] });
    }

    // import(`./pages/${name}.jsx`) -> every file of that folder
    for (const m of code.matchAll(/\b(?:import|require)\s*\(\s*`([^`]*?)\$\{[^`]*`\s*\)/g)) {
        found.push({ spec: m[1], glob: true });
    }

    // Vite: import.meta.glob("./x/*.jsx")
    for (const m of code.matchAll(/import\.meta\.glob(?:Eager)?\s*\(\s*(\[[^\]]*\]|["'][^"']+["'])/g)) {
        for (const g of m[1].matchAll(/["']([^"']+)["']/g)) {
            found.push({ spec: g[1].split("*")[0], glob: true });
        }
    }

    return found;
}

function resolveSpecifier(fromFile, spec) {
    let clean = spec.split("?")[0].split("#")[0];

    if (!clean || /^(https?:|data:|mailto:|#)/.test(clean)) return null;

    let base;

    if (clean.startsWith("./") || clean.startsWith("../")) {
        base = path.resolve(path.dirname(fromFile), clean);
    } else if (clean.startsWith("/")) {
        base = path.join(ROOT, clean); // Vite root-relative ("/src/main.jsx")
    } else if (!clean.includes("/") && STYLE_EXT.includes(path.extname(fromFile))) {
        base = path.resolve(path.dirname(fromFile), clean); // CSS url(img.png)
    } else {
        return null; // package
    }

    const candidates = [
        base,
        ...RESOLVE_EXT.map((ext) => base + ext),
        ...RESOLVE_EXT.map((ext) => path.join(base, `index${ext}`)),
    ];

    return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) || null;
}

function resolveGlob(fromFile, prefix, allFiles) {
    if (!prefix.startsWith(".") && !prefix.startsWith("/")) return [];

    const base = prefix.startsWith("/")
        ? path.join(ROOT, prefix)
        : path.resolve(path.dirname(fromFile), prefix);

    return allFiles.filter((file) => file.startsWith(base));
}

/* --------------------------------------------------
   Entry points
-------------------------------------------------- */

function findEntries(allFiles) {
    const entries = new Set();
    const manual = new Set();

    const add = (file) => {
        if (file && fs.existsSync(file)) entries.add(path.resolve(file));
    };

    const pkgPath = path.join(ROOT, "package.json");
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

            if (pkg.main) add(path.join(ROOT, pkg.main));

            for (const command of Object.values(pkg.scripts || {})) {
                for (const m of String(command).matchAll(/(?:^|\s)([\w./-]+\.(?:m?js|cjs|ts))\b/g)) {
                    add(path.join(ROOT, m[1]));
                }
            }
        } catch {
            console.warn("Could not read package.json.");
        }
    }

    for (const name of ["server.js", "app.js", "index.js", "main.js", "src/main.jsx", "src/main.tsx", "src/index.jsx", "src/main.js"]) {
        add(path.join(ROOT, name));
    }

    // index.html: <script src> and <link href>
    const html = path.join(ROOT, "index.html");
    if (fs.existsSync(html)) {
        const text = fs.readFileSync(html, "utf8").replace(/<!--[\s\S]*?-->/g, " ");
        for (const m of text.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/g)) {
            const file = resolveSpecifier(html, m[1]);
            if (file) add(file);
        }
    }

    for (const file of allFiles) {
        const relative = rel(file);

        if (!relative.includes("/") && CONFIG_FILE.test(relative)) add(file);

        if (MANUAL_DIRS.some((dir) => relative.startsWith(`${dir}/`)) && CODE_EXT.includes(path.extname(file))) {
            manual.add(file);
        }
    }

    return { entries, manual };
}

/* --------------------------------------------------
   Graph
-------------------------------------------------- */

const allFiles = walk(ROOT).filter((file) => {
    const name = path.basename(file);
    return !IGNORED_FILES.has(name) && !name.endsWith(".delete") && SCANNED_EXT.has(path.extname(name).toLowerCase());
});

const { entries, manual } = findEntries(allFiles);
const textCache = new Map();

const readText = (file) => {
    if (!textCache.has(file)) {
        const ext = path.extname(file).toLowerCase();
        textCache.set(file, [...CODE_EXT, ...STYLE_EXT].includes(ext) ? fs.readFileSync(file, "utf8") : "");
    }
    return textCache.get(file);
};

function reachableFrom(starts) {
    const seen = new Set();
    const stack = [...starts];

    while (stack.length) {
        const file = stack.pop();
        if (seen.has(file)) continue;
        seen.add(file);

        for (const { spec, glob } of findSpecifiers(file, readText(file))) {
            const targets = glob ? resolveGlob(file, spec, allFiles) : [resolveSpecifier(file, spec)];

            for (const resolved of targets) {
                if (resolved && !seen.has(resolved)) stack.push(resolved);
            }
        }
    }

    return seen;
}

const used = reachableFrom(entries);
const usedByScripts = reachableFrom(manual);

// Text of every used code file, without comments: to catch names used as
// strings (fs.readFile("data.json"), lazy paths...).
const usedCodeByFile = [...used]
    .filter((file) => CODE_EXT.includes(path.extname(file)) || STYLE_EXT.includes(path.extname(file)))
    .map((file) => [file, CODE_EXT.includes(path.extname(file)) ? stripComments(readText(file)) : readText(file)]);

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// File name -> a used file with that name ("sidebar.jsx" -> Apps/Property/Sidebar/Sidebar.jsx).
const usedStems = new Map();
for (const file of used) {
    const name = path.basename(file).toLowerCase();
    if (!usedStems.has(name)) usedStems.set(name, file);
}

/** A used file with the same name (then a name mention proves nothing). */
function sameNameAs(file) {
    return usedStems.get(path.basename(file).toLowerCase()) || null;
}

/** The used file that names this file, or null. */
function mentionedIn(file) {
    if (sameNameAs(file)) return null;

    const name = path.basename(file);
    const stem = name.slice(0, -path.extname(name).length);
    const generic = stem.length < 4 || /^(index|main|app|utils?|data|config|style|styles)$/i.test(stem);
    const stemRegex = new RegExp(`["'\`/]${escape(stem)}["'\`]`);

    for (const [usedFile, code] of usedCodeByFile) {
        if (code.includes(name)) return usedFile;
        if (!generic && stemRegex.test(code)) return usedFile;
    }

    return null;
}

const unused = [];
const maybe = [];
const manualOnly = [];

for (const file of allFiles) {
    if (used.has(file)) continue;

    if (manual.has(file) || usedByScripts.has(file)) {
        manualOnly.push(file);
    } else if (mentionedIn(file)) {
        maybe.push(file);
    } else {
        unused.push(file);
    }
}

/* --------------------------------------------------
   Report
-------------------------------------------------- */

const sortByPath = (a, b) => rel(a).localeCompare(rel(b));
unused.sort(sortByPath);
maybe.sort(sortByPath);
manualOnly.sort(sortByPath);

const lines = [];
const log = (line = "") => lines.push(line);

log(`Unused files in ${ROOT}`);
log(`Scanned ${allFiles.length} files, ${entries.size} starting files, ${used.size} used.`);
log("");
log(`UNUSED (${unused.length}) — nothing imports them:`);
for (const file of unused) {
    const twin = sameNameAs(file);
    log(`  ${rel(file)}${twin ? `   (copy? the app uses ${rel(twin)})` : ""}`);
}
log("");
log(`MAYBE USED (${maybe.length}) — not imported, but their name appears in the code. Check by hand:`);
for (const file of maybe) log(`  ${rel(file)}   <- named in ${rel(mentionedIn(file))}`);
log("");
log(`MANUAL SCRIPTS (${manualOnly.length}) — run by hand, kept:`);
for (const file of manualOnly) log(`  ${rel(file)}`);

const report = lines.join("\n");
console.log(report);
fs.writeFileSync(path.join(ROOT, "unused-files-report.txt"), `${report}\n`);

if (mode === "rename") {
    console.log("");
    for (const file of unused) {
        fs.renameSync(file, `${file}.delete`);
        console.log(`renamed   ${rel(file)}.delete`);
    }
    console.log(
        `\n${unused.length} file(s) renamed. Test the application now.\n` +
            `  Broken?  node find-unused-files.mjs ${target} --restore\n` +
            `  All OK?  node find-unused-files.mjs ${target} --purge`
    );
} else {
    console.log(`\nReport saved to ${rel(path.join(ROOT, "unused-files-report.txt"))}.`);
    console.log(`To mark the UNUSED files:  node find-unused-files.mjs ${target} --rename`);
}
