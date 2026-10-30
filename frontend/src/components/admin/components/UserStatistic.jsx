
import { Box, Typography } from "@mui/material";

export default function UserStatistic({ icon, label, value }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 2,
                bgcolor: "grey.50",
                borderRadius: 2,
                minWidth: 0,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "primary.main",
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>

            <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={800} lineHeight={1.3}>
                    {value}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}
