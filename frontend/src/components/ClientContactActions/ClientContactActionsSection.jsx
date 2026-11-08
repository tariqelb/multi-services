import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    Stack,
    Typography,
} from "@mui/material";

import {
    Refresh,
    Phone,
    WhatsApp,
    Today,
    TouchApp,
} from "@mui/icons-material";

import axiosInstance from "../../api/axiosInstance";

import ContactStatCard from "./ContactStatCard";
import ContactActivityChart from "./ContactActivityChart";
import ContactActionBreakdown from "./ContactActionBreakdown";
import TopContactedProperties from "./TopContactedProperties";
import RecentContactActivity from "./RecentContactActivity";

export default function ClientContactActionsSection() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const handlePropertyClick = useCallback(
        (propertyId) => {
            if (!propertyId) {
                console.error("Property ID is missing.");
                return;
            }

            navigate(`/properties/${propertyId}`);
        },
        [navigate]
    );

    const fetchAnalytics = useCallback(async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await axiosInstance.get(
                "/dashboard/property-contacts"
            );

            setAnalytics(response.data);
        } catch (err) {
            console.error("Property contact analytics error:", err);

            setError(
                err.response?.data?.message ||
                    t("adminContactActions.loadError")
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={350}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error && !analytics) {
        return (
            <Alert
                severity="error"
                action={
                    <Button
                        color="inherit"
                        size="small"
                        onClick={() => fetchAnalytics()}
                    >
                        {t("adminContactActions.retry")}
                    </Button>
                }
            >
                {error}
            </Alert>
        );
    }

    const statistics = analytics?.statistics || {};

    const totalContacts = statistics.totalContacts || 0;
    const callContacts = statistics.callContacts || 0;
    const whatsappContacts = statistics.whatsappContacts || 0;
    const contactsToday = statistics.contactsToday || 0;

    return (
        <Stack spacing={3}>
            {/* Header */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
            >
                <Box>
                    <Typography
                        variant="h5"
                        fontWeight={800}
                        color="text.primary"
                    >
                        {t("adminContactActions.title")}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        {t("adminContactActions.subtitle")}
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={
                        refreshing
                            ? <CircularProgress size={17} />
                            : <Refresh />
                    }
                    onClick={() => fetchAnalytics(true)}
                    disabled={refreshing}
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                    }}
                >
                    {t("adminContactActions.refresh")}
                </Button>
            </Stack>

            {error && (
                <Alert severity="warning">
                    {error}
                </Alert>
            )}

            {/* Statistics */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <ContactStatCard
                        title={t("adminContactActions.totalContacts")}
                        value={totalContacts}
                        icon={<TouchApp />}
                        color="#2563EB"
                        background="#EFF6FF"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <ContactStatCard
                        title={t("adminContactActions.contactsToday")}
                        value={contactsToday}
                        icon={<Today />}
                        color="#7C3AED"
                        background="#F5F3FF"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <ContactStatCard
                        title={t("adminContactActions.phoneClicks")}
                        value={callContacts}
                        icon={<Phone />}
                        color="#0891B2"
                        background="#ECFEFF"
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <ContactStatCard
                        title={t("adminContactActions.whatsappClicks")}
                        value={whatsappContacts}
                        icon={<WhatsApp />}
                        color="#059669"
                        background="#ECFDF5"
                    />
                </Grid>
            </Grid>

            {/* Activity and distribution */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <ContactActivityChart
                        data={analytics?.dailyActivity || []}
                    />
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <ContactActionBreakdown
                        calls={callContacts}
                        whatsapp={whatsappContacts}
                    />
                </Grid>
            </Grid>

            {/* Top properties */}
            <TopContactedProperties
                properties={analytics?.topProperties || []}
                onClick={handlePropertyClick}
            />

            {/* Recent activity */}
            <RecentContactActivity
                contacts={analytics?.recentContacts || []}
            />
        </Stack>
    );
}