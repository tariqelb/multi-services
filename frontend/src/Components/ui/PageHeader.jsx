// src/Components/ui/PageHeader.jsx
// Same title block on every page: icon, title, subtitle and main action.
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function PageHeader({ icon, title, subtitle, action, badge, sx }) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: { xs: 2.5, md: 3.5 }, minWidth: 0, ...sx }}
        >
            <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", minWidth: 0 }}>
                {icon && (
                    <Box
                        sx={(theme) => ({
                            width: { xs: 44, md: 52 },
                            height: { xs: 44, md: 52 },
                            borderRadius: 3,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            "& svg": { fontSize: { xs: 24, md: 28 } },
                        })}
                    >
                        {icon}
                    </Box>
                )}

                <Box sx={{ minWidth: 0 }}>
                    {badge && (
                        <Typography variant="overline" sx={{ color: "primary", display: "block", lineHeight: 1.6 }}>
                            {badge}
                        </Typography>
                    )}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{ fontSize: { xs: "1.45rem", sm: "1.75rem", md: "2rem" }, overflowWrap: "anywhere" }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography sx={{ color: "text.secondary", mt: 0.5, maxWidth: 760 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Stack>

            {action && <Box sx={{ flexShrink: 0, "& > .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }}>{action}</Box>}
        </Stack>
    );
}
