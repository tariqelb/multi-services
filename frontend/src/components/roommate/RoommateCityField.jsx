
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Autocomplete,
    TextField,
} from "@mui/material";

import cities from "../../data/moroccanCities";

export default function RoommateCityField({
    value,
    onChange,
    error,
    fieldSx,
}) {
    const { t, i18n } = useTranslation();

    const isArabic = i18n.language?.startsWith("ar");

    const selectedCity =
        cities.find((city) => city.en === value) || null;

    return (
        <Autocomplete
            fullWidth
            options={cities}
            value={selectedCity}
            onChange={(_, newValue) => {
                onChange(newValue?.en || "");
            }}
            getOptionLabel={(option) =>
                isArabic ? option.ar : option.en
            }
            isOptionEqualToValue={(option, selected) =>
                option.en === selected.en
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={t("roommates.fields.city", {
                        defaultValue: "City",
                    })}
                    placeholder={t(
                        "roommates.insert.cityPlaceholder",
                        {
                            defaultValue: "Select a Moroccan city",
                        }
                    )}
                    required
                    error={Boolean(error)}
                    helperText={error || ""}
                    sx={fieldSx}
                />
            )}
        />
    );
}
