
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;

const PADDING = {
    top: 25,
    right: 25,
    bottom: 45,
    left: 40,
};

function getPoints(data, key, maxValue) {
    const chartWidth =
        CHART_WIDTH - PADDING.left - PADDING.right;

    const chartHeight =
        CHART_HEIGHT - PADDING.top - PADDING.bottom;

    return data.map((item, index) => {
        const x =
            data.length === 1
                ? PADDING.left + chartWidth / 2
                : PADDING.left +
                  (index / (data.length - 1)) * chartWidth;

        const y =
            PADDING.top +
            chartHeight -
            ((item[key] || 0) / maxValue) * chartHeight;

        return {
            x,
            y,
            value: item[key] || 0,
        };
    });
}

export default function ContactActivityChart({ data = [] }) {
    const { t, i18n } = useTranslation();

    const safeData = [...data]
        .sort((a, b) => a.date.localeCompare(b.date));

    const maxValue = Math.max(
        1,
        ...safeData.map((item) =>
            Math.max(item.calls || 0, item.whatsapp || 0)
        )
    );

    const chartMax = Math.ceil(maxValue / 5) * 5 || 5;

    const callsPoints = getPoints(
        safeData,
        "calls",
        chartMax
    );

    const whatsappPoints = getPoints(
        safeData,
        "whatsapp",
        chartMax
    );

    const callsLine = callsPoints
        .map((point) => `${point.x},${point.y}`)
        .join(" ");

    const whatsappLine = whatsappPoints
        .map((point) => `${point.x},${point.y}`)
        .join(" ");

    const chartHeight =
        CHART_HEIGHT - PADDING.top - PADDING.bottom;

    const formatDate = (date) => {
        return new Intl.DateTimeFormat(i18n.language, {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
        }).format(new Date(`${date}T00:00:00Z`));
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 3 },
                height: "100%",
                border: "1px solid #E8EDF4",
                borderRadius: 3,
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
                mb={2}
            >
                <Box>
                    <Typography fontWeight={800} variant="h6">
                        {t("adminContactActions.activityTitle")}
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {t("adminContactActions.activitySubtitle")}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    <Stack direction="row" spacing={0.7} alignItems="center">
                        <Box
                            sx={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                bgcolor: "#0891B2",
                            }}
                        />
                        <Typography variant="caption">
                            {t("adminContactActions.calls")}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.7} alignItems="center">
                        <Box
                            sx={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                bgcolor: "#059669",
                            }}
                        />
                        <Typography variant="caption">
                            WhatsApp
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>

            {safeData.length === 0 ? (
                <Box
                    minHeight={250}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Typography color="text.secondary">
                        {t("adminContactActions.noActivity")}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ width: "100%", overflow: "hidden" }}>
                    <svg
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        width="100%"
                        role="img"
                        aria-label={t("adminContactActions.activityTitle")}
                    >
                        {[0, 1, 2, 3, 4].map((step) => {
                            const y =
                                PADDING.top +
                                (chartHeight / 4) * step;

                            const value =
                                chartMax -
                                (chartMax / 4) * step;

                            return (
                                <g key={step}>
                                    <line
                                        x1={PADDING.left}
                                        x2={CHART_WIDTH - PADDING.right}
                                        y1={y}
                                        y2={y}
                                        stroke="#E9EEF5"
                                        strokeDasharray="4 5"
                                    />

                                    <text
                                        x={PADDING.left - 10}
                                        y={y + 4}
                                        textAnchor="end"
                                        fontSize="11"
                                        fill="#94A3B8"
                                    >
                                        {Math.round(value)}
                                    </text>
                                </g>
                            );
                        })}

                        {safeData.length > 1 && (
                            <>
                                <polyline
                                    points={callsLine}
                                    fill="none"
                                    stroke="#0891B2"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                <polyline
                                    points={whatsappLine}
                                    fill="none"
                                    stroke="#059669"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </>
                        )}

                        {callsPoints.map((point, index) => (
                            <g key={`call-${index}`}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="4"
                                    fill="#0891B2"
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                >
                                    <title>
                                        {`${formatDate(safeData[index].date)}: ${point.value} ${t("adminContactActions.calls")}`}
                                    </title>
                                </circle>
                            </g>
                        ))}

                        {whatsappPoints.map((point, index) => (
                            <g key={`whatsapp-${index}`}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="4"
                                    fill="#059669"
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                >
                                    <title>
                                        {`${formatDate(safeData[index].date)}: ${point.value} WhatsApp`}
                                    </title>
                                </circle>
                            </g>
                        ))}

                        {safeData.map((item, index) => {
                            const x =
                                safeData.length === 1
                                    ? CHART_WIDTH / 2
                                    : PADDING.left +
                                      (index / (safeData.length - 1)) *
                                      (CHART_WIDTH - PADDING.left - PADDING.right);

                            return (
                                <text
                                    key={item.date}
                                    x={x}
                                    y={CHART_HEIGHT - 12}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#94A3B8"
                                >
                                    {formatDate(item.date)}
                                </text>
                            );
                        })}
                    </svg>
                </Box>
            )}
        </Paper>
    );
}
