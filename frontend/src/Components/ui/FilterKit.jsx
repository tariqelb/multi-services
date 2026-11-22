// src/Components/ui/FilterKit.jsx
// One filter design for every page of the application.
//
// <FilterPanel activeCount={2} onClear={reset}>
//     <FilterSearch value={q} onChange={setQ} placeholder="Search..." />
//     <FilterChips label="Property type" options={[{ value, label, count, icon }]} value={type} onChange={setType} />
//     <FilterGrid>
//         <FilterSelect label="City" value={city} onChange={setCity} options={[{ value, label }]} />
//         <FilterField label="Min price" type="number" value={min} onChange={setMin} />
//     </FilterGrid>
// </FilterPanel>

import {
    Badge,
    Box,
    Button,
    Chip,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

/** Shared field look inside filters. */
export const filterFieldSx = {
    minWidth: 0,
    width: "100%",
    "& .MuiOutlinedInput-root": {
        bgcolor: "background.paper",
        borderRadius: "10px",
    },
};

/**
 * Container of every filter block.
 * - title: defaults to "Filters"
 * - activeCount: number of active filters (badge + enables the clear button)
 * - onClear: reset handler (button hidden when not provided)
 * - action: extra element displayed in the header (e.g. results count)
 */
export function FilterPanel({ title, activeCount = 0, onClear, clearLabel, action, children, sx }) {
    const { t } = useTranslation();

    return (
        <Paper
            variant="outlined"
            component="section"
            aria-label={title || t("ui.filters.title", "Filters")}
            sx={(theme) => ({
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                p: { xs: 1.75, sm: 2.25 },
                mb: { xs: 2.5, md: 3 },
                borderRadius: "16px",
                bgcolor: "background.paper",
                boxShadow: theme.customShadows?.sm,
                ...(typeof sx === "function" ? sx(theme) : sx),
            })}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                    <Badge
                        color="primary"
                        badgeContent={activeCount}
                        invisible={!activeCount}
                        sx={{ "& .MuiBadge-badge": { fontWeight: 700 } }}
                    >
                        <Box
                            sx={(theme) => ({
                                width: 34,
                                height: 34,
                                borderRadius: "10px",
                                display: "grid",
                                placeItems: "center",
                                color: "primary.main",
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                            })}
                        >
                            <TuneRoundedIcon fontSize="small" />
                        </Box>
                    </Badge>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                        {title || t("ui.filters.title", "Filters")}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                    {action}
                    {onClear && (
                        <Button
                            size="small"
                            variant="text"
                            color="inherit"
                            startIcon={<RestartAltRoundedIcon />}
                            onClick={onClear}
                            disabled={!activeCount}
                            sx={{ color: "text.secondary", fontWeight: 600 }}
                        >
                            {clearLabel || t("ui.filters.clear", "Clear")}
                        </Button>
                    )}
                </Stack>
            </Stack>

            <Stack spacing={2}>{children}</Stack>
        </Paper>
    );
}

/** Responsive grid for selects / fields. */
export function FilterGrid({ children, min = 190 }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    md: `repeat(auto-fill, minmax(${min}px, 1fr))`,
                },
                gap: { xs: 1.25, sm: 1.5 },
                width: "100%",
                minWidth: 0,
                "& > .filter-full": { gridColumn: "1 / -1" },
            }}
        >
            {children}
        </Box>
    );
}

/** Full width search field (Enter calls onSubmit when provided). */
export function FilterSearch({ value, onChange, placeholder, onSubmit, submitLabel, inputProps }) {
    const { t } = useTranslation();

    return (
        <Stack direction="row" spacing={1} sx={{ width: "100%", minWidth: 0 }}>
            <TextField
                fullWidth
                size="small"
                value={value ?? ""}
                onChange={(event) => onChange?.(event.target.value, event)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" && onSubmit) {
                        event.preventDefault();
                        onSubmit();
                    }
                }}
                placeholder={placeholder || t("ui.filters.search", "Search...")}
                sx={filterFieldSx}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchRoundedIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                        ),
                    },
                    htmlInput: inputProps,
                }}
            />
            {onSubmit && (
                <Button variant="contained" onClick={onSubmit} sx={{ flexShrink: 0, px: 2.5 }}>
                    {submitLabel || t("ui.filters.searchButton", "Search")}
                </Button>
            )}
        </Stack>
    );
}

/** Select based on TextField (same height and look as other fields). */
export function FilterSelect({ label, value, onChange, options = [], className, disabled, startIcon }) {
    return (
        <TextField
            select
            size="small"
            label={label}
            value={value ?? ""}
            onChange={(event) => onChange?.(event.target.value, event)}
            className={className}
            disabled={disabled}
            sx={filterFieldSx}
            slotProps={{
                select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 360 } } } } },
                input: startIcon
                    ? { startAdornment: <InputAdornment position="start">{startIcon}</InputAdornment> }
                    : undefined,
            }}
        >
            {options.map((option) => (
                <MenuItem key={String(option.value)} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    );
}

/** Text / number field with the filter look. */
export function FilterField({ label, value, onChange, type = "text", placeholder, className, endAdornment }) {
    return (
        <TextField
            size="small"
            type={type}
            label={label}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(event) => onChange?.(event.target.value, event)}
            className={className}
            sx={filterFieldSx}
            slotProps={{
                htmlInput: type === "number" ? { min: 0 } : undefined,
                input: endAdornment
                    ? { endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment> }
                    : undefined,
            }}
        />
    );
}

/**
 * Chip group.
 * options: [{ value, label, count?, icon? }]
 * value: selected value (or array when multiple)
 * Mobile: one horizontal scrolling row. Desktop: wraps.
 */
export function FilterChips({ label, options = [], value, onChange, multiple = false }) {
    const isActive = (optionValue) =>
        multiple ? Array.isArray(value) && value.includes(optionValue) : value === optionValue;

    const handleClick = (optionValue) => {
        if (!multiple) {
            onChange?.(optionValue);
            return;
        }
        const current = Array.isArray(value) ? value : [];
        onChange?.(
            current.includes(optionValue)
                ? current.filter((item) => item !== optionValue)
                : [...current, optionValue]
        );
    };

    return (
        <Box sx={{ minWidth: 0 }}>
            {label && (
                <Typography
                    variant="caption"
                    sx={{ display: "block", mb: 0.75, fontWeight: 700, color: "text.secondary", letterSpacing: 0.2 }}
                >
                    {label}
                </Typography>
            )}

            <Box
                role="group"
                aria-label={typeof label === "string" ? label : undefined}
                sx={{
                    display: "flex",
                    gap: 0.75,
                    flexWrap: { xs: "nowrap", sm: "wrap" },
                    overflowX: { xs: "auto", sm: "visible" },
                    pb: { xs: 0.5, sm: 0 },
                    mx: { xs: -0.25, sm: 0 },
                    px: { xs: 0.25, sm: 0 },
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                {options.map((option) => {
                    const active = isActive(option.value);
                    const hasCount = option.count !== undefined && option.count !== null;

                    return (
                        <Chip
                            key={String(option.value)}
                            icon={option.icon}
                            clickable
                            onClick={() => handleClick(option.value)}
                            color={active ? "primary" : "default"}
                            variant={active ? "filled" : "outlined"}
                            aria-pressed={active}
                            label={
                                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                                    {option.label}
                                    {hasCount && (
                                        <Box
                                            component="span"
                                            sx={{
                                                minWidth: 20,
                                                height: 18,
                                                px: 0.5,
                                                borderRadius: "6px",
                                                display: "inline-grid",
                                                placeItems: "center",
                                                fontSize: "0.7rem",
                                                fontWeight: 700,
                                                bgcolor: active ? "rgba(255,255,255,0.22)" : "action.hover",
                                                color: active ? "#fff" : "text.secondary",
                                            }}
                                        >
                                            {option.count}
                                        </Box>
                                    )}
                                </Box>
                            }
                            sx={{
                                flexShrink: 0,
                                height: 34,
                                borderRadius: "999px",
                                fontWeight: 600,
                                ...(active ? {} : { bgcolor: "background.paper" }),
                                "& .MuiChip-icon": { fontSize: 18 },
                            }}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}
