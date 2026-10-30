
import { useState } from "react";
import { Box, Typography } from "@mui/material";

import DashboardNavigation from "./components/DashboardNavigation";
import UsersSection from "./components/UsersSection";
import AnalyticsPlaceholder from "./components/AnalyticsPlaceholder";
import VisitsSection from "./components/VisitsSection";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("users");

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1600,
                mx: "auto",
                px: { xs: 2.5, sm: 3, md: 5 },
                py: { xs: 4, md: 6 },
                boxSizing: "border-box",
                minHeight: "100vh",
            }}
        >
            <Box mb={5}>
                <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{
                        color: "#064e3b",
                        mb: 1,
                        fontSize: { xs: "2rem", md: "2.35rem" },
                    }}
                >
                    Admin Dashboard
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{ fontSize: "1.05rem" }}
                >
                    Monitor users and activity across your marketplace.
                </Typography>
            </Box>

            <DashboardNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <Box mt={4}>
                {activeTab === "users" && <UsersSection />}

                {activeTab === "clicks" && (
                    <AnalyticsPlaceholder type="clicks" />
                )}

                {activeTab === "visits" && <VisitsSection />}
            </Box>
        </Box>
    );
}
