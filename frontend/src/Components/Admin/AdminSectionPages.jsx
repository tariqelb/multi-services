// src/Components/Admin/AdminSectionPages.jsx
// Admin panel > Account: Users and Visits pages (the sections that were tabs
// of the property statistics dashboard).

import { useTranslation } from "react-i18next";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import PageLayout from "../../Apps/Property/Statistic/PageLayout";
import UsersSection from "../../Apps/Property/Statistic/components/User/UsersSection";
import VisitsSection from "../../Apps/Property/Statistic/components/Visit/VisitsSection";

export function AdminUsersPage() {
    const { t } = useTranslation();
    return (
        <PageLayout
            icon={<PeopleAltOutlinedIcon />}
            title={t("adminPanel.items.users", "Users")}
            subtitle={t("adminPanel.usersSubtitle", "Every account: activity, verification, publications, suspension.")}
        >
            <UsersSection />
        </PageLayout>
    );
}

export function AdminVisitsPage() {
    const { t } = useTranslation();
    return (
        <PageLayout
            icon={<VisibilityOutlinedIcon />}
            title={t("adminPanel.items.visits", "Visits")}
            subtitle={t("adminPanel.visitsSubtitle", "Visitors and sessions across the platform.")}
        >
            <VisitsSection />
        </PageLayout>
    );
}
