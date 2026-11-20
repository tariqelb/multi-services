import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Stack, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

function NotFound() {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                minHeight: "70vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
            }}
        >
            <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
                <Typography sx={{ fontSize: { xs: "4rem", md: "6rem" }, fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
                    404
                </Typography>
                <Typography variant="h5">{t("notFound.title", "Page not found.")}</Typography>
                <Typography sx={{ color: "text.secondary" }}>
                    {t("notFound.description", "The page you are looking for does not exist or has been moved.")}
                </Typography>
                <Button component={RouterLink} to="/" variant="contained" startIcon={<HomeRoundedIcon />} sx={{ mt: 1 }}>
                    {t("notFound.goHome", "Go home")}
                </Button>
            </Stack>
        </Box>
    );
}

export default NotFound;
