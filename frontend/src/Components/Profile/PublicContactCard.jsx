// src/Components/Profile/PublicContactCard.jsx
//
// Contact block of a public profile (property and vehicles): only what the
// user chose to show in Settings > Public profile (email, phone, WhatsApp,
// address) and their public social media links. Nothing is rendered when
// they show nothing.

import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";

import { SocialLinksList } from "./SocialLinks";

const waLink = (number) => `https://wa.me/${String(number || "").replace(/\D/g, "")}`;

function Verified({ show }) {
    const { t } = useTranslation();
    if (!show) return null;
    return (
        <Chip
            size="small"
            color="success"
            variant="outlined"
            icon={<VerifiedRoundedIcon />}
            label={t("publicContact.verified", "Verified")}
            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem" } }}
        />
    );
}

export default function PublicContactCard({ contact, socialLinks = [] }) {
    const { t } = useTranslation();
    const links = (socialLinks || []).filter((link) => link?.url);
    if (!contact && !links.length) return null;

    const rows = !contact ? [] : [
        contact.phone && {
            key: "phone",
            icon: <PhoneOutlinedIcon fontSize="small" />,
            label: t("publicContact.phone", "Phone"),
            value: contact.phone,
            href: `tel:${contact.phone}`,
            verified: contact.phoneVerified,
            ltr: true,
        },
        contact.whatsappNumber && {
            key: "whatsapp",
            icon: <WhatsAppIcon fontSize="small" />,
            label: t("publicContact.whatsapp", "WhatsApp"),
            value: contact.whatsappNumber,
            href: waLink(contact.whatsappNumber),
            external: true,
            verified: contact.whatsappVerified,
            ltr: true,
        },
        contact.email && {
            key: "email",
            icon: <EmailOutlinedIcon fontSize="small" />,
            label: t("publicContact.email", "Email"),
            value: contact.email,
            href: `mailto:${contact.email}`,
            verified: contact.emailVerified,
            ltr: true,
        },
        contact.address && {
            key: "address",
            icon: <PlaceOutlinedIcon fontSize="small" />,
            label: t("publicContact.address", "Address"),
            value: contact.address,
        },
    ].filter(Boolean);

    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                    <ContactPhoneOutlinedIcon color="primary" />
                    <Typography sx={{ fontWeight: 700 }}>
                        {rows.length ? t("publicContact.title", "Contact") : t("socialLinks.title", "Social media")}
                    </Typography>
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 1.5 }}>
                    {rows.map((row) => (
                        <Stack
                            key={row.key}
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center", p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: "12px", minWidth: 0 }}
                        >
                            <Box sx={{ width: 36, height: 36, flexShrink: 0, borderRadius: "10px", display: "grid", placeItems: "center", bgcolor: "#EFF6FF", color: "primary.main" }}>
                                {row.icon}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {row.label}
                                    </Typography>
                                    <Verified show={row.verified} />
                                </Stack>
                                {row.href ? (
                                    <Button
                                        href={row.href}
                                        target={row.external ? "_blank" : undefined}
                                        rel={row.external ? "noopener noreferrer" : undefined}
                                        sx={{ p: 0, minWidth: 0, textTransform: "none", fontWeight: 700, justifyContent: "flex-start", maxWidth: "100%" }}
                                    >
                                        <Box component="bdi" dir={row.ltr ? "ltr" : undefined} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {row.value}
                                        </Box>
                                    </Button>
                                ) : (
                                    <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{row.value}</Typography>
                                )}
                            </Box>
                        </Stack>
                    ))}
                </Box>

                {links.length > 0 && (
                    <Box sx={{ mt: rows.length ? 2.5 : 0 }}>
                        {rows.length > 0 && (
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontWeight: 700, mb: 1 }}>
                                {t("socialLinks.title", "Social media")}
                            </Typography>
                        )}
                        <SocialLinksList links={links} />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
