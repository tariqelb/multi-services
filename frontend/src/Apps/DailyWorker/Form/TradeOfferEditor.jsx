// src/Apps/DailyWorker/Form/TradeOfferEditor.jsx
//
// One trade offer of the worker form: trade (from the list, or "Other" typed),
// specialties, experience, price, payment, deposit, materials, visit,
// guarantee and description.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Collapse,
    FormControlLabel,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { ChoiceChips, FieldGroupTitle, FormGrid, FullRow } from "../../../Components/ui/FormKit";
import { labelOf, langOf, tradeFilter, tradeOf } from "../workerOptions";

export default function TradeOfferEditor({ index, offer, options, errors = {}, usedTrades = [], onChange, onRemove, canRemove }) {
    const { t, i18n } = useTranslation();
    const lang = langOf(i18n);
    const [customInput, setCustomInput] = useState("");

    const error = (field) => errors[`offers.${index}.${field}`] || "";
    const set = (field, value) => onChange({ ...offer, [field]: value });

    const other = options?.other || "other";
    const groups = new Map((options?.groups || []).map((group) => [group.id, labelOf(group, lang)]));
    const tradeOptions = [
        ...(options?.trades || []).map((trade) => ({ id: trade.id, label: labelOf(trade, lang), group: groups.get(trade.group) || "" })),
        { id: other, label: t("workersApp.form.otherTrade", "Other (type my trade)"), group: t("workersApp.trade.otherGroup", "Other") },
    ];
    const tradeValue = tradeOptions.find((option) => option.id === offer.trade) || null;
    const trade = tradeOf(options, offer.trade);
    const limits = options?.limits || { specialties: 10, customSpecialties: 5 };

    const addCustom = () => {
        const value = customInput.trim().replace(/\s+/g, " ").slice(0, 60);
        if (value.length < 2 || offer.customSpecialties.includes(value) || offer.customSpecialties.length >= limits.customSpecialties) return;
        set("customSpecialties", [...offer.customSpecialties, value]);
        setCustomInput("");
    };

    const priceLabel =
        {
            day: t("workersApp.form.priceDay", "Price per day (MAD)"),
            hour: t("workersApp.form.priceHour", "Price per hour (MAD)"),
            m2: t("workersApp.form.priceM2", "Price per m² (MAD)"),
            task: t("workersApp.form.priceTask", "Starting price per job (MAD, optional)"),
        }[offer.priceType] || "";

    return (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "#FBFCFE" }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {tradeValue && offer.trade !== other
                        ? tradeValue.label
                        : offer.customTrade || t("workersApp.form.offerTitle", "Trade {{number}}", { number: index + 1 })}
                </Typography>
                {canRemove && (
                    <Tooltip title={t("workersApp.form.removeOffer", "Remove this trade")}>
                        <IconButton onClick={onRemove} color="error" aria-label={t("workersApp.form.removeOffer", "Remove this trade")}>
                            <DeleteOutlineRoundedIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            <FormGrid columns={2}>
                <Autocomplete
                    options={tradeOptions}
                    filterOptions={tradeFilter(options)}
                    groupBy={(option) => option.group}
                    value={tradeValue}
                    onChange={(_, option) => onChange({ ...offer, trade: option?.id || "", specialties: [], customTrade: option?.id === other ? offer.customTrade : "" })}
                    getOptionLabel={(option) => option.label}
                    getOptionDisabled={(option) => option.id !== other && option.id !== offer.trade && usedTrades.includes(option.id)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(props) => (
                        <TextField {...props} required label={t("workersApp.form.trade", "Trade")} error={Boolean(error("trade"))} helperText={error("trade") || t("workersApp.form.tradeHelp", "Type to search: plombier, zellige, peintre…")} />
                    )}
                />
                {offer.trade === other ? (
                    <TextField
                        required
                        label={t("workersApp.form.customTrade", "Your trade")}
                        value={offer.customTrade}
                        onChange={(event) => set("customTrade", event.target.value)}
                        error={Boolean(error("customTrade"))}
                        helperText={error("customTrade") || t("workersApp.form.customTradeHelp", "Not in the list? Write it as clients would search it.")}
                        slotProps={{ htmlInput: { maxLength: 60 } }}
                    />
                ) : (
                    <TextField
                        required
                        type="number"
                        label={t("workersApp.form.experience", "Years of experience in this trade")}
                        value={offer.experienceYears}
                        onChange={(event) => set("experienceYears", event.target.value)}
                        error={Boolean(error("experienceYears"))}
                        helperText={error("experienceYears")}
                        slotProps={{ htmlInput: { min: 0, max: 60 } }}
                    />
                )}
                {offer.trade === other && (
                    <TextField
                        required
                        type="number"
                        label={t("workersApp.form.experience", "Years of experience in this trade")}
                        value={offer.experienceYears}
                        onChange={(event) => set("experienceYears", event.target.value)}
                        error={Boolean(error("experienceYears"))}
                        helperText={error("experienceYears")}
                        slotProps={{ htmlInput: { min: 0, max: 60 } }}
                    />
                )}

                {trade?.specialties?.length > 0 && (
                    <FullRow>
                        <FieldGroupTitle>{t("workersApp.form.specialties", "What you do in this trade")}</FieldGroupTitle>
                        <ChoiceChips
                            multiple
                            size="small"
                            options={trade.specialties.map((specialty) => ({ value: specialty.id, label: labelOf(specialty, lang) }))}
                            value={offer.specialties}
                            onChange={(value) => set("specialties", value.slice(0, limits.specialties))}
                        />
                    </FullRow>
                )}

                {offer.trade && (
                    <FullRow>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                            <TextField
                                fullWidth
                                size="small"
                                label={t("workersApp.form.customSpecialty", "Add a specialty that is not in the list")}
                                value={customInput}
                                onChange={(event) => setCustomInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        addCustom();
                                    }
                                }}
                                error={Boolean(error("customSpecialties"))}
                                helperText={error("customSpecialties") || t("workersApp.form.customSpecialtyHelp", "Up to {{count}}. Press Enter to add.", { count: limits.customSpecialties })}
                                slotProps={{ htmlInput: { maxLength: 60 } }}
                            />
                            <Button variant="outlined" onClick={addCustom} startIcon={<AddRoundedIcon />} sx={{ flexShrink: 0, height: 40 }}>
                                {t("workersApp.form.add", "Add")}
                            </Button>
                        </Stack>
                        {offer.customSpecialties.length > 0 && (
                            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                                {offer.customSpecialties.map((value) => (
                                    <Chip key={value} label={value} onDelete={() => set("customSpecialties", offer.customSpecialties.filter((item) => item !== value))} />
                                ))}
                            </Stack>
                        )}
                    </FullRow>
                )}

                <FullRow>
                    <FieldGroupTitle>{t("workersApp.form.priceTitle", "How do you charge?")}</FieldGroupTitle>
                    <ChoiceChips
                        options={(options?.priceTypes || ["day", "task", "hour", "m2", "quote"]).map((value) => ({ value, label: t(`workersApp.priceTypes.${value}`, value) }))}
                        value={offer.priceType}
                        onChange={(value) => onChange({ ...offer, priceType: value, ...(value === "quote" ? { price: "" } : {}) })}
                    />
                    {error("priceType") && <Typography variant="caption" color="error">{error("priceType")}</Typography>}
                </FullRow>

                {offer.priceType !== "quote" && (
                    <TextField
                        required={offer.priceType !== "task"}
                        type="number"
                        label={priceLabel}
                        value={offer.price}
                        onChange={(event) => set("price", event.target.value)}
                        error={Boolean(error("price"))}
                        helperText={error("price")}
                        slotProps={{ htmlInput: { min: 1 }, input: { endAdornment: <InputAdornment position="end">MAD</InputAdornment> } }}
                    />
                )}
                <TextField
                    select
                    required
                    label={t("workersApp.form.paymentTiming", "When are you paid?")}
                    value={offer.paymentTiming}
                    onChange={(event) => set("paymentTiming", event.target.value)}
                    error={Boolean(error("paymentTiming"))}
                    helperText={error("paymentTiming")}
                >
                    <MenuItem value="daily">{t("workersApp.payment.daily", "Paid at the end of each day")}</MenuItem>
                    <MenuItem value="end">{t("workersApp.payment.end", "Paid when the job is finished")}</MenuItem>
                    <MenuItem value="agreed">{t("workersApp.payment.agreed", "Payment as agreed")}</MenuItem>
                </TextField>

                <Box>
                    <FormControlLabel
                        control={<Switch checked={offer.depositRequired} onChange={(event) => set("depositRequired", event.target.checked)} />}
                        label={t("workersApp.form.deposit", "I ask for a deposit before starting")}
                    />
                    <Collapse in={offer.depositRequired} unmountOnExit>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={t("workersApp.form.depositPercent", "Deposit (% of the price, optional)")}
                            value={offer.depositPercent}
                            onChange={(event) => set("depositPercent", event.target.value)}
                            error={Boolean(error("depositPercent"))}
                            helperText={error("depositPercent")}
                            slotProps={{ htmlInput: { min: 1, max: 100 }, input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                            sx={{ mt: 1 }}
                        />
                    </Collapse>
                </Box>
                <Box>
                    <FormControlLabel
                        control={<Switch checked={offer.visitFree} onChange={(event) => set("visitFree", event.target.checked)} />}
                        label={t("workersApp.form.visitFree", "Visit and quote are free")}
                    />
                    <Collapse in={!offer.visitFree} unmountOnExit>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={t("workersApp.form.visitFee", "Visit fee (MAD, optional)")}
                            value={offer.visitFee}
                            onChange={(event) => set("visitFee", event.target.value)}
                            error={Boolean(error("visitFee"))}
                            helperText={error("visitFee")}
                            slotProps={{ htmlInput: { min: 1 } }}
                            sx={{ mt: 1 }}
                        />
                    </Collapse>
                </Box>

                <TextField select label={t("workersApp.form.materials", "Materials")} value={offer.materials} onChange={(event) => set("materials", event.target.value)}>
                    <MenuItem value="client">{t("workersApp.materials.client", "Client buys the materials")}</MenuItem>
                    <MenuItem value="included">{t("workersApp.materials.included", "Materials included")}</MenuItem>
                    <MenuItem value="either">{t("workersApp.materials.either", "Materials: either way")}</MenuItem>
                </TextField>
                <TextField
                    label={t("workersApp.form.guarantee", "Guarantee (optional)")}
                    placeholder={t("workersApp.form.guaranteePlaceholder", "e.g. 6 months on the work")}
                    value={offer.guarantee}
                    onChange={(event) => set("guarantee", event.target.value)}
                    slotProps={{ htmlInput: { maxLength: 120 } }}
                />
                <TextField
                    label={t("workersApp.form.diploma", "Diploma or training (optional)")}
                    placeholder={t("workersApp.form.diplomaPlaceholder", "e.g. OFPPT – plumbing")}
                    value={offer.diploma}
                    onChange={(event) => set("diploma", event.target.value)}
                    slotProps={{ htmlInput: { maxLength: 120 } }}
                />
                <FullRow>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label={t("workersApp.form.offerDescription", "Describe your work in this trade (optional)")}
                        value={offer.description}
                        onChange={(event) => set("description", event.target.value)}
                        error={Boolean(error("description"))}
                        helperText={error("description") || `${offer.description.length} / 800`}
                        slotProps={{ htmlInput: { maxLength: 800 } }}
                    />
                </FullRow>
            </FormGrid>
        </Paper>
    );
}
