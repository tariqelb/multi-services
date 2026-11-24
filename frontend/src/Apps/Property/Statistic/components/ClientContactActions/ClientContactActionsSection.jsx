// admin/components/ClientContactActions/ClientContactActionsSection.jsx
// Leads: calls, WhatsApp and other contact clicks on properties,
// roommate announcements and establishments.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Avatar,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

import {
    AccessTimeOutlined,
    GroupOutlined,
    HomeWorkOutlined,
    HotelOutlined,
    PeopleAltOutlined,
    PhoneInTalkOutlined,
    PhoneOutlined,
    RepeatOutlined,
    TodayOutlined,
    WhatsApp,
} from "@mui/icons-material";

import {
    BarChartView,
    ChartCard,
    ChartGrid,
    DonutChart,
    EmptyState,
    ErrorBanner,
    HourlyChart,
    KpiGrid,
    LoadingState,
    RangeSelect,
    RankedList,
    RefreshButton,
    SectionHeader,
    StatCard,
    TrendChart,
    getPeakHour,
    useAnalyticsData,
} from "../shared/AnalyticsUI";

import {
    formatDateTime,
    formatDecimal,
    formatHour,
    formatNumber,
    formatPercent,
    getFullName,
    getInitials,
    getLocale,
    translateValue,
    translateCity,
} from "../shared/analyticsUtils";

const WHATSAPP_COLOR = "#22C55E";
const CALL_COLOR = "#2563EB";
const OTHER_COLOR = "#F59E0B";

const LISTING_TYPES = {
    property: {
        url: "/property/dashboard/property-contacts",
        detailsPath: "/properties",
        icon: <HomeWorkOutlined fontSize="small" />,
        label: "Properties",
    },
    roommate: {
        url: "/property/dashboard/listing-contacts",
        detailsPath: "/roommates",
        icon: <GroupOutlined fontSize="small" />,
        label: "Roommates",
    },
    establishment: {
        url: "/property/dashboard/listing-contacts",
        detailsPath: "/establishments",
        icon: <HotelOutlined fontSize="small" />,
        label: "Establishments",
    },
};

const ACTION_COLORS = {
    call: CALL_COLOR,
    whatsapp: WHATSAPP_COLOR,
    email: "#9333EA",
    website: "#0891B2",
    booking: OTHER_COLOR,
    social: "#EC4899",
};

const ACTION_LABELS = {
    call: "Calls",
    whatsapp: "WhatsApp",
    email: "Email",
    website: "Website",
    booking: "Booking website",
    social: "Social media",
};

function PersonCell({ person, fallback }) {
    const name = getFullName(person) || person?.email || fallback;

    return (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
            <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: "primary.main" }}>
                {getInitials(name)}
            </Avatar>

            <Stack sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                    {name}
                </Typography>
                {person?.phoneNumber && (
                    <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                        {person.phoneNumber}
                    </Typography>
                )}
            </Stack>
        </Stack>
    );
}

export default function ClientContactActionsSection() {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);
    const navigate = useNavigate();

    const [range, setRange] = useState("30d");
    const [listingType, setListingType] = useState("property");

    const config = LISTING_TYPES[listingType];

    const { data, loading, error, reload } = useAnalyticsData(
        config.url,
        listingType === "property" ? { range } : { range, listingType }
    );

    const typeSwitch = (
        <ToggleButtonGroup
            size="small"
            exclusive
            value={listingType}
            onChange={(_event, value) => value && setListingType(value)}
        >
            {Object.entries(LISTING_TYPES).map(([key, item]) => (
                <ToggleButton key={key} value={key} sx={{ gap: 0.75, textTransform: "none" }}>
                    {item.icon}
                    {t(`contactActions.types.${key}`, item.label)}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );

    if (loading && !data) return <LoadingState />;

    // Ignore a response from the previously selected type while switching.
    const isCurrentData =
        listingType === "property"
            ? !data?.listingType
            : data?.listingType === listingType;

    const view = isCurrentData ? data : null;
    const stats = view?.statistics || {};
    const hasOtherActions = listingType === "establishment";

    const actionLabel = (action) =>
        t(`contactActions.actions.${action}`, ACTION_LABELS[action] || action);

    const channelData =
        listingType === "property"
            ? [
                { name: actionLabel("call"), value: stats.callContacts || 0, color: CALL_COLOR },
                { name: actionLabel("whatsapp"), value: stats.whatsappContacts || 0, color: WHATSAPP_COLOR },
            ]
            : (view?.actions || []).map((item) => ({
                name: actionLabel(item.name),
                value: item.value,
                color: ACTION_COLORS[item.name],
            }));

    const topItems = view?.topProperties || view?.topListings || [];
    const peakHour = getPeakHour(view?.hourly, "contacts");

    const callLabel = t("contactActions.calls", "Calls");
    const whatsappLabel = t("contactActions.whatsapp", "WhatsApp");

    return (
        <Stack spacing={3}>
            <SectionHeader
                icon={<PhoneInTalkOutlined />}
                title={t("contactActions.title", "Client contact actions")}
                subtitle={t(
                    "contactActions.subtitle",
                    "Leads generated for owners and establishments."
                )}
            >
                {typeSwitch}
                <RangeSelect value={range} onChange={setRange} />
                <RefreshButton onClick={reload} loading={loading} />
            </SectionHeader>

            <ErrorBanner error={error} />

            <KpiGrid>
                <StatCard
                    title={t("contactActions.totalContacts", "Total contacts")}
                    value={formatNumber(stats.totalContacts, locale)}
                    change={stats.contactsChange}
                    icon={<PhoneInTalkOutlined />}
                    locale={locale}
                />

                <StatCard
                    title={t("contactActions.contactsToday", "Today")}
                    value={formatNumber(stats.contactsToday, locale)}
                    icon={<TodayOutlined />}
                    color="#0891B2"
                    locale={locale}
                />

                <StatCard
                    title={callLabel}
                    value={formatNumber(stats.callContacts, locale)}
                    icon={<PhoneOutlined />}
                    color={CALL_COLOR}
                    locale={locale}
                />

                <StatCard
                    title={whatsappLabel}
                    value={formatNumber(stats.whatsappContacts, locale)}
                    description={t("contactActions.whatsappShare", "{{share}} of contacts", {
                        share: formatPercent(stats.whatsappShare, locale),
                    })}
                    icon={<WhatsApp />}
                    color={WHATSAPP_COLOR}
                    locale={locale}
                />

                <StatCard
                    title={t("contactActions.uniqueClients", "Contacting clients")}
                    value={formatNumber(stats.uniqueClients, locale)}
                    description={t("contactActions.contactsPerClient", "{{value}} contacts each", {
                        value: formatDecimal(stats.contactsPerClient, locale),
                    })}
                    icon={<PeopleAltOutlined />}
                    color="#9333EA"
                    locale={locale}
                />

                <StatCard
                    title={t("contactActions.repeatClients", "Returning clients")}
                    value={formatNumber(stats.repeatClients, locale)}
                    description={t("contactActions.repeatRate", "{{rate}} contacted more than once", {
                        rate: formatPercent(stats.repeatClientRate, locale),
                    })}
                    icon={<RepeatOutlined />}
                    color="#EC4899"
                    locale={locale}
                />

                <StatCard
                    title={t(`contactActions.listingsWithLeads.${listingType}`, {
                        property: "Properties with leads",
                        roommate: "Announcements with leads",
                        establishment: "Establishments with leads",
                    }[listingType])}
                    value={formatNumber(stats.uniqueProperties, locale)}
                    description={t("contactActions.uniqueOwners", "{{count}} owners reached", {
                        count: formatNumber(stats.uniqueOwners, locale),
                    })}
                    icon={<HomeWorkOutlined />}
                    color="#EA580C"
                    locale={locale}
                />

                <StatCard
                    title={t("contactActions.peakHour", "Busiest hour")}
                    value={peakHour === null ? "—" : formatHour(peakHour)}
                    description={t("contactActions.peakHourDescription", "When owners get most contacts")}
                    icon={<AccessTimeOutlined />}
                    color="#64748B"
                    locale={locale}
                />
            </KpiGrid>

            <ChartGrid template="7fr 5fr">
                <ChartCard
                    title={t("contactActions.trend", "Contacts over time")}
                    subtitle={t("contactActions.trendDescription", "Contact clicks by channel")}
                    height={320}
                >
                    <TrendChart
                        stacked
                        data={view?.dailyActivity || []}
                        locale={locale}
                        series={[
                            { key: "calls", name: callLabel, color: CALL_COLOR },
                            { key: "whatsapp", name: whatsappLabel, color: WHATSAPP_COLOR },
                            ...(hasOtherActions
                                ? [{ key: "other", name: t("contactActions.other", "Email & websites"), color: OTHER_COLOR }]
                                : []),
                        ]}
                    />
                </ChartCard>

                <ChartCard
                    title={t("contactActions.channels", "Preferred channel")}
                    height={320}
                >
                    <DonutChart locale={locale} data={channelData} />
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard
                    title={t("contactActions.cities", "Contacts by city")}
                    height={320}
                >
                    <BarChartView
                        layout="vertical"
                        data={view?.cities || []}
                        bars={[
                            { key: "calls", name: callLabel, color: CALL_COLOR, stackId: "channel" },
                            { key: "whatsapp", name: whatsappLabel, color: WHATSAPP_COLOR, stackId: "channel" },
                            ...(hasOtherActions
                                ? [{ key: "other", name: t("contactActions.other", "Email & websites"), color: OTHER_COLOR, stackId: "channel" }]
                                : []),
                        ]}
                        locale={locale}
                        labelWidth={100}
                    />
                </ChartCard>

                <ChartCard
                    title={t("contactActions.hourly", "Contacts by hour")}
                    subtitle={t("contactActions.hourlyDescription", "Morocco time")}
                    height={320}
                >
                    <HourlyChart
                        data={view?.hourly || []}
                        valueKey="contacts"
                        name={t("contactActions.totalContacts", "Contacts")}
                        color="#16A34A"
                        locale={locale}
                    />
                </ChartCard>
            </ChartGrid>

            <ChartGrid>
                <ChartCard
                    title={t(`contactActions.topListings.${listingType}`, {
                        property: "Most contacted properties",
                        roommate: "Most contacted announcements",
                        establishment: "Most contacted establishments",
                    }[listingType])}
                    subtitle={
                        listingType === "property"
                            ? t("contactActions.topPropertiesDescription", "With conversion from views to contacts")
                            : undefined
                    }
                    height={null}
                >
                    <RankedList
                        color="#16A34A"
                        items={topItems.map((item) => ({
                            key: item.propertyId || item.listingId,
                            primary: item.title,
                            secondary: [
                                item.city && translateCity(t, i18n.language, item.city),
                                item.listingType &&
                                    translateValue(t, "contactActions.listingTypes", item.listingType),
                                t("contactActions.channelSplit", "{{calls}} calls · {{whatsapp}} WhatsApp", {
                                    calls: formatNumber(item.calls, locale),
                                    whatsapp: formatNumber(item.whatsapp, locale),
                                }),
                                item.other
                                    ? t("contactActions.otherCount", "{{count}} other", {
                                        count: formatNumber(item.other, locale),
                                    })
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(" · "),
                            value: item.total,
                            valueLabel: formatNumber(item.total, locale),
                            extra: item.clicks
                                ? t("contactActions.conversion", "{{rate}} of {{views}} views", {
                                    rate: formatPercent(item.conversionRate, locale),
                                    views: formatNumber(item.clicks, locale),
                                })
                                : undefined,
                            onClick: () =>
                                navigate(`${config.detailsPath}/${item.propertyId || item.listingId}`),
                        }))}
                    />
                </ChartCard>

                <ChartCard
                    title={t("contactActions.topOwners", "Owners receiving most leads")}
                    height={null}
                >
                    <RankedList
                        color="#9333EA"
                        items={(view?.topOwners || []).map((owner) => ({
                            key: owner.ownerId,
                            primary:
                                getFullName(owner) ||
                                owner.email ||
                                t("contactActions.unknownOwner", "Unknown owner"),
                            secondary: t("contactActions.ownerDetails", "{{properties}} listings · {{clients}} clients", {
                                properties: formatNumber(owner.properties, locale),
                                clients: formatNumber(owner.uniqueClients, locale),
                            }),
                            value: owner.total,
                            valueLabel: formatNumber(owner.total, locale),
                            onClick: () => navigate(`/admin/users/${owner.ownerId}`),
                        }))}
                    />
                </ChartCard>
            </ChartGrid>

            {/* Recent contacts */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Typography variant="h6" sx={{ fontWeight: 750, mb: 2 }}>
                        {t("contactActions.recentContacts", "Recent contacts")}
                    </Typography>

                    {!view?.recentContacts?.length ? (
                        <EmptyState
                            height={140}
                            message={t("contactActions.empty", "No contact actions in this period.")}
                        />
                    ) : (
                        <TableContainer>
                            <Table size="small" sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t("contactActions.table.client", "Client")}</TableCell>
                                        <TableCell>{t("contactActions.table.property", "Property")}</TableCell>
                                        <TableCell>{t("contactActions.table.owner", "Owner")}</TableCell>
                                        <TableCell>{t("contactActions.table.channel", "Channel")}</TableCell>
                                        <TableCell>{t("contactActions.table.date", "Date")}</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {view.recentContacts.map((contact) => (
                                        <TableRow key={contact._id} hover>
                                            <TableCell>
                                                <PersonCell
                                                    person={contact.clientId}
                                                    fallback={
                                                        listingType === "property"
                                                            ? t("contactActions.deletedUser", "Deleted user")
                                                            : t("contactActions.anonymousVisitor", "Anonymous visitor")
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell sx={{ maxWidth: 260 }}>
                                                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                                    {contact.propertyId?.title ||
                                                        contact.listing?.title ||
                                                        t("contactActions.deletedProperty", "Listing no longer available")}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    {contact.propertyId?.city || contact.listing?.city}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <PersonCell
                                                    person={contact.ownerId}
                                                    fallback={t("contactActions.deletedUser", "Deleted user")}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    icon={
                                                        contact.action === "whatsapp" ? (
                                                            <WhatsApp />
                                                        ) : contact.action === "call" ? (
                                                            <PhoneOutlined />
                                                        ) : undefined
                                                    }
                                                    label={
                                                        contact.target
                                                            ? `${actionLabel(contact.action)} · ${contact.target}`
                                                            : actionLabel(contact.action)
                                                    }
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: "#fff",
                                                        bgcolor: ACTION_COLORS[contact.action] || OTHER_COLOR,
                                                        "& .MuiChip-icon": { color: "#fff" },
                                                    }}
                                                />
                                            </TableCell>

                                            <TableCell>{formatDateTime(contact.createdAt, locale)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
