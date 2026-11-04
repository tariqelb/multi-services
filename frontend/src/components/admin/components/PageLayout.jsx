import { Box, Stack, Typography } from "@mui/material";

/**
 * Shared page shell: centered container + title / subtitle / main action.
 * Use it as the root of every page.
 */
export default function PageLayout({
    title,
    subtitle,
    action,
    icon,
    maxWidth = "none",
    children,
}) {
    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                maxWidth,
                mx: "auto",
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 3, md: 4 },
                boxSizing: "border-box",
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "flex-end" }}
                spacing={2}
                sx={{ mb: 3, minWidth: 0 }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        {icon}
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {title}
                        </Typography>
                    </Stack>

                    {subtitle && (
                        <Typography
                            color="text.secondary"
                            sx={{ mt: 0.75, overflowWrap: "anywhere" }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {action}
            </Stack>

            {children}
        </Box>
    );
}
