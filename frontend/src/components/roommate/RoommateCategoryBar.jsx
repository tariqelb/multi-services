
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Button,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";

import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";

const purposes = [
    "All",
    "Share My Property",
    "Find a Room",
    "Rent Together",
];

const propertyTypes = [
    "All",
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Other",
];

const rentalPeriods = [
    "All",
    "Daily",
    "Monthly",
];

export default function RoommateCategoryBar({
    selectedPurpose,
    onPurposeChange,
    selectedPropertyType,
    onPropertyTypeChange,
    selectedRentalPeriod,
    onRentalPeriodChange,
    city,
    onCityChange,
    search,
    onSearchChange,
    onClearFilters,
}) {
    const { t } = useTranslation();

    const getPurposeLabel = (purpose) => {
        if (purpose === "All") {
            return t("roommates.filters.allPurposes", {
                defaultValue: "All announcements",
            });
        }

        return t(`roommates.purpose.${purpose}`, {
            defaultValue: purpose,
        });
    };

    const getPropertyTypeLabel = (type) => {
        if (type === "All") {
            return t("roommates.filters.allPropertyTypes", {
                defaultValue: "All property types",
            });
        }

        return t(`properties.types.${type}`, {
            defaultValue: type,
        });
    };

    return (
        <Box sx={{ mb: 3 }}>
            {/* Purpose categories */}
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    mb: 2,
                    overflowX: "auto",
                    pb: 1,
                    "&::-webkit-scrollbar": {
                        height: 5,
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "divider",
                        borderRadius: 5,
                    },
                }}
            >
                {purposes.map((purpose) => (
                    <Button
                        key={purpose}
                        variant={
                            selectedPurpose === purpose
                                ? "contained"
                                : "outlined"
                        }
                        color="primary"
                        onClick={() => onPurposeChange(purpose)}
                        sx={{
                            flexShrink: 0,
                            textTransform: "none",
                            borderRadius: 2,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {getPurposeLabel(purpose)}
                    </Button>
                ))}
            </Box>

            {/* Search */}
            <TextField
                fullWidth
                size="small"
                placeholder={t("roommates.filters.search", {
                    defaultValue: "Search announcements...",
                })}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                InputProps={{
                    startAdornment: (
                        <SearchIcon
                            sx={{
                                mr: 1,
                                color: "text.secondary",
                            }}
                        />
                    ),
                }}
                sx={{ mb: 2 }}
            />

            {/* Additional filters */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 2,
                    alignItems: "center",
                }}
            >
                <TextField
                    select
                    size="small"
                    fullWidth
                    label={t("roommates.filters.propertyType", {
                        defaultValue: "Property type",
                    })}
                    value={selectedPropertyType}
                    onChange={(event) =>
                        onPropertyTypeChange(event.target.value)
                    }
                >
                    {propertyTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                            {getPropertyTypeLabel(type)}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    size="small"
                    fullWidth
                    label={t("roommates.filters.rentalPeriod", {
                        defaultValue: "Rental period",
                    })}
                    value={selectedRentalPeriod}
                    onChange={(event) =>
                        onRentalPeriodChange(event.target.value)
                    }
                >
                    {rentalPeriods.map((period) => (
                        <MenuItem key={period} value={period}>
                            {period === "All"
                                ? t("roommates.filters.allPeriods", {
                                    defaultValue: "All periods",
                                })
                                : t(`properties.rentalPeriod.${period}`, {
                                    defaultValue: period,
                                })}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    size="small"
                    fullWidth
                    label={t("roommates.filters.city", {
                        defaultValue: "City",
                    })}
                    placeholder={t("roommates.filters.enterCity", {
                        defaultValue: "Enter city",
                    })}
                    value={city}
                    onChange={(event) => onCityChange(event.target.value)}
                />

                <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ClearAllIcon />}
                    onClick={onClearFilters}
                    sx={{
                        height: 40,
                        textTransform: "none",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                    }}
                >
                    {t("roommates.filters.clear", {
                        defaultValue: "Clear filters",
                    })}
                </Button>
            </Box>
        </Box>
    );
}
