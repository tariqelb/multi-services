// src/Apps/DailyWorker/Details/WorkerOfferDetails.jsx
//
// One trade offer on the worker page: price, payment, deposit, materials,
// visit, guarantee, specialties and description.

import { useTranslation } from "react-i18next";
import { Box, Chip, Stack, Typography } from "@mui/material";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import HomeRepairServiceOutlinedIcon from "@mui/icons-material/HomeRepairServiceOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import { FactGrid, DescriptionText } from "../../../Components/ui/DetailsKit";
import { langOf, specialtyNames, tradeName } from "../workerOptions";
import { experienceText, formatNumber, materialsLabel, paymentTimingLabel, priceText } from "../workerFormat";

export default function WorkerOfferDetails({ offer, options, highlighted = false }) {
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const specialties = specialtyNames(options, offer, lang);
    const mad = (value) => `${formatNumber(value, lang)} ${t("workersApp.price.currency", "MAD")}`;

    const deposit = offer.deposit?.required
        ? offer.deposit.percent
            ? t("workersApp.offer.depositPercent", "{{percent}}% before starting", { percent: offer.deposit.percent })
            : t("workersApp.offer.depositYes", "Asked before starting")
        : t("workersApp.offer.depositNo", "No deposit");

    const visit = offer.visit?.free
        ? t("workersApp.offer.visitFree", "Free visit / quote")
        : offer.visit?.fee
          ? t("workersApp.offer.visitFee", "Visit: {{amount}}", { amount: mad(offer.visit.fee) })
          : t("workersApp.offer.visitPaid", "Paid visit");

    return (
        <Box
            id={`offer-${offer.id}`}
            sx={{
                scrollMarginTop: 96,
                ...(highlighted && { p: 2, mx: -1, borderRadius: 3, bgcolor: "#EFF6FF", border: "1px solid #BFDBFE" }),
            }}
        >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, mb: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {tradeName(options, offer, lang, t("workersApp.trade.other", "Other"))}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {experienceText(t, offer.experienceYears)}
                    </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main", whiteSpace: "nowrap" }}>
                    {priceText(t, offer, lang)}
                </Typography>
            </Stack>

            {specialties.length > 0 && (
                <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                    {specialties.map((name) => (
                        <Chip key={name} label={name} size="small" sx={{ bgcolor: "#F1F5F9", fontWeight: 600 }} />
                    ))}
                </Stack>
            )}

            <FactGrid
                minWidth={200}
                items={[
                    { icon: <PaymentsOutlinedIcon />, label: t("workersApp.offer.payment", "Payment"), value: paymentTimingLabel(t, offer.paymentTiming) },
                    { icon: <AccountBalanceWalletOutlinedIcon />, label: t("workersApp.offer.deposit", "Deposit"), value: deposit },
                    { icon: <Inventory2OutlinedIcon />, label: t("workersApp.offer.materials", "Materials"), value: materialsLabel(t, offer.materials) },
                    { icon: <HomeRepairServiceOutlinedIcon />, label: t("workersApp.offer.visit", "Visit / quote"), value: visit },
                    { icon: <WorkspacePremiumOutlinedIcon />, label: t("workersApp.offer.guarantee", "Guarantee"), value: offer.guarantee },
                    { icon: <SchoolOutlinedIcon />, label: t("workersApp.offer.diploma", "Diploma / training"), value: offer.diploma },
                ]}
            />

            {offer.description && (
                <Box sx={{ mt: 1.5 }}>
                    <DescriptionText>{offer.description}</DescriptionText>
                </Box>
            )}
        </Box>
    );
}
