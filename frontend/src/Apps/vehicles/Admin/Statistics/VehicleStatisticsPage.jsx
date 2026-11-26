// Admin › Vehicles › Statistics: the same tabs as Property › Statistics for
// cars, motos & bikes, spare parts and external listings.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack } from "@mui/material";
import {
    BookmarkBorderOutlined,
    BuildOutlined,
    DashboardOutlined,
    DirectionsCarOutlined,
    GroupsOutlined,
    HomeRepairServiceOutlined,
    InsightsOutlined,
    MouseOutlined,
    OpenInNewOutlined,
    PhoneInTalkOutlined,
    QueryStatsOutlined,
    TwoWheelerOutlined,
} from "@mui/icons-material";

import { pagePaddingSx } from "../../../../Components/ui/PageContainer";
import PageHeader from "../../../../Components/ui/PageHeader";
import StatisticsTabs from "../../../../Components/Analytics/StatisticsTabs";
import ActivityPanel from "../../../../Components/Analytics/ActivityPanel";
import SavedDemandPanel from "../../../../Components/Analytics/SavedDemandPanel";
import TypeChips from "../../../../Components/Analytics/TypeChips";
import { RangeSelect, SectionHeader } from "../../../../Components/Analytics/AnalyticsUI";
import VehicleOverviewTab from "./VehicleOverviewTab";
import VehicleAlertDemandTab from "./VehicleAlertDemandTab";
import EventStatsTab from "./EventStatsTab";

const API = "/vehicles/admin/statistics";

function SavedTab() {
    const { t } = useTranslation();
    const [type, setType] = useState("vehicle");
    const [range, setRange] = useState("30d");
    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<BookmarkBorderOutlined />}
                title={t("vehicleStats.saved.title", "Saved demand")}
                subtitle={t("vehicleStats.saved.subtitle", "What people save: vehicles and motos, spare parts.")}
            >
                <RangeSelect value={range} onChange={setRange} />
            </SectionHeader>
            <TypeChips
                value={type}
                onChange={setType}
                options={[
                    { value: "vehicle", label: t("vehicleStats.values.vehicles", "Vehicles & motos"), icon: <DirectionsCarOutlined /> },
                    { value: "part", label: t("vehicleStats.values.parts", "Spare parts"), icon: <BuildOutlined /> },
                ]}
            />
            <SavedDemandPanel key={type} url={`${API}/saved-demand`} params={{ range, type }} />
        </Stack>
    );
}

export default function VehicleStatisticsPage() {
    const { t } = useTranslation();
    const [tab, setTab] = useState("overview");

    const tabs = [
        { value: "overview", label: t("vehicleStats.tabs.overview", "Overview"), icon: <DashboardOutlined /> },
        { value: "activity", label: t("vehicleStats.tabs.activity", "Publications & community"), icon: <GroupsOutlined /> },
        { value: "views", label: t("vehicleStats.tabs.views", "Listing views"), icon: <MouseOutlined /> },
        { value: "external", label: t("vehicleStats.tabs.external", "External listings clicks"), icon: <OpenInNewOutlined /> },
        { value: "alerts", label: t("vehicleStats.tabs.alerts", "Alert demand"), icon: <QueryStatsOutlined /> },
        { value: "saved", label: t("vehicleStats.tabs.saved", "Saved demand"), icon: <BookmarkBorderOutlined /> },
        { value: "contacts", label: t("vehicleStats.tabs.contacts", "Client call actions"), icon: <PhoneInTalkOutlined /> },
    ];

    return (
        <Box sx={pagePaddingSx}>
            <PageHeader
                icon={<InsightsOutlined />}
                title={t("vehicleStats.title", "Vehicle statistics")}
                subtitle={t("vehicleStats.subtitle", "Cars, motos & bikes, spare parts and external listings: publications, views, alerts, saves, contacts, requests and portfolios.")}
            />
            <StatisticsTabs value={tab} onChange={setTab} items={tabs} />

            {tab === "overview" && <VehicleOverviewTab />}
            {tab === "activity" && (
                <ActivityPanel
                    url={`${API}/activity`}
                    title={t("activityStats.vehicleTitle", "Publications & community")}
                    subtitle={t("activityStats.vehicleSubtitle", "New cars, motos & bikes and spare parts, requests, portfolios and reviews.")}
                    profilePath={(id) => `/vehicles/profile/${id}`}
                    translateTransaction={(value) => t(`requests.transactions.vehicle.${value}`, value)}
                    listingTypes={[
                        { key: "cars", kpi: "newCars", label: t("vehicleStats.values.cars", "Cars"), icon: <DirectionsCarOutlined />, color: "#2563EB" },
                        { key: "motos", kpi: "newMotos", label: t("vehicleStats.values.motos", "Motos & bikes"), icon: <TwoWheelerOutlined />, color: "#F97316" },
                        { key: "parts", kpi: "newParts", label: t("vehicleStats.values.parts", "Spare parts"), icon: <HomeRepairServiceOutlined />, color: "#16A34A" },
                    ]}
                />
            )}
            {tab === "views" && (
                <EventStatsTab
                    url={`${API}/views`}
                    icon={<MouseOutlined />}
                    title={t("vehicleStats.views.title", "Listing views")}
                    subtitle={t("vehicleStats.views.subtitle", "Details pages opened by visitors (owners and bots are not counted).")}
                    breakdown="listingTypes"
                    rateLabel={t("vehicleStats.views.contactRate", "Views that led to a contact")}
                    typeOptions={[
                        { value: "all", label: t("vehicleStats.values.all", "All") },
                        { value: "vehicle", label: t("vehicleStats.values.cars", "Cars"), icon: <DirectionsCarOutlined /> },
                        { value: "moto", label: t("vehicleStats.values.motos", "Motos & bikes"), icon: <TwoWheelerOutlined /> },
                        { value: "part", label: t("vehicleStats.values.parts", "Spare parts"), icon: <BuildOutlined /> },
                    ]}
                />
            )}
            {tab === "external" && (
                <EventStatsTab
                    url={`${API}/external-clicks`}
                    icon={<OpenInNewOutlined />}
                    color="#EA580C"
                    title={t("vehicleStats.external.title", "External listings clicks")}
                    subtitle={t("vehicleStats.external.subtitle", "Listings of other websites (Avito, Moteur.ma...) opened from the application.")}
                    breakdown="sources"
                />
            )}
            {tab === "alerts" && <VehicleAlertDemandTab />}
            {tab === "saved" && <SavedTab />}
            {tab === "contacts" && (
                <EventStatsTab
                    url={`${API}/contacts`}
                    icon={<PhoneInTalkOutlined />}
                    color="#16A34A"
                    title={t("vehicleStats.contacts.title", "Client call actions")}
                    subtitle={t("vehicleStats.contacts.subtitle", "Call, WhatsApp and email buttons pressed on vehicles and spare parts.")}
                    breakdown="channels"
                    rateLabel={t("vehicleStats.contacts.rate", "Contacts per view")}
                />
            )}
        </Box>
    );
}
