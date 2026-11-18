import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardContent,
    Typography,
} from "@mui/material";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

const AnalyticsChart = ({ title, data = [], description }) => {
    const { t, i18n } = useTranslation();

    const locale =
        i18n.language?.startsWith("ar")
            ? "ar"
            : i18n.language?.startsWith("fr")
              ? "fr-FR"
              : "en-US";

    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                minWidth: 0,
                height: 400,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                overflow: "hidden",
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2.5, md: 3 },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:last-child": { pb: 3 },
                }}
            >
                <Box mb={2.5}>
                    <Typography variant="h6" fontWeight={700}>
                        {title}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        {description}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    {data.length > 0 ? (
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                        >
                            <BarChart
                                data={data}
                                margin={{
                                    top: 15,
                                    right: 15,
                                    left: -15,
                                    bottom: 35,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#E2E8F0"
                                />

                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    height={65}
                                    tick={{
                                        fontSize: 12,
                                        fill: "#5B6577",
                                    }}
                                    axisLine={{ stroke: "#D5DCE8" }}
                                    tickLine={false}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{
                                        fontSize: 12,
                                        fill: "#5B6577",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />

                                <Tooltip
                                    cursor={{
                                        fill: "rgba(37, 99, 235, 0.04)",
                                    }}
                                    contentStyle={{
                                        borderRadius: 10,
                                        border: "1px solid #E2E8F0",
                                        boxShadow:
                                            "0 4px 15px rgba(0,0,0,0.06)",
                                        fontSize: "0.85rem",
                                        backgroundColor: "#FFFFFF",
                                    }}
                                    formatter={(value) => [
                                        `${Number(value).toLocaleString(locale)} ${t("adminExternalClicks.charts.clicks")}`,
                                        t("adminExternalClicks.charts.clicks"),
                                    ]}
                                />

                                <Bar
                                    dataKey="clicks"
                                    fill="#2563EB"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box
                            height="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {t("adminExternalClicks.charts.noData")}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default AnalyticsChart;