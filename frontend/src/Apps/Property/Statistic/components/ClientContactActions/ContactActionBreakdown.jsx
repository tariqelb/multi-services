
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import {
    Phone,
    WhatsApp,
} from "@mui/icons-material";

export default function ContactActionBreakdown({
    calls = 0,
    whatsapp = 0,
}) {
    const { t } = useTranslation();

    const total = calls + whatsapp;

    const callPercentage = total
        ? Math.round((calls / total) * 100)
        : 0;

    const whatsappPercentage = total
        ? 100 - callPercentage
        : 0;

    const items = [
        {
            label: t("adminContactActions.calls"),
            value: calls,
            percentage: callPercentage,
            color: "#0891B2",
            icon: <Phone />,
        },
        {
            label: "WhatsApp",
            value: whatsapp,
            percentage: whatsappPercentage,
            color: "#059669",
            icon: <WhatsApp />,
        },
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: "100%",
                border: "1px solid #E8EDF4",
                borderRadius: 3,
            }}
        >
            <Typography variant="h6" fontWeight={800}>
                {t("adminContactActions.breakdownTitle")}
            </Typography>

            <Typography
                variant="caption"
                color="text.secondary"
            >
                {t("adminContactActions.breakdownSubtitle")}
            </Typography>

            <Box
                sx={{
                    width: 170,
                    height: 170,
                    mx: "auto",
                    my: 3,
                    borderRadius: "50%",
                    background: total
                        ? `conic-gradient(
                            #0891B2 0% ${callPercentage}%,
                            #059669 ${callPercentage}% 100%
                        )`
                        : "#E9EEF5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Box
                    sx={{
                        width: 125,
                        height: 125,
                        borderRadius: "50%",
                        bgcolor: "background.paper",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="h4" fontWeight={800}>
                        {total.toLocaleString()}
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {t("adminContactActions.total")}
                    </Typography>
                </Box>
            </Box>

            <Stack spacing={2}>
                {items.map((item) => (
                    <Box key={item.label}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={0.8}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <Box sx={{ color: item.color }}>
                                    {item.icon}
                                </Box>

                                <Typography
                                    variant="body2"
                                    fontWeight={600}
                                >
                                    {item.label}
                                </Typography>
                            </Stack>

                            <Typography
                                variant="body2"
                                fontWeight={700}
                            >
                                {item.value.toLocaleString()} ({item.percentage}%)
                            </Typography>
                        </Stack>

                        <Box
                            sx={{
                                height: 8,
                                borderRadius: 5,
                                bgcolor: "#F1F5F9",
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    width: `${item.percentage}%`,
                                    height: "100%",
                                    bgcolor: item.color,
                                    borderRadius: 5,
                                    transition: "width 0.4s ease",
                                }}
                            />
                        </Box>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
