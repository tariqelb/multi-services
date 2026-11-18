
import {
    Card,
    CardContent,
    Box,
    Typography,
    Divider,
    Button,
} from "@mui/material";

import {
    LocationOn,
    CalendarMonth,
    Visibility,
    HomeWork,
    AttachMoney,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    formatDate,
    formatPrice,
} from "./propertyClickUtils";

const PropertyClickCard = ({ property }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const locale = i18n.language?.startsWith("ar")
        ? "ar"
        : i18n.language?.startsWith("fr")
            ? "fr-FR"
            : "en-US";

    const translateValue = (value, category) => {
        if (!value) return "";

        const normalized = String(value)
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("-", "_");

        return t(
            `adminPropertyClicks.${category}.${normalized}`,
            value
        );
    };

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
            <CardContent
                sx={{
                    p: 2.5,
                    "&:last-child": {
                        pb: 2.5,
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            noWrap
                        >
                            {property.title ||
                                t("adminPropertyClicks.properties.untitled")}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {translateValue(
                                property.propertyType,
                                "propertyTypes"
                            ) ||
                                t("adminPropertyClicks.properties.unknownType")}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: "#DBEAFE",
                            color: "primary.dark",
                            flexShrink: 0,
                        }}
                    >
                        <Visibility fontSize="small" />

                        <Typography
                            variant="body2"
                            fontWeight={700}
                        >
                            {property.clickCount || 0}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <LocationOn
                            fontSize="small"
                            color="action"
                        />

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {[property.neighborhood, property.city]
                                .filter(Boolean)
                                .join(", ") ||
                                t("adminPropertyClicks.properties.locationUnavailable")}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <HomeWork
                            fontSize="small"
                            color="action"
                        />

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {translateValue(
                                property.listingType,
                                "listingTypes"
                            ) ||
                                t("adminPropertyClicks.properties.unknownListingType")}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <AttachMoney
                            fontSize="small"
                            color="action"
                        />

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {formatPrice(property.price, locale)}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <CalendarMonth
                            fontSize="small"
                            color="action"
                        />

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {t("adminPropertyClicks.properties.lastClicked", {
                                date: formatDate(property.lastClickedAt, locale),
                            })}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {t("adminPropertyClicks.properties.id", {
                            id: property.propertyId,
                        })}
                    </Typography>

                    <Button
                        size="small"
                        color="primary"
                        onClick={handleViewProperty}
                        disabled={!property.propertyId}
                    >
                        {t("adminPropertyClicks.properties.view")} →
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default PropertyClickCard;
