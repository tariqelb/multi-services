
import React from "react";
import {
    Stack,
    TextField,
    MenuItem,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

import { SectionHeader, SectionPaper } from "./RoommateFormUI";

export default function RoommatePreferencesSection({
    formData,
    onChange,
    t,
}) {
    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;

        onChange({
            target: {
                name,
                value: checked,
            },
        });
    };

    return (
        <SectionPaper>
            <SectionHeader
                number={4}
                icon={<TuneIcon />}
                title={translate(
                    "roommates.form.preferences",
                    "Roommate preferences"
                )}
                subtitle={translate(
                    "roommates.form.preferencesDescription",
                    "Choose the preferences that matter to you."
                )}
            />

            <Stack spacing={2}>
                <TextField
                    select
                    fullWidth
                    label={translate(
                        "roommates.form.preferredGender",
                        "Preferred gender"
                    )}
                    name="preferredGender"
                    value={formData.preferredGender || ""}
                    onChange={onChange}
                >
                    {/* "Any" is the saved default */}
                    <MenuItem value="Any">
                        {translate("roommates.gender.any", "No preference")}
                    </MenuItem>

                    <MenuItem value="Male">
                        {translate("roommates.gender.male", "Man")}
                    </MenuItem>

                    <MenuItem value="Female">
                        {translate("roommates.gender.female", "Woman")}
                    </MenuItem>
                </TextField>

                <FormControlLabel
                    control={
                        <Checkbox
                            name="smokingAllowed"
                            checked={Boolean(formData.smokingAllowed)}
                            onChange={handleCheckboxChange}
                        />
                    }
                    label={translate(
                        "roommates.form.smokingAllowed",
                        "Smoking allowed"
                    )}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            name="petsAllowed"
                            checked={Boolean(formData.petsAllowed)}
                            onChange={handleCheckboxChange}
                        />
                    }
                    label={translate(
                        "roommates.form.petsAllowed",
                        "Pets allowed"
                    )}
                />
            </Stack>
        </SectionPaper>
    );
}
