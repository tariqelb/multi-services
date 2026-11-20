
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
                border: "1px solid #E2E8F0",
                borderRadius: 3,
            }}
        >
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {t("adminContactActions.recentActivity")}
                </Typography>

                <Typography
                    variant="caption" sx={{ color: "text.secondary" }}
                >
                    {t("adminContactActions.recentActivitySubtitle")}
                </Typography>
            </Box>

            {contacts.length === 0 ? (
                <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}
                >
                    {t("adminContactActions.noRecentActivity")}
                </Typography>
            ) : (
                <Stack spacing={0} divider={<Box sx={{ borderBottom: "1px solid #F1F5F9" }} />}>
                    {contacts.map((contact) => {
                        const isCall = contact.action === "call";

                        const client = contact.clientId;
                        const owner = contact.ownerId;
                        const property = contact.propertyId;

                        return (
                            <Stack
                                key={contact._id}
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" }, py: 2 }}
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

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700 }}>
                                        {[client?.firstName, client?.lastName]
                                            .filter(Boolean)
                                            .join(" ") ||
                                            t("adminContactActions.unknownClient")}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        noWrap sx={{ color: "text.secondary" }}
                                    >
                                        {client?.email || "—"}
                                    </Typography>

                                    <Typography
                                        variant="caption" sx={{ color: "text.secondary", display: "block" }}
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

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        noWrap sx={{ fontWeight: 700 }}
                                    >
                                        {property?.title ||
                                            t("adminContactActions.unknownProperty")}
                                    </Typography>

                                    <Typography
                                        variant="caption" sx={{ color: "text.secondary" }}
                                    >
                                        {property?.city || "—"}
                                    </Typography>
                                </Box>

                                <Stack
                                    direction="row"
                                    spacing={1} sx={{ alignItems: "center" }}
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
                                    spacing={0.6}
                                    sx={{ alignItems: "center",
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
