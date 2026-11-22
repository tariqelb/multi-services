// Small UI pieces shared by the External Listing Sources page sections.
// (date helpers are in sourcesFormat.js)

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export function SectionCard({ id, title, subtitle, action, children }) {
    return (
        <Card id={id} variant="outlined" sx={{ borderRadius: "16px", scrollMarginTop: 16 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
                {(title || action) && (
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {title}
                            </Typography>
                            {subtitle && (
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                        {action && <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}>{action}</Box>}
                    </Stack>
                )}
                {children}
            </CardContent>
        </Card>
    );
}

export function StatTile({ icon, label, value, color = "primary" }) {
    return (
        <Box
            sx={(theme) => ({
                p: 1.5,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.05),
                minWidth: 0,
            })}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: `${color}.main` }}>
                {icon}
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                    {value}
                </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                {label}
            </Typography>
        </Box>
    );
}
