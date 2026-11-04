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

import {
    formatDate,
    formatPrice,
} from "./propertyClickUtils";

const PropertyClickCard = ({ property }) => {
    const navigate = useNavigate();

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
                            {property.title || "Untitled property"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {property.propertyType || "Unknown type"}
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
                                .join(", ") || "Location unavailable"}
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
                            {property.listingType || "Unknown listing type"}
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
                            {formatPrice(property.price)}
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
                            Last clicked: {formatDate(property.lastClickedAt)}
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
                        ID: {property.propertyId}
                    </Typography>

                    <Button
                        size="small"
                        color="primary"
                        onClick={handleViewProperty}
                        disabled={!property.propertyId}
                    >
                        View property →
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default PropertyClickCard;