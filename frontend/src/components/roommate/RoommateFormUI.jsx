
import React from "react";

import {
    Box,
    Typography,
    Divider,
    Stack,
    Chip,
    Paper,
} from "@mui/material";

export function SectionHeader({
    icon,
    title,
    subtitle,
    number,
}) {
    return (
        <Box sx={{ mb: 3 }}>
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "12px",
                        bgcolor: "#EFF6FF",
                        color: "#2563EB",
                        flexShrink: 0,
                        fontWeight: 700,
                        fontSize: "1.1rem",
                    }}
                >
                    {icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#0F172A",
                            fontSize: "1.08rem",
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#5B6577",
                            mt: 0.3,
                        }}
                    >
                        {subtitle}
                    </Typography>
                </Box>

                <Chip
                    label={`0${number}`}
                    size="small"
                    sx={{
                        fontWeight: 700,
                        color: "#2563EB",
                        bgcolor: "#EFF6FF",
                        borderRadius: "8px",
                    }}
                />
            </Stack>

            <Divider
                sx={{
                    mt: 2.5,
                    borderColor: "#E2E8F0",
                }}
            />
        </Box>
    );
}

export function SectionPaper({ children }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: {
                    xs: 2.5,
                    sm: 3.5,
                    md: 4,
                },
                mb: 3,
                border: "1px solid #E2E8F0",
                borderRadius: "16px",
                bgcolor: "#ffffff",
                boxShadow:
                    "0 3px 12px rgba(15, 23, 42, 0.025)",
            }}
        >
            {children}
        </Paper>
    );
}
