
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Avatar,
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import {
    Phone,
    WhatsApp,
    AccessTime,
} from "@mui/icons-material";

export default function RecentContactActivity({
    contacts = [],
}) {
    const { t, i18n } = useTranslation();

    const formatDate = (date) => {
        if (!date) return "—";

        return new Intl.DateTimeFormat(i18n.language, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(date));
    };

    const getInitials = (user) => {
        return (
            `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`
                .toUpperCase() || "?"
        );
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 3 },
                border: "1px solid #E8EDF4",
                borderRadius: 3,
            }}
        >
            <Box mb={2.5}>
                <Typography variant="h6" fontWeight={800}>
                    {t("adminContactActions.recentActivity")}
                </Typography>

                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {t("adminContactActions.recentActivitySubtitle")}
                </Typography>
            </Box>

            {contacts.length === 0 ? (
                <Typography
                    textAlign="center"
                    color="text.secondary"
                    py={4}
                >
                    {t("adminContactActions.noRecentActivity")}
                </Typography>
            ) : (
                <Stack spacing={0} divider={<Box sx={{ borderBottom: "1px solid #EEF2F7" }} />}>
                    {contacts.map((contact) => {
                        const isCall = contact.action === "call";

                        const client = contact.clientId;
                        const owner = contact.ownerId;
                        const property = contact.propertyId;

                        return (
                            <Stack
                                key={contact._id}
                                direction={{ xs: "column", sm: "row" }}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                spacing={2}
                                py={2}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor: "#EDE9FE",
                                        color: "#6D28D9",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getInitials(client)}
                                </Avatar>

                                <Box flex={1} minWidth={0}>
                                    <Typography fontWeight={700}>
                                        {[client?.firstName, client?.lastName]
                                            .filter(Boolean)
                                            .join(" ") ||
                                            t("adminContactActions.unknownClient")}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        noWrap
                                    >
                                        {client?.email || "—"}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                    >
                                        {t("adminContactActions.contacted")}{" "}
                                        <Box
                                            component="span"
                                            sx={{
                                                color: "text.primary",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {owner
                                                ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
                                                : t("adminContactActions.unknownOwner")}
                                        </Box>
                                    </Typography>
                                </Box>

                                <Box flex={1} minWidth={0}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        noWrap
                                    >
                                        {property?.title ||
                                            t("adminContactActions.unknownProperty")}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {property?.city || "—"}
                                    </Typography>
                                </Box>

                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                >
                                    <Chip
                                        icon={
                                            isCall
                                                ? <Phone />
                                                : <WhatsApp />
                                        }
                                        label={
                                            isCall
                                                ? t("adminContactActions.call")
                                                : "WhatsApp"
                                        }
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            bgcolor: isCall
                                                ? "#ECFEFF"
                                                : "#ECFDF5",
                                            color: isCall
                                                ? "#0E7490"
                                                : "#047857",
                                            "& .MuiChip-icon": {
                                                color: "inherit",
                                            },
                                        }}
                                    />
                                </Stack>

                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.6}
                                    sx={{
                                        minWidth: { sm: 145 },
                                        color: "text.secondary",
                                    }}
                                >
                                    <AccessTime sx={{ fontSize: 15 }} />

                                    <Typography variant="caption">
                                        {formatDate(contact.createdAt)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        );
                    })}
                </Stack>
            )}
        </Paper>
    );
}
