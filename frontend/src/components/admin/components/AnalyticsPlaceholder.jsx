import { Card, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import MouseOutlinedIcon from "@mui/icons-material/MouseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export default function AnalyticsPlaceholder({ type }) {
    const { t } = useTranslation();
    const isClicks = type === "clicks";

    const Icon = isClicks
        ? MouseOutlinedIcon
        : VisibilityOutlinedIcon;

    return (
        <Card
            sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}
        >
            <Stack alignItems="center" spacing={1.5}>
                <Icon sx={{ fontSize: 48, color: "text.secondary" }} />

                <Typography variant="h5" fontWeight={700}>
                    {isClicks
                        ? t("analyticsPlaceholder.clickTitle")
                        : t("analyticsPlaceholder.visitTitle")}
                </Typography>

                <Typography color="text.secondary">
                    {isClicks
                        ? t("analyticsPlaceholder.clickDescription")
                        : t("analyticsPlaceholder.visitDescription")}
                </Typography>
            </Stack>
        </Card>
    );
}