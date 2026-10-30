
import { Card, Stack, Typography } from "@mui/material";
import MouseOutlinedIcon from "@mui/icons-material/MouseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export default function AnalyticsPlaceholder({ type }) {
    const isClicks = type === "clicks";

    const Icon = isClicks
        ? MouseOutlinedIcon
        : VisibilityOutlinedIcon;

    return (
        <Card
            elevation={0}
            sx={{
                p: { xs: 3, md: 5 },
                textAlign: "center",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <Stack alignItems="center" spacing={1.5}>
                <Icon sx={{ fontSize: 48, color: "text.secondary" }} />

                <Typography variant="h5" fontWeight={800}>
                    {isClicks ? "Click Analytics" : "Visit Analytics"}
                </Typography>

                <Typography color="text.secondary">
                    {isClicks
                        ? "Click tracking and statistics will be added here."
                        : "Website visits and page statistics will be added here."}
                </Typography>
            </Stack>
        </Card>
    );
}
