
import React from "react";
import {
    Paper,
    Stack,
    TextField,
    MenuItem,
} from "@mui/material";
import PaymentsIcon from "@mui/icons-material/Payments";

import { SectionHeader } from "./RoommateFormUI";

export default function RoommateRentSection({
    formData,
    errors,
    onChange,
    t,
}) {
    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const numberFields = [
        {
            name: "totalRent",
            label: translate("roommates.form.totalRent", "Total monthly rent"),
            required: true,
        },
        {
            name: "individualRoomPrice",
            label: translate(
                "roommates.form.individualRoomPrice",
                "Individual room price"
            ),
        },
        {
            name: "deposit",
            label: translate("roommates.form.deposit", "Deposit"),
        },
        {
            name: "syndicateFees",
            label: translate(
                "roommates.form.syndicateFees",
                "Syndicate fees"
            ),
        },
        {
            name: "otherExpenses",
            label: translate(
                "roommates.form.otherExpenses",
                "Other expenses"
            ),
        },
        {
            name: "totalPeople",
            label: translate(
                "roommates.form.totalPeople",
                "Total occupants"
            ),
            required: true,
        },
        {
            name: "currentPeople",
            label: translate(
                "roommates.form.currentPeople",
                "Current occupants"
            ),
            required: true,
        },
        {
            name: "availablePlaces",
            label: translate(
                "roommates.form.availablePlaces",
                "Available places"
            ),
        },
    ];

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <SectionHeader
                icon={<PaymentsIcon />}
                title={translate(
                    "roommates.form.rentOccupancy",
                    "Rent and occupancy"
                )}
                subtitle={translate(
                    "roommates.form.rentDescription",
                    "Set the rental price and available places."
                )}
            />

            <Stack spacing={2.5}>
                <TextField
                    select
                    fullWidth
                    required
                    label={translate(
                        "roommates.form.rentalPeriod",
                        "Rental period"
                    )}
                    name="rentalPeriod"
                    value={formData.rentalPeriod}
                    onChange={onChange}
                    error={Boolean(errors.rentalPeriod)}
                    helperText={errors.rentalPeriod}
                >
                    {["Daily", "Monthly"].map((period) => (
                        <MenuItem key={period} value={period}>
                            {translate(
                                `roommates.properties.rentalPeriod.${period.toLowerCase()}`,
                                period
                            )}
                        </MenuItem>
                    ))}
                </TextField>

                {numberFields.map((field) => (
                    <TextField
                        key={field.name}
                        fullWidth
                        type="number"
                        required={field.required}
                        label={field.label}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={onChange}
                        error={Boolean(errors[field.name])}
                        helperText={errors[field.name]}
                        inputProps={{ min: 0 }}
                    />
                ))}

                <TextField
                    select
                    fullWidth
                    label={translate(
                        "roommates.form.rentSplitType",
                        "Rent split type"
                    )}
                    name="rentSplitType"
                    value={formData.rentSplitType}
                    onChange={onChange}
                >
                    {["Equal", "Custom"].map((option) => (
                        <MenuItem key={option} value={option}>
                            {translate(
                                `roommates.rentSplit.${option.toLowerCase()}`,
                                option
                            )}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    type="date"
                    label={translate(
                        "roommates.form.availableFrom",
                        "Available from"
                    )}
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={onChange}
                    InputLabelProps={{ shrink: true }}
                />
            </Stack>
        </Paper>
    );
}
