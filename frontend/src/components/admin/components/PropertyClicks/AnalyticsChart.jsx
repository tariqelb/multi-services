
import {
    Card,
    CardContent,
    Box,
    Typography,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

const AnalyticsChart = ({ title, data = [] }) => {
    const { t } = useTranslation();

    const hasData = Array.isArray(data) && data.length > 0;

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ mb: 3 }}
                >
                    {title}
                </Typography>

                {hasData ? (
                    <Box sx={{ width: "100%", height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -15,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#E2E8F0"
                                />

                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    angle={-20}
                                    textAnchor="end"
                                    height={65}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <Tooltip
                                    cursor={{ fill: "#2563EB", opacity: 0.08 }}
                                    formatter={(value) => [
                                        value,
                                        t("adminPropertyClicks.charts.clicks"),
                                    ]}
                                />

                                <Bar
                                    dataKey="clicks"
                                    name={t("adminPropertyClicks.charts.clicks")}
                                    fill="#2563EB"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={55}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            height: 280,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Typography
                            color="text.secondary"
                            variant="body2"
                        >
                            {t("adminPropertyClicks.charts.noData")}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default AnalyticsChart;
