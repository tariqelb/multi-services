// Public pages: About, Contact, Privacy policy, Terms of use.
// Text lives in infoContent.js (en / fr / ar).

import { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Box, Button, Card, CardContent, Container, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import { CONTACT_EMAIL, LAST_UPDATED, getInfoContent } from "./infoContent";
import { socialLinks } from "../Footer/socialLinks";

function useInfo() {
    const { i18n } = useTranslation();
    const language = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

    return { info: getInfoContent(language), language };
}

function usePageTitle(title) {
    useEffect(() => {
        const previous = document.title;
        document.title = `${title} | MultiServices`;
        return () => {
            document.title = previous;
        };
    }, [title]);
}

function Hero({ icon, title, subtitle, updated }) {
    return (
        <Box
            sx={(theme) => ({
                py: { xs: 4, md: 6 },
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.02)})`,
                borderBottom: "1px solid",
                borderColor: "divider",
            })}
        >
            <Container maxWidth="md">
                <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                    <Box
                        sx={(theme) => ({
                            width: 52,
                            height: 52,
                            flexShrink: 0,
                            borderRadius: "14px",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: "primary.main",
                        })}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", md: "2.1rem" } }}>
                            {title}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", mt: 0.75, fontSize: { md: "1.05rem" } }}>
                            {subtitle}
                        </Typography>
                        {updated && (
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 1 }}>
                                {updated}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}

function Sections({ sections }) {
    return (
        <Stack spacing={3.5}>
            {sections.map((section) => (
                <Box key={section.heading} component="section">
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.25 }}>
                        {section.heading}
                    </Typography>

                    {section.list && (
                        <Stack component="ul" spacing={1} sx={{ m: 0, mb: section.paragraphs ? 1.5 : 0, p: 0, listStyle: "none" }}>
                            {section.list.map((item) => (
                                <Stack key={item} component="li" direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                                    <CheckCircleOutlineRoundedIcon sx={{ fontSize: 19, color: "primary.main", mt: "3px", flexShrink: 0 }} />
                                    <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>{item}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}

                    {section.paragraphs?.map((paragraph) => (
                        <Typography key={paragraph} sx={{ color: "text.secondary", lineHeight: 1.8, mb: 1.25 }}>
                            {paragraph}
                        </Typography>
                    ))}
                </Box>
            ))}
        </Stack>
    );
}

function DocumentPage({ icon, page, info, language, withDate }) {
    usePageTitle(page.title);

    const updated = withDate
        ? `${info.updated}: ${new Intl.DateTimeFormat(language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(new Date(LAST_UPDATED))}`
        : "";

    return (
        <>
            <Hero icon={icon} title={page.title} subtitle={page.subtitle} updated={updated} />
            <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
                <Card variant="outlined" sx={{ borderRadius: "16px" }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 4.5 }, "&:last-child": { pb: { xs: 2.5, md: 4.5 } } }}>
                        <Sections sections={page.sections} />
                    </CardContent>
                </Card>
            </Container>
        </>
    );
}

export function AboutPage() {
    const { info, language } = useInfo();
    return <DocumentPage icon={<InfoOutlinedIcon />} page={info.about} info={info} language={language} />;
}

export function PrivacyPage() {
    const { info, language } = useInfo();
    return <DocumentPage icon={<PolicyOutlinedIcon />} page={info.privacy} info={info} language={language} withDate />;
}

export function TermsPage() {
    const { info, language } = useInfo();
    return <DocumentPage icon={<GavelRoundedIcon />} page={info.terms} info={info} language={language} withDate />;
}

function ContactCard({ icon, title, children }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: "16px", height: "100%" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                    <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
                    <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
                </Stack>
                {children}
            </CardContent>
        </Card>
    );
}

export function ContactPage() {
    const { info } = useInfo();
    const contact = info.contact;

    usePageTitle(contact.title);

    return (
        <>
            <Hero icon={<MailOutlineRoundedIcon />} title={contact.title} subtitle={contact.subtitle} />

            <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                    <ContactCard icon={<MailOutlineRoundedIcon />} title={contact.emailLabel}>
                        <Typography
                            component="a"
                            href={`mailto:${CONTACT_EMAIL}`}
                            sx={{ fontWeight: 700, color: "primary.main", textDecoration: "none", overflowWrap: "anywhere" }}
                        >
                            {CONTACT_EMAIL}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                            {contact.emailText}
                        </Typography>
                    </ContactCard>

                    <ContactCard icon={<FeedbackOutlinedIcon />} title={contact.feedbackLabel}>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                            {contact.feedbackText}
                        </Typography>
                        <Button component={RouterLink} to="/feedback" variant="outlined" size="small">
                            {contact.feedbackButton}
                        </Button>
                    </ContactCard>

                    <ContactCard icon={<LocationOnOutlinedIcon />} title={contact.locationLabel}>
                        <Typography sx={{ color: "text.secondary" }}>{contact.location}</Typography>
                    </ContactCard>

                    <ContactCard icon={<InfoOutlinedIcon />} title={contact.socialLabel}>
                        <Stack direction="row" spacing={1}>
                            {socialLinks.map((social) => (
                                <Tooltip key={social.label} title={social.label}>
                                    <IconButton
                                        component="a"
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        sx={{ border: "1px solid", borderColor: "divider" }}
                                    >
                                        {social.icon}
                                    </IconButton>
                                </Tooltip>
                            ))}
                        </Stack>
                    </ContactCard>
                </Box>

                <Card variant="outlined" sx={{ borderRadius: "16px", mt: 2 }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Sections sections={[{ heading: contact.tipsHeading, list: contact.tips }]} />
                    </CardContent>
                </Card>
            </Container>
        </>
    );
}
