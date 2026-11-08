
import React from "react";

import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";

export default function FindByMapFilters({
    filters,
    setFilters,
    cities,
    propertyTypes,
}) {
    const handleChange = (field, value) => {
        setFilters((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    return (
        <Box className="find-map-filters">
            <FormControl size="small">
                <InputLabel>City</InputLabel>
                <Select
                    value={filters.city}
                    label="City"
                    onChange={(event) =>
                        handleChange("city", event.target.value)
                    }
                >
                    <MenuItem value="All">All Morocco</MenuItem>

                    {cities.map((city) => (
                        <MenuItem key={city} value={city}>
                            {city}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small">
                <InputLabel>Property type</InputLabel>
                <Select
                    value={filters.propertyType}
                    label="Property type"
                    onChange={(event) =>
                        handleChange("propertyType", event.target.value)
                    }
                >
                    <MenuItem value="All">All types</MenuItem>

                    {propertyTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                            {type}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small">
                <InputLabel>Listing</InputLabel>
                <Select
                    value={filters.listingType}
                    label="Listing"
                    onChange={(event) =>
                        handleChange("listingType", event.target.value)
                    }
                >
                    <MenuItem value="All">All listings</MenuItem>
                    <MenuItem value="For Sale">For Sale</MenuItem>
                    <MenuItem value="For Rent">For Rent</MenuItem>
                </Select>
            </FormControl>

            <TextField
                size="small"
                label="Maximum price (MAD)"
                type="number"
                value={filters.maxPrice}
                onChange={(event) =>
                    handleChange("maxPrice", event.target.value)
                }
                inputProps={{ min: 0 }}
            />
        </Box>
    );
}
