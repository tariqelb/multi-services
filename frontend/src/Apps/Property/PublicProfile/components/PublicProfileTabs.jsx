import React from "react";
import { useTranslation } from "react-i18next";

import {
    Paper,
    Tab,
    Tabs,
} from "@mui/material";

import {
    HomeWork,
    People,
    Hotel,
    RateReview,
    Campaign,
    AutoStoriesOutlined,
} from "@mui/icons-material";

const tabs = [
    {
        label: "publicProfile.tabs.properties",
        icon: <HomeWork fontSize="small" />,
    },
    {
        label: "publicProfile.tabs.roommates",
        icon: <People fontSize="small" />,
    },
    {
        label: "publicProfile.tabs.establishments",
        icon: <Hotel fontSize="small" />,
    },
    {
        label: "publicProfile.tabs.reviews",
        icon: <RateReview fontSize="small" />,
    },
    // Last, so hiding it never moves the other tabs.
    {
        label: "publicProfile.tabs.requests",
        icon: <Campaign fontSize="small" />,
    },
];

export default function PublicProfileTabs({
    activeTab,
    onChange,
    // Public profiles show "Requests" only if the user chose to show them.
    showRequests = true,
    // "Portfolio" (articles and videos) comes first; its value is "portfolio",
    // so the other tabs keep their numbers.
    showPortfolio = false,
}) {
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
                {(showRequests ? tabs : tabs.slice(0, -1)).map((tab, index) => (
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