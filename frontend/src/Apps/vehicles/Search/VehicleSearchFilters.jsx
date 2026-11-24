// src/Apps/vehicles/Search/VehicleSearchFilters.jsx
//
// Criteria of the vehicle search: what (cars, motos & bikes, spare parts),
// city, offer, make / model (for parts: the vehicles they fit), condition,
// fuel, year, part category, price (below / above / exact / between) and
// keywords. Edits a draft; "Search" applies it.

import { useTranslation } from "react-i18next";
import { Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

import { FilterChips, FilterField, FilterGrid, FilterPanel, FilterSelect, filterFieldSx } from "../../../Components/ui/FilterKit";
import moroccanCities from "../../../data/moroccanCities";
import { optionLabel } from "../vehicleFormat";
import { FUELS, MOTO_MAKES, VEHICLE_MAKES, modelsForMake } from "../vehicleOptions";
import { PART_CATEGORIES } from "../SpareParts/sparePartOptions";
import { SERVICES, YEAR_OPTIONS, countActive, possibleKinds } from "./vehicleSearchCriteria";

const SERVICE_ICONS = {
    car: <DirectionsCarOutlinedIcon fontSize="small" />,
    moto: <TwoWheelerOutlinedIcon fontSize="small" />,
    part: <BuildOutlinedIcon fontSize="small" />,
};

const ALL_MAKES = [...new Set([...VEHICLE_MAKES, ...MOTO_MAKES])].sort((a, b) => a.localeCompare(b));

export default function VehicleSearchFilters({ draft, onChange, onSubmit, onReset }) {
    const { t, i18n } = useTranslation();
    const isArabic = (i18n.resolvedLanguage || i18n.language || "").startsWith("ar");

    const set = (patch) => onChange({ ...draft, ...patch });
    const { vehicles, parts, onlyMotos } = possibleKinds(draft);

    const makes = onlyMotos ? MOTO_MAKES : draft.services.length === 1 && draft.services[0] === "car" ? VEHICLE_MAKES : ALL_MAKES;
    const models = [...new Set([...modelsForMake(draft.make, "car"), ...modelsForMake(draft.make, "moto")])];
    const cityOption = moroccanCities.find((city) => city.en === draft.city) || null;
    const any = { value: "", label: t("vehiclesApp.search.any", "Any") };

    const submit = (event) => {
        event?.preventDefault?.();
        onSubmit();
    };

    // Keep the form coherent with the services chosen.
    const changeServices = (services) => {
        const next = possibleKinds({ services });
        set({
            services,
            transaction: next.vehicles ? draft.transaction : "",
            fuel: next.vehicles ? draft.fuel : "",
            minYear: next.vehicles ? draft.minYear : "",
            partCategory: next.parts ? draft.partCategory : "",
            condition: !next.parts && draft.condition === "refurbished" ? "" : draft.condition,
        });
    };

    return (
        <FilterPanel
            title={t("vehiclesApp.search.criteria", "Search criteria")}
            activeCount={countActive(draft)}
            onClear={onReset}
            clearLabel={t("vehiclesApp.search.reset", "Reset")}
            sx={{ mb: 0 }}
        >
            <Stack component="form" spacing={2} onSubmit={submit}>
                <FilterChips
                    label={t("vehiclesApp.search.what", "What are you looking for?")}
                    multiple
                    value={draft.services}
                    onChange={changeServices}
                    options={SERVICES.map((service) => ({
                        value: service,
                        icon: SERVICE_ICONS[service],
                        label: t(`vehiclesApp.search.services.${service}`),
                    }))}
                />

                <FilterGrid min={180}>
                    <Autocomplete
                        size="small"
                        options={moroccanCities}
                        value={cityOption}
                        onChange={(_event, value) => set({ city: value?.en || "" })}
                        getOptionLabel={(city) => (isArabic ? city.ar || city.en : city.en)}
                        isOptionEqualToValue={(option, value) => option.en === value.en}
                        sx={filterFieldSx}
                        renderInput={(params) => (
                            <TextField {...params} label={t("vehiclesApp.search.city", "City")} placeholder={t("vehiclesApp.search.anyCity", "All cities")} />
                        )}
                    />

                    {vehicles && (
                        <FilterSelect
                            label={t("vehiclesApp.search.offer", "Offer")}
                            value={draft.transaction}
                            onChange={(transaction) => set({ transaction })}
                            options={[any, { value: "sale", label: optionLabel(t, "listingType", "sale") }, { value: "rent", label: optionLabel(t, "listingType", "rent") }]}
                        />
                    )}

                    <Autocomplete
                        freeSolo
                        size="small"
                        options={makes}
                        value={draft.make}
                        onInputChange={(_event, value) => {
                            if (value !== draft.make) set({ make: value, model: "" });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={vehicles ? t("vehiclesApp.filters.make", "Make") : t("vehiclesApp.parts.fitsMake", "For make")}
                                sx={filterFieldSx}
                            />
                        )}
                    />

                    <Autocomplete
                        freeSolo
                        size="small"
                        options={models}
                        value={draft.model}
                        disabled={!draft.make}
                        onInputChange={(_event, value) => {
                            if (value !== draft.model) set({ model: value });
                        }}
                        renderInput={(params) => <TextField {...params} label={t("vehiclesApp.filters.model", "Model")} sx={filterFieldSx} />}
                    />

                    <FilterSelect
                        label={t("vehiclesApp.filters.condition", "Condition")}
                        value={draft.condition}
                        onChange={(condition) => set({ condition })}
                        options={[
                            any,
                            { value: "new", label: optionLabel(t, "partCondition", "new") },
                            { value: "used", label: optionLabel(t, "partCondition", "used") },
                            ...(parts ? [{ value: "refurbished", label: optionLabel(t, "partCondition", "refurbished") }] : []),
                        ]}
                    />

                    {vehicles && (
                        <FilterSelect
                            label={t("vehiclesApp.filters.fuel", "Fuel")}
                            value={draft.fuel}
                            onChange={(fuel) => set({ fuel })}
                            options={[any, ...FUELS.map((value) => ({ value, label: optionLabel(t, "fuel", value) }))]}
                        />
                    )}

                    {vehicles && (
                        <FilterSelect
                            label={t("vehiclesApp.search.minYear", "Year")}
                            value={draft.minYear}
                            onChange={(minYear) => set({ minYear })}
                            options={[
                                any,
                                ...YEAR_OPTIONS.map((year) => ({
                                    value: String(year),
                                    label: t("vehiclesApp.search.fromYear", "{{year}} or newer", { year }),
                                })),
                            ]}
                        />
                    )}

                    {parts && (
                        <FilterSelect
                            label={t("vehiclesApp.search.partCategory", "Part category")}
                            value={draft.partCategory}
                            onChange={(partCategory) => set({ partCategory })}
                            options={[any, ...PART_CATEGORIES.map((value) => ({ value, label: optionLabel(t, "partCategory", value) }))]}
                        />
                    )}

                    <FilterSelect
                        label={t("vehiclesApp.search.price", "Price")}
                        value={draft.priceMode}
                        onChange={(priceMode) => set({ priceMode, priceMax: priceMode === "between" ? draft.priceMax : "" })}
                        options={[
                            { value: "", label: t("vehiclesApp.search.anyPrice", "Any price") },
                            { value: "below", label: t("vehiclesApp.search.priceMode.below", "Less than") },
                            { value: "above", label: t("vehiclesApp.search.priceMode.above", "More than") },
                            { value: "exact", label: t("vehiclesApp.search.priceMode.exact", "Exactly") },
                            { value: "between", label: t("vehiclesApp.search.priceMode.between", "Between") },
                        ]}
                    />

                    {draft.priceMode && (
                        <FilterField
                            type="number"
                            label={draft.priceMode === "between" ? t("vehiclesApp.search.priceMin", "From (MAD)") : t("vehiclesApp.search.amount", "Amount (MAD)")}
                            value={draft.price}
                            onChange={(price) => set({ price })}
                        />
                    )}

                    {draft.priceMode === "between" && (
                        <FilterField type="number" label={t("vehiclesApp.search.priceMax", "To (MAD)")} value={draft.priceMax} onChange={(priceMax) => set({ priceMax })} />
                    )}

                    <FilterField
                        className="filter-full"
                        label={t("vehiclesApp.search.keywords", "Keywords (title, make, brand, reference, neighbourhood)")}
                        value={draft.q}
                        onChange={(q) => set({ q })}
                    />
                </FilterGrid>

                {(draft.priceMode || (parts && draft.make)) && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {[
                            draft.priceMode && t("vehiclesApp.search.priceHelp", "Prices: total for sales, per day for rentals, per unit for spare parts."),
                            parts && draft.make && t("vehiclesApp.search.makeHelp", "Spare parts: parts that fit this make and model, and universal parts."),
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    </Typography>
                )}

                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                    <Button type="button" onClick={onReset} sx={{ textTransform: "none" }}>
                        {t("vehiclesApp.search.reset", "Reset")}
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<SearchRoundedIcon />} sx={{ textTransform: "none", fontWeight: 700, px: 3 }}>
                        {t("vehiclesApp.search.submit", "Search")}
                    </Button>
                </Stack>
            </Stack>
        </FilterPanel>
    );
}
