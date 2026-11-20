
import { Box, Typography } from "@mui/material";

export default function UserStatistic({ icon, label, value }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 2,
                bgcolor: "#F5F7FB",
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
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {value}
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}
