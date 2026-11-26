// src/Components/Dashboard/About/AboutServicePage.jsx
//
// Dashboard sidebar > About ... (/about-services/:serviceId)
//   live services (property, vehicles): what the service offers, every entry
//     of its sidebar (what you find there and how to use it) and the top bar
//     profile menu in that service
//   services not available yet: a short description
//   "account": the top bar (main bar, language, notifications, profile menu)
// Content: aboutServices.js and the "aboutServices" translations.

import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    AdminPanelSettingsOutlined,
    ArrowForward,
    CheckCircleOutlined,
    DashboardOutlined,
    LanguageOutlined,
    LogoutOutlined,
    ManageAccountsOutlined,
    MenuOutlined,
    NotificationsOutlined,
    ViewSidebarOutlined,
} from "@mui/icons-material";

import PageLayout from "../../Home/PageLayout";
import { ABOUT_BASE } from "../dashboardNavigation";
import { ABOUT_SERVICES, MENU_ITEMS, aboutServiceById, textKey } from "./aboutServices";

// Arrows point the reading direction.
const arrow = <ArrowForward sx={{ "[dir=rtl] &": { transform: "scaleX(-1)" } }} />;

const cardSx = { p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none" };

/** Colored square with an icon. */
function IconBox({ Icon, color, size = 44 }) {
    return (
        <Box
            sx={{
                width: size,
                height: size,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 2.5,
                color,
                bgcolor: alpha(color, 0.1),
            }}
        >
            <Icon fontSize={size > 40 ? "medium" : "small"} />
        </Box>
    );
}

function SectionTitle({ title, subtitle }) {
    return (
        <Box sx={{ mt: { xs: 4, md: 5 }, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
}

/** The 3 things you can do with the service. */
function Highlights({ base, color }) {
    const { t } = useTranslation();
    return (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
            {["one", "two", "three"].map((key) => (
                <Paper key={key} sx={cardSx}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                        <CheckCircleOutlined sx={{ color, mt: 0.25 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                            {t(`${base}.highlights.${key}`)}
                        </Typography>
                    </Stack>
                </Paper>
            ))}
        </Box>
    );
}

/** One entry of the service's sidebar: what you find there and how. */
function EntryCard({ entry, base, color }) {
    const { t } = useTranslation();
    return (
        <Paper sx={{ ...cardSx, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <IconBox Icon={entry.Icon} color={color} />
                <Typography sx={{ fontWeight: 800, flex: 1, minWidth: 0 }}>{t(entry.labelKey, entry.label)}</Typography>
                <Button component={RouterLink} to={entry.path} size="small" endIcon={arrow} sx={{ flexShrink: 0, fontWeight: 700 }}>
                    {t("aboutServices.open", "Open")}
                </Button>
            </Stack>
            <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {t("aboutServices.what", "What you find")}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {t(`${base}.entries.${entry.key}.what`)}
                </Typography>
            </Box>
            <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {t("aboutServices.how", "How to use it")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {t(`${base}.entries.${entry.key}.how`)}
                </Typography>
            </Box>
        </Paper>
    );
}

/** The profile menu of the top bar, item by item. text(item) -> description. */
function MenuList({ color, text, paths = {} }) {
    const { t } = useTranslation();
    return (
        <Paper sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
            {MENU_ITEMS.map((item, index) => (
                <Stack
                    key={item.key}
                    direction="row"
                    spacing={1.5}
                    sx={{ p: { xs: 1.75, sm: 2 }, alignItems: "flex-start", borderTop: index ? "1px solid" : 0, borderColor: "divider" }}
                >
                    <IconBox Icon={item.Icon} color={color} size={36} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                            <Typography sx={{ fontWeight: 700 }}>{t(item.labelKey, item.label)}</Typography>
                            {paths[item.key] && (
                                <Chip
                                    component={RouterLink}
                                    to={paths[item.key]}
                                    clickable
                                    size="small"
                                    label={<bdi dir="ltr">{paths[item.key]}</bdi>}
                                    sx={{ height: 22, fontSize: 12, fontFamily: "monospace" }}
                                />
                            )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.7 }}>
                            {text(item)}
                        </Typography>
                    </Box>
                </Stack>
            ))}
        </Paper>
    );
}

/** Links to the other About pages. */
function OtherServices({ currentId }) {
    const { t } = useTranslation();
    const others = [...ABOUT_SERVICES.map((service) => service.id), "account"].filter((id) => id !== currentId);
    return (
        <>
            <SectionTitle title={t("aboutServices.others", "Other services")} />
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                {others.map((id) => (
                    <Chip key={id} component={RouterLink} to={`${ABOUT_BASE}/${id}`} clickable variant="outlined" label={t(`aboutServices.${textKey(id)}.title`)} />
                ))}
            </Stack>
        </>
    );
}

function LiveService({ service }) {
    const { t } = useTranslation();
    const base = `aboutServices.${textKey(service.id)}`;
    return (
        <PageLayout
            icon={<service.Icon />}
            title={t(`${base}.title`)}
            subtitle={t(`${base}.intro`)}
            action={
                <Button component={RouterLink} to={service.home} variant="contained" endIcon={arrow} sx={{ fontWeight: 700, borderRadius: 2 }}>
                    {t("aboutServices.openService", "Open the service")}
                </Button>
            }
        >
            <Highlights base={base} color={service.color} />

            <SectionTitle
                title={t("aboutServices.sidebarTitle", "The sidebar, entry by entry")}
                subtitle={t(`${base}.sidebarSubtitle`)}
            />
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" } }}>
                {service.entries.map((entry) => (
                    <EntryCard key={entry.key} entry={entry} base={base} color={service.color} />
                ))}
            </Box>

            <SectionTitle
                title={t("aboutServices.menuTitle", "Your menu in this service")}
                subtitle={t("aboutServices.menuSubtitle", "Click your name at the top right. In this service, the menu opens these pages:")}
            />
            <MenuList color={service.color} paths={service.menu} text={(item) => t(`${base}.menu.${item.key}`)} />

            <OtherServices currentId={service.id} />
        </PageLayout>
    );
}

function SoonService({ service }) {
    const { t } = useTranslation();
    const base = `aboutServices.${textKey(service.id)}`;
    return (
        <PageLayout icon={<service.Icon />} title={t(`${base}.title`)} subtitle={t(`${base}.intro`)}>
            <Paper sx={{ ...cardSx, borderColor: alpha(service.color, 0.35), bgcolor: alpha(service.color, 0.04) }}>
                <Chip label={t("aboutServices.comingSoon", "Coming soon")} size="small" sx={{ fontWeight: 700, color: service.color, bgcolor: alpha(service.color, 0.12), mb: 1.5 }} />
                <Typography sx={{ lineHeight: 1.8 }}>{t(`${base}.soon`)}</Typography>
                <Button component={RouterLink} to={service.home} endIcon={arrow} sx={{ mt: 2, fontWeight: 700 }}>
                    {t("aboutServices.readMore", "Read the presentation")}
                </Button>
            </Paper>
            <SectionTitle title={t("aboutServices.planned", "What is planned")} />
            <Highlights base={base} color={service.color} />
            <OtherServices currentId={service.id} />
        </PageLayout>
    );
}

/** The top bar and the main bar, shared by every service. */
function AccountGuide() {
    const { t } = useTranslation();
    const base = "aboutServices.account";
    const color = "#0B2E5C";
    const parts = [
        { key: "mainBar", Icon: DashboardOutlined },
        { key: "sidebar", Icon: ViewSidebarOutlined },
        { key: "menuButton", Icon: MenuOutlined },
        { key: "language", Icon: LanguageOutlined },
        { key: "notifications", Icon: NotificationsOutlined },
        { key: "admin", Icon: AdminPanelSettingsOutlined },
    ];
    return (
        <PageLayout icon={<ManageAccountsOutlined />} title={t(`${base}.title`)} subtitle={t(`${base}.intro`)}>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                {parts.map((part) => (
                    <Paper key={part.key} sx={cardSx}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                            <IconBox Icon={part.Icon} color={color} />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 800 }}>{t(`${base}.parts.${part.key}.title`)}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                                    {t(`${base}.parts.${part.key}.text`)}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Box>

            <SectionTitle title={t(`${base}.menuTitle`)} subtitle={t(`${base}.menuSubtitle`)} />
            <MenuList color={color} text={(item) => t(`${base}.menu.${item.key}`)} />

            <Paper sx={{ ...cardSx, mt: 2 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <IconBox Icon={LogoutOutlined} color="#DC2626" size={36} />
                    <Box>
                        <Typography sx={{ fontWeight: 700 }}>{t("topbar.logout", "Logout")}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.7 }}>
                            {t(`${base}.logout`)}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            <OtherServices currentId="account" />
        </PageLayout>
    );
}

export default function AboutServicePage() {
    const { serviceId } = useParams();

    if (serviceId === "account") return <AccountGuide />;

    const service = aboutServiceById(serviceId);
    if (!service) return <Navigate to={`${ABOUT_BASE}/property`} replace />;

    return service.status === "live" ? <LiveService key={service.id} service={service} /> : <SoonService key={service.id} service={service} />;
}
