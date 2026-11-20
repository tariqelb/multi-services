// src/Components/ui/FormKit.jsx
// One design for every insert / publish form in the application
// (properties, roommate announcements, establishments...).

import { Children, isValidElement } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

// -----------------------------------------------------------------------------
// Page container
// -----------------------------------------------------------------------------

export function FormPage({ children, maxWidth = 1040 }) {
    return (
        <Box
            sx={{
                width: "100%",
                maxWidth,
                mx: "auto",
                px: { xs: 1.5, sm: 3 },
                py: { xs: 2, md: 4 },
                boxSizing: "border-box",
            }}
        >
            {children}
        </Box>
    );
}

// -----------------------------------------------------------------------------
// Page header (badge, title, subtitle, required-fields note)
// -----------------------------------------------------------------------------

export function FormPageHeader({
    badge,
    title,
    subtitle,
    icon,
    requiredNote,
    showRequiredNote = true,
    action,
}) {
    const { t } = useTranslation();

    return (
        <Paper
            variant="outlined"
            sx={(theme) => ({
                position: "relative",
                overflow: "hidden",
                mb: { xs: 2.5, md: 3.5 },
                p: { xs: 2.5, sm: 3.5, md: 4 },
                borderRadius: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 55%)`,
            })}
        >
            {/* Decorative circle */}
            <Box
                aria-hidden
                sx={(theme) => ({
                    position: "absolute",
                    insetInlineEnd: -60,
                    top: -60,
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                })}
            />

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2.5}
                sx={{ alignItems: { xs: "flex-start", sm: "center" }, position: "relative" }}
            >
                {icon && (
                    <Box
                        sx={(theme) => ({
                            width: 56,
                            height: 56,
                            borderRadius: 3,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            color: "#fff",
                            bgcolor: "primary.main",
                            boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                            "& svg": { fontSize: 28 },
                        })}
                    >
                        {icon}
                    </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {badge && (
                        <Chip
                            label={badge}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                                mb: 1.25,
                                bgcolor: "background.paper",
                                fontSize: "0.68rem",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}
                        />
                    )}

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontSize: { xs: "1.45rem", sm: "1.75rem", md: "1.9rem" },
                            overflowWrap: "anywhere",
                        }}
                    >
                        {title}
                    </Typography>

                    {subtitle && (
                        <Typography
                            sx={{ color: "text.secondary", mt: 1, maxWidth: 680, lineHeight: 1.75 }}
                        >
                            {subtitle}
                        </Typography>
                    )}

                    {showRequiredNote && (
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{ alignItems: "center", mt: 1.75 }}
                        >
                            <CheckCircleRoundedIcon
                                sx={{ fontSize: 18, color: "success.main" }}
                            />
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {requiredNote ||
                                    t("ui.form.requiredNote", "Fields marked with * are required.")}
                            </Typography>
                        </Stack>
                    )}
                </Box>

                {action}
            </Stack>
        </Paper>
    );
}

// -----------------------------------------------------------------------------
// Sections
// -----------------------------------------------------------------------------

const formatNumber = (number) =>
    number === undefined || number === null || number === ""
        ? null
        : String(number).padStart(2, "0");

/**
 * Header shown at the top of every form section.
 * `icon` may be an MUI icon element (recommended) or text.
 */
export function FormSectionHeader({ icon, title, subtitle, number, action }) {
    const label = formatNumber(number);

    return (
        <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
                {icon && (
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            bgcolor: "primary.lighter",
                            color: "primary.main",
                            fontSize: "1.25rem",
                            "& svg": { fontSize: 22 },
                        }}
                    >
                        {icon}
                    </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" component="h2" sx={{ overflowWrap: "anywhere" }}>
                        {title}
                    </Typography>

                    {subtitle && (
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {action}

                {label && (
                    <Typography
                        aria-hidden
                        sx={{
                            display: { xs: "none", sm: "block" },
                            fontWeight: 800,
                            fontSize: "1.5rem",
                            lineHeight: 1,
                            color: "primary.light",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {label}
                    </Typography>
                )}
            </Stack>
        </Box>
    );
}

/** Card that wraps one section of a form. */
export function FormSectionPaper({ children, id, sx }) {
    return (
        <Paper
            id={id}
            variant="outlined"
            sx={{
                p: { xs: 2, sm: 3, md: 3.5 },
                mb: { xs: 2, md: 3 },
                borderRadius: 4,
                bgcolor: "background.paper",
                boxShadow: (theme) => theme.customShadows?.xs,
                scrollMarginTop: 88,
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                ...sx,
            }}
        >
            {children}
        </Paper>
    );
}

/** Convenience: paper + header in one component. */
export function FormSection({ id, icon, title, subtitle, number, action, children, sx }) {
    return (
        <FormSectionPaper id={id} sx={sx}>
            <FormSectionHeader
                icon={icon}
                title={title}
                subtitle={subtitle}
                number={number}
                action={action}
            />
            {children}
        </FormSectionPaper>
    );
}

// Backward-compatible names used by the existing forms.
export const SectionHeader = FormSectionHeader;
export const SectionPaper = FormSectionPaper;

// -----------------------------------------------------------------------------
// Layout helpers
// -----------------------------------------------------------------------------

/** Responsive grid: 1 column on mobile, `columns` on larger screens. */
export function FormGrid({ children, columns = 2, gap = 2.5, sx }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`,
                    md: `repeat(${columns}, minmax(0, 1fr))`,
                },
                gap,
                ...sx,
            }}
        >
            {Children.map(children, (child) =>
                isValidElement(child) ? child : null
            )}
        </Box>
    );
}

/** Make a FormGrid child span the full row. */
export function FullRow({ children }) {
    return <Box sx={{ gridColumn: "1 / -1", minWidth: 0 }}>{children}</Box>;
}

/** Small uppercase group title inside a section. */
export function FieldGroupTitle({ children, sx }) {
    return (
        <Typography
            variant="overline"
            component="div"
            sx={{ color: "text.secondary", display: "block", mb: 1.25, mt: 0.5, ...sx }}
        >
            {children}
        </Typography>
    );
}

// -----------------------------------------------------------------------------
// Option cards (single / multiple choice displayed as pills)
// -----------------------------------------------------------------------------

/**
 * options: [{ value, label, icon? }]
 * value: string (single) or array (multiple)
 */
export function ChoiceChips({ options = [], value, onChange, multiple = false, size = "medium" }) {
    const isSelected = (optionValue) =>
        multiple ? (value || []).includes(optionValue) : value === optionValue;

    const toggle = (optionValue) => {
        if (!onChange) return;

        if (!multiple) {
            onChange(optionValue);
            return;
        }

        const current = value || [];

        onChange(
            current.includes(optionValue)
                ? current.filter((item) => item !== optionValue)
                : [...current, optionValue]
        );
    };

    return (
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
            {options.map((option) => {
                const selected = isSelected(option.value);

                return (
                    <Chip
                        key={option.value}
                        icon={option.icon}
                        label={option.label}
                        size={size}
                        clickable
                        color={selected ? "primary" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        onClick={() => toggle(option.value)}
                        aria-pressed={selected}
                        sx={{ px: 0.5, height: size === "small" ? 28 : 36, borderRadius: 2.5 }}
                    />
                );
            })}
        </Stack>
    );
}

// -----------------------------------------------------------------------------
// Submit bar (last card of every form)
// -----------------------------------------------------------------------------

export function FormSubmitBar({
    title,
    subtitle,
    loading = false,
    disabled = false,
    submitLabel,
    loadingLabel,
    onSubmit,
    onReset,
    resetLabel,
    submitIcon,
    sticky = true,
}) {
    const { t } = useTranslation();

    return (
        <Paper
            variant="outlined"
            sx={(theme) => ({
                p: { xs: 2, sm: 2.5 },
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.paper, 0.92),
                backdropFilter: "blur(10px)",
                boxShadow: theme.customShadows?.md,
                ...(sticky && {
                    position: "sticky",
                    bottom: { xs: 8, md: 16 },
                    zIndex: 5,
                }),
            })}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}
            >
                <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
                    <Typography variant="subtitle1">
                        {title || t("ui.form.readyTitle", "Ready to publish?")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {subtitle ||
                            t("ui.form.readySubtitle", "Check your information before submitting.")}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    {onReset && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={onReset}
                            disabled={loading}
                            startIcon={<RestartAltRoundedIcon />}
                        >
                            {resetLabel || t("ui.form.reset", "Reset")}
                        </Button>
                    )}

                    <Button
                        type={onSubmit ? "button" : "submit"}
                        onClick={onSubmit}
                        variant="contained"
                        size="large"
                        disabled={loading || disabled}
                        endIcon={
                            loading ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : (
                                submitIcon || <SendRoundedIcon sx={{ transform: (theme) => theme.direction === "rtl" ? "scaleX(-1)" : "none" }} />
                            )
                        }
                        sx={{ flex: { xs: 1, sm: "0 0 auto" }, minWidth: { sm: 220 } }}
                    >
                        {loading
                            ? loadingLabel || t("ui.form.publishing", "Publishing...")
                            : submitLabel || t("ui.form.publish", "Publish")}
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
}

// -----------------------------------------------------------------------------
// Image upload drop zone
// -----------------------------------------------------------------------------

export function UploadDropzone({
    icon,
    title,
    hint,
    buttonLabel,
    onClick,
    disabled,
    children,
}) {
    return (
        <Box
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={disabled ? undefined : onClick}
            onKeyDown={(event) => {
                if (!disabled && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onClick?.();
                }
            }}
            sx={(theme) => ({
                p: { xs: 3, sm: 4 },
                textAlign: "center",
                borderRadius: 3,
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                transition: "all .2s ease",
                "&:hover": disabled
                    ? undefined
                    : {
                        borderColor: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                    },
            })}
        >
            {icon && (
                <Box sx={{ color: "primary.main", mb: 1, "& svg": { fontSize: 40 } }}>
                    {icon}
                </Box>
            )}
            {title && <Typography variant="subtitle1">{title}</Typography>}
            {hint && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    {hint}
                </Typography>
            )}
            {buttonLabel && (
                <Button variant="outlined" color="primary" size="small" sx={{ mt: 2 }} tabIndex={-1}>
                    {buttonLabel}
                </Button>
            )}
            {children}
        </Box>
    );
}

// -----------------------------------------------------------------------------
// Selected images preview
// -----------------------------------------------------------------------------

/**
 * items: [{ key, src, alt }]
 * The first image is marked as the cover / main photo.
 */
export function ImagePreviewGrid({
    items = [],
    onRemove,
    mainLabel,
    removeLabel,
    countLabel,
    title,
}) {
    const { t } = useTranslation();

    if (!items.length) return null;

    return (
        <Box sx={{ mt: 3 }}>
            {(title || countLabel) && (
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="subtitle2">{title}</Typography>
                    {countLabel && <Chip size="small" color="primary" variant="outlined" label={countLabel} />}
                </Stack>
            )}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        sm: "repeat(3, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                }}
            >
                {items.map((item, index) => (
                    <Box
                        key={item.key || `${item.src}-${index}`}
                        sx={{
                            position: "relative",
                            aspectRatio: "4 / 3",
                            borderRadius: 2.5,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.muted",
                        }}
                    >
                        <Box
                            component="img"
                            src={item.src}
                            alt={item.alt || ""}
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />

                        {onRemove && (
                            <Button
                                size="small"
                                color="error"
                                onClick={() => onRemove(index)}
                                sx={{
                                    position: "absolute",
                                    top: 6,
                                    insetInlineEnd: 6,
                                    minHeight: 26,
                                    px: 1,
                                    fontSize: "0.72rem",
                                    bgcolor: "rgba(255,255,255,0.95)",
                                    "&:hover": { bgcolor: "#fff" },
                                }}
                            >
                                {removeLabel || t("ui.form.remove", "Remove")}
                            </Button>
                        )}

                        {index === 0 && (
                            <Chip
                                size="small"
                                color="primary"
                                label={mainLabel || t("ui.form.coverPhoto", "Cover")}
                                sx={{ position: "absolute", bottom: 6, insetInlineStart: 6 }}
                            />
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
