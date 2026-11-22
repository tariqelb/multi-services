// admin/components/shared/AnalyticsUI.jsx
// Reusable building blocks for every dashboard analytics section.

import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Tooltip as MuiTooltip,
    Typography,
} from "@mui/material";

import {
    RefreshOutlined,
    TrendingDown,
    TrendingFlat,
    TrendingUp,
} from "@mui/icons-material";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import axiosInstance from "../../../../../api/axiosInstance";

import {
    CHART_COLORS,
    RANGE_OPTIONS,
    formatBucketLabel,
    formatHour,
    formatNumber,
    formatPercent,
    maxOf,
} from "./analyticsUtils";

const GRID_STROKE = "#E2E8F0";
const AXIS_TICK = { fontSize: 11, fill: "#64748B" };

const tooltipStyle = {
    borderRadius: 10,
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
    fontSize: "0.85rem",
};

// -----------------------------------------------------------------------------
// Charts in Arabic (RTL)
//
// Recharts draws SVG text with text-anchor start/end. Inside an RTL page
// those anchors flip, so axis labels were drawn over the bars. Charts are
// drawn in an LTR box (Arabic text still renders correctly) and mirrored
// on purpose where it helps reading (horizontal bars grow from the right).
// Tooltips and legends keep the page direction.
// -----------------------------------------------------------------------------

const useIsRtl = () => {
    const { i18n } = useTranslation();
    return i18n.dir(i18n.resolvedLanguage || i18n.language) === "rtl";
};

function ChartFrame({ children }) {
    return (
        // dir attribute, not sx: the RTL style plugin would flip "direction".
        <Box dir="ltr" sx={{ width: "100%", height: "100%" }}>
            {children}
        </Box>
    );
}

const tooltipProps = (isRtl) => ({
    contentStyle: { ...tooltipStyle, direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left" },
});

const legendProps = (isRtl) => ({
    iconType: "circle",
    wrapperStyle: { direction: isRtl ? "rtl" : "ltr" },
});

// -----------------------------------------------------------------------------
// Data hook
// -----------------------------------------------------------------------------

/**
 * Fetch analytics and keep the previous data visible while reloading.
 * Pass refreshMs to poll (e.g. live visitors).
 */
export function useAnalyticsData(url, params = {}, { refreshMs = 0 } = {}) {
    const { t } = useTranslation();

    const [state, setState] = useState({
        data: null,
        loading: true,
        error: "",
    });

    const [reloadKey, setReloadKey] = useState(0);
    const paramsKey = JSON.stringify(params);

    useEffect(() => {
        let cancelled = false;

        setState((previous) => ({ ...previous, loading: true, error: "" }));

        axiosInstance
            .get(url, { params: JSON.parse(paramsKey) })
            .then((response) => {
                if (!cancelled) {
                    setState({ data: response.data, loading: false, error: "" });
                }
            })
            .catch((error) => {
                if (cancelled) return;

                console.error(`Analytics request failed (${url}):`, error);

                setState((previous) => ({
                    ...previous,
                    loading: false,
                    error:
                        error.response?.data?.message ||
                        t("analytics.loadError", "Failed to load analytics."),
                }));
            });

        return () => {
            cancelled = true;
        };
    }, [url, paramsKey, reloadKey, t]);

    useEffect(() => {
        if (!refreshMs) return undefined;

        const interval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                setReloadKey((key) => key + 1);
            }
        }, refreshMs);

        return () => window.clearInterval(interval);
    }, [refreshMs]);

    return {
        ...state,
        reload: () => setReloadKey((key) => key + 1),
    };
}

// -----------------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------------

export function SectionHeader({ icon, title, subtitle, children }) {
    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {icon && (
                        <Box sx={{ color: "primary.main", display: "flex" }}>
                            {icon}
                        </Box>
                    )}

                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {title}
                    </Typography>
                </Stack>

                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 0.5 }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {children && (
                <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}
                >
                    {children}
                </Stack>
            )}
        </Stack>
    );
}

export function RangeSelect({ value, onChange, options = RANGE_OPTIONS }) {
    const { t } = useTranslation();

    return (
        <FormControl size="small" sx={{ minWidth: 165 }}>
            <Select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                inputProps={{
                    "aria-label": t("analytics.dateRange", "Date range"),
                }}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {t(`analytics.ranges.${option.key}`, option.fallback)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export function RefreshButton({ onClick, loading }) {
    const { t } = useTranslation();

    return (
        <MuiTooltip title={t("analytics.refresh", "Refresh")}>
            <span>
                <IconButton
                    onClick={onClick}
                    disabled={loading}
                    sx={{ border: "1px solid", borderColor: "divider" }}
                >
                    {loading ? (
                        <CircularProgress size={20} />
                    ) : (
                        <RefreshOutlined />
                    )}
                </IconButton>
            </span>
        </MuiTooltip>
    );
}

export function KpiGrid({ children, columns = 4 }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    lg: `repeat(${columns}, minmax(0, 1fr))`,
                },
                gap: { xs: 1.25, sm: 2 },
            }}
        >
            {children}
        </Box>
    );
}

export function ChartGrid({ children, template = "1fr 1fr" }) {
    const columns = template
        .split(" ")
        .map((part) => `minmax(0, ${part})`)
        .join(" ");

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    lg: columns,
                },
                gap: 2,
                alignItems: "stretch",
            }}
        >
            {children}
        </Box>
    );
}

export function LoadingState({ minHeight = 320 }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: minHeight }}
        >
            <CircularProgress />
        </Box>
    );
}

export function EmptyState({ message, height = 220 }) {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                px: 2,
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
            }}
        >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {message || t("analytics.noData", "No data for this period.")}
            </Typography>
        </Box>
    );
}

export function ErrorBanner({ error }) {
    if (!error) return null;

    return <Alert severity="error">{error}</Alert>;
}

// -----------------------------------------------------------------------------
// Cards
// -----------------------------------------------------------------------------

/**
 * change: number (%), null (= new), undefined (= hidden).
 * inverse: true when a decrease is good (e.g. bounce rate).
 */
export function ChangeIndicator({ change, inverse = false, locale }) {
    const { t } = useTranslation();

    if (change === undefined) return null;

    if (change === null) {
        return (
            <Chip
                size="small"
                color="info"
                variant="outlined"
                label={t("analytics.new", "New")}
                sx={{ fontWeight: 700, height: 22 }}
            />
        );
    }

    const isUp = change > 0;
    const isFlat = change === 0;
    const isGood = inverse ? change < 0 : change > 0;

    const icon = isFlat ? (
        <TrendingFlat />
    ) : isUp ? (
        <TrendingUp />
    ) : (
        <TrendingDown />
    );

    return (
        <MuiTooltip
            title={t("analytics.vsPrevious", "Compared with the previous period")}
        >
            <Chip
                size="small"
                variant="outlined"
                icon={icon}
                color={isFlat ? "default" : isGood ? "success" : "error"}
                label={`${isUp ? "+" : ""}${formatPercent(change, locale)}`}
                sx={{ fontWeight: 700, height: 22 }}
            />
        </MuiTooltip>
    );
}

export function StatCard({
    title,
    value,
    description,
    icon,
    color = "#2563EB",
    change,
    inverse,
    locale,
}) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                    borderColor: color,
                    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
                },
            }}
        >
            <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
                <Stack
                    direction="row"
                    spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", fontWeight: 600, overflowWrap: "anywhere" }}
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="h4"
                            sx={{ fontWeight: 800, mt: 0.75, letterSpacing: "-0.5px" }}
                        >
                            {value}
                        </Typography>
                    </Box>

                    {icon && (
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                flexShrink: 0,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: 2,
                                bgcolor: `${color}14`,
                                color,
                                "& svg": { fontSize: 24 },
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Stack>

                <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ alignItems: "center", flexWrap: "wrap", mt: 1 }}
                >
                    <ChangeIndicator
                        change={change}
                        inverse={inverse}
                        locale={locale}
                    />

                    {description && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {description}
                        </Typography>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

export function ChartCard({ title, subtitle, action, height = 320, children }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                width: "100%",
                minWidth: 0,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2, md: 2.5 },
                    "&:last-child": { pb: { xs: 2, md: 2.5 } },
                }}
            >
                <Stack
                    direction="row"
                    spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 750, overflowWrap: "anywhere" }}
                        >
                            {title}
                        </Typography>

                        {subtitle && (
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5, overflowWrap: "anywhere" }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    {action}
                </Stack>

                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        height: height || "auto",
                    }}
                >
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
}

// -----------------------------------------------------------------------------
// Charts
// -----------------------------------------------------------------------------

const hasValues = (data = [], keys = []) =>
    data.some((row) => keys.some((key) => Number(row[key]) > 0));

/**
 * series: [{ key, name, color }]
 */
export function TrendChart({ data = [], series = [], locale, stacked = false }) {
    const isRtl = useIsRtl();
    const rawId = useId();
    const id = rawId.replace(/[^a-zA-Z0-9]/g, "");

    const chartData = useMemo(
        () =>
            data.map((row) => ({
                ...row,
                label: formatBucketLabel(row.date, locale),
            })),
        [data, locale]
    );

    if (!hasValues(data, series.map((item) => item.key))) {
        return <EmptyState height="100%" />;
    }

    return (
        <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={chartData}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
                <defs>
                    {series.map((item) => (
                        <linearGradient
                            key={item.key}
                            id={`grad-${id}-${item.key}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop offset="0%" stopColor={item.color} stopOpacity={0.28} />
                            <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
                        </linearGradient>
                    ))}
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />

                <XAxis
                    dataKey="label"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={{ stroke: GRID_STROKE }}
                    minTickGap={18}
                />

                <YAxis
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                />

                <Tooltip
                    {...tooltipProps(isRtl)}
                    formatter={(value, name) => [formatNumber(value, locale), name]}
                />

                {series.length > 1 && <Legend {...legendProps(isRtl)} />}

                {series.map((item) => (
                    <Area
                        key={item.key}
                        type="monotone"
                        dataKey={item.key}
                        name={item.name}
                        stroke={item.color}
                        strokeWidth={2.5}
                        fill={`url(#grad-${id}-${item.key})`}
                        stackId={stacked ? "stack" : undefined}
                        activeDot={{ r: 5 }}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
        </ChartFrame>
    );
}

/**
 * bars: [{ key, name, color, stackId? }]
 * layout "vertical" = horizontal bars (best for long labels).
 */
export function BarChartView({
    data = [],
    bars = [],
    nameKey = "name",
    layout = "horizontal",
    locale,
    labelWidth = 120,
}) {
    const isRtl = useIsRtl();

    if (!hasValues(data, bars.map((item) => item.key))) {
        return <EmptyState height="100%" />;
    }

    const isVertical = layout === "vertical";

    // Arabic: labels on the right, bars growing to the left.
    const mirror = isRtl && isVertical;

    return (
        <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                layout={layout}
                margin={{
                    top: 8,
                    right: mirror ? 8 : 16,
                    left: mirror ? 16 : isVertical ? 8 : 0,
                    bottom: isVertical ? 0 : 30,
                }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={isVertical}
                    horizontal={!isVertical}
                    stroke={GRID_STROKE}
                />

                {isVertical ? (
                    <>
                        <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} reversed={mirror} />
                        <YAxis
                            type="category"
                            dataKey={nameKey}
                            width={labelWidth}
                            tick={AXIS_TICK}
                            tickLine={false}
                            orientation={mirror ? "right" : "left"}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey={nameKey}
                            interval={0}
                            angle={isRtl ? 20 : -20}
                            textAnchor={isRtl ? "start" : "end"}
                            reversed={isRtl}
                            height={50}
                            tick={AXIS_TICK}
                            tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                            width={40}
                        />
                    </>
                )}

                <Tooltip
                    cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
                    {...tooltipProps(isRtl)}
                    formatter={(value, name) => [formatNumber(value, locale), name]}
                />

                {bars.length > 1 && <Legend {...legendProps(isRtl)} />}

                {bars.map((item, index) => (
                    <Bar
                        key={item.key}
                        dataKey={item.key}
                        name={item.name}
                        fill={item.color || CHART_COLORS[index % CHART_COLORS.length]}
                        stackId={item.stackId}
                        maxBarSize={isVertical ? 26 : 46}
                        radius={isVertical ? (mirror ? [6, 0, 0, 6] : [0, 6, 6, 0]) : [6, 6, 0, 0]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
        </ChartFrame>
    );
}

export function DonutChart({ data = [], nameKey = "name", valueKey = "value", locale }) {
    const isRtl = useIsRtl();

    if (!hasValues(data, [valueKey])) {
        return <EmptyState height="100%" />;
    }

    const total = data.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);

    return (
        <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey={valueKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="45%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={3}
                >
                    {data.map((item, index) => (
                        <Cell
                            key={`${item[nameKey]}-${index}`}
                            fill={item.color || CHART_COLORS[index % CHART_COLORS.length]}
                        />
                    ))}
                </Pie>

                <Tooltip
                    {...tooltipProps(isRtl)}
                    formatter={(value, name) => [
                        `${formatNumber(value, locale)} (${formatPercent(
                            total ? (value / total) * 100 : 0,
                            locale
                        )})`,
                        name,
                    ]}
                />

                <Legend verticalAlign="bottom" {...legendProps(isRtl)} />
            </PieChart>
        </ResponsiveContainer>
        </ChartFrame>
    );
}

export function HourlyChart({ data = [], valueKey = "count", name, color = "#9333EA", locale }) {
    const isRtl = useIsRtl();
    const chartData = useMemo(
        () => data.map((row) => ({ ...row, label: formatHour(row.hour) })),
        [data]
    );

    const peak = maxOf(data, valueKey);

    if (!peak) return <EmptyState height="100%" />;

    return (
        <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} interval={2} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                    cursor={{ fill: "rgba(147, 51, 234, 0.06)" }}
                    {...tooltipProps(isRtl)}
                    formatter={(value) => [formatNumber(value, locale), name]}
                />
                <Bar dataKey={valueKey} name={name} radius={[4, 4, 0, 0]}>
                    {chartData.map((row) => (
                        <Cell
                            key={row.hour}
                            fill={color}
                            fillOpacity={0.3 + 0.7 * ((row[valueKey] || 0) / peak)}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
        </ChartFrame>
    );
}

// Busiest hour helper for "best time" insights.
export const getPeakHour = (data = [], valueKey) => {
    const peak = data.reduce(
        (best, row) => ((row[valueKey] || 0) > (best?.[valueKey] || 0) ? row : best),
        null
    );

    return peak && peak[valueKey] > 0 ? peak.hour : null;
};

// -----------------------------------------------------------------------------
// Lists
// -----------------------------------------------------------------------------

/**
 * items: [{ key, primary, secondary, value, valueLabel, extra, onClick }]
 */
export function RankedList({ items = [], color = "#2563EB", emptyMessage, showRank = true }) {
    const max = maxOf(items, "value");

    if (!items.length) {
        return <EmptyState message={emptyMessage} height={160} />;
    }

    return (
        <Stack spacing={1.25}>
            {items.map((item, index) => (
                <Box
                    key={item.key ?? index}
                    onClick={item.onClick}
                    sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        cursor: item.onClick ? "pointer" : "default",
                        minWidth: 0,
                    }}
                >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        {showRank && (
                            <Box
                                sx={{
                                    width: 28,
                                    height: 28,
                                    flexShrink: 0,
                                    borderRadius: 1.5,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: index < 3 ? color : "background.paper",
                                    color: index < 3 ? "#fff" : "text.secondary",
                                    fontWeight: 800,
                                    fontSize: 13,
                                }}
                            >
                                {index + 1}
                            </Box>
                        )}

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                {item.primary}
                            </Typography>

                            {item.secondary && (
                                <Typography
                                    variant="caption"
                                    noWrap
                                    component="div" sx={{ color: "text.secondary" }}
                                >
                                    {item.secondary}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ textAlign: "end", flexShrink: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {item.valueLabel ?? item.value}
                            </Typography>

                            {item.extra && (
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {item.extra}
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    <LinearProgress
                        variant="determinate"
                        value={max ? ((Number(item.value) || 0) / max) * 100 : 0}
                        sx={{
                            mt: 1,
                            height: 5,
                            borderRadius: 5,
                            bgcolor: "background.paper",
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 5,
                                bgcolor: color,
                            },
                        }}
                    />
                </Box>
            ))}
        </Stack>
    );
}

/**
 * Small labelled progress bar used for rates (verification, retention...).
 */
export function RateBar({ label, value, color = "#2563EB", caption, locale }) {
    return (
        <Box>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {label}
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {formatPercent(value, locale)}
                </Typography>
            </Stack>

            <LinearProgress
                variant="determinate"
                value={Math.min(100, Number(value) || 0)}
                sx={{
                    mt: 0.75,
                    height: 8,
                    borderRadius: 8,
                    bgcolor: "action.hover",
                    "& .MuiLinearProgress-bar": {
                        borderRadius: 8,
                        bgcolor: color,
                    },
                }}
            />

            {caption && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {caption}
                </Typography>
            )}
        </Box>
    );
}
