// src/Apps/vehicles/Profile/components/VehicleProfileTabs.jsx
import { useTranslation } from "react-i18next";

import {
    Paper,
    Tab,
    Tabs,
} from "@mui/material";
import AutoStoriesOutlined from "@mui/icons-material/AutoStoriesOutlined";

// tabs: [{ label (translation key), icon }]
// showPortfolio: "Portfolio" (articles and videos) first, value "portfolio",
// so the other tabs keep their numbers.
export default function VehicleProfileTabs({ activeTab, onChange, tabs: items = [], showPortfolio = false }) {
    const { t } = useTranslation();

    return (
        <Paper
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                overflow: "hidden",
            }}
        >
            <Tabs
                value={activeTab}
                onChange={(_, newValue) => onChange(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                    minHeight: 56,
                    "& .MuiTabs-flexContainer": {
                        width: { xs: "max-content", md: "100%" },
                    },
                    "& .MuiTab-root": {
                        minHeight: 56,
                        minWidth: { xs: 145, sm: 150, md: 0 },
                        flex: { xs: "0 0 auto", md: 1 },
                        textTransform: "none",
                        fontWeight: 600,
                    },
                }}
            >
                {showPortfolio && (
                    <Tab
                        value="portfolio"
                        icon={<AutoStoriesOutlined fontSize="small" />}
                        iconPosition="start"
                        label={t("portfolio.tab", "Portfolio")}
                        id="public-profile-tab-portfolio"
                        aria-controls="public-profile-panel-portfolio"
                    />
                )}
                {items.map((tab, index) => (
                    <Tab
                        key={tab.label}
                        value={index}
                        icon={tab.icon}
                        iconPosition="start"
                        label={t(tab.label)}
                        id={`public-profile-tab-${index}`}
                        aria-controls={`public-profile-panel-${index}`}
                    />
                ))}
            </Tabs>
        </Paper>
    );
}