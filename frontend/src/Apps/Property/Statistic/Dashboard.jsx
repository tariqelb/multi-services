
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

import PageLayout from "./PageLayout";
import DashboardNavigation from "./DashboardNavigation";
import UsersSection from "./components/User/UsersSection";
import VisitsSection from "./components/Visit/VisitsSection";
import ExternalClicksSection from "./components/ExternalListingsClicks/ExternalClicksSection";
import PropertyClicksSection from "./components/PropertyClicks/PropertyClicksSection";
import PropertyDemandSection from "./components/PropertyDemand/PropertyDemandSection";
import ClientContactActionsSection from "./components/ClientContactActions/ClientContactActionsSection";

export default function Dashboard() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("users");

    return (
        <PageLayout
            title={t("adminDashboard.title")}
            subtitle={t("adminDashboard.subtitle")}
        >
            <DashboardNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <Box mt={3}>
                {activeTab === "users" && <UsersSection />}

                {activeTab === "internal property clicks" && (
                    <PropertyClicksSection />
                )}

                {activeTab === "external listings clicks" && (
                    <ExternalClicksSection />
                )}

                {activeTab === "visits" && <VisitsSection />}

                {activeTab === "property demand" && (
                    <PropertyDemandSection />
                )}

                {activeTab === "client call action" && (
                    <ClientContactActionsSection />
                )}
            </Box>
        </PageLayout>
    );
}
