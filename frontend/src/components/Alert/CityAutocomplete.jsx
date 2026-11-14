
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Autocomplete,
    TextField,
} from "@mui/material";

import {
    cities,
    filterCityOptions,
    getCanonicalCity,
    getCityLabel,
} from "./alertHelpers";

export default function CityAutocomplete({
    city,
    setCity,
    setError,
    setSuccess,
}) {
    const { t, i18n } = useTranslation();

    const language =
        i18n.resolvedLanguage ||
        i18n.language ||
        "en";

    const selectedCity =
        cities.find(
            (option) =>
                option.english.toLowerCase() ===
                getCanonicalCity(city).toLowerCase()
        ) || city || null;

    const getOptionLabel = (option) => {
        if (!option) return "";

        if (typeof option === "string") {
            return getCityLabel(option, language);
        }

        return language.startsWith("ar")
            ? option.arabic || option.english
            : option.english;
    };

    const handleChange = (event, newValue) => {
        const value =
            typeof newValue === "object" && newValue !== null
                ? newValue.english
                : getCanonicalCity(newValue);

        setCity(value || "");
        setError("");
        setSuccess("");
    };

    const handleInputChange = (
        event,
        newInputValue,
        reason
    ) => {
        if (reason === "input" || reason === "clear") {
            setCity(getCanonicalCity(newInputValue));
            setError("");
            setSuccess("");
        }
    };

    return (
        <Autocomplete
            freeSolo
            fullWidth
            options={cities}
            value={selectedCity}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={(option, value) =>
                option.english.toLowerCase() ===
                getCanonicalCity(
                    typeof value === "string"
                        ? value
                        : value?.english
                ).toLowerCase()
            }
            filterOptions={filterCityOptions}
            onChange={handleChange}
            onInputChange={handleInputChange}
            sx={{
                mb: {
                    xs: 4,
                    sm: 5,
                },
                "& .MuiOutlinedInput-root": {
                    minHeight: {
                        xs: 54,
                        sm: 60,
                    },
                    borderRadius: "10px",
                    fontSize: {
                        xs: "1rem",
                        sm: "1.05rem",
                    },
                },
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={t("alerts.city", {
                        defaultValue: "City",
                    })}
                    placeholder={t("alerts.cityPlaceholder", {
                        defaultValue: "Choose or enter a city",
                    })}
                />
            )}
        />
    );
}
