
// import React from "react";
// import { useTranslation } from "react-i18next";

// import {
//     Alert,
//     Paper,
//     Stack,
//     Typography,
//     Button,
// } from "@mui/material";

// import {
//     Phone,
//     WhatsApp,
// } from "@mui/icons-material";

// export default function PropertyContactOwner({ property }) {
//     const { t } = useTranslation();

//     if (!property) return null;

//     const phone =
//         property.phone ||
//         property.owner?.phoneNumber ||
//         "";

//     const ownerName =
//         [property.firstName, property.lastName]
//             .filter(Boolean)
//             .join(" ") || t("properties.contactOwner.owner");

//     const normalizedPhone = String(phone).trim();

//     // WhatsApp requires the international number without "+" or spaces.
//     const whatsappNumber = normalizedPhone.replace(/\D/g, "");

//     return (
//         <Paper
//             variant="outlined"
//             sx={{
//                 p: { xs: 3, md: 4 },
//                 borderRadius: "16px",
//                 borderColor: "#E2E8F0",
//                 bgcolor: "#ffffff",
//                 textAlign: "center",
//                 mb: 4,
//             }}
//         >
//             <Typography
//                 variant="h5"
//                 sx={{
//                     fontWeight: 700,
//                     mb: 1,
//                     color: "#0F172A",
//                 }}
//             >
//                 {t("properties.contactOwner.title")}
//             </Typography>

//             <Typography
//                 variant="body2"
//                 sx={{
//                     color: "#5B6577",
//                     mb: 3,
//                 }}
//             >
//                 {t("properties.contactOwner.subtitle")}
//             </Typography>

//             <Typography
//                 variant="h6"
//                 sx={{
//                     fontWeight: 700,
//                     color: "#0F172A",
//                 }}
//             >
//                 {ownerName}
//             </Typography>

//             {normalizedPhone ? (
//                 <>
//                     {/* Owner phone number */}
//                     <Typography
//                         component="a"
//                         href={`tel:${normalizedPhone}`}
//                         sx={{
//                             display: "inline-block",
//                             mt: 1,
//                             color: "#1D4ED8",
//                             fontSize: "1.1rem",
//                             fontWeight: 700,
//                             textDecoration: "none",
//                             overflowWrap: "anywhere",
//                             "&:hover": {
//                                 textDecoration: "underline",
//                             },
//                         }}
//                     >
//                         <Phone
//                             sx={{
//                                 fontSize: 18,
//                                 verticalAlign: "middle",
//                                 mr: 0.75,
//                             }}
//                         />
//                         {normalizedPhone}
//                     </Typography>

//                     {/* Contact buttons */}
//                     <Stack
//                         direction={{
//                             xs: "column",
//                             sm: "row",
//                         }}
//                         spacing={2}
//                         justifyContent="center"
//                         sx={{
//                             mt: 3,
//                             maxWidth: 500,
//                             mx: "auto",
//                         }}
//                     >
//                         <Button
//                             component="a"
//                             href={`tel:${normalizedPhone}`}
//                             variant="contained"
//                             startIcon={<Phone />}
//                             fullWidth
//                             sx={{ py: 1.2 }}
//                         >
//                             {t("properties.contactOwner.call")}
//                         </Button>

//                         <Button
//                             component="a"
//                             href={`https://wa.me/${whatsappNumber}`}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             variant="outlined"
//                             startIcon={<WhatsApp />}
//                             fullWidth
//                             sx={{
//                                 color: "#047857",
//                                 borderColor: "#86CBA8",
//                                 "&:hover": {
//                                     borderColor: "#047857",
//                                     bgcolor: "#ecfdf5",
//                                 },
//                                 py: 1.2,
//                             }}
//                         >
//                             {t("properties.contactOwner.whatsapp")}
//                         </Button>
//                     </Stack>
//                 </>
//             ) : (
//                 <Alert
//                     severity="info"
//                     sx={{
//                         mt: 2,
//                         maxWidth: 400,
//                         mx: "auto",
//                     }}
//                 >
//                     {t("properties.contactOwner.noPhone")}
//                 </Alert>
//             )}
//         </Paper>
//     );
// }


import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Alert,
    Paper,
    Stack,
    Typography,
    Button,
    Snackbar,
} from "@mui/material";

import {
    Phone,
    WhatsApp,
} from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";

export default function PropertyContactOwner({ property }) {
    const { t } = useTranslation();


    const [tracking, setTracking] = useState(false);
    const [error, setError] = useState("");

    if (!property) return null;

    const phone =
        property.phone ||
        property.owner?.phoneNumber ||
        "";

    const ownerName =
        [property.firstName, property.lastName]
            .filter(Boolean)
            .join(" ") || t("properties.contactOwner.owner");

    const normalizedPhone = String(phone).trim();
    const whatsappNumber = normalizedPhone.replace(/\D/g, "");

    const handleContact = async (action) => {

        if (!property._id) {
            setError(t("properties.contactOwner.trackingError"));
            return;
        }

        if (tracking) return;

        setTracking(true);
        setError("");

        try {
            await axiosInstance.post(
                "/dashboard/property-contacts",
                {
                    propertyId: property._id,
                    action,
                }
            );

            if (action === "call") {
                window.location.href = `tel:${normalizedPhone}`;
            } else {
                window.open(
                    `https://wa.me/${whatsappNumber}`,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        } catch (err) {
            console.error("Contact tracking error:", err);

            setError(
                t("properties.contactOwner.trackingError")
            );
        } finally {
            setTracking(false);
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 3, md: 4 },
                borderRadius: "16px",
                borderColor: "#E2E8F0",
                bgcolor: "#ffffff",
                textAlign: "center",
                mb: 4,
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: "#0F172A",
                }}
            >
                {t("properties.contactOwner.title")}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    color: "#5B6577",
                    mb: 3,
                }}
            >
                {t("properties.contactOwner.subtitle")}
            </Typography>

            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                }}
            >
                {ownerName}
            </Typography>

            {normalizedPhone ? (
                <>
                    {/* Clicking the phone number is tracked */}
                    <Typography
                        component="a"
                        href={`tel:${normalizedPhone}`}
                        onClick={(event) => {
                            event.preventDefault();
                            handleContact("call");
                        }}
                        sx={{
                            display: "inline-block",
                            mt: 1,
                            color: "#1D4ED8",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            overflowWrap: "anywhere",
                            cursor: "pointer",
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
                            onClick={() => handleContact("call")}
                            variant="contained"
                            startIcon={<Phone />}
                            fullWidth
                            disabled={tracking}
                            sx={{ py: 1.2 }}
                        >
                            {t("properties.contactOwner.call")}
                        </Button>

                        <Button
                            onClick={() => handleContact("whatsapp")}
                            variant="outlined"
                            startIcon={<WhatsApp />}
                            fullWidth
                            disabled={tracking}
                            sx={{
                                color: "#047857",
                                borderColor: "#86CBA8",
                                "&:hover": {
                                    borderColor: "#047857",
                                    bgcolor: "#ecfdf5",
                                },
                                py: 1.2,
                            }}
                        >
                            {t("properties.contactOwner.whatsapp")}
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
                    {t("properties.contactOwner.noPhone")}
                </Alert>
            )}

            <Snackbar
                open={Boolean(error)}
                autoHideDuration={4000}
                onClose={() => setError("")}
                message={error}
            />
        </Paper>
    );
}

