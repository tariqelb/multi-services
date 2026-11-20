
import React from "react";
import {
    Stack,
    TextField,
    MenuItem,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { SectionHeader, SectionPaper } from "./RoommateFormUI";
import RoommateCityField from "./RoommateCityField";

export default function RoommateLocationSection({
    formData,
    errors,
    onChange,
    onCityChange,
    t,
}) {
    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const propertyTypes = [
        "Apartment",
        "House",
        "Villa",
        "Studio",
        "Room",
    ];

    return (
        <SectionPaper>
            <SectionHeader
                number={2}
                icon={<LocationOnIcon />}
                title={translate(
                    "roommates.form.location",
                    "Location and accommodation"
                )}
                subtitle={translate(
                    "roommates.form.locationDescription",
                    "Provide information about the accommodation."
                )}
            />

            <Stack spacing={2.5}>
                <RoommateCityField
                    value={formData.city}
                    onChange={onCityChange}
                    error={errors.city}
                    t={t}
                />

                <TextField
                    fullWidth
                    label={translate(
                        "roommates.form.neighborhood",
                        "Neighborhood"
                    )}
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={onChange}
                    error={Boolean(errors.neighborhood)}
                    helperText={errors.neighborhood}
                />

                <TextField
                    fullWidth
                    label={translate(
                        "roommates.form.fullAddress",
                        "Full address"
                    )}
                    name="fullAddress"
                    value={formData.fullAddress}
                    onChange={onChange}
                />

                <TextField
                    fullWidth
                    label={translate(
                        "roommates.form.mapLink",
                        "Google Maps link"
                    )}
                    name="mapLink"
                    value={formData.mapLink}
                    onChange={onChange}
                    error={Boolean(errors.mapLink)}
                    helperText={errors.mapLink}
                    placeholder="https://maps.google.com/..."
                />

                <TextField
                    select
                    fullWidth
                    required
                    label={translate(
                        "roommates.form.propertyType",
                        "Property type"
                    )}
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={onChange}
                    error={Boolean(errors.propertyType)}
                    helperText={errors.propertyType}
                >
                    {propertyTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                            {translate(
                                `roommates.properties.types.${type.toLowerCase()}`,
                                type
                            )}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    fullWidth
                    label={translate(
                        "roommates.form.furnishing",
                        "Furnishing"
                    )}
                    name="furnishing"
                    value={formData.furnishing}
                    onChange={onChange}
                >
                    {["Furnished", "Unfurnished"].map((option) => (
                        <MenuItem key={option} value={option}>
                            {translate(
                                `roommates.furnishing.${option.toLowerCase()}`,
                                option
                            )}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    type="number"
                    label={translate(
                        "roommates.form.surface",
                        "Surface area (m²)"
                    )}
                    name="surface"
                    value={formData.surface}
                    onChange={onChange}
                    inputProps={{ min: 0 }}
                />

                <TextField
                    select
                    fullWidth
                    label={translate(
                        "roommates.form.condition",
                        "Property condition"
                    )}
                    name="condition"
                    value={formData.condition}
                    onChange={onChange}
                >
                    {["New", "Good", "Needs Renovation"].map((option) => (
                        <MenuItem key={option} value={option}>
                            {translate(
                                `roommates.condition.${option.toLowerCase().replaceAll(" ", "")}`,
                                option
                            )}
                        </MenuItem>
                    ))}
                </TextField>

                {[
                    {
                        name: "bedrooms",
                        label: translate("roommates.form.bedrooms", "Bedrooms"),
                    },
                    {
                        name: "salons",
                        label: translate("roommates.form.salons", "Living rooms"),
                    },
                    {
                        name: "bathrooms",
                        label: translate("roommates.form.bathrooms", "Bathrooms"),
                    },
                    {
                        name: "floor",
                        label: translate("roommates.form.floor", "Floor"),
                    },
                ].map((field) => (
                    <TextField
                        key={field.name}
                        fullWidth
                        type="number"
                        label={field.label}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={onChange}
                        inputProps={{ min: 0 }}
                    />
                ))}
            </Stack>
        </SectionPaper>
    );
}
