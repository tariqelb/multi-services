// src/Apps/DailyWorker/workerOptions.js
//
// Trades, specialties and form choices of the daily worker service.
// The list lives in the backend (apps/workers/data/workerTrades.js) and is
// loaded once from GET /api/workers/options, then kept for the session.

import { useEffect, useState } from "react";

import axiosInstance from "../../api/axiosInstance";

let cache = null;
let pending = null;

export function loadWorkerOptions() {
    if (cache) return Promise.resolve(cache);
    if (!pending) {
        pending = axiosInstance
            .get("/workers/options")
            .then(({ data }) => {
                cache = data;
                return data;
            })
            .finally(() => {
                pending = null;
            });
    }
    return pending;
}

/** { options, loading, error } */
export function useWorkerOptions() {
    const [state, setState] = useState(() => ({ options: cache, loading: !cache, error: "" }));

    useEffect(() => {
        if (cache) return undefined;
        let cancelled = false;
        loadWorkerOptions()
            .then((options) => !cancelled && setState({ options, loading: false, error: "" }))
            .catch((error) => !cancelled && setState({ options: null, loading: false, error: error.response?.data?.message || "error" }));
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}

/** "ar" | "fr" | "en" from the i18next language. */
export const langOf = (i18n) => {
    const code = String(i18n?.resolvedLanguage || i18n?.language || "en").slice(0, 2);
    return ["ar", "fr"].includes(code) ? code : "en";
};

export const labelOf = (item, lang) => (item ? item[lang] || item.en || "" : "");

export const tradeOf = (options, tradeId) => (options?.trades || []).find((trade) => trade.id === tradeId) || null;

/** Name of the trade of an offer: catalog label, or what the worker typed. */
export function tradeName(options, offer, lang, otherLabel = "Other") {
    if (!offer) return "";
    if (offer.trade === (options?.other || "other")) return offer.customTrade || otherLabel;
    return labelOf(tradeOf(options, offer.trade), lang) || offer.customTrade || offer.trade;
}

/** Specialty names: chosen ones (translated) then typed ones. */
export function specialtyNames(options, offer, lang) {
    const trade = tradeOf(options, offer?.trade);
    const known = (offer?.specialties || [])
        .map((id) => labelOf(trade?.specialties?.find((specialty) => specialty.id === id), lang))
        .filter(Boolean);
    return [...known, ...(offer?.customSpecialties || [])];
}

/** Trades grouped for selects: [{ group, label, trades: [...] }] */
export function groupedTrades(options, lang) {
    return (options?.groups || []).map((group) => ({
        id: group.id,
        label: labelOf(group, lang),
        trades: (options?.trades || []).filter((trade) => trade.group === group.id),
    }));
}

/** Lowercase, no accents ("Électricien" = "electricien"). */
export const normalizeText = (value) =>
    String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

/**
 * Words a trade can be found with in a picker, whatever the page language:
 * its English, French and Arabic names, keywords and specialties.
 */
export function tradeSearchText(options, tradeId) {
    const trade = tradeOf(options, tradeId);
    if (!trade) return "";
    return normalizeText(
        [trade.en, trade.fr, trade.ar, ...(trade.keywords || []), ...(trade.specialties || []).flatMap((specialty) => [specialty.en, specialty.fr, specialty.ar])].join(" ")
    );
}

/** filterOptions for trade Autocompletes: every typed word must match. */
export const tradeFilter = (options) => (list, { inputValue }) => {
    const words = normalizeText(inputValue).split(/\s+/).filter(Boolean);
    if (!words.length) return list;
    return list.filter((option) => {
        const text = `${normalizeText(option.label)} ${tradeSearchText(options, option.id)}`;
        return words.every((word) => text.includes(word));
    });
};
