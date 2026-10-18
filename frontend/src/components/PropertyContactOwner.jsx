import React from "react";
import { Alert, Paper, Stack, Typography, Button } from "@mui/material";
import { Phone, WhatsApp } from "@mui/icons-material";

export default function PropertyContactOwner({ property }) {
    if (!property) return null;

    const phone = property.phone || property.owner?.phoneNumber || "";
    const ownerName =
        [property.firstName, property.lastName].filter(Boolean).join(" ") ||
        "Property owner";

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 4,
                borderRadius: 4,
                bgcolor: "#ffffff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                textAlign: "center",
                mb: 4,
            }}
        >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "#0f172a" }}>
                Interested in this property?
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
                Get in touch with the owner directly using the contacts below.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                {ownerName}
            </Typography>

            {property.email && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                    {property.email}
                </Typography>
            )}

            {phone ? (
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    justifyContent="center"
                    sx={{ mt: 2, maxWidth: 500, mx: "auto" }}
                >
                    <Button
                        component="a"
                        href={`tel:${phone}`}
                        variant="contained"
                        startIcon={<Phone />}
                        fullWidth
                        sx={{
                            bgcolor: "#059669",
                            "&:hover": { bgcolor: "#047857" },
                            textTransform: "none",
                            fontWeight: 700,
                            py: 1.2,
                        }}
                    >
                        Call owner
                    </Button>

                    <Button
                        component="a"
                        href={`https://wa.me/${String(phone).replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        startIcon={<WhatsApp />}
                        fullWidth
                        sx={{
                            color: "#059669",
                            borderColor: "#059669",
                            textTransform: "none",
                            fontWeight: 700,
                            py: 1.2,
                        }}
                    >
                        WhatsApp
                    </Button>
                </Stack>
            ) : (
                <Alert severity="info" sx={{ mt: 2, maxWidth: 400, mx: "auto" }}>
                    The owner has not provided a phone number.
                </Alert>
            )}
        </Paper>
    );
}