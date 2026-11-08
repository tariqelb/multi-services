import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import {
    HomeWorkOutlined,
    Phone,
    WhatsApp,
    EmojiEvents,
    Visibility,
} from "@mui/icons-material";

import getImageUrl from "../../utils/getImageUrl";

export default function TopContactedProperties({
    properties = [],
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const getPropertyImage = (property) => {
        const image = property?.images?.[0];

        if (!image) return "";

        return getImageUrl(image);
    };

    const getPropertyViews = (item, property) => {
        return (
            item.views ??
            item.totalViews ??
            item.propertyViews ??
            property?.views ??
            property?.viewCount ??
            0
        );
    };

    const handlePropertyClick = (propertyId) => {
        if (!propertyId) {
            console.error("Property ID is missing.");
            return;
        }

        navigate(`/properties/${propertyId}`);
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
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2.5}
            >
                <Box>
                    <Typography variant="h6" fontWeight={800}>
                        {t("adminContactActions.topProperties")}
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {t("adminContactActions.topPropertiesSubtitle")}
                    </Typography>
                </Box>

                <EmojiEvents
                    sx={{
                        color: "#D97706",
                        fontSize: 27,
                    }}
                />
            </Stack>

            {properties.length === 0 ? (
                <Typography
                    color="text.secondary"
                    textAlign="center"
                    py={4}
                >
                    {t("adminContactActions.noProperties")}
                </Typography>
            ) : (
                <Box
                    sx={{
                        maxHeight: properties.length > 10 ? 650 : "none",
                        overflowY:
                            properties.length > 10 ? "auto" : "visible",
                        overflowX: "hidden",
                        pr: properties.length > 10 ? 1 : 0,
                        "&::-webkit-scrollbar": {
                            width: "6px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "#CBD5E1",
                            borderRadius: "10px",
                        },
                        "&::-webkit-scrollbar-track": {
                            backgroundColor: "transparent",
                        },
                    }}
                >
                    <Stack spacing={1.5}>
                        {properties.map((item, index) => {
                            const property =
                                item._id && typeof item._id === "object"
                                    ? item._id
                                    : item.property;

                            const propertyId =
                                property?._id ||
                                (typeof item.property === "string"
                                    ? item.property
                                    : null) ||
                                item.propertyId ||
                                (typeof item._id === "string"
                                    ? item._id
                                    : null);

                            const views = getPropertyViews(
                                item,
                                property
                            );

                            return (
                                <Stack
                                    key={String(propertyId || index)}
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                    onClick={() =>
                                        handlePropertyClick(propertyId)
                                    }
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: "#F8FAFC",
                                        cursor: propertyId
                                            ? "pointer"
                                            : "default",
                                        transition: "all 0.2s ease",
                                        "&:hover": propertyId
                                            ? {
                                                bgcolor: "#F1F5F9",
                                                transform: "translateY(-1px)",
                                            }
                                            : {},
                                    }}
                                >
                                    <Typography
                                        fontWeight={800}
                                        color="text.secondary"
                                        sx={{
                                            width: 25,
                                            textAlign: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        #{index + 1}
                                    </Typography>

                                    <Box
                                        component="img"
                                        src={getPropertyImage(property)}
                                        alt={property?.title || "Property"}
                                        sx={{
                                            width: 65,
                                            height: 58,
                                            borderRadius: 2,
                                            objectFit: "cover",
                                            bgcolor: "#E2E8F0",
                                            flexShrink: 0,
                                        }}
                                        onError={(event) => {
                                            event.currentTarget.style.visibility =
                                                "hidden";
                                        }}
                                    />

                                    <Box flex={1} minWidth={0}>
                                        <Typography
                                            fontWeight={700}
                                            noWrap
                                        >
                                            {property?.title ||
                                                t(
                                                    "adminContactActions.unknownProperty"
                                                )}
                                        </Typography>

                                        <Stack
                                            direction="row"
                                            spacing={0.7}
                                            alignItems="center"
                                        >
                                            <HomeWorkOutlined
                                                sx={{
                                                    fontSize: 14,
                                                    color: "text.secondary",
                                                }}
                                            />

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                noWrap
                                            >
                                                {[
                                                    property?.propertyType,
                                                    property?.city,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" • ") ||
                                                    t(
                                                        "adminContactActions.property"
                                                    )}
                                            </Typography>
                                        </Stack>

                                        <Stack
                                            direction="row"
                                            spacing={1.5}
                                            mt={0.75}
                                            alignItems="center"
                                            flexWrap="wrap"
                                            useFlexGap
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={0.4}
                                                alignItems="center"
                                            >
                                                <Visibility
                                                    sx={{
                                                        fontSize: 14,
                                                        color: "#7C3AED",
                                                    }}
                                                />

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {views}
                                                </Typography>
                                            </Stack>

                                            <Stack
                                                direction="row"
                                                spacing={0.4}
                                                alignItems="center"
                                            >
                                                <Phone
                                                    sx={{
                                                        fontSize: 13,
                                                        color: "#0891B2",
                                                    }}
                                                />

                                                <Typography variant="caption">
                                                    {item.calls || 0}
                                                </Typography>
                                            </Stack>

                                            <Stack
                                                direction="row"
                                                spacing={0.4}
                                                alignItems="center"
                                            >
                                                <WhatsApp
                                                    sx={{
                                                        fontSize: 13,
                                                        color: "#059669",
                                                    }}
                                                />

                                                <Typography variant="caption">
                                                    {item.whatsapp || 0}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Box>

                                    <Chip
                                        label={`${item.totalContacts || 0} ${t(
                                            "adminContactActions.clicks"
                                        )}`}
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            bgcolor: "#EDE9FE",
                                            color: "#6D28D9",
                                            flexShrink: 0,
                                        }}
                                    />
                                </Stack>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}