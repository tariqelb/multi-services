import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Alert, Button, Snackbar, Stack, Typography } from "@mui/material";

import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import { trackPropertyContact } from "../../../api/trackContact";
import VerifiedContact from "../listings/VerifiedContact";
import {
    MobileActionBar,
    OwnerSummary,
    SidebarCard,
} from "../../../Components/ui/DetailsKit";

const whatsappSx = {
    bgcolor: "#16A34A",
    color: "#fff",
    "&:hover": { bgcolor: "#15803D" },
};

/**
 * Owner contact card.
 * - Renders as a sidebar card (desktop + mobile).
 * - With `withMobileBar`, also renders a fixed Call / WhatsApp bar on phones.
 * Contact clicks are tracked (statistics) without blocking the action.
 */
// saveButton: the "Save" button, shown right under WhatsApp (same place on
// every details page).
export default function PropertyContactOwner({ property, withMobileBar = false, saveButton = null }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState("");

    if (!property) return null;

    const ownerId =
        property.userId?._id ||
        property.userId?.id ||
        property.userId ||
        property.owner?._id ||
        property.owner?.id ||
        property.ownerId ||
        "";

    const phone = property.phone || property.owner?.phoneNumber || "";

    const ownerName =
        [
            property.firstName || property.owner?.firstName,
            property.lastName || property.owner?.lastName,
        ]
            .filter(Boolean)
            .join(" ") || t("properties.contactOwner.owner", "Owner");

    const avatar = property.owner?.profileImage || property.userId?.profileImage || "";

    const normalizedPhone = String(phone).trim();

    // The owner's current WhatsApp number, else the phone number.
    const whatsappDisplay = String(property.whatsappNumber || normalizedPhone).trim();
    const whatsappNumber = whatsappDisplay.replace(/\D/g, "");

    const verified = property.contactVerified || {};

    const handleVisitProfile = () => {
        if (!ownerId) {
            setError(t("properties.contactOwner.profileError", "Owner profile is unavailable."));
            return;
        }
        navigate(`/profile/${ownerId}`);
    };

    // Track in the background, then open the call / WhatsApp immediately.
    const handleContact = (action) => {
        if (action === "call" && !normalizedPhone) return;
        if (action === "whatsapp" && !whatsappNumber) return;

        trackPropertyContact(property._id || property.id, action);

        if (action === "call") {
            window.location.href = `tel:${normalizedPhone}`;
        } else {
            window.open(`https://wa.me/${whatsappNumber}`, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <>
            <SidebarCard>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {t("properties.contactOwner.title", "Contact the owner")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    {t("properties.contactOwner.subtitle", "Get in touch directly with the advertiser.")}
                </Typography>

                <OwnerSummary name={ownerName} avatar={avatar} />

                {/* Current numbers, "Verified" when the owner verified them */}
                {(normalizedPhone || whatsappDisplay) && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        <VerifiedContact
                            icon={<PhoneRoundedIcon />}
                            label={
                                whatsappDisplay === normalizedPhone
                                    ? t("properties.contactOwner.phoneAndWhatsapp", "Phone & WhatsApp")
                                    : t("properties.contactOwner.phone", "Phone")
                            }
                            value={normalizedPhone}
                            verified={
                                whatsappDisplay === normalizedPhone
                                    ? verified.phone || verified.whatsapp
                                    : verified.phone
                            }
                        />
                        {whatsappDisplay && whatsappDisplay !== normalizedPhone ? (
                            <VerifiedContact
                                icon={<WhatsAppIcon />}
                                label="WhatsApp"
                                value={whatsappDisplay}
                                verified={verified.whatsapp}
                            />
                        ) : null}
                    </Stack>
                )}

                {!normalizedPhone && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {t("properties.contactOwner.noPhone", "No phone number available.")}
                    </Alert>
                )}

                <Stack spacing={1.25} sx={{ mt: 2.5 }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PhoneRoundedIcon />}
                        onClick={() => handleContact("call")}
                        disabled={!normalizedPhone}
                        fullWidth
                    >
                        {t("properties.contactOwner.call", "Call")}
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<WhatsAppIcon />}
                        onClick={() => handleContact("whatsapp")}
                        disabled={!whatsappNumber}
                        fullWidth
                        sx={whatsappSx}
                    >
                        {t("properties.contactOwner.whatsapp", "WhatsApp")}
                    </Button>

                    {saveButton}

                    <Button
                        variant="outlined"
                        startIcon={<AccountCircleOutlinedIcon />}
                        onClick={handleVisitProfile}
                        disabled={!ownerId}
                        fullWidth
                    >
                        {t("properties.contactOwner.visitProfile", "Visit profile")}
                    </Button>
                </Stack>
            </SidebarCard>

            {withMobileBar && (normalizedPhone || whatsappNumber) && (
                <MobileActionBar>
                    <Button
                        variant="contained"
                        startIcon={<PhoneRoundedIcon />}
                        onClick={() => handleContact("call")}
                        disabled={!normalizedPhone}
                    >
                        {t("properties.contactOwner.call", "Call")}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        onClick={() => handleContact("whatsapp")}
                        disabled={!whatsappNumber}
                        sx={whatsappSx}
                    >
                        {t("properties.contactOwner.whatsapp", "WhatsApp")}
                    </Button>
                </MobileActionBar>
            )}

            <Snackbar
                open={Boolean(error)}
                autoHideDuration={4000}
                onClose={() => setError("")}
                message={error}
            />
        </>
    );
}
