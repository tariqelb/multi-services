import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Button,
} from "@mui/material";

import {
    formatDate,
    formatNumber,
} from "./externalClicksUtils";

const ExternalListingClickCard = ({ listing, color = "", locale }) => {
    const { t } = useTranslation();

    const details = [
        {
            label: t("adminExternalClicks.card.propertyType"),
            value: listing.propertyType || t("adminExternalClicks.common.unknown"),
        },
        {
            label: t("adminExternalClicks.card.listingType"),
            value: listing.listingType || t("adminExternalClicks.common.unknown"),
        },
        {
            label: t("adminExternalClicks.card.city"),
            value: listing.city || t("adminExternalClicks.common.unknown"),
        },
        {
            label: t("adminExternalClicks.card.neighborhood"),
            value: listing.neighborhood || t("adminExternalClicks.common.unknown"),
        },
        {
            label: t("adminExternalClicks.card.sourceWebsite"),
            value:
                listing.sourceName ||
                listing.sourceDomain ||
                t("adminExternalClicks.common.unknown"),
        },
        {
            label: t("adminExternalClicks.card.firstClick"),
            value: formatDate(listing.firstClickedAt, locale),
        },
        {
            label: t("adminExternalClicks.card.lastClick"),
            value: formatDate(listing.lastClickedAt, locale),
        },
        {
            label: t("adminExternalClicks.card.lastClickedBy"),
            value:
                listing.lastClickedBy ||
                t("adminExternalClicks.card.guest"),
        },
    ];

    return (
        <Card
            elevation={0}
            onClick={(event) => event.stopPropagation()}
            sx={{
                width: "100%",
                minWidth: 0,
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(109, 146, 227, 0.08)",
                },
            }}
        >
            <CardContent
                sx={{
                    p: 3,
                    "&:last-child": { pb: 3 },
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            borderRadius: 2,
                            bgcolor: `${color}15`,
                            color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.35rem",
                            fontWeight: 700,
                        }}
                    >
                        ↗
                    </Box>

                    <Box minWidth={0} flex={1}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{
                                overflowWrap: "anywhere",
                                lineHeight: 1.4,
                            }}
                        >
                            {listing.title ||
                                t("adminExternalClicks.card.untitled")}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={0.5}
                            noWrap
                        >
                            {listing.sourceName ||
                                listing.sourceDomain ||
                                t("adminExternalClicks.card.unknownWebsite")}
                        </Typography>
                    </Box>
                </Stack>

                <Box
                    sx={{
                        mt: 3,
                        p: 2.5,
                        borderRadius: 2,
                        border: "1px solid",
                        bgcolor: "#DBEAFE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Box>
                        <Typography
                            variant="caption"
                            color={`${color}10`}
                            fontWeight={700}
                            sx={{
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                            }}
                        >
                            {t("adminExternalClicks.card.totalEngagement")}
                        </Typography>

                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="primary.main"
                            mt={0.5}
                        >
                            {formatNumber(listing.clickCount, locale)}
                        </Typography>
                    </Box>

                    <Typography
                        variant="body2"
                        color="primary.main"
                        fontWeight={700}
                    >
                        {Number(listing.clickCount) === 1
                            ? t("adminExternalClicks.card.click")
                            : t("adminExternalClicks.card.clicks")}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        mt: 3,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    {details.map((item, index) => (
                        <Box
                            key={item.label}
                            sx={{
                                p: 2,
                                minWidth: 0,
                                borderRight: index % 2 === 0
                                    ? "1px solid"
                                    : "none",
                                borderBottom: index < details.length - 2
                                    ? "1px solid"
                                    : "none",
                                borderColor: "divider",
                                bgcolor: "background.default",
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.primary"
                                fontWeight={700}
                                display="block"
                                mb={0.5}
                            >
                                {item.label}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    overflowWrap: "anywhere",
                                    lineHeight: 1.5,
                                }}
                            >
                                {item.value}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Box
                    sx={{
                        mt: 3,
                        pt: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.75,
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ overflowWrap: "anywhere" }}
                    >
                        {t("adminExternalClicks.card.externalListingId")}:{" "}
                        {listing.externalListingId ||
                            t("adminExternalClicks.common.unknown")}
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ overflowWrap: "anywhere" }}
                    >
                        {t("adminExternalClicks.card.sourceDomain")}:{" "}
                        {listing.sourceDomain ||
                            t("adminExternalClicks.common.unknown")}
                    </Typography>
                </Box>

                <Box display="flex" justifyContent="flex-end" mt={2}>
                    {listing.sourceUrl ? (
                        <Button
                            component="a"
                            href={listing.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="text"
                            color="primary"
                            onClick={(event) => event.stopPropagation()}
                            endIcon={<span>↗</span>}
                        >
                            {t("adminExternalClicks.card.openOriginal")}
                        </Button>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {t("adminExternalClicks.card.sourceUnavailable")}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default ExternalListingClickCard;