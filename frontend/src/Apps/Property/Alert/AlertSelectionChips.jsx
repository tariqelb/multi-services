
import React from "react";

import {
    Box,
    Chip,
} from "@mui/material";

import Check from "@mui/icons-material/Check";

export default function AlertSelectionChips({
    options,
    selected,
    setter,
    getLabel = (value) => value,
    onSelectionChange,
}) {
    const handleToggle = (value) => {
        setter((previous) =>
            previous.includes(value)
                ? previous.filter((item) => item !== value)
                : [...previous, value]
        );

        onSelectionChange?.();
    };

    const selectionChipSx = (isSelected) => ({
        minHeight: {
            xs: 40,
            sm: 44,
        },
        height: "auto",
        maxWidth: "100%",
        px: {
            xs: 0.75,
            sm: 1.25,
        },
        py: 0.5,
        borderRadius: "10px",
        fontWeight: 600,
        fontSize: {
            xs: "0.875rem",
            sm: "1rem",
        },
        bgcolor: isSelected ? "#eff6ff" : "transparent",
        color: isSelected ? "#1d4ed8" : "#334155",
        borderColor: isSelected ? "#93c5fd" : "#D5DCE8",
        "& .MuiChip-label": {
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            py: 0.5,
        },
        "&:hover": {
            bgcolor: isSelected ? "#dbeafe" : "#f1f5f9",
        },
    });

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: {
                    xs: 1,
                    sm: 1.5,
                },
                mb: {
                    xs: 4,
                    sm: 5,
                },
            }}
        >
            {options.map((option) => {
                const isSelected = selected.includes(option);

                return (
                    <Chip
                        key={option}
                        label={getLabel(option)}
                        icon={
                            isSelected ? (
                                <Check
                                    sx={{
                                        color: "#1d4ed8 !important",
                                        fontSize: "1.2rem !important",
                                    }}
                                />
                            ) : undefined
                        }
                        clickable
                        onClick={() => handleToggle(option)}
                        variant={isSelected ? "filled" : "outlined"}
                        sx={selectionChipSx(isSelected)}
                    />
                );
            })}
        </Box>
    );
}
