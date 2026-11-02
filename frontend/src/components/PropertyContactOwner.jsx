import React from "react";
import {
    Alert,
    Paper,
    Stack,
    Typography,
    Button,
} from "@mui/material";
import {
    Phone,
    WhatsApp,
} from "@mui/icons-material";

export default function PropertyContactOwner({ property }) {
    if (!property) return null;

    const phone =
        property.phone ||
        property.owner?.phoneNumber ||
        "";

    const ownerName =
        [property.firstName, property.lastName]
            .filter(Boolean)
            .join(" ") || "Property owner";

    const normalizedPhone = String(phone).trim();

    // WhatsApp requires the international number without "+" or spaces.
    const whatsappNumber = normalizedPhone.replace(/\D/g, "");

    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                bgcolor: "#ffffff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                textAlign: "center",
                mb: 4,
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 800,
                    mb: 1,
                    color: "#0f172a",
                }}
            >
                Interested in this property?
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    color: "#64748b",
                    mb: 3,
                }}
            >
                Contact the owner directly by phone or WhatsApp.
            </Typography>

            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    color: "#1e293b",
                }}
            >
                {ownerName}
            </Typography>

            {normalizedPhone ? (
                <>
                    {/* Owner phone number */}
                    <Typography
                        component="a"
                        href={`tel:${normalizedPhone}`}
                        sx={{
                            display: "inline-block",
                            mt: 1,
                            color: "#047857",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            overflowWrap: "anywhere",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        <Phone
                            sx={{
                                fontSize: 18,
                                verticalAlign: "middle",
                                mr: 0.75,
                            }}
                        />
                        {normalizedPhone}
                    </Typography>

                    {/* Contact buttons */}
                    <Stack
                        direction={{
                            xs: "column",
                            sm: "row",
                        }}
                        spacing={2}
                        justifyContent="center"
                        sx={{
                            mt: 3,
                            maxWidth: 500,
                            mx: "auto",
                        }}
                    >
                        <Button
                            component="a"
                            href={`tel:${normalizedPhone}`}
                            variant="contained"
                            startIcon={<Phone />}
                            fullWidth
                            sx={{
                                bgcolor: "#059669",
                                "&:hover": {
                                    bgcolor: "#047857",
                                },
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1.2,
                            }}
                        >
                            Call Owner
                        </Button>

                        <Button
                            component="a"
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            startIcon={<WhatsApp />}
                            fullWidth
                            sx={{
                                color: "#059669",
                                borderColor: "#059669",
                                "&:hover": {
                                    borderColor: "#047857",
                                    bgcolor: "#ecfdf5",
                                },
                                textTransform: "none",
                                fontWeight: 700,
                                py: 1.2,
                            }}
                        >
                            WhatsApp
                        </Button>
                    </Stack>
                </>
            ) : (
                <Alert
                    severity="info"
                    sx={{
                        mt: 2,
                        maxWidth: 400,
                        mx: "auto",
                    }}
                >
                    The owner has not provided a phone number.
                </Alert>
            )}
        </Paper>
    );
}