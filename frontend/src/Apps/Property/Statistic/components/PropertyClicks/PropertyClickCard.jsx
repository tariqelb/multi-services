// admin/components/PropertyClicks/PropertyClickCard.jsx

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

import {
    AttachMoney,
    CalendarMonth,
    HomeWork,
    LocationOn,
    PhoneInTalkOutlined,
    Visibility,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { formatDate, formatPrice } from "./propertyClickUtils";

import {
    formatNumber,
    formatPercent,
    getLocale,
    translateValue,
} from "../shared/analyticsUtils";

function InfoRow({ icon, children }) {
    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box sx={{ color: "action.active", display: "flex" }}>{icon}</Box>

            <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
                {children}
            </Typography>
        </Stack>
    );
}

function Metric({ label, value, color = "text.primary" }) {
    return (
        <Box sx={{ textAlign: "center", minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: color }}>
                {value}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {label}
            </Typography>
        </Box>
    );
}

const PropertyClickCard = ({ property }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.language);

    const handleViewProperty = () => {
        if (!property?.propertyId) return;

        navigate(`/properties/${property.propertyId}`);
    };

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                transition: "all 0.2s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.08)",
                    borderColor: "primary.main",
                },
            }}
        >
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
                            {property.title ||
                                t("adminPropertyClicks.properties.untitled", "Untitled property")}
                        </Typography>

                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {translateValue(t, "adminPropertyClicks.propertyTypes", property.propertyType)}
                        </Typography>
                    </Box>

                    {property.clicksInRange > 0 && (
                        <Chip
                            size="small"
                            color="primary"
                            label={t("adminPropertyClicks.properties.inPeriod", "+{{count}} in period", {
                                count: formatNumber(property.clicksInRange, locale),
                            })}
                            sx={{ fontWeight: 700, flexShrink: 0 }}
                        />
                    )}
                </Stack>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 1,
                        p: 1.5,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: "#EFF6FF",
                    }}
                >
                    <Metric
                        label={t("adminPropertyClicks.properties.views", "Views")}
                        value={formatNumber(property.clickCount, locale)}
                        color="primary.main"
                    />
                    <Metric
                        label={t("adminPropertyClicks.properties.contacts", "Contacts")}
                        value={formatNumber(property.contacts, locale)}
                        color="success.main"
                    />
                    <Metric
                        label={t("adminPropertyClicks.properties.conversion", "Conversion")}
                        value={formatPercent(property.conversionRate, locale)}
                        color="secondary.main"
                    />
                </Box>

                <Stack spacing={1.25}>
                    <InfoRow icon={<LocationOn fontSize="small" />}>
                        {[property.neighborhood, property.city].filter(Boolean).join(", ") ||
                            t("adminPropertyClicks.properties.locationUnavailable", "Location unavailable")}
                    </InfoRow>

                    <InfoRow icon={<HomeWork fontSize="small" />}>
                        {translateValue(t, "adminPropertyClicks.listingTypes", property.listingType)}
                    </InfoRow>

                    <InfoRow icon={<AttachMoney fontSize="small" />}>
                        {formatPrice(property.price, locale)}
                    </InfoRow>

                    <InfoRow icon={<CalendarMonth fontSize="small" />}>
                        {t("adminPropertyClicks.properties.lastClicked", "Last viewed {{date}}", {
                            date: formatDate(property.lastClickedAt, locale),
                        })}
                    </InfoRow>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        {property.contacts > 0 ? (
                            <PhoneInTalkOutlined fontSize="small" color="success" />
                        ) : (
                            <Visibility fontSize="small" color="disabled" />
                        )}

                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {property.contacts > 0
                                ? t("adminPropertyClicks.properties.generatesLeads", "Generates leads")
                                : t("adminPropertyClicks.properties.noLeads", "No contacts yet")}
                        </Typography>
                    </Stack>

                    <Button
                        size="small"
                        onClick={handleViewProperty}
                        disabled={!property.propertyId}
                    >
                        {t("adminPropertyClicks.properties.view", "View")} →
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default PropertyClickCard;
