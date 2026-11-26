// src/Components/Analytics/TypeChips.jsx
// Chips to switch the kind of listing a statistics tab shows.

import { Chip, Stack } from "@mui/material";

export default function TypeChips({ value, onChange, options = [] }) {
    return (
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
            {options.map((option) => (
                <Chip
                    key={option.value}
                    icon={option.icon}
                    label={option.label}
                    color={value === option.value ? "primary" : "default"}
                    variant={value === option.value ? "filled" : "outlined"}
                    onClick={() => onChange(option.value)}
                    sx={{ fontWeight: 700 }}
                />
            ))}
        </Stack>
    );
}
