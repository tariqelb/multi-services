import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
} from "@mui/material";

import { formatNumber } from "./externalClicksUtils";

const SummaryCard = ({ title, value, icon, subtitle , color = "" }) => {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 20px rgba(37, 99, 235, 0.08)",
                    transform: "translateY(-2px)",
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={600}
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight={700}
                            sx={{
                                mt: 1,
                                color: "primary.main",
                                fontSize: { xs: "1.75rem", md: "2rem" },
                            }}
                        >
                            {formatNumber(value)}
                        </Typography>

                        {subtitle && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5, display: "block" }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 52,
                            height: 52,
                            borderRadius: 2,
                            // bgcolor: "primary.light",
                            // color:  "primary.light",
                            bgcolor: `${color}15`,
                            color,
                            flexShrink: 0,
                            fontSize: "1.5rem",
                            fontWeight: 700,
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;