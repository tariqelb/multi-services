// src/Apps/Property/Search/SearchFilters.jsx
//
// Criteria of the global search: service, city, transaction, property /
// accommodation type, price (below / above / exact / between), rooms and
// keywords. Edits a draft; "Search" applies it.

import { useTranslation } from "react-i18next";
import { Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import WeekendOutlinedIcon from "@mui/icons-material/WeekendOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HotelOutlinedIcon from "@mui/icons-material/HotelOutlined";

import {
    FilterChips,
    FilterField,
    FilterGrid,
    FilterPanel,
    FilterSelect,
    filterFieldSx,
} from "../../../Components/ui/FilterKit";
import moroccanCities from "../../../data/moroccanCities";
import { ACCOMMODATION_TYPES, PROPERTY_TYPES, SERVICES, countActive } from "./searchCriteria";

const SERVICE_ICONS = {
    unfurnished: <HomeWorkOutlinedIcon fontSize="small" />,
    furnished: <WeekendOutlinedIcon fontSize="small" />,
    roommate: <GroupsOutlinedIcon fontSize="small" />,
    establishment: <HotelOutlinedIcon fontSize="small" />,
};

export default function SearchFilters({ draft, onChange, onSubmit, onReset }) {
    const { t, i18n } = useTranslation();
    const isArabic = (i18n.resolvedLanguage || i18n.language || "").startsWith("ar");

    const set = (patch) => onChange({ ...draft, ...patch });

    const onlyHotels = draft.services.length === 1 && draft.services[0] === "establishment";
    const hotelsPossible = draft.services.length === 0 || draft.services.includes("establishment");
    const homesPossible = !onlyHotels;

    const cityOption = moroccanCities.find((city) => city.en === draft.city) || null;

    const submit = (event) => {
        event?.preventDefault?.();
        onSubmit();
    };

    return (
        <FilterPanel
            title={t("search.filters.title", "Search criteria")}
            activeCount={countActive(draft)}
            onClear={onReset}
            clearLabel={t("search.filters.reset", "Reset")}
            sx={{ mb: 0 }}
        >
            <Stack component="form" spacing={2} onSubmit={submit}>
                <FilterChips
                    label={t("search.filters.service", "What are you looking for?")}
                    multiple
                    value={draft.services}
                    onChange={(services) =>
                        set({
                            services,
                            // keep the form coherent with the services chosen
                            accommodationType:
                                services.length === 0 || services.includes("establishment") ? draft.accommodationType : "",
                        })
                    }
                    options={SERVICES.map((service) => ({
                        value: service,
                        icon: SERVICE_ICONS[service],
                        label: t(`search.services.${service}`),
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
                            <TextField
                                {...params}
                                label={t("search.filters.city", "City")}
                                placeholder={t("search.filters.anyCity", "All cities")}
                            />
                        )}
                    />

                    <FilterSelect
                        label={t("search.filters.transaction", "Transaction")}
                        value={draft.transaction}
                        onChange={(transaction) =>
                            set({ transaction, rentalPeriod: transaction === "rent" ? draft.rentalPeriod : "" })
                        }
                        options={[
                            { value: "", label: t("search.filters.any", "Any") },
                            { value: "sale", label: t("search.transaction.sale", "For sale") },
                            { value: "rent", label: t("search.transaction.rent", "For rent") },
                        ]}
                    />

                    {draft.transaction === "rent" && (
                        <FilterSelect
                            label={t("search.filters.rentalPeriod", "Rental period")}
                            value={draft.rentalPeriod}
                            onChange={(rentalPeriod) => set({ rentalPeriod })}
                            options={[
                                { value: "", label: t("search.filters.any", "Any") },
                                { value: "daily", label: t("search.rentalPeriod.daily", "Daily") },
                                { value: "monthly", label: t("search.rentalPeriod.monthly", "Monthly") },
                            ]}
                        />
                    )}

                    {homesPossible && (
                        <FilterSelect
                            label={t("search.filters.propertyType", "Property type")}
                            value={draft.propertyType}
                            onChange={(propertyType) => set({ propertyType })}
                            options={[
                                { value: "", label: t("search.filters.any", "Any") },
                                ...PROPERTY_TYPES.map(([value, key]) => ({
                                    value,
                                    label: t(`properties.categories.${key}`, value),
                                })),
                            ]}
                        />
                    )}

                    {hotelsPossible && (
                        <FilterSelect
                            label={t("search.filters.accommodationType", "Hotel / riad type")}
                            value={draft.accommodationType}
                            onChange={(accommodationType) => set({ accommodationType })}
                            options={[
                                { value: "", label: t("search.filters.any", "Any") },
                                ...ACCOMMODATION_TYPES.map((value) => ({
                                    value,
                                    label: t(`search.accommodationTypes.${value.toLowerCase()}`, value),
                                })),
                            ]}
                        />
                    )}

                    <FilterSelect
                        label={t("search.filters.price", "Price")}
                        value={draft.priceMode}
                        onChange={(priceMode) => set({ priceMode, priceMax: priceMode === "between" ? draft.priceMax : "" })}
                        options={[
                            { value: "", label: t("search.filters.anyPrice", "Any price") },
                            { value: "below", label: t("search.priceMode.below", "Less than") },
                            { value: "above", label: t("search.priceMode.above", "More than") },
                            { value: "exact", label: t("search.priceMode.exact", "Exactly") },
                            { value: "between", label: t("search.priceMode.between", "Between") },
                        ]}
                    />

                    {draft.priceMode && (
                        <FilterField
                            type="number"
                            label={
                                draft.priceMode === "between"
                                    ? t("search.filters.priceMin", "From (MAD)")
                                    : t("search.filters.amount", "Amount (MAD)")
                            }
                            value={draft.price}
                            onChange={(price) => set({ price })}
                        />
                    )}

                    {draft.priceMode === "between" && (
                        <FilterField
                            type="number"
                            label={t("search.filters.priceMax", "To (MAD)")}
                            value={draft.priceMax}
                            onChange={(priceMax) => set({ priceMax })}
                        />
                    )}

                    {homesPossible && (
                        <FilterSelect
                            label={t("search.filters.rooms", "Rooms")}
                            value={draft.minRooms}
                            onChange={(minRooms) => set({ minRooms })}
                            options={[
                                { value: "", label: t("search.filters.any", "Any") },
                                ...[1, 2, 3, 4, 5].map((count) => ({
                                    value: String(count),
                                    label: t("search.filters.roomsAtLeast", "{{count}}+ rooms", { count }),
                                })),
                            ]}
                        />
                    )}

                    <FilterField
                        className="filter-full"
                        label={t("search.filters.keywords", "Keywords (title, neighbourhood)")}
                        value={draft.q}
                        onChange={(q) => set({ q })}
                    />
                </FilterGrid>

                {draft.priceMode && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {t(
                            "search.filters.priceHelp",
                            "Prices: total for sales, per month or night for rentals, per person for roommates, cheapest room for hotels."
                        )}
                    </Typography>
                )}

                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                    <Button type="button" onClick={onReset} sx={{ textTransform: "none" }}>
                        {t("search.filters.reset", "Reset")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SearchRoundedIcon />}
                        sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
                    >
                        {t("search.filters.submit", "Search")}
                    </Button>
                </Stack>
            </Stack>
        </FilterPanel>
    );
}
