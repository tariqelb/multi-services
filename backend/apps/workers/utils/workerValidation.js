// backend/apps/workers/utils/workerValidation.js
//
// Reads the "publish my worker profile" form. Pure functions (tested).
//   buildWorkerProfile(body) -> { data, errors }
// errors: { field: message }, offers use "offers.<index>.<field>".

import { OTHER_TRADE, TRADE_IDS, tradeById, tradeSearchWords } from "../data/workerTrades.js";
import {
    AVAILABILITY,
    BIO_MAX,
    CONTACT_PREFERENCES,
    COVERAGE,
    CUSTOM_TEXT_MAX,
    DIPLOMA_MAX,
    GENDERS,
    GUARANTEE_MAX,
    HOURS_PATTERN,
    LANGUAGES,
    MATERIALS,
    MAX_CITIES,
    MAX_CUSTOM_SPECIALTIES,
    MAX_EXPERIENCE_YEARS,
    MAX_OFFERS,
    MAX_PRICE,
    MAX_SPECIALTIES,
    MAX_TEAM_SIZE,
    NAME_MAX,
    OFFER_DESCRIPTION_MAX,
    PAYMENT_TIMINGS,
    PRICE_REQUIRED,
    PRICE_TYPES,
    TEAM_MODES,
    WORK_DAYS,
    WORKPLACE_ADDRESS_MAX,
    WORKPLACE_KINDS,
    WORKPLACE_NAME_MAX,
} from "./workerOptions.js";

/** Plain text: no tags, no control characters, single spaces when `line`. */
export function cleanText(value, max, { line = false } = {}) {
    let text = String(value ?? "")
        .replace(/<[^>]*>/g, "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\r\n?/g, "\n");
    text = line ? text.replace(/\s+/g, " ") : text.replace(/\n{4,}/g, "\n\n\n");
    return text.trim().slice(0, max);
}

/** Lowercase, no accents: "Électricien" and "electricien" match. */
export const normalize = (value) =>
    String(value ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();

const asList = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
        } catch {
            return value.split(",");
        }
    }
    return [];
};

const unique = (values) => [...new Set(values)];

const asBool = (value) => value === true || value === "true" || value === 1 || value === "1" || value === "on";

const asNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(String(value).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(number) ? number : NaN;
};

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm).split(":").map(Number);
    return h * 60 + m;
};

/** True when [breakStart, breakEnd] is inside the working hours (which may cross midnight). */
export function withinHours(start, end, breakStart, breakEnd) {
    const s = toMinutes(start);
    let e = toMinutes(end);
    let bs = toMinutes(breakStart);
    let be = toMinutes(breakEnd);
    if (e <= s) {
        e += 24 * 60;
        if (bs < s) {
            bs += 24 * 60;
            be += 24 * 60;
        }
    }
    return bs >= s && be <= e;
}

function buildOffer(raw = {}, index, errors) {
    const key = (field) => `offers.${index}.${field}`;
    const offer = {};

    const trade = String(raw.trade || "").trim();
    if (!trade) errors[key("trade")] = "Choose a trade.";
    else if (trade !== OTHER_TRADE && !TRADE_IDS.has(trade)) errors[key("trade")] = "Unknown trade.";
    offer.trade = trade;

    offer.customTrade = trade === OTHER_TRADE ? cleanText(raw.customTrade, CUSTOM_TEXT_MAX + 1, { line: true }) : "";
    if (trade === OTHER_TRADE) {
        if (offer.customTrade.length < 3) errors[key("customTrade")] = "Type your trade (at least 3 characters).";
        else if (offer.customTrade.length > CUSTOM_TEXT_MAX) errors[key("customTrade")] = `Up to ${CUSTOM_TEXT_MAX} characters.`;
    }

    // Specialties of the list (unknown ones are dropped) + up to 5 typed ones.
    const known = new Set((tradeById(trade)?.specialties || []).map((specialty) => specialty.id));
    offer.specialties = unique(asList(raw.specialties).map(String)).filter((id) => known.has(id));
    if (offer.specialties.length > MAX_SPECIALTIES) errors[key("specialties")] = `Choose up to ${MAX_SPECIALTIES} specialties.`;

    offer.customSpecialties = unique(
        asList(raw.customSpecialties)
            .map((value) => cleanText(value, CUSTOM_TEXT_MAX, { line: true }))
            .filter((value) => value.length >= 2)
    );
    if (offer.customSpecialties.length > MAX_CUSTOM_SPECIALTIES) {
        errors[key("customSpecialties")] = `Add up to ${MAX_CUSTOM_SPECIALTIES} specialties of your own.`;
    }

    const years = asNumber(raw.experienceYears);
    if (years === null || Number.isNaN(years) || years < 0 || years > MAX_EXPERIENCE_YEARS || !Number.isInteger(years)) {
        errors[key("experienceYears")] = `Years of experience: a whole number from 0 to ${MAX_EXPERIENCE_YEARS}.`;
    }
    offer.experienceYears = Number.isInteger(years) ? years : 0;

    offer.diploma = cleanText(raw.diploma, DIPLOMA_MAX, { line: true });

    // Price
    offer.priceType = String(raw.priceType || "");
    if (!PRICE_TYPES.includes(offer.priceType)) errors[key("priceType")] = "Choose how you are paid.";

    const price = asNumber(raw.price);
    if (offer.priceType === "quote") {
        offer.price = null;
    } else if (price === null) {
        offer.price = null;
        if (PRICE_REQUIRED.has(offer.priceType)) errors[key("price")] = "Enter your price.";
    } else if (Number.isNaN(price) || price <= 0 || price > MAX_PRICE) {
        errors[key("price")] = "Enter a valid price in MAD.";
        offer.price = null;
    } else {
        offer.price = Math.round(price);
    }

    offer.paymentTiming = pick(String(raw.paymentTiming || ""), PAYMENT_TIMINGS, "");
    if (!offer.paymentTiming) errors[key("paymentTiming")] = "Choose when you are paid.";

    // Deposit
    const depositRequired = asBool(raw.depositRequired ?? raw.deposit?.required);
    const depositPercent = asNumber(raw.depositPercent ?? raw.deposit?.percent);
    offer.deposit = { required: depositRequired, percent: null };
    if (depositRequired) {
        if (depositPercent === null) {
            offer.deposit.percent = null;
        } else if (Number.isNaN(depositPercent) || depositPercent < 1 || depositPercent > 100) {
            errors[key("depositPercent")] = "Deposit: from 1 to 100 %.";
        } else {
            offer.deposit.percent = Math.round(depositPercent);
        }
    }

    offer.materials = pick(String(raw.materials || ""), MATERIALS, "client");

    // Visit / quote
    const visitFree = raw.visitFree === undefined && raw.visit?.free === undefined ? true : asBool(raw.visitFree ?? raw.visit?.free);
    const visitFee = asNumber(raw.visitFee ?? raw.visit?.fee);
    offer.visit = { free: visitFree, fee: null };
    if (!visitFree && visitFee !== null) {
        if (Number.isNaN(visitFee) || visitFee <= 0 || visitFee > 100000) errors[key("visitFee")] = "Enter a valid visit fee in MAD.";
        else offer.visit.fee = Math.round(visitFee);
    }

    offer.guarantee = cleanText(raw.guarantee, GUARANTEE_MAX, { line: true });

    offer.description = cleanText(raw.description, OFFER_DESCRIPTION_MAX + 1);
    if (offer.description.length > OFFER_DESCRIPTION_MAX) errors[key("description")] = `Up to ${OFFER_DESCRIPTION_MAX} characters.`;

    if (raw._id && /^[a-f\d]{24}$/i.test(String(raw._id))) offer._id = String(raw._id);
    return offer;
}

/** What a list or detail search can match: trade labels, specialties, typed words, names, cities. */
export function buildSearchText(data) {
    const words = [data.firstName, data.lastName, data.baseCity, ...(data.cities || []), data.workplace?.name, data.workplace?.address];
    for (const offer of data.offers || []) {
        words.push(...tradeSearchWords(offer.trade), offer.customTrade, ...(offer.customSpecialties || []), offer.diploma);
    }
    return normalize(unique(words.filter(Boolean).map((word) => String(word).trim())).join(" | "));
}

export function buildWorkerProfile(body = {}) {
    const errors = {};
    const data = {};

    data.firstName = cleanText(body.firstName, NAME_MAX + 1, { line: true });
    data.lastName = cleanText(body.lastName, NAME_MAX + 1, { line: true });
    if (data.firstName.length < 2) errors.firstName = "Enter your first name.";
    else if (data.firstName.length > NAME_MAX) errors.firstName = `Up to ${NAME_MAX} characters.`;
    if (data.lastName.length < 2) errors.lastName = "Enter your last name.";
    else if (data.lastName.length > NAME_MAX) errors.lastName = `Up to ${NAME_MAX} characters.`;

    data.gender = String(body.gender || "");
    if (!GENDERS.includes(data.gender)) {
        errors.gender = "Choose man or woman.";
        data.gender = "";
    }

    data.bio = cleanText(body.bio, BIO_MAX + 1);
    if (data.bio.length > BIO_MAX) errors.bio = `Up to ${BIO_MAX} characters.`;

    // Where
    data.baseCity = cleanText(body.baseCity, 60, { line: true });
    if (!data.baseCity) errors.baseCity = "Choose the city where you live.";

    data.coverage = pick(String(body.coverage || ""), COVERAGE, "cities");
    const cities = unique(asList(body.cities).map((city) => cleanText(city, 60, { line: true })).filter(Boolean));
    data.cities = data.coverage === "morocco" ? [] : unique([data.baseCity, ...cities].filter(Boolean));
    if (data.cities.length > MAX_CITIES) errors.cities = `Choose up to ${MAX_CITIES} cities, or "All of Morocco".`;

    // Workshop, shop or garage where clients can come (optional).
    data.hasWorkplace = asBool(body.hasWorkplace);
    const place = body.workplace && typeof body.workplace === "object" ? body.workplace : {};
    if (data.hasWorkplace) {
        const kind = String(place.kind || "");
        const name = cleanText(place.name, WORKPLACE_NAME_MAX + 1, { line: true });
        const address = cleanText(place.address, WORKPLACE_ADDRESS_MAX + 1, { line: true });
        const mapLink = String(place.mapLink || "").trim();
        if (!WORKPLACE_KINDS.includes(kind)) errors["workplace.kind"] = "Choose workshop, shop or garage.";
        if (name.length > WORKPLACE_NAME_MAX) errors["workplace.name"] = `Up to ${WORKPLACE_NAME_MAX} characters.`;
        if (address.length > WORKPLACE_ADDRESS_MAX) errors["workplace.address"] = `Up to ${WORKPLACE_ADDRESS_MAX} characters.`;
        if (!mapLink) errors["workplace.mapLink"] = "Add the Google Maps link of your place.";
        else if (!/^https?:\/\//i.test(mapLink) || mapLink.length > 500) errors["workplace.mapLink"] = "Paste a Google Maps link (https://…).";
        // Photos kept from before (filenames); new ones are uploaded with the form.
        const keepImages = [...new Set((Array.isArray(place.keepImages) ? place.keepImages : []).map(String))];
        data.workplace = { kind: WORKPLACE_KINDS.includes(kind) ? kind : "", name, address, mapLink, keepImages };
    } else {
        data.workplace = { kind: "", name: "", address: "", mapLink: "", keepImages: [] };
    }

    // When
    data.workDays = WORK_DAYS.filter((day) => asList(body.workDays).map(String).includes(day));
    if (!data.workDays.length) errors.workDays = "Choose the days you work.";

    // Night work: the worker accepts night jobs, and his hours may cross midnight (20:00 – 06:00).
    data.worksAtNight = asBool(body.worksAtNight);

    const start = String(body.hours?.start ?? body.hoursStart ?? "");
    const end = String(body.hours?.end ?? body.hoursEnd ?? "");
    const overnight = HOURS_PATTERN.test(start) && HOURS_PATTERN.test(end) && toMinutes(end) < toMinutes(start);
    if (!HOURS_PATTERN.test(start) || !HOURS_PATTERN.test(end)) errors.hours = "Enter your working hours (e.g. 08:00 – 18:00).";
    else if (start === end) errors.hours = "The end time must be different from the start time.";
    else if (overnight && !data.worksAtNight) errors.hours = "The end time must be after the start time (or turn on night work).";
    data.hours = { start, end };

    // Lunch break (optional): inside the working hours.
    data.hasBreak = asBool(body.hasBreak);
    const breakStart = String(body.break?.start ?? body.breakStart ?? "");
    const breakEnd = String(body.break?.end ?? body.breakEnd ?? "");
    if (data.hasBreak) {
        if (!HOURS_PATTERN.test(breakStart) || !HOURS_PATTERN.test(breakEnd)) errors.break = "Enter your break (e.g. 12:30 – 14:00).";
        else if (toMinutes(breakEnd) <= toMinutes(breakStart)) errors.break = "The break must end after it starts.";
        else if (!errors.hours && !withinHours(start, end, breakStart, breakEnd)) errors.break = "The break must be inside your working hours.";
        data.break = { start: breakStart, end: breakEnd };
    } else {
        data.break = { start: "", end: "" };
    }

    data.languages = LANGUAGES.filter((language) => asList(body.languages).map(String).includes(language));
    if (!data.languages.length) errors.languages = "Choose at least one language.";

    // How
    data.teamMode = pick(String(body.teamMode || ""), TEAM_MODES, "alone");
    const teamSize = asNumber(body.teamSize);
    data.teamSize = data.teamMode === "team" ? (Number.isInteger(teamSize) ? teamSize : 0) : 1;
    if (data.teamMode === "team" && (!Number.isInteger(teamSize) || teamSize < 2 || teamSize > MAX_TEAM_SIZE)) {
        errors.teamSize = `A team has 2 to ${MAX_TEAM_SIZE} people.`;
    }

    data.hasTools = asBool(body.hasTools);
    data.hasVehicle = asBool(body.hasVehicle);
    data.acceptsUrgent = asBool(body.acceptsUrgent);
    data.contactPreference = pick(String(body.contactPreference || ""), CONTACT_PREFERENCES, "both");

    // Trade offers: 1 to 5, one per trade.
    const rawOffers = asList(body.offers).filter((offer) => offer && typeof offer === "object");
    if (!rawOffers.length) errors.offers = "Add at least one trade.";
    if (rawOffers.length > MAX_OFFERS) errors.offers = `You can offer up to ${MAX_OFFERS} trades.`;
    data.offers = rawOffers.slice(0, MAX_OFFERS).map((offer, index) => buildOffer(offer, index, errors));

    const seen = new Set();
    data.offers.forEach((offer, index) => {
        const id = offer.trade === OTHER_TRADE ? `other:${normalize(offer.customTrade)}` : offer.trade;
        if (offer.trade && seen.has(id)) errors[`offers.${index}.trade`] = "You already offer this trade.";
        seen.add(id);
    });

    data.searchText = buildSearchText(data);
    data.trades = unique(data.offers.map((offer) => offer.trade).filter(Boolean));

    return { data, errors };
}

/** PATCH /me/availability */
export function buildAvailability(body = {}, now = new Date()) {
    const status = String(body.status || "");
    if (!AVAILABILITY.includes(status)) return { error: "Choose available or busy." };
    if (status === "available") return { data: { status, busyUntil: null } };

    if (!body.busyUntil) return { data: { status, busyUntil: null } };
    const until = new Date(body.busyUntil);
    if (Number.isNaN(until.getTime())) return { error: "Invalid date." };
    if (until <= now) return { error: "Choose a date in the future." };
    const max = new Date(now);
    max.setFullYear(max.getFullYear() + 1);
    if (until > max) return { error: "Choose a date within a year." };
    return { data: { status, busyUntil: until } };
}

/** Available now: "available", or "busy" with a date that has passed. */
export const isAvailableNow = (availability, now = new Date()) =>
    !availability ||
    availability.status !== "busy" ||
    Boolean(availability.busyUntil && new Date(availability.busyUntil) <= now);

/** Escape a user text for a RegExp. */
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
