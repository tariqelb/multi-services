// backend/apps/property/services/externalListings/availabilityChecker.js
//
// "Are my external listings still available on their websites?"
//
//   startAvailabilityCheck({ website, dryRun, requestedBy })
//   getAvailabilityStatus() -> { current, running, history }
//   cancelAvailabilityCheck()
//
// For every stored listing the checker opens the original page and decides:
//
//   available  the page is still there              -> kept, marked active
//   gone       404 / 410, redirected to the home or a list page, the
//              website's "not found" page, or an "expired listing" message
//              -> removed from the database (and remembered, so the
//                 collector never adds it back)
//   unreachable  no answer (timeout, DNS, connection refused) or a
//              server error (5xx), twice -> removed (not remembered: the
//              collector may add it again when the website is back)
//   unknown    blocked (401 / 403 / 429), odd answers...
//              -> kept: the website refuses robots, the listing may exist
//
// Safety:
//   - every "gone" result is checked a second time before removal;
//   - before a website is checked, a page that surely does not exist is
//     opened ("control page") to learn how this website shows missing
//     listings; when the website cannot be reached, nothing is removed;
//   - when almost every listing of a website looks gone without a real
//     404 (often a website blocking robots), they are kept "for review"
//     and the administrator removes them with one click if correct;
//   - unreachable listings are removed only when our own server is online
//     (a known page is opened first), so a network problem on our side
//     never empties the database;
//   - removeUnreachable: false keeps unreachable listings (old behaviour);
//   - dryRun: only report, change nothing.

import crypto from "node:crypto";

import axios from "axios";

import ExternalListing from "../../models/ExternalListing.js";
import { validateExternalUrl } from "./externalListingAccess.js";
import { createListingMatcher, urlVariants } from "./siteDiscovery.js";
import { findSourceByWebsite, parseWebsiteInput } from "./sources/externalListingSource.js";
import { removeListings } from "./removedListings.js";

const USER_AGENT = "Mozilla/5.0 (compatible; MultiServicesListingCollector/1.0)";
const REQUEST_TIMEOUT = 15000;
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const DEFAULT_REQUEST_DELAY_MS = 1200;
const PARALLEL_WEBSITES = 3;
const MAX_UNKNOWN_IN_A_ROW = 8; // the website is blocking us: stop it
const SUSPICIOUS_MIN_CHECKED = 5;
const SUSPICIOUS_RATIO = 0.8;
const MAX_RESULTS = 500;
const HISTORY_SIZE = 10;
const CONNECTIVITY_URLS = [
    "https://www.google.com/generate_204",
    "https://www.cloudflare.com/cdn-cgi/trace",
];

let currentJob = null;
const history = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* --------------------------------------------------
   Text helpers
-------------------------------------------------- */

function stripWww(hostname) {
    return String(hostname || "").toLowerCase().replace(/^www\./, "");
}

/** Lowercase, no accents, same apostrophes, simple Arabic letters. */
export function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[’‘ʼ`´]/g, "'")
        .replace(/[إأآٱ]/g, "ا")
        .replace(/[ً-ٰٕ]/g, "")
        .replace(/ـ/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function decodeEntities(text) {
    return String(text || "")
        .replace(/&nbsp;|&#160;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;|&#x27;|&rsquo;|&lsquo;/gi, "'")
        .replace(/&eacute;/gi, "é")
        .replace(/&egrave;/gi, "è")
        .replace(/&agrave;/gi, "à")
        .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCodePoint(parseInt(code, 16)));
}

function firstMatch(html, regex) {
    const match = regex.exec(html);
    return match ? normalizeText(decodeEntities(match[1].replace(/<[^>]*>/g, " "))) : "";
}

/** The parts of a page that tell whether the listing still exists. */
export function readPage(html) {
    const text = String(html || "");

    const title = firstMatch(text, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const h1 = firstMatch(text, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const ogTitle = firstMatch(
        text,
        /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i
    );

    const canonicalMatch =
        /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(text) ||
        /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i.exec(text);

    // Main text, without menus, forms (report forms often say "this listing
    // is no longer available" as an option), scripts...
    const main = normalizeText(
        decodeEntities(
            text
                .replace(/<!--[\s\S]*?-->/g, " ")
                .replace(
                    /<(script|style|noscript|template|svg|nav|header|footer|aside|form|select|option|label|button|textarea|dialog)\b[\s\S]*?<\/\1>/gi,
                    " "
                )
                .replace(/<head\b[\s\S]*?<\/head>/i, " ")
                .replace(/<[^>]+>/g, " ")
        )
    ).slice(0, 3000);

    return {
        title,
        heading: h1,
        ogTitle,
        canonical: canonicalMatch ? decodeEntities(canonicalMatch[1]).trim() : "",
        main,
    };
}

// Messages shown by websites on an expired or deleted listing.
// Written without accents; compared with normalizeText().
const LISTING_GONE_PHRASES = [
    // French
    "annonce n'est plus disponible",
    "annonce n'est plus en ligne",
    "annonce n'est plus active",
    "annonce n'existe plus",
    "annonce a ete supprimee",
    "annonce a ete retiree",
    "annonce a ete desactivee",
    "annonce a expire",
    "annonce est expiree",
    "annonce expiree",
    "annonce introuvable",
    "annonce archivee",
    "bien n'est plus disponible",
    "bien a deja ete vendu",
    "bien a deja ete loue",
    // English
    "listing is no longer available",
    "listing no longer available",
    "listing has expired",
    "listing has been removed",
    "listing has been deleted",
    "listing not found",
    "property is no longer available",
    "property no longer available",
    "property not found",
    "ad is no longer available",
    "ad has expired",
    "this ad has been removed",
    // Arabic
    "الاعلان غير متوفر",
    "الاعلان غير موجود",
    "الاعلان لم يعد متاحا",
    "الاعلان لم يعد متوفرا",
    "هذا الاعلان لم يعد",
    "انتهت صلاحية الاعلان",
    "تم حذف الاعلان",
    "العقار لم يعد متاحا",
].map(normalizeText);

// Generic "page not found" messages: only trusted in the page title or
// main heading (a footer link "page not found" means nothing).
const PAGE_NOT_FOUND_PHRASES = [
    "page introuvable",
    "page non trouvee",
    "cette page n'existe pas",
    "la page demandee n'existe pas",
    "erreur 404",
    "page not found",
    "this page does not exist",
    "this page doesn't exist",
    "404 not found",
    "الصفحة غير موجودة",
    "الصفحة المطلوبة غير موجودة",
].map(normalizeText);

function containsAny(text, phrases) {
    if (!text) return "";
    return phrases.find((phrase) => text.includes(phrase)) || "";
}

/* --------------------------------------------------
   Fetch (follows redirects itself, checking every hop)
-------------------------------------------------- */

/**
 * @returns {Promise<{status, url, redirected, html, contentType}>}
 * Network problems throw.
 */
export async function fetchPage(inputUrl) {
    let current = (await validateExternalUrl(inputUrl)).href;
    let redirected = false;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        const response = await axios.get(current, {
            timeout: REQUEST_TIMEOUT,
            maxRedirects: 0,
            responseType: "text",
            transformResponse: (data) => data,
            maxContentLength: MAX_HTML_BYTES,
            maxBodyLength: MAX_HTML_BYTES,
            decompress: true,
            validateStatus: () => true,
            headers: {
                Accept: "text/html,application/xhtml+xml",
                "Accept-Language": "fr,en;q=0.8,ar;q=0.6",
                "User-Agent": USER_AGENT,
            },
        });

        if (response.status >= 300 && response.status < 400 && response.headers?.location) {
            const next = new URL(response.headers.location, current).href;
            current = (await validateExternalUrl(next)).href;
            redirected = true;
            continue;
        }

        return {
            status: response.status,
            url: current,
            redirected,
            html: typeof response.data === "string" ? response.data : "",
            contentType: String(response.headers?.["content-type"] || ""),
        };
    }

    throw new Error("Too many redirects.");
}

/* --------------------------------------------------
   Deciding
-------------------------------------------------- */

function isSamePage(a, b) {
    return urlVariants(a).includes(b) || urlVariants(b).includes(a);
}

/** "/", "/fr", "/ar/", "/en/home"... */
export function isHomePath(pathname) {
    const parts = String(pathname || "/").split("/").filter(Boolean);

    if (parts.length === 0) return true;
    if (parts.length === 1 && /^(fr|ar|en|es|fr-ma|ar-ma|index\.(php|html?)|home|accueil)$/i.test(parts[0])) return true;
    if (parts.length === 2 && /^(fr|ar|en)$/i.test(parts[0]) && /^(home|accueil|index\.(php|html?))$/i.test(parts[1])) return true;

    return false;
}

function pathOf(url) {
    try {
        return new URL(url).pathname;
    } catch {
        return "";
    }
}

function hostOf(url) {
    try {
        return stripWww(new URL(url).hostname);
    } catch {
        return "";
    }
}

/**
 * Decide from one fetched page.
 *
 * @param {object} page      result of fetchPage (or { error })
 * @param {object} context   { listingUrl, isListingUrl(url), control }
 * @returns {{ verdict: "available"|"gone"|"unknown", reason: string, hard?: boolean }}
 */
export function judgePage(page, context) {
    const { listingUrl, isListingUrl = null, control = null } = context;

    if (!page || page.error) {
        return {
            verdict: "unknown",
            code: "unreachable",
            unreachable: true,
            reason: `Could not open the page (${page?.error || "no answer"}).`,
        };
    }

    const { status } = page;

    if (status === 404 || status === 410) {
        return { verdict: "gone", hard: true, code: "pageMissing", reason: `The page no longer exists (${status}).` };
    }

    if (status === 401 || status === 403 || status === 429) {
        return { verdict: "unknown", code: "refused", reason: `The website refused the check (${status}).` };
    }

    if (status >= 500) {
        return { verdict: "unknown", code: "unreachable", unreachable: true, reason: `Website error (${status}).` };
    }

    if (status < 200 || status >= 300) {
        return { verdict: "unknown", reason: `Unexpected answer (${status}).` };
    }

    // Redirected somewhere else?
    if (page.redirected && !isSamePage(page.url, listingUrl)) {
        if (hostOf(page.url) !== hostOf(listingUrl)) {
            return { verdict: "unknown", reason: "Redirected to another website." };
        }

        if (control?.redirected && control.url && isSamePage(page.url, control.url)) {
            return { verdict: "gone", code: "redirectMissing", reason: "Redirected like a missing listing." };
        }

        if (isHomePath(pathOf(page.url))) {
            return { verdict: "gone", code: "redirectHome", reason: "Redirected to the home page." };
        }

        if (isListingUrl) {
            return isListingUrl(page.url)
                ? { verdict: "available", reason: "The listing moved to a new address." }
                : { verdict: "gone", code: "redirectList", reason: "Redirected to a list of listings." };
        }

        return { verdict: "unknown", reason: "Redirected to another page." };
    }

    if (page.contentType && !/html/i.test(page.contentType)) {
        return { verdict: "unknown", reason: "The website did not return a web page." };
    }

    const info = readPage(page.html);

    // Same page as the "surely missing" control page (website shows a
    // "not found" page with a 200 answer).
    if (
        control?.status >= 200 &&
        control.status < 300 &&
        !control.redirected &&
        control.title &&
        info.title &&
        info.title === control.title &&
        info.title !== control.homeTitle
    ) {
        return { verdict: "gone", code: "notFoundPage", reason: "The website shows its \"not found\" page." };
    }

    const headline = [info.title, info.heading, info.ogTitle].join(" | ");

    const notFound = containsAny(headline, PAGE_NOT_FOUND_PHRASES);
    if (notFound) {
        return { verdict: "gone", code: "pageSays", phrase: notFound, reason: `The page says "${notFound}".` };
    }

    const expired = containsAny(headline, LISTING_GONE_PHRASES) || containsAny(info.main, LISTING_GONE_PHRASES);
    if (expired) {
        return { verdict: "gone", code: "pageSays", phrase: expired, reason: `The page says "${expired}".` };
    }

    if (info.canonical) {
        try {
            const canonical = new URL(info.canonical, page.url || listingUrl);

            if (hostOf(canonical.href) === hostOf(listingUrl) && isHomePath(canonical.pathname)) {
                return { verdict: "gone", code: "canonicalHome", reason: "The page now points to the home page." };
            }
        } catch {
            // ignore a broken canonical link
        }
    }

    return { verdict: "available", reason: "" };
}

/* --------------------------------------------------
   Website preparation (control page)
-------------------------------------------------- */

async function safeFetch(fetchImpl, url) {
    try {
        return await fetchImpl(url);
    } catch (error) {
        return { error: error?.code || error?.message || "network error" };
    }
}

/**
 * Learn how a website shows a missing listing, and check it can be reached.
 * Returns { ok, reason, control, isListingUrl }.
 */
export async function prepareWebsite(sampleUrl, source, { fetchImpl = fetchPage, delayMs = 0 } = {}) {
    let origin;

    try {
        origin = new URL(sampleUrl).origin;
    } catch {
        return { ok: false, reason: "Invalid listing address." };
    }

    const prefix = source?.pathPrefix && source.pathPrefix !== "/" ? source.pathPrefix : null;

    const isListingUrl =
        source && (prefix || source.linkPattern)
            ? createListingMatcher({ pathPrefix: source.pathPrefix, linkPattern: source.linkPattern })
            : null;

    const home = await safeFetch(fetchImpl, `${origin}/`);

    if (home.error || home.status === 403 || home.status === 429 || home.status >= 500) {
        return {
            ok: false,
            // No answer or server error: the website is down.
            // 403 / 429: it refuses robots (listings may still exist).
            unreachable: Boolean(home.error) || home.status >= 500,
            reason: home.error
                ? `The website could not be reached (${home.error}).`
                : `The website refused the check (${home.status}).`,
        };
    }

    if (delayMs) await sleep(delayMs);

    // A listing address that surely does not exist.
    const basePath = prefix || (() => {
        const parts = pathOf(sampleUrl).split("/").filter(Boolean);
        return parts.length > 1 ? `/${parts.slice(0, -1).join("/")}/` : "/";
    })();

    const missingUrl = `${origin}${basePath}zz-check-${crypto.randomBytes(5).toString("hex")}-999999999`;
    const missing = await safeFetch(fetchImpl, missingUrl);

    const homeTitle = home.html ? readPage(home.html).title : "";

    const control = missing.error
        ? null
        : {
              status: missing.status,
              redirected: Boolean(missing.redirected),
              url: missing.url,
              title: missing.html ? readPage(missing.html).title : "",
              homeTitle,
          };

    return { ok: true, control, isListingUrl };
}

/* --------------------------------------------------
   Job
-------------------------------------------------- */

function publicJob(job) {
    if (!job) return null;

    const { cancelRequested, ...rest } = job;

    return {
        ...rest,
        cancelRequested: Boolean(cancelRequested),
        results: rest.results.slice(0, MAX_RESULTS),
        websites: rest.websites.map((site) => ({ ...site })),
    };
}

function pushError(job, message) {
    job.errors.push(String(message).slice(0, 300));
    if (job.errors.length > 30) job.errors.shift();
}

function buildMessage(job) {
    if (job.total === 0) return "No external listings to check.";

    const parts = [
        `${job.checked} of ${job.total} listing(s) checked: ${job.available} still available`,
    ];

    if (job.removed) {
        parts.push(
            job.unreachable
                ? `${job.removed} removed (${job.unreachable} could not be reached)`
                : `${job.removed} removed`
        );
    }
    if (job.dryRun && job.unreachable) parts.push(`${job.unreachable} could not be reached (not removed: report only)`);
    if (job.kept) {
        parts.push(
            job.dryRun
                ? `${job.kept} no longer available (not removed: report only)`
                : `${job.kept} look unavailable and wait for your review`
        );
    }
    if (job.unknown) parts.push(`${job.unknown} could not be checked and were kept`);
    if (job.offline) parts.push("our server seemed offline, so unreachable listings were kept");

    return `${parts.join(", ")}.`;
}

function addResult(job, listing, result, removed, site) {
    if (job.results.length >= MAX_RESULTS) return null;

    const item = {
        id: String(listing._id),
        hostname: site.hostname,
        title: listing.title || "",
        sourceUrl: listing.sourceUrl,
        sourceName: listing.sourceName || site.sourceName || site.hostname,
        imageUrl: listing.imageUrl || "",
        city: listing.city || "",
        reason: result.reason,
        code: result.code || "",
        phrase: result.phrase || "",
        removed,
    };

    job.results.push(item);
    return item;
}

/**
 * Listings that could not be reached (twice): removed, or reported in a
 * dry run. Not remembered: the collector may add them back later.
 */
async function removeUnreachable(job, site, listings, result, deps) {
    if (!listings.length) return;

    site.unreachable = (site.unreachable || 0) + listings.length;
    job.unreachable += listings.length;

    if (job.dryRun) {
        site.kept += listings.length;
        job.kept += listings.length;
        for (const listing of listings) addResult(job, listing, result, false, site);
        return;
    }

    const removed = await deps.removeImpl(listings, {
        reasonById: Object.fromEntries(listings.map((listing) => [String(listing._id), result.reason])),
        removedBy: job.requestedBy,
        remember: false,
    });

    site.removed += removed;
    job.removed += removed;

    for (const listing of listings) addResult(job, listing, result, removed > 0, site);
}

async function checkWebsite(job, site, listings, deps) {
    const {
        Model,
        fetchImpl,
        requestDelayMs,
        removeImpl,
        findSource,
    } = deps;

    site.status = "checking";

    const source = findSource(site.hostname);
    if (source?.sourceName) site.sourceName = source.sourceName;

    let prepared = await prepareWebsite(listings[0].sourceUrl, source, {
        fetchImpl,
        delayMs: requestDelayMs,
    });

    // Down? Try once more before deciding.
    if (!prepared.ok && prepared.unreachable) {
        if (requestDelayMs) await sleep(requestDelayMs * 2);

        prepared = await prepareWebsite(listings[0].sourceUrl, source, {
            fetchImpl,
            delayMs: requestDelayMs,
        });
    }

    // Website down: its listings cannot be reached.
    if (!prepared.ok && prepared.unreachable && job.removeUnreachable) {
        const result = { verdict: "unknown", code: "unreachable", reason: prepared.reason };

        site.checked += listings.length;
        job.checked += listings.length;
        site.status = "done";
        site.noteCode = job.dryRun ? "websiteDownReport" : "websiteDown";

        await removeUnreachable(job, site, listings, result, deps);

        site.note = job.dryRun
            ? `${prepared.reason} Nothing was removed (report only).`
            : `${prepared.reason} Its listings were removed.`;
        return;
    }

    if (!prepared.ok) {
        site.status = "skipped";
        site.note = `${prepared.reason} Nothing was removed.`;
        site.noteCode = prepared.unreachable ? "unreachable" : "refused";
        site.unknown += listings.length;
        job.unknown += listings.length;
        job.checked += listings.length;
        pushError(job, `${site.hostname}: ${prepared.reason}`);
        return;
    }

    const probe = async (listing) => {
        const page = await safeFetch(fetchImpl, listing.sourceUrl);
        return judgePage(page, {
            listingUrl: listing.sourceUrl,
            isListingUrl: prepared.isListingUrl,
            control: prepared.control,
        });
    };

    const softGone = []; // decided after the whole website is checked
    let unknownInARow = 0;
    let lastUnreachable = false; // was the last unknown answer "no answer"?

    for (let index = 0; index < listings.length; index += 1) {
        const listing = listings[index];

        if (job.cancelRequested) break;

        if (unknownInARow >= MAX_UNKNOWN_IN_A_ROW) {
            const rest = listings.slice(index);
            site.checked += rest.length;
            job.checked += rest.length;

            if (lastUnreachable && job.removeUnreachable) {
                // The website stopped answering: the rest cannot be reached.
                await removeUnreachable(
                    job,
                    site,
                    rest,
                    { verdict: "unknown", code: "unreachable", reason: "The website stopped answering." },
                    deps
                );
                site.note = job.dryRun
                    ? "The website stopped answering. Nothing was removed (report only)."
                    : "The website stopped answering. The other listings were removed.";
                site.noteCode = job.dryRun ? "stoppedAnsweringReport" : "stoppedAnsweringRemoved";
            } else {
                site.unknown += rest.length;
                job.unknown += rest.length;
                site.note = "The website stopped answering. The other listings were kept.";
                site.noteCode = "stoppedAnswering";
            }

            break;
        }

        if (requestDelayMs) await sleep(requestDelayMs);

        job.currentUrl = listing.sourceUrl;

        let result = await probe(listing);
        lastUnreachable = Boolean(result.unreachable);

        // Never remove on a single answer: check "gone" again.
        if (result.verdict === "gone") {
            if (requestDelayMs) await sleep(requestDelayMs);

            const second = await probe(listing);

            if (second.verdict !== "gone") {
                result = second.verdict === "available"
                    ? second
                    : { verdict: "unknown", reason: "Different answers on two checks." };
            } else {
                result = { ...result, hard: result.hard && second.hard };
            }
        }

        site.checked += 1;
        job.checked += 1;

        const now = new Date();

        if (result.verdict === "available") {
            unknownInARow = 0;
            site.available += 1;
            job.available += 1;

            await Model.updateOne(
                { _id: listing._id },
                { $set: { status: "active", lastCheckedAt: now, lastSeenAt: now, lastError: "" } }
            ).catch(() => {});
            continue;
        }

        // No answer / server error: try again, then remove.
        if (result.verdict === "unknown" && result.unreachable && job.removeUnreachable) {
            if (requestDelayMs) await sleep(requestDelayMs);

            const second = await probe(listing);

            if (second.verdict === "available") {
                unknownInARow = 0;
                site.available += 1;
                job.available += 1;

                await Model.updateOne(
                    { _id: listing._id },
                    { $set: { status: "active", lastCheckedAt: now, lastSeenAt: now, lastError: "" } }
                ).catch(() => {});
                continue;
            }

            if (second.unreachable) {
                unknownInARow += 1;
                await removeUnreachable(job, site, [listing], result, deps);
                continue;
            }

            result = second.verdict === "gone" ? { ...second, hard: false } : second;
        }

        if (result.verdict === "unknown") {
            unknownInARow += 1;
            site.unknown += 1;
            job.unknown += 1;

            await Model.updateOne(
                { _id: listing._id },
                { $set: { lastCheckedAt: now, lastError: result.reason } }
            ).catch(() => {});
            continue;
        }

        // gone
        unknownInARow = 0;

        if (job.dryRun) {
            site.kept += 1;
            job.kept += 1;
            addResult(job, listing, result, false, site);
        } else if (result.hard) {
            const removed = await removeImpl([listing], {
                reasonById: { [String(listing._id)]: result.reason },
                removedBy: job.requestedBy,
            });

            // 0 when someone deleted it meanwhile: nothing to report.
            if (removed > 0) {
                site.removed += 1;
                job.removed += 1;
                addResult(job, listing, result, true, site);
            }
        } else {
            softGone.push({ listing, result });
        }
    }

    // Soft results ("redirected", "expired" text...): if nearly every
    // listing of the website looks gone, the website is probably blocking
    // the check. Keep them for the administrator to review.
    if (softGone.length) {
        const suspicious =
            site.checked >= SUSPICIOUS_MIN_CHECKED &&
            softGone.length / site.checked >= SUSPICIOUS_RATIO;

        if (suspicious) {
            site.kept += softGone.length;
            job.kept += softGone.length;
            site.note =
                "Almost every listing of this website looks unavailable. They were kept: review them, then remove them if correct.";
            site.noteCode = "suspicious";

            for (const { listing, result } of softGone) {
                addResult(job, listing, result, false, site);
            }
        } else {
            const reasonById = Object.fromEntries(
                softGone.map(({ listing, result }) => [String(listing._id), result.reason])
            );

            const removed = await removeImpl(
                softGone.map(({ listing }) => listing),
                { reasonById, removedBy: job.requestedBy }
            );

            site.removed += removed;
            job.removed += removed;

            for (const { listing, result } of softGone) {
                addResult(job, listing, result, true, site);
            }
        }
    }

    site.status = job.cancelRequested ? "cancelled" : "done";
}

async function runCheck(job, deps) {
    const { Model } = deps;

    const filter = {};

    if (job.hostname) {
        const bare = stripWww(job.hostname);
        filter.sourceDomain = { $in: [bare, `www.${bare}`] };
    }

    job.phase = "loading";

    const listings = await Model.find(filter)
        .select("_id sourceUrl sourceDomain sourceName title imageUrl city status")
        .sort({ lastCheckedAt: 1 })
        .lean();

    job.total = listings.length;

    // One group per website: websites are checked in parallel, the
    // listings of one website one after the other.
    const groups = new Map();

    for (const listing of listings) {
        const host = stripWww(listing.sourceDomain || hostOf(listing.sourceUrl));
        if (!host) continue;

        if (!groups.has(host)) groups.set(host, []);
        groups.get(host).push(listing);
    }

    job.websites = [...groups.entries()].map(([hostname, items]) => ({
        hostname,
        sourceName: items.find((item) => item.sourceName)?.sourceName || hostname,
        total: items.length,
        checked: 0,
        available: 0,
        removed: 0,
        kept: 0,
        unknown: 0,
        unreachable: 0,
        status: "waiting",
        note: "",
        noteCode: "",
    }));

    // Unreachable listings are removed only when our own server is online.
    if (job.removeUnreachable && groups.size) {
        job.phase = "connectivity";

        const online = await deps.isOnline().catch(() => false);

        if (!online) {
            job.offline = true;
            job.removeUnreachable = false;
            pushError(job, "Our server could not reach the internet: unreachable listings were kept.");
        }
    }

    job.phase = "checking";

    const queue = [...job.websites];

    const worker = async () => {
        while (queue.length && !job.cancelRequested) {
            const site = queue.shift();

            try {
                await checkWebsite(job, site, groups.get(site.hostname), deps);
            } catch (error) {
                site.status = "failed";
                site.note = error.message;
                site.noteCode = "failed";
                pushError(job, `${site.hostname}: ${error.message}`);
            }
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(PARALLEL_WEBSITES, queue.length || 1) }, worker)
    );
}

/** True when at least one well-known page answers. */
export async function isServerOnline(fetchImpl = fetchPage) {
    for (const url of CONNECTIVITY_URLS) {
        const page = await safeFetch(fetchImpl, url);
        if (!page.error && page.status && page.status < 500) return true;
    }

    return false;
}

/* --------------------------------------------------
   Public API
-------------------------------------------------- */

export function getAvailabilityStatus() {
    return {
        current: publicJob(currentJob),
        running: Boolean(currentJob && currentJob.status === "running"),
        history: history.map((job) => {
            const { results, websites, errors, ...summary } = publicJob(job);
            return summary;
        }),
    };
}

export function isAvailabilityCheckRunning() {
    return Boolean(currentJob && currentJob.status === "running");
}

export function cancelAvailabilityCheck() {
    if (!isAvailabilityCheckRunning()) return false;

    currentJob.cancelRequested = true;
    return true;
}

/**
 * Start a check in the background. Throws (status 409) when one is running.
 *
 * @param {object} params
 *   - website   hostname to check, or "" / "all" for every listing
 *   - dryRun    only report, remove nothing
 * @param {object} deps   injectable for tests
 */
export function startAvailabilityCheck(
    { website = "", dryRun = false, requestedBy = "", removeUnreachable = true } = {},
    deps = {}
) {
    if (isAvailabilityCheckRunning()) {
        const error = new Error("A check is already running. Wait for it to finish.");
        error.status = 409;
        throw error;
    }

    const all = !website || String(website).trim().toLowerCase() === "all";
    const hostname = all ? "" : parseWebsiteInput(String(website)) || "";

    if (!all && !hostname) {
        const error = new Error("Invalid website.");
        error.status = 400;
        throw error;
    }

    const fullDeps = {
        Model: ExternalListing,
        fetchImpl: fetchPage,
        requestDelayMs: DEFAULT_REQUEST_DELAY_MS,
        removeImpl: (items, options) => removeListings(items, { ...options, Model: deps.Model || ExternalListing }),
        isOnline: () => isServerOnline(deps.fetchImpl || fetchPage),
        findSource: (host) => findSourceByWebsite(host),
        ...deps,
    };

    const job = {
        id: crypto.randomUUID(),
        hostname: stripWww(hostname),
        dryRun: Boolean(dryRun),
        removeUnreachable: removeUnreachable !== false,
        offline: false,
        unreachable: 0,
        status: "running",
        phase: "starting",
        total: 0,
        checked: 0,
        available: 0,
        removed: 0,
        kept: 0,
        unknown: 0,
        websites: [],
        results: [],
        errors: [],
        currentUrl: "",
        message: "",
        requestedBy,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        cancelRequested: false,
    };

    currentJob = job;

    (async () => {
        try {
            await runCheck(job, fullDeps);
            job.status = job.cancelRequested ? "cancelled" : "completed";
        } catch (error) {
            job.status = "failed";
            pushError(job, error.message);
        } finally {
            job.phase = "done";
            job.currentUrl = "";
            job.finishedAt = new Date().toISOString();
            job.message =
                job.status === "failed"
                    ? job.errors[job.errors.length - 1] || "The check failed."
                    : buildMessage(job);

            history.unshift(job);
            if (history.length > HISTORY_SIZE) history.pop();

            console.log(`[ExternalListings] Availability check ${job.status}: ${job.message}`);
        }
    })();

    return publicJob(job);
}

/** Start a check and wait for the result (scheduled job). */
export async function runAvailabilityCheck(params = {}, deps = {}) {
    const started = startAvailabilityCheck({ requestedBy: "scheduler", ...params }, deps);

    while (currentJob && currentJob.id === started.id && currentJob.status === "running") {
        await sleep(500);
    }

    return publicJob(currentJob);
}

/**
 * The administrator confirms removal of listings kept for review.
 * Marks them as removed in the last check's results.
 */
export async function removeReviewedListings(ids, { requestedBy = "", Model = ExternalListing, removeImpl = removeListings } = {}) {
    const wanted = [...new Set((ids || []).map(String))].slice(0, 1000);

    if (!wanted.length) return 0;

    const listings = await Model.find({ _id: { $in: wanted } })
        .select("_id sourceUrl sourceDomain title")
        .lean();

    const reasonById = {};

    for (const item of currentJob?.results || []) {
        reasonById[item.id] = item.reason;
    }

    const removed = await removeImpl(listings, { reasonById, removedBy: requestedBy, Model });

    if (currentJob && removed > 0) {
        const removedIds = new Set(listings.map((item) => String(item._id)));
        let count = 0;

        for (const item of currentJob.results) {
            if (!item.removed && removedIds.has(item.id)) {
                item.removed = true;
                count += 1;

                const site = currentJob.websites.find((entry) => entry.hostname === item.hostname);
                if (site) {
                    site.kept = Math.max(0, site.kept - 1);
                    site.removed += 1;
                }
            }
        }

        currentJob.kept = Math.max(0, currentJob.kept - count);
        currentJob.removed += count;

        if (currentJob.status !== "running") currentJob.message = buildMessage(currentJob);
    }

    return removed;
}
