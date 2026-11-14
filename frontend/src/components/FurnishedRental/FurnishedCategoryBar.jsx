import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Button,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";

import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import VillaOutlinedIcon from "@mui/icons-material/VillaOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

const categories = [
    {
        value: "All",
        key: "all",
        icon: HomeWorkOutlinedIcon,
    },
    {
        value: "Villa",
        key: "villa",
        icon: VillaOutlinedIcon,
    },
    {
        value: "Studio",
        key: "studio",
        icon: ApartmentOutlinedIcon,
    },
    {
        value: "Room",
        key: "room",
        icon: MeetingRoomOutlinedIcon,
    },
    {
        value: "Apartment",
        key: "apartment",
        icon: ApartmentOutlinedIcon,
    },
    {
        value: "House",
        key: "house",
        icon: HomeWorkOutlinedIcon,
    },
];

const rentalPeriods = [
    { value: "All", key: "allPeriods" },
    { value: "Daily", key: "daily" },
    { value: "Monthly", key: "monthly" },
];

export default function FurnishedCategoryBar({
    selectedCategory = "All",
    onCategoryChange,
    selectedRentalPeriod = "All",
    onRentalPeriodChange,
}) {
    const { t } = useTranslation();

    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const handleClearFilters = () => {
        onCategoryChange?.("All");
        onRentalPeriodChange?.("All");
    };

    const hasActiveFilters =
        selectedCategory !== "All" ||
        selectedRentalPeriod !== "All";

    const filterFieldSx = {
        minWidth: 0,
        width: "100%",
        "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            backgroundColor: "#fff",
        },
    };

    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                    pb: 2,
                    fontSize: {
                        xs: "1.25rem",
                        sm: "1.5rem",
                    },
                }}
            >
                {translate(
                    "properties.furnished.filterTitle",
                    "Find furnished accommodation"
                )}
            </Typography>

            <Box
                sx={{
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                    mb: 3,
                    px: {
                        xs: 1.5,
                        sm: 2.5,
                        md: 3,
                    },
                    py: {
                        xs: 1.5,
                        sm: 2,
                    },
                    border: 1,
                    borderRadius: "16px",
                    borderColor: "#E2E8F0",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    bgcolor: "#fff",
                }}
            >
                {/* Property categories */}
                <Typography
                    sx={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#334155",
                        mb: 1,
                    }}
                >
                    {translate(
                        "properties.furnished.propertyType",
                        "Property type"
                    )}
                </Typography>

                <Box
                    component="nav"
                    aria-label={translate(
                        "properties.furnished.categoriesAriaLabel",
                        "Furnished property categories"
                    )}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                            md: "repeat(3, minmax(0, 1fr))",
                            lg: "repeat(6, minmax(0, 1fr))",
                        },
                        gap: {
                            xs: 1,
                            sm: 1.5,
                        },
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        py: 1,
                    }}
                >
                    {categories.map((category) => {
                        const active =
                            selectedCategory === category.value;

                        const Icon = category.icon;

                        return (
                            <Button
                                key={category.value}
                                variant={active ? "contained" : "outlined"}
                                disableElevation
                                onClick={() =>
                                    onCategoryChange?.(category.value)
                                }
                                startIcon={
                                    <Icon
                                        sx={{
                                            fontSize: {
                                                xs: 17,
                                                sm: 19,
                                            },
                                        }}
                                    />
                                }
                                sx={{
                                    minWidth: 0,
                                    width: "100%",
                                    minHeight: {
                                        xs: 42,
                                        sm: 46,
                                    },
                                    px: {
                                        xs: 0.75,
                                        sm: 1.5,
                                    },
                                    py: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    whiteSpace: "normal",
                                    overflowWrap: "anywhere",
                                    textAlign: "center",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: {
                                        xs: "0.75rem",
                                        sm: "0.85rem",
                                    },
                                    lineHeight: 1.3,
                                    borderRadius: "999px",
                                    color: active ? "#fff" : "#334155",
                                    backgroundColor: active
                                        ? "#2563EB"
                                        : "#fff",
                                    borderColor: active
                                        ? "#2563EB"
                                        : "#D5DCE8",
                                    boxShadow: active
                                        ? "0 4px 12px rgba(37, 99, 235, 0.2)"
                                        : "none",
                                    transition: "all 0.2s ease",
                                    "& .MuiButton-startIcon": {
                                        mr: 0.5,
                                        ml: 0,
                                        flexShrink: 0,
                                    },
                                    "&:hover": {
                                        backgroundColor: active
                                            ? "#1D4ED8"
                                            : "#F8FAFC",
                                        borderColor: active
                                            ? "#1D4ED8"
                                            : "#94A3B8",
                                        boxShadow: active
                                            ? "0 4px 12px rgba(37, 99, 235, 0.2)"
                                            : "none",
                                    },
                                }}
                            >
                                {translate(
                                    `properties.categories.${category.key}`,
                                    category.value === "All"
                                        ? "All"
                                        : category.value
                                )}
                            </Button>
                        );
                    })}
                </Box>

                {/* Rental period filters */}
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: {
                            xs: 1.5,
                            sm: 2,
                        },
                        mt: 1.5,
                        p: {
                            xs: 1,
                            sm: 1.5,
                        },
                        borderRadius: "16px",
                        backgroundColor: "#F4F7FB",
                        boxSizing: "border-box",
                        width: "100%",
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flex: {
                                xs: "1 1 100%",
                                sm: "0 0 auto",
                            },
                        }}
                    >
                        <CalendarMonthOutlinedIcon
                            sx={{
                                color: "#2563EB",
                                fontSize: 21,
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: "#334155",
                            }}
                        >
                            {translate(
                                "properties.furnished.rentalPeriod",
                                "Rental period"
                            )}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(3, minmax(0, 1fr))",
                                sm: "repeat(3, minmax(110px, 1fr))",
                            },
                            gap: 1,
                            flex: {
                                xs: "1 1 100%",
                                sm: "1 1 350px",
                            },
                            minWidth: 0,
                        }}
                    >
                        {rentalPeriods.map((period) => {
                            const active =
                                selectedRentalPeriod === period.value;

                            return (
                                <Button
                                    key={period.value}
                                    variant={
                                        active ? "contained" : "outlined"
                                    }
                                    disableElevation
                                    onClick={() =>
                                        onRentalPeriodChange?.(
                                            period.value
                                        )
                                    }
                                    sx={{
                                        minWidth: 0,
                                        minHeight: 42,
                                        px: {
                                            xs: 0.5,
                                            sm: 1.5,
                                        },
                                        borderRadius: "999px",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        fontSize: {
                                            xs: "0.72rem",
                                            sm: "0.85rem",
                                        },
                                        whiteSpace: "normal",
                                        lineHeight: 1.3,
                                        color: active
                                            ? "#fff"
                                            : "#334155",
                                        backgroundColor: active
                                            ? "#2563EB"
                                            : "#fff",
                                        borderColor: active
                                            ? "#2563EB"
                                            : "#D5DCE8",
                                        "&:hover": {
                                            backgroundColor: active
                                                ? "#1D4ED8"
                                                : "#F8FAFC",
                                            borderColor: active
                                                ? "#1D4ED8"
                                                : "#94A3B8",
                                        },
                                    }}
                                >
                                    {translate(
                                        `properties.furnished.${period.key}`,
                                        period.value === "All"
                                            ? "All periods"
                                            : period.value
                                    )}
                                </Button>
                            );
                        })}
                    </Box>

                    <Box
                        sx={{
                            flex: {
                                xs: "1 1 100%",
                                sm: "0 0 auto",
                            },
                            display: "flex",
                            justifyContent: {
                                xs: "stretch",
                                sm: "flex-end",
                            },
                            ml: {
                                sm: "auto",
                            },
                        }}
                    >
                        <Button
                            variant="outlined"
                            disabled={!hasActiveFilters}
                            onClick={handleClearFilters}
                            sx={{
                                minHeight: 42,
                                minWidth: {
                                    xs: "100%",
                                    sm: "auto",
                                },
                                px: 2.5,
                                borderRadius: "10px",
                                borderColor: "#D5DCE8",
                                color: "#475569",
                                fontWeight: 700,
                                textTransform: "none",
                                whiteSpace: "nowrap",
                                "&:hover": {
                                    borderColor: "#94A3B8",
                                    backgroundColor: "#fff",
                                },
                                "&.Mui-disabled": {
                                    borderColor: "#E2E8F0",
                                    color: "#A0AAB8",
                                },
                            }}
                        >
                            {translate(
                                "properties.filter.clearFilters",
                                "Clear filters"
                            )}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}