import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Stack, Typography } from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

function Home() {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                bgcolor: "background.default",
            }}
        >
            <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", maxWidth: 560 }}>
                <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
                    {t("home.welcome", "Welcome to Multi-Services")}
                </Typography>
                <Typography sx={{ color: "text.secondary" }}>
                    {t("home.tagline", "Find a house, book transport, or get a service.")}
                </Typography>
                <Button
                    component={RouterLink}
                    to="/login"
                    variant="contained"
                    size="large"
                    startIcon={<LoginRoundedIcon />}
                >
                    {t("home.loginSignup", "Login / Sign up")}
                </Button>
            </Stack>
        </Box>
    );
}

export default Home;
