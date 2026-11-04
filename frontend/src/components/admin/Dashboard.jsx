
import { useState } from "react";
import { Box } from "@mui/material";

import PageLayout from "./components/PageLayout";
import DashboardNavigation from "./components/DashboardNavigation";
import UsersSection from "./components/UsersSection";
import VisitsSection from "./components/VisitsSection";
import ExternalClicksSection from "./externalListings/ExternalClicksSection";
import PropertyClicksSection from "./components/PropertyClicks/PropertyClicksSection";
import PublicationsReviewSection from "./components/PublicationReviews/PublicationsReviewSection";
import FeedbackSection from "./components/feedback/FeedbackSection";


export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("users");

    return (
        <PageLayout
            title="Admin Dashboard"
            subtitle="Monitor users and activity across your marketplace."
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

                {activeTab === "feedback" && <FeedbackSection />}
            </Box>
        </PageLayout>
    );
}
