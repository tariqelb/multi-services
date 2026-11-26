// src/Apps/vehicles/Requests/VehicleRequestFormPage.jsx
//
// "Post a request" (/vehicles/requests/new): the user describes the car, moto
// or spare part they need. Dealers, rental companies, parts shops and owners
// who receive vehicle requests for this city are notified, and reply with
// "I have a match".
// Prefilled from the address (?category=&city=&transaction=&make=&model=&budgetMax=&q=),
// e.g. from a search without results.

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Autocomplete, Box, MenuItem, TextField } from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import axiosInstance from "../../../api/axiosInstance";
import moroccanCities from "../../../data/moroccanCities";
import { ChoiceChips, FieldGroupTitle, FormGrid, FormPage, FormPageHeader, FormSection, FormSubmitBar, FullRow } from "../../../Components/ui/FormKit";
import { MOTO_MAKES, VEHICLE_MAKES, modelsForMake } from "../vehicleOptions";
import {
    PART_CATEGORIES,
    REQUEST_API,
    REQUEST_BASE,
    VEHICLE_CATEGORIES,
    VEHICLE_FUELS,
    VEHICLE_TRANSACTIONS,
    VEHICLE_TRANSMISSIONS,
    categoryLabel,
} from "./vehicleRequestOptions";

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1979 }, (_value, index) => THIS_YEAR + 1 - index);

function initialForm(params) {
    const category = VEHICLE_CATEGORIES.includes(params.get("category")) ? params.get("category") : "car";
    const transaction = params.get("transaction") || "";

    return {
        vehicleCategory: category,
        transaction: category === "part" ? "buy" : VEHICLE_TRANSACTIONS.includes(transaction) ? transaction : "buy",
        make: params.get("make") || "",
        model: params.get("model") || "",
        yearFrom: "",
        yearTo: "",
        maxMileage: "",
        fuel: "",
        transmission: "",
        partCategory: "",
        partName: params.get("q") && category === "part" ? params.get("q") : "",
        city: params.get("city") || "",
        neighborhoods: "",
        budgetMin: params.get("budgetMin") || "",
        budgetMax: params.get("budgetMax") || "",
        message: "",
    };
}

export default function VehicleRequestFormPage() {
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

    const isPart = form.vehicleCategory === "part";
    const makes = form.vehicleCategory === "moto" ? MOTO_MAKES : VEHICLE_MAKES;
    const models = useMemo(() => modelsForMake(form.make, form.vehicleCategory === "moto" ? "moto" : "car"), [form.make, form.vehicleCategory]);
    const cityOption = moroccanCities.find((city) => city.en === form.city) || null;
    const errorText = (field) => (errors[field] ? t(`requests.errors.${errors[field]}`, t("requests.errors.invalid", "Check this field.")) : undefined);

    const submit = async () => {
        setError("");

        // Same checks as the server, before sending.
        const local = {};
        if (!form.city) local.city = "required";
        if (isPart && form.partName.trim().length < 3) local.partName = "required";
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
                badge={t("requests.form.badgeVehicle", "Vehicle request")}
                title={t("requests.form.title", "Post a request")}
                subtitle={t("requests.form.subtitleVehicle", "Describe the vehicle or spare part you need. Dealers, rental companies, parts shops and owners in your city receive it.")}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px" }}>
                    {error}
                </Alert>
            )}

            {/* What */}
            <FormSection number={1} icon={<DirectionsCarOutlinedIcon />} title={t("requests.form.whatVehicle", "What do you need?")}>
                <ChoiceChips
                    value={form.vehicleCategory}
                    onChange={(vehicleCategory) => set({ vehicleCategory, make: "", model: "", transaction: vehicleCategory === "part" ? "buy" : form.transaction })}
                    options={VEHICLE_CATEGORIES.map((value) => ({ value, label: categoryLabel(t, value) }))}
                />
                {!isPart && (
                    <>
                        <FieldGroupTitle sx={{ mt: 3 }}>{t("requests.form.transaction", "I want to")}</FieldGroupTitle>
                        <ChoiceChips
                            value={form.transaction}
                            onChange={(transaction) => set({ transaction })}
                            options={VEHICLE_TRANSACTIONS.map((value) => ({ value, label: t(`requests.wantTo.vehicle.${value}`) }))}
                        />
                    </>
                )}
                <FormGrid sx={{ mt: 3 }}>
                    {isPart && (
                        <>
                            <TextField
                                required
                                label={t("requests.form.partName", "Part needed")}
                                placeholder={t("requests.form.partNamePlaceholder", "e.g. Front brake pads, left headlight…")}
                                value={form.partName}
                                onChange={(event) => set({ partName: event.target.value })}
                                error={Boolean(errors.partName)}
                                helperText={errors.partName ? t("requests.errors.partName", "Write the part you need (3 characters at least).") : undefined}
                                slotProps={{ htmlInput: { maxLength: 120 } }}
                            />
                            <TextField select label={t("requests.form.partCategory", "Part category")} value={form.partCategory} onChange={(event) => set({ partCategory: event.target.value })}>
                                <MenuItem value="">{t("requests.any", "Any")}</MenuItem>
                                {PART_CATEGORIES.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`vehiclesApp.options.partCategory.${value}`, value)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </>
                    )}
                    <Autocomplete
                        freeSolo
                        options={makes}
                        value={form.make}
                        onInputChange={(_event, value) => value !== form.make && set({ make: value, model: "" })}
                        renderInput={(inputParams) => (
                            <TextField {...inputParams} label={isPart ? t("requests.form.forMake", "For make") : t("requests.form.make", "Make")} placeholder={t("requests.any", "Any")} />
                        )}
                    />
                    <Autocomplete
                        freeSolo
                        options={models}
                        value={form.model}
                        disabled={!form.make}
                        onInputChange={(_event, value) => value !== form.model && set({ model: value })}
                        renderInput={(inputParams) => <TextField {...inputParams} label={t("requests.form.model", "Model")} placeholder={t("requests.any", "Any")} />}
                    />
                    <TextField select label={t("requests.form.yearFrom", "Year from")} value={form.yearFrom} onChange={(event) => set({ yearFrom: event.target.value })} error={Boolean(errors.yearFrom)}>
                        <MenuItem value="">{t("requests.any", "Any")}</MenuItem>
                        {YEARS.map((year) => (
                            <MenuItem key={year} value={String(year)}>
                                {year}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label={t("requests.form.yearTo", "Year to")}
                        value={form.yearTo}
                        onChange={(event) => set({ yearTo: event.target.value })}
                        error={Boolean(errors.yearTo)}
                        helperText={errorText("yearTo")}
                    >
                        <MenuItem value="">{t("requests.any", "Any")}</MenuItem>
                        {YEARS.map((year) => (
                            <MenuItem key={year} value={String(year)}>
                                {year}
                            </MenuItem>
                        ))}
                    </TextField>
                    {!isPart && (
                        <>
                            <TextField select label={t("vehiclesApp.filters.fuel", "Fuel")} value={form.fuel} onChange={(event) => set({ fuel: event.target.value })}>
                                <MenuItem value="">{t("requests.any", "Any")}</MenuItem>
                                {VEHICLE_FUELS.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`vehiclesApp.options.fuel.${value}`, value)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField select label={t("requests.form.transmission", "Gearbox")} value={form.transmission} onChange={(event) => set({ transmission: event.target.value })}>
                                <MenuItem value="">{t("requests.any", "Any")}</MenuItem>
                                {VEHICLE_TRANSMISSIONS.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`vehiclesApp.options.transmission.${value}`, value)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                type="number"
                                label={t("requests.form.maxMileage", "Mileage (km, at most)")}
                                value={form.maxMileage}
                                onChange={(event) => set({ maxMileage: event.target.value })}
                                error={Boolean(errors.maxMileage)}
                                slotProps={{ htmlInput: { min: 0 } }}
                            />
                        </>
                    )}
                </FormGrid>
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
                        label={t("requests.form.area", "Area (optional)")}
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
                subtitle={
                    isPart
                        ? t("requests.form.budgetHelpPart", "Price of the part (MAD).")
                        : t("requests.form.budgetHelpVehicle", "Total price to buy, or price per day to rent (MAD).")
                }
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
