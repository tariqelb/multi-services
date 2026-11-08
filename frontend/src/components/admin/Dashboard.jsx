import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

import PageLayout from "./components/PageLayout";
import DashboardNavigation from "./components/DashboardNavigation";
import UsersSection from "./components/UsersSection";
import VisitsSection from "./components/VisitsSection";
import ExternalClicksSection from "./externalListings/ExternalClicksSection";
import PropertyClicksSection from "./components/PropertyClicks/PropertyClicksSection";
import PublicationsReviewSection from "./components/PublicationReviews/PublicationsReviewSection";
import FeedbackSection from "./components/feedback/FeedbackSection";
import PropertyDemandSection from "./components/PropertyDemand/PropertyDemandSection";
import ClientContactActionsSection from "../ClientContactActions/ClientContactActionsSection";

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

                {activeTab === "publications" && (
                    <PublicationsReviewSection />
                )}

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

                {activeTab === "feedback" && <FeedbackSection />}

                {activeTab === "client call action" && (
                    <ClientContactActionsSection />
                )}
            </Box>
        </PageLayout>
    );
}