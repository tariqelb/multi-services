// admin/Dashboard.jsx

import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

import PageLayout from "./PageLayout";
import DashboardNavigation from "./DashboardNavigation";
import OverviewSection from "./components/Overview/OverviewSection";
import ExternalClicksSection from "./components/ExternalListingsClicks/ExternalClicksSection";
import PropertyClicksSection from "./components/PropertyClicks/PropertyClicksSection";
import PropertyDemandSection from "./components/PropertyDemand/PropertyDemandSection";
import ClientContactActionsSection from "./components/ClientContactActions/ClientContactActionsSection";

// Users and Visits moved to Admin panel > Account.
const SECTIONS = {
    overview: OverviewSection,
    "internal property clicks": PropertyClicksSection,
    "external listings clicks": ExternalClicksSection,
    "property demand": PropertyDemandSection,
    "client call action": ClientContactActionsSection,
};

export default function Dashboard() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("overview");

    const ActiveSection = SECTIONS[activeTab] || OverviewSection;

    return (
        <PageLayout
            icon={<InsightsOutlinedIcon />}
            title={t("adminPanel.statisticsTitle", "Property statistics")}
            subtitle={t("adminPanel.statisticsSubtitle", "Clicks, demand and contacts on the property listings.")}
        >
            <DashboardNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <Box sx={{ mt: 3 }}>
                <ActiveSection />
            </Box>
        </PageLayout>
    );
}
