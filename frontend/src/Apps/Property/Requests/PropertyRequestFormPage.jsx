// src/Apps/Property/Requests/PropertyRequestFormPage.jsx
//
// "Post a request" (/requests/new): the user describes the property they are
// looking for. Owners and agencies who receive property requests for this
// city are notified, and reply with "I have a match".
// Prefilled from the address (?city=&transaction=&types=&minRooms=&budgetMax=),
// e.g. from a search without results.

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Autocomplete, Box, MenuItem, TextField, Typography } from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import axiosInstance from "../../../api/axiosInstance";
import moroccanCities from "../../../data/moroccanCities";
import { ChoiceChips, FieldGroupTitle, FormGrid, FormPage, FormPageHeader, FormSection, FormSubmitBar, FullRow } from "../../../Components/ui/FormKit";
import { PROPERTY_FEATURES, PROPERTY_TRANSACTIONS, PROPERTY_TYPES, REQUEST_API, REQUEST_BASE, propertyTypeLabel } from "./propertyRequestOptions";

function initialForm(params) {
    const list = (key) => (params.get(key) || "").split(",").map((value) => value.trim()).filter(Boolean);
    const transaction = params.get("transaction") || "";

    return {
        transaction: PROPERTY_TRANSACTIONS.includes(transaction) ? transaction : "rent",
        propertyTypes: list("types").filter((type) => PROPERTY_TYPES.includes(type)),
        minRooms: params.get("minRooms") || "",
        minSurface: "",
        features: [],
        moveInDate: "",
        city: params.get("city") || "",
        neighborhoods: "",
        budgetMin: params.get("budgetMin") || "",
        budgetMax: params.get("budgetMax") || "",
        message: "",
    };
}

export default function PropertyRequestFormPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const isArabic = (i18n.resolvedLanguage || i18n.language || "").startsWith("ar");

    const [form, setForm] = useState(() => initialForm(params));
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (patch) => {
        setForm((previous) => ({ ...previous, ...patch }));
        setErrors((previous) => {
            const next = { ...previous };
            Object.keys(patch).forEach((key) => delete next[key]);
            return next;
        });
    };

    const cityOption = moroccanCities.find((city) => city.en === form.city) || null;
    const errorText = (field) => (errors[field] ? t(`requests.errors.${errors[field]}`, t("requests.errors.invalid", "Check this field.")) : undefined);

    const submit = async () => {
        setError("");

        // Same checks as the server, before sending.
        const local = {};
        if (!form.city) local.city = "required";
        if (!form.propertyTypes.length) local.propertyTypes = "required";
        if (form.budgetMin && form.budgetMax && Number(form.budgetMin) > Number(form.budgetMax)) local.budgetMax = "lessThanMin";
        if (Object.keys(local).length) {
            setErrors(local);
            setError(t("requests.form.checkForm", "Please check the highlighted fields."));
            return;
        }

        setSaving(true);
        try {
            const { data } = await axiosInstance.post(REQUEST_API, form);
            navigate(`${REQUEST_BASE}/${data.request.id}`, { state: { created: true, recipients: data.request.recipientsCount } });
        } catch (requestError) {
            setErrors(requestError.response?.data?.errors || {});
            setError(requestError.response?.data?.message || t("requests.form.submitError", "Unable to publish your request."));
            setSaving(false);
        }
    };

    return (
        <FormPage>
            <FormPageHeader
                icon={<CampaignOutlinedIcon />}
                badge={t("requests.form.badgeProperty", "Property request")}
                title={t("requests.form.title", "Post a request")}
                subtitle={t("requests.form.subtitleProperty", "Describe what you are looking for. Owners and agencies working in your city receive it and contact you if they have a match.")}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px" }}>
                    {error}
                </Alert>
            )}

            {/* What */}
            <FormSection number={1} icon={<HomeWorkOutlinedIcon />} title={t("requests.form.whatProperty", "What are you looking for?")}>
                <FieldGroupTitle>{t("requests.form.transaction", "I want to")}</FieldGroupTitle>
                <ChoiceChips
                    value={form.transaction}
                    onChange={(transaction) => set({ transaction })}
                    options={PROPERTY_TRANSACTIONS.map((value) => ({ value, label: t(`requests.wantTo.property.${value}`) }))}
                />
                <FieldGroupTitle sx={{ mt: 3 }}>{t("requests.form.propertyTypes", "Property types *")}</FieldGroupTitle>
                <ChoiceChips
                    multiple
                    value={form.propertyTypes}
                    onChange={(propertyTypes) => set({ propertyTypes })}
                    options={PROPERTY_TYPES.map((value) => ({ value, label: propertyTypeLabel(t, value) }))}
                />
                {errors.propertyTypes && (
                    <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                        {t("requests.errors.typesRequired", "Choose at least one type.")}
                    </Typography>
                )}
                <FormGrid columns={3} sx={{ mt: 3 }}>
                    <TextField
                        select
                        label={t("requests.form.minRooms", "Rooms (at least)")}
                        value={form.minRooms}
                        onChange={(event) => set({ minRooms: event.target.value })}
                        error={Boolean(errors.minRooms)}
                    >
                        <MenuItem value="">{t("requests.any", "Any")}</MenuItem>
                        {[1, 2, 3, 4, 5, 6].map((value) => (
                            <MenuItem key={value} value={String(value)}>
                                {value}+
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        type="number"
                        label={t("requests.form.minSurface", "Surface (m², at least)")}
                        value={form.minSurface}
                        onChange={(event) => set({ minSurface: event.target.value })}
                        error={Boolean(errors.minSurface)}
                        slotProps={{ htmlInput: { min: 0 } }}
                    />
                    <TextField
                        type="date"
                        label={t("requests.form.moveInDate", "From (date)")}
                        value={form.moveInDate}
                        onChange={(event) => set({ moveInDate: event.target.value })}
                        error={Boolean(errors.moveInDate)}
                        helperText={errorText("moveInDate")}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </FormGrid>
                <FieldGroupTitle sx={{ mt: 3 }}>{t("requests.form.features", "Important for me (optional)")}</FieldGroupTitle>
                <ChoiceChips
                    multiple
                    size="small"
                    value={form.features}
                    onChange={(features) => set({ features })}
                    options={PROPERTY_FEATURES.map((value) => ({ value, label: t(`requests.features.${value}`) }))}
                />
            </FormSection>

            {/* Where */}
            <FormSection number={2} icon={<PlaceOutlinedIcon />} title={t("requests.form.whereTitle", "Where?")}>
                <FormGrid>
                    <Autocomplete
                        options={moroccanCities}
                        value={cityOption}
                        onChange={(_event, value) => set({ city: value?.en || "" })}
                        getOptionLabel={(city) => (isArabic ? city.ar || city.en : city.en)}
                        isOptionEqualToValue={(option, value) => option.en === value.en}
                        renderInput={(inputParams) => (
                            <TextField {...inputParams} required label={t("requests.form.city", "City")} error={Boolean(errors.city)} helperText={errorText("city")} />
                        )}
                    />
                    <TextField
                        label={t("requests.form.neighborhoods", "Neighbourhoods (optional)")}
                        placeholder={t("requests.form.neighborhoodsPlaceholder", "e.g. Talborjt, Founty, near the beach")}
                        value={form.neighborhoods}
                        onChange={(event) => set({ neighborhoods: event.target.value })}
                        slotProps={{ htmlInput: { maxLength: 200 } }}
                    />
                </FormGrid>
            </FormSection>

            {/* Budget */}
            <FormSection
                number={3}
                icon={<PaymentsOutlinedIcon />}
                title={t("requests.form.budgetTitle", "Budget")}
                subtitle={t("requests.form.budgetHelpProperty", "Monthly rent, price per night for furnished rentals, or total price to buy (MAD).")}
            >
                <FormGrid>
                    <TextField
                        type="number"
                        label={t("requests.form.budgetMin", "From (MAD)")}
                        value={form.budgetMin}
                        onChange={(event) => set({ budgetMin: event.target.value })}
                        error={Boolean(errors.budgetMin)}
                        slotProps={{ htmlInput: { min: 0 } }}
                    />
                    <TextField
                        type="number"
                        label={t("requests.form.budgetMax", "Up to (MAD)")}
                        value={form.budgetMax}
                        onChange={(event) => set({ budgetMax: event.target.value })}
                        error={Boolean(errors.budgetMax)}
                        helperText={errorText("budgetMax")}
                        slotProps={{ htmlInput: { min: 0 } }}
                    />
                </FormGrid>
            </FormSection>

            {/* Message */}
            <FormSection
                number={4}
                icon={<ChatBubbleOutlineOutlinedIcon />}
                title={t("requests.form.messageTitle", "A word for the professionals")}
                subtitle={t("requests.form.messageHelp", "Anything that helps: family size, timing, must-haves. Don't write your phone number: you choose who gets your contact.")}
            >
                <FullRow>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label={t("requests.form.message", "Message (optional)")}
                        value={form.message}
                        onChange={(event) => set({ message: event.target.value })}
                        slotProps={{ htmlInput: { maxLength: 1000 } }}
                        helperText={`${form.message.length}/1000`}
                    />
                </FullRow>
            </FormSection>

            <Box sx={{ mt: 1 }}>
                <FormSubmitBar
                    title={t("requests.form.submitTitle", "Ready to send?")}
                    subtitle={t("requests.form.submitSubtitle", "Your request stays active 30 days. Your contact details stay private until you share them.")}
                    loading={saving}
                    submitLabel={t("requests.form.submit", "Publish my request")}
                    loadingLabel={t("requests.form.submitting", "Publishing…")}
                    submitIcon={<SendRoundedIcon />}
                    onSubmit={submit}
                />
            </Box>
        </FormPage>
    );
}
