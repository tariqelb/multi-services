import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    Typography,
} from "@mui/material";

import {
    LocationOn,
    MeetingRoom,
    Visibility,
} from "@mui/icons-material";

import {
    formatPrice,
} from "../utils/publicProfileHelpers";

export default function ListingCard({
    image,
    title,
    subtitle,
    location,
    description,
    price,
    priceLabel,
    status,
    details = [],
    onView,
    imageFit = "cover",
}) {
    const { t, i18n } = useTranslation();

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 3,
                },
            }}
        >
            <Box sx={{ position: "relative" }}>
                {image ? (
                    <CardMedia
                        component="img"
                        image={image}
                        alt={title || ""}
                        sx={{
                            height: 190,
                            width: "100%",
                            objectFit: imageFit,
                            bgcolor: "action.hover",
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            height: 190,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "action.hover",
                            color: "text.disabled",
                        }}
                    >
                        <MeetingRoom sx={{ fontSize: 52 }} />
                    </Box>
                )}

                {status && (
                    <Chip
                        label={status}
                        size="small"
                        color="primary"
                        sx={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            bgcolor: "background.paper",
                        }}
                    />
                )}
            </Box>

            <CardContent
                sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                }}
            >
                <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    noWrap
                    title={title}
                >
                    {title || t("publicProfile.untitled")}
                </Typography>

                {subtitle && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.3 }}
                    >
                        {subtitle}
                    </Typography>
                )}

                {location && (
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ mt: 1 }}
                    >
                        <LocationOn
                            fontSize="small"
                            color="action"
                        />
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                        >
                            {location}
                        </Typography>
                    </Stack>
                )}

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 1.2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 40,
                        }}
                    >
                        {description}
                    </Typography>
                )}

                {details.length > 0 && (
                    <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 1.5 }}
                    >
                        {details.map((detail, index) => (
                            <Chip
                                key={`${detail}-${index}`}
                                size="small"
                                variant="outlined"
                                label={detail}
                            />
                        ))}
                    </Stack>
                )}

                <Box sx={{ flex: 1 }} />

                {price !== null && price !== undefined && (
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ mt: 2 }}
                    >
                        {priceLabel || ""}
                        {formatPrice(price, i18n.language)}
                        <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                        >
                            {priceLabel ? "" : ""}
                        </Typography>
                    </Typography>
                )}

                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={onView}
                    sx={{ mt: 1.5, textTransform: "none" }}
                >
                    {t("publicProfile.viewDetails")}
                </Button>
            </CardContent>
        </Card>
    );
}