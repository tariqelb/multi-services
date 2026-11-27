// src/Apps/DailyWorker/List/WorkerOfferCard.jsx
//
// One trade offer of a worker in the list: photo, name, trade, specialties,
// cities, experience, price and availability.

import { useTranslation } from "react-i18next";
import { Box, Card, CardActionArea, Chip, Divider, Stack, Typography } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import WorkHistoryOutlinedIcon from "@mui/icons-material/WorkHistoryOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

import WorkerAvatar from "../Components/WorkerAvatar";
import getImageUrl from "../../../utils/getImageUrl";
import { defaultCover } from "../workerPictures";
import { langOf, specialtyNames, tradeName } from "../workerOptions";
import { availabilityBadge, coverageText, experienceText, fullName, priceText, workplaceLabel } from "../workerFormat";

export default function WorkerOfferCard({ worker, options, onClick }) {
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const badge = availabilityBadge(t, worker.availability, lang);
    const specialties = specialtyNames(options, worker, lang);
    const extra = Math.max(0, (worker.offersCount || 1) - 1);
    const hasCover = Boolean(worker.coverImage);
    const cover = hasCover ? getImageUrl(worker.coverImage) : defaultCover(worker.gender);
    // Round photo on the picture, unless both would be the same default drawing.
    const showAvatar = Boolean(worker.profileImage) || hasCover;

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow .2s, transform .2s",
                "&:hover": { boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)", transform: "translateY(-2px)" },
            }}
        >
            <CardActionArea onClick={onClick} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                {/* Picture: newest portfolio photo, or the default picture (man / woman). */}
                <Box sx={{ position: "relative", height: 170, bgcolor: "#E2E8F0", flexShrink: 0 }}>
                    <Box
                        component="img"
                        src={cover}
                        alt=""
                        loading="lazy"
                        sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: hasCover ? "center" : "center 15%", display: "block" }}
                    />
                    <Chip
                        size="small"
                        label={badge.label}
                        color={badge.tone}
                        sx={{ position: "absolute", top: 12, insetInlineStart: 12, fontWeight: 700, boxShadow: 1 }}
                    />
                    {worker.hasWorkplace && (
                        <Chip
                            size="small"
                            icon={<StorefrontOutlinedIcon />}
                            label={workplaceLabel(t, worker.workplaceKind)}
                            sx={{ position: "absolute", top: 12, insetInlineEnd: 12, fontWeight: 700, bgcolor: "rgba(255,255,255,.92)" }}
                        />
                    )}
                    {showAvatar && (
                        <WorkerAvatar
                            src={worker.profileImage}
                            gender={worker.gender}
                            name={fullName(worker)}
                            size={64}
                            sx={{ position: "absolute", bottom: -28, insetInlineStart: 16 }}
                        />
                    )}
                </Box>

                <Box sx={{ p: 2.25, pt: showAvatar ? 4.5 : 2, display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.25 }} noWrap>
                        {fullName(worker)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700 }} noWrap>
                        {tradeName(options, worker, lang, t("workersApp.trade.other", "Other"))}
                    </Typography>
                </Box>

                {specialties.length > 0 && (
                    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 0.75 }}>
                        {specialties.slice(0, 3).map((name) => (
                            <Chip key={name} label={name} size="small" sx={{ bgcolor: "#F1F5F9", fontWeight: 600, maxWidth: "100%" }} />
                        ))}
                        {specialties.length > 3 && <Chip label={`+${specialties.length - 3}`} size="small" variant="outlined" />}
                    </Stack>
                )}

                <Stack spacing={0.75} sx={{ color: "text.secondary" }}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                        <PlaceOutlinedIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2" noWrap>
                            {coverageText(t, worker, lang)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <WorkHistoryOutlinedIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">{experienceText(t, worker.experienceYears)}</Typography>
                    </Stack>
                    {(worker.acceptsUrgent || worker.teamMode === "team" || worker.worksAtNight) && (
                        <Stack direction="row" useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", columnGap: 1.5, rowGap: 0.5 }}>
                            {worker.acceptsUrgent && (
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "#B45309" }}>
                                    <BoltRoundedIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {t("workersApp.card.urgent", "Urgent jobs")}
                                    </Typography>
                                </Stack>
                            )}
                            {worker.worksAtNight && (
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "#4338CA" }}>
                                    <BedtimeOutlinedIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {t("workersApp.card.night", "Night work")}
                                    </Typography>
                                </Stack>
                            )}
                            {worker.teamMode === "team" && (
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                    <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="body2">{t("workersApp.card.team", "Team of {{count}}", { count: worker.teamSize })}</Typography>
                                </Stack>
                            )}
                        </Stack>
                    )}
                </Stack>

                <Box sx={{ flex: 1 }} />
                <Divider />

                <Stack direction="row" sx={{ alignItems: "flex-end", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.05rem", lineHeight: 1.3 }}>
                            {priceText(t, worker, lang)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {worker.deposit?.required
                                ? worker.deposit.percent
                                    ? t("workersApp.card.depositPercent", "Deposit {{percent}}%", { percent: worker.deposit.percent })
                                    : t("workersApp.card.deposit", "Deposit asked")
                                : t("workersApp.card.noDeposit", "No deposit")}
                        </Typography>
                    </Box>
                    {extra > 0 && (
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textAlign: "end" }}>
                            {t("workersApp.card.moreTrades", "+{{count}} other trades", { count: extra })}
                        </Typography>
                    )}
                </Stack>
                </Box>
            </CardActionArea>
        </Card>
    );
}
