// Property › Statistics › "Publications & community": new properties,
// roommate announcements and hotels & riads, requests and replies,
// portfolio articles and videos, reviews and the most active publishers.

import { useTranslation } from "react-i18next";
import { HomeWorkOutlined, HotelOutlined, PeopleAltOutlined } from "@mui/icons-material";

import ActivityPanel from "../../../../../Components/Analytics/ActivityPanel";

export default function ActivitySection() {
    const { t } = useTranslation();

    return (
        <ActivityPanel
            url="/property/dashboard/activity"
            title={t("activityStats.propertyTitle", "Publications & community")}
            subtitle={t("activityStats.propertySubtitle", "New listings of every kind, requests, portfolios and reviews.")}
            profilePath={(id) => `/profile/${id}`}
            translateTransaction={(value) => t(`requests.transactions.property.${value}`, value)}
            listingTypes={[
                { key: "properties", kpi: "newProperties", label: t("activityStats.types.properties", "Properties"), icon: <HomeWorkOutlined />, color: "#2563EB" },
                { key: "roommates", kpi: "newRoommates", label: t("activityStats.types.roommates", "Roommate announcements"), icon: <PeopleAltOutlined />, color: "#9333EA" },
                { key: "establishments", kpi: "newEstablishments", label: t("activityStats.types.establishments", "Hotels & riads"), icon: <HotelOutlined />, color: "#F59E0B" },
            ]}
        />
    );
}
