// src/Components/navigation/navHistory.js
//
// Small helpers so "Back", "Cancel" and "Save" behave the same everywhere:
//   - useGoBack():         go one step back; if there is no previous page in the
//                          app (link opened directly), go to a fallback page.
//   - useReturnAfterSave() after saving an edit form, open the details page
//                          WITHOUT leaving the edit page in the history. Back from
//                          the details page then returns to where "Edit" was clicked.
//   - useTrackNavigation() called once in the app layout; remembers which path sits
//                          at each history position (React Router stores the
//                          position in window.history.state.idx).

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "ms.navStack";
const FLASH_KEY = "ms.navFlash";

const readStack = () => {
    try {
        const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeStack = (stack) => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-100)));
    } catch {
        // storage full or blocked: helpers fall back to plain navigation
    }
};

export const currentHistoryIndex = () => {
    const idx = Number(typeof window !== "undefined" ? window.history.state?.idx : 0);
    return Number.isFinite(idx) && idx > 0 ? idx : 0;
};

export const canGoBack = () => currentHistoryIndex() > 0;

const stripSlash = (path = "") => String(path || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";

export const previousPath = () => {
    const idx = currentHistoryIndex();
    if (idx <= 0) return "";
    return readStack()[idx - 1] || "";
};

export function useTrackNavigation() {
    const location = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        const idx = currentHistoryIndex();
        const stack = readStack();
        // A new page (PUSH) drops the "forward" pages, like the browser does.
        if (navigationType === "PUSH") stack.length = Math.min(stack.length, idx);
        stack[idx] = location.pathname;
        writeStack(stack);
    }, [location.pathname, location.key, navigationType]);
}

export function useGoBack(fallback = "/") {
    const navigate = useNavigate();
    return useCallback(
        (to) => {
            if (canGoBack()) navigate(-1);
            else navigate(typeof to === "string" && to ? to : fallback, { replace: true });
        },
        [navigate, fallback]
    );
}

export function useReturnAfterSave() {
    const navigate = useNavigate();
    return useCallback(
        (detailsPaths, state) => {
            // detailsPaths: one path, or a list of the pages that show this item
            // (e.g. public and owner details). The first one is used when the edit
            // page was not opened from any of them.
            const paths = (Array.isArray(detailsPaths) ? detailsPaths : [detailsPaths]).filter(Boolean);
            const detailsPath = paths[0];
            const previous = stripSlash(previousPath());
            const openedFrom = paths.find((path) => stripSlash(path) === previous);
            // Edit opened from a details page: step back to that same entry,
            // so the history has no edit page left behind it.
            if (openedFrom && canGoBack()) {
                // navigate(-1) cannot carry state, so hand it over through sessionStorage.
                if (state) {
                    try {
                        sessionStorage.setItem(FLASH_KEY, JSON.stringify({ path: stripSlash(openedFrom), state }));
                    } catch {
                        // ignore
                    }
                }
                navigate(-1);
                return;
            }
            // Edit opened from somewhere else (a list, my publications, a direct link):
            // swap the edit page for the details page.
            navigate(detailsPath, { replace: true, state });
        },
        [navigate]
    );
}

// Details pages: location.state, or the state handed over by useReturnAfterSave.
export function useFlashState() {
    const location = useLocation();
    const [flash] = useState(() => {
        try {
            const saved = JSON.parse(sessionStorage.getItem(FLASH_KEY) || "null");
            return saved && saved.path === stripSlash(location.pathname) ? saved.state : null;
        } catch {
            return null;
        }
    });
    useEffect(() => {
        if (flash) sessionStorage.removeItem(FLASH_KEY);
    }, [flash]);
    return location.state || flash || null;
}
