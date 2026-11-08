
import React from "react";

import {
    Box,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

export default function ContactStatCard({
    title,
    value,
    icon,
    color,
    background,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                height: "100%",
                border: "1px solid #E8EDF4",
                borderRadius: 3,
                transition: "0.2s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.07)",
                },
            }}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
            >
                <Box minWidth={0}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="h4"
                        fontWeight={800}
                        color="text.primary"
                    >
                        {Number(value).toLocaleString()}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: 52,
                        height: 52,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 2.5,
                        bgcolor: background,
                        color,
                        "& svg": {
                            fontSize: 27,
                        },
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </Paper>
    );
}
