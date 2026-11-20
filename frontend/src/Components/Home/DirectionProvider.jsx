// src/Components/Home/DirectionProvider.jsx
// Applies the app theme (LTR / RTL) and the global CSS baseline.

import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

import { createAppTheme } from "../../theme/theme";

export default function DirectionProvider({ children }) {
    const { i18n } = useTranslation();

    const currentLanguage = (
        i18n.resolvedLanguage ||
        i18n.language ||
        "en"
    )
        .split("-")[0]
        .split("_")[0];

    const isRTL = currentLanguage === "ar";
    const direction = isRTL ? "rtl" : "ltr";

    const cache = useMemo(
        () =>
            createCache({
                key: isRTL ? "muirtl" : "mui",
                stylisPlugins: isRTL ? [prefixer, rtlPlugin] : [prefixer],
            }),
        [isRTL]
    );

    // One shared design system for every page.
    const theme = useMemo(() => createAppTheme(direction), [direction]);

    useEffect(() => {
        document.documentElement.dir = direction;
        document.documentElement.lang = currentLanguage;
        document.body.dir = direction;
    }, [direction, currentLanguage]);

    return (
        <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
                <CssBaseline enableColorScheme />
                {children}
            </ThemeProvider>
        </CacheProvider>
    );
}
