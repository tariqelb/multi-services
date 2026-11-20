// src/theme/theme.js
// One design system for the whole application (MUI).
// Every page inherits these colors, shapes and component styles, so the
// app looks consistent without repeating styles in each component.

import { alpha, createTheme } from "@mui/material/styles";

// -----------------------------------------------------------------------------
// Design tokens
// -----------------------------------------------------------------------------

export const tokens = {
    brand: {
        main: "#2563EB",
        dark: "#1D4ED8",
        light: "#DBEAFE",
        lighter: "#EFF6FF",
        prefered: "#14539a"
    },
    success: { main: "#16A34A", dark: "#15803D", light: "#DCFCE7" },
    warning: { main: "#D97706", dark: "#B45309", light: "#FEF3C7" },
    error: { main: "#DC2626", dark: "#B91C1C", light: "#FEE2E2" },
    info: { main: "#0891B2", dark: "#0E7490", light: "#CFFAFE" },
    whatsapp: "#22C55E",

    text: {
        primary: "#0F172A",
        secondary: "#64748B",
        disabled: "#94A3B8",
    },

    surface: {
        background: "#F5F7FB",
        paper: "#FFFFFF",
        subtle: "#F8FAFC",
        muted: "#F1F5F9",
    },

    border: {
        light: "#EEF2F7",
        main: "#E2E8F0",
        strong: "#CBD5E1",
    },

    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
    },

    shadow: {
        xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
        sm: "0 2px 8px rgba(15, 23, 42, 0.05)",
        md: "0 8px 24px rgba(15, 23, 42, 0.08)",
        lg: "0 16px 40px rgba(15, 23, 42, 0.12)",
        focus: "0 0 0 4px rgba(37, 99, 235, 0.14)",
    },
};

const LATIN_FONT =
    '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif';

const ARABIC_FONT =
    '"IBM Plex Sans Arabic", "Inter", "Segoe UI", "Tahoma", sans-serif';

// -----------------------------------------------------------------------------
// Theme factory (direction aware: "ltr" | "rtl")
// -----------------------------------------------------------------------------

export function createAppTheme(direction = "ltr") {
    const fontFamily = direction === "rtl" ? ARABIC_FONT : LATIN_FONT;

    const base = createTheme({
        direction,

        palette: {
            mode: "light",
            primary: {
                main: tokens.brand.main,
                dark: tokens.brand.dark,
                light: tokens.brand.light,
                lighter: tokens.brand.lighter,
                contrastText: "#FFFFFF",
            },
            secondary: {
                main: "#7C3AED",
                light: "#EDE9FE",
                dark: "#6D28D9",
                contrastText: "#FFFFFF",
            },
            success: { ...tokens.success, contrastText: "#FFFFFF" },
            warning: { ...tokens.warning, contrastText: "#FFFFFF" },
            error: { ...tokens.error, contrastText: "#FFFFFF" },
            info: { ...tokens.info, contrastText: "#FFFFFF" },
            text: tokens.text,
            divider: tokens.border.main,
            background: {
                default: tokens.surface.background,
                paper: tokens.surface.paper,
                subtle: tokens.surface.subtle,
                muted: tokens.surface.muted,
            },
            action: {
                hover: alpha(tokens.text.primary, 0.04),
                selected: alpha(tokens.brand.main, 0.08),
            },
        },

        // Keep the MUI default unit (4px) so sx={{ borderRadius: 3 }} = 12px everywhere.
        shape: { borderRadius: 4 },

        typography: {
            fontFamily,
            fontSize: 14,
            h1: { fontWeight: 800, fontSize: "2.5rem", lineHeight: 1.15, letterSpacing: "-0.02em" },
            h2: { fontWeight: 800, fontSize: "2.125rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
            h3: { fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.25, letterSpacing: "-0.01em" },
            h4: { fontWeight: 700, fontSize: "1.625rem", lineHeight: 1.25, letterSpacing: "-0.01em" },
            h5: { fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.35 },
            h6: { fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.4 },
            subtitle1: { fontWeight: 600, fontSize: "1rem" },
            subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
            body1: { fontSize: "0.9375rem", lineHeight: 1.65 },
            body2: { fontSize: "0.875rem", lineHeight: 1.6 },
            caption: { fontSize: "0.75rem", lineHeight: 1.5 },
            overline: { fontWeight: 700, fontSize: "0.6875rem", letterSpacing: "0.08em" },
            button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
        },

        breakpoints: {
            values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
        },
    });

    const { palette } = base;

    return createTheme(base, {
        customShadows: tokens.shadow,
        tokens,

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: palette.background.default,
                        color: palette.text.primary,
                        WebkitFontSmoothing: "antialiased",
                        MozOsxFontSmoothing: "grayscale",
                    },
                    "*::-webkit-scrollbar": { width: 10, height: 10 },
                    "*::-webkit-scrollbar-thumb": {
                        backgroundColor: tokens.border.strong,
                        borderRadius: 999,
                        border: `2px solid ${palette.background.default}`,
                    },
                    "*::-webkit-scrollbar-track": { backgroundColor: "transparent" },
                    "::selection": { backgroundColor: alpha(tokens.brand.main, 0.18) },
                },
            },

            // ----------------------------------------------------------------
            // Buttons
            // ----------------------------------------------------------------
            MuiButtonBase: {
                defaultProps: { disableRipple: false },
            },
            MuiButton: {
                defaultProps: { disableElevation: true },
                styleOverrides: {
                    root: {
                        borderRadius: tokens.radius.md - 2,
                        minHeight: 40,
                        paddingInline: 18,
                        fontWeight: 600,
                        transition: "background-color .2s ease, box-shadow .2s ease, border-color .2s ease, transform .1s ease",
                        "&:active": { transform: "translateY(1px)" },
                    },
                    sizeSmall: { minHeight: 32, paddingInline: 12, fontSize: "0.8125rem" },
                    sizeLarge: { minHeight: 48, paddingInline: 24, fontSize: "0.9375rem" },
                    containedPrimary: {
                        boxShadow: `0 4px 14px ${alpha(tokens.brand.main, 0.25)}`,
                        "&:hover": {
                            backgroundColor: tokens.brand.dark,
                            boxShadow: `0 6px 18px ${alpha(tokens.brand.main, 0.32)}`,
                        },
                    },
                    outlined: {
                        borderColor: tokens.border.strong,
                        "&:hover": { borderColor: palette.text.secondary, backgroundColor: tokens.surface.subtle },
                    },
                    outlinedPrimary: {
                        borderColor: alpha(tokens.brand.main, 0.45),
                        "&:hover": { borderColor: tokens.brand.main, backgroundColor: tokens.brand.lighter },
                    },
                    outlinedSuccess: {
                        borderColor: alpha(tokens.success.main, 0.5),
                        "&:hover": { borderColor: tokens.success.main, backgroundColor: tokens.success.light },
                    },
                    text: { "&:hover": { backgroundColor: alpha(tokens.brand.main, 0.06) } },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: { borderRadius: tokens.radius.md - 2 },
                },
            },
            MuiFab: {
                styleOverrides: {
                    root: { boxShadow: tokens.shadow.md, textTransform: "none", fontWeight: 600 },
                },
            },
            MuiToggleButton: {
                styleOverrides: {
                    root: {
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: tokens.border.main,
                        color: palette.text.secondary,
                        "&.Mui-selected": {
                            color: tokens.brand.dark,
                            backgroundColor: tokens.brand.lighter,
                            "&:hover": { backgroundColor: tokens.brand.light },
                        },
                    },
                },
            },
            MuiToggleButtonGroup: {
                styleOverrides: {
                    root: { borderRadius: tokens.radius.md - 2, backgroundColor: palette.background.paper },
                },
            },

            // ----------------------------------------------------------------
            // Surfaces
            // ----------------------------------------------------------------
            MuiPaper: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: { backgroundImage: "none" },
                    rounded: { borderRadius: tokens.radius.lg },
                    outlined: { borderColor: tokens.border.main },
                    elevation1: { boxShadow: tokens.shadow.sm },
                    elevation2: { boxShadow: tokens.shadow.md },
                    elevation3: { boxShadow: tokens.shadow.md },
                    elevation8: { boxShadow: tokens.shadow.lg },
                },
            },
            MuiCard: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: {
                        borderRadius: tokens.radius.lg,
                        border: `1px solid ${tokens.border.main}`,
                        backgroundColor: palette.background.paper,
                    },
                },
            },
            MuiCardContent: {
                styleOverrides: {
                    root: { padding: 20, "&:last-child": { paddingBottom: 20 } },
                },
            },
            MuiCardActionArea: {
                styleOverrides: { root: { borderRadius: "inherit" } },
            },
            MuiDivider: {
                styleOverrides: { root: { borderColor: tokens.border.main } },
            },
            MuiAppBar: {
                defaultProps: { elevation: 0, color: "inherit" },
                styleOverrides: {
                    root: { borderBottom: `1px solid ${tokens.border.main}`, backgroundColor: palette.background.paper },
                },
            },
            MuiDrawer: {
                styleOverrides: { paper: { borderColor: tokens.border.main } },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: { borderRadius: tokens.radius.xl, boxShadow: tokens.shadow.lg },
                },
            },
            MuiDialogTitle: {
                styleOverrides: { root: { fontWeight: 700, fontSize: "1.125rem", padding: "20px 24px 8px" } },
            },
            MuiDialogContent: {
                styleOverrides: { root: { padding: "12px 24px" } },
            },
            MuiDialogActions: {
                styleOverrides: { root: { padding: "12px 24px 20px", gap: 8 } },
            },
            MuiAccordion: {
                defaultProps: { disableGutters: true, elevation: 0 },
                styleOverrides: {
                    root: {
                        border: `1px solid ${tokens.border.main}`,
                        borderRadius: tokens.radius.md,
                        "&:before": { display: "none" },
                        "&:not(:last-of-type)": { marginBottom: 8 },
                    },
                },
            },
            MuiPopover: {
                styleOverrides: {
                    paper: { borderRadius: tokens.radius.md, boxShadow: tokens.shadow.lg, border: `1px solid ${tokens.border.light}` },
                },
            },
            MuiMenu: {
                styleOverrides: {
                    paper: { borderRadius: tokens.radius.md, boxShadow: tokens.shadow.lg, marginTop: 4 },
                    list: { padding: 6 },
                },
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        borderRadius: tokens.radius.sm,
                        minHeight: 38,
                        fontSize: "0.875rem",
                        "&.Mui-selected": {
                            backgroundColor: tokens.brand.lighter,
                            "&:hover": { backgroundColor: tokens.brand.light },
                        },
                    },
                },
            },
            MuiAutocomplete: {
                styleOverrides: {
                    paper: { borderRadius: tokens.radius.md, boxShadow: tokens.shadow.lg },
                    listbox: { padding: 6 },
                    option: { borderRadius: tokens.radius.sm, fontSize: "0.875rem" },
                },
            },

            // ----------------------------------------------------------------
            // Inputs
            // ----------------------------------------------------------------
            MuiTextField: {
                defaultProps: { variant: "outlined" },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: tokens.radius.md - 2,
                        backgroundColor: palette.background.paper,
                        transition: "box-shadow .2s ease",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: tokens.border.strong },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: palette.text.disabled },
                        "&.Mui-focused": { boxShadow: tokens.shadow.focus },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: tokens.brand.main, borderWidth: 1.5 },
                        "&.Mui-error.Mui-focused": { boxShadow: `0 0 0 4px ${alpha(tokens.error.main, 0.12)}` },
                        "&.Mui-disabled": { backgroundColor: tokens.surface.muted },
                    },
                    input: { "&::placeholder": { color: palette.text.disabled, opacity: 1 } },
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: { fontWeight: 500, color: palette.text.secondary },
                },
            },
            MuiFormLabel: {
                styleOverrides: {
                    root: { fontWeight: 600, color: palette.text.primary, fontSize: "0.875rem" },
                    asterisk: { color: tokens.error.main },
                },
            },
            MuiFormHelperText: {
                styleOverrides: { root: { marginInline: 2, marginTop: 6 } },
            },
            MuiFormControlLabel: {
                styleOverrides: { label: { fontSize: "0.9rem" } },
            },
            MuiCheckbox: {
                styleOverrides: { root: { borderRadius: 6 } },
            },
            MuiSwitch: {
                styleOverrides: {
                    switchBase: { "&.Mui-checked + .MuiSwitch-track": { opacity: 1 } },
                    track: { borderRadius: 999, backgroundColor: tokens.border.strong, opacity: 1 },
                },
            },
            MuiSlider: {
                styleOverrides: { thumb: { boxShadow: tokens.shadow.sm } },
            },

            // ----------------------------------------------------------------
            // Data display
            // ----------------------------------------------------------------
            MuiChip: {
                styleOverrides: {
                    root: { borderRadius: tokens.radius.sm, fontWeight: 600 },
                    sizeSmall: { height: 24, fontSize: "0.75rem" },
                    outlined: { borderColor: tokens.border.strong },
                    filledDefault: { backgroundColor: tokens.surface.muted },
                },
            },
            MuiAvatar: {
                styleOverrides: { root: { fontWeight: 700 } },
            },
            MuiBadge: {
                styleOverrides: { badge: { fontWeight: 700 } },
            },
            MuiTooltip: {
                defaultProps: { arrow: true },
                styleOverrides: {
                    tooltip: {
                        backgroundColor: palette.text.primary,
                        borderRadius: tokens.radius.sm,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        padding: "6px 10px",
                    },
                    arrow: { color: palette.text.primary },
                },
            },
            MuiTableContainer: {
                styleOverrides: { root: { borderRadius: tokens.radius.md } },
            },
            MuiTableHead: {
                styleOverrides: {
                    root: {
                        "& .MuiTableCell-head": {
                            backgroundColor: tokens.surface.subtle,
                            color: palette.text.secondary,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                        },
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: { root: { borderColor: tokens.border.light } },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: { borderRadius: 999, backgroundColor: tokens.surface.muted },
                    bar: { borderRadius: 999 },
                },
            },
            MuiSkeleton: {
                styleOverrides: { rounded: { borderRadius: tokens.radius.md } },
            },
            MuiRating: {
                styleOverrides: { iconFilled: { color: "#F59E0B" } },
            },

            // ----------------------------------------------------------------
            // Navigation & feedback
            // ----------------------------------------------------------------
            MuiTabs: {
                styleOverrides: {
                    root: { minHeight: 48 },
                    indicator: { height: 3, borderRadius: "3px 3px 0 0" },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: "none",
                        fontWeight: 600,
                        minHeight: 48,
                        color: palette.text.secondary,
                        "&.Mui-selected": { color: tokens.brand.main },
                    },
                },
            },
            MuiPaginationItem: {
                styleOverrides: {
                    root: { fontWeight: 600, borderRadius: tokens.radius.sm },
                },
            },
            MuiBreadcrumbs: {
                styleOverrides: { li: { fontSize: "0.875rem" } },
            },
            MuiStepIcon: {
                styleOverrides: {
                    root: { "&.Mui-completed": { color: tokens.success.main } },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: { borderRadius: tokens.radius.md, alignItems: "center" },
                    standardInfo: { backgroundColor: tokens.brand.lighter, color: tokens.brand.dark },
                    standardSuccess: { backgroundColor: tokens.success.light, color: tokens.success.dark },
                    standardWarning: { backgroundColor: tokens.warning.light, color: tokens.warning.dark },
                    standardError: { backgroundColor: tokens.error.light, color: tokens.error.dark },
                },
            },
            MuiSnackbarContent: {
                styleOverrides: { root: { borderRadius: tokens.radius.md } },
            },
            MuiBackdrop: {
                styleOverrides: {
                    root: { "&:not(.MuiBackdrop-invisible)": { backgroundColor: alpha("#0F172A", 0.45) } },
                },
            },
        },
    });
}

const theme = createAppTheme("ltr");

export default theme;
