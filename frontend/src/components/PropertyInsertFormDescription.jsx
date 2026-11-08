import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    TextField,
    Typography,
} from "@mui/material";

export default function PropertyInsertFormDescription({
    formData,
    errors,
    handleChange,
    fieldSx,
    SectionPaper,
    SectionHeader,
}) {
    const { t } = useTranslation();

    return (
        <SectionPaper>
            <SectionHeader
                icon="📝"
                title={t("properties.insert.description.title")}
                subtitle={t("properties.insert.description.subtitle")}
                number={3}
            />

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                }}
            >
                <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    maxRows={10}
                    name="description"
                    label={t("properties.insert.description.label")}
                    placeholder={t("properties.insert.description.placeholder")}
                    value={formData.description || ""}
                    onChange={handleChange}
                    sx={fieldSx}
                    inputProps={{ maxLength: 3000 }}
                    helperText={
                        <Box
                            component="span"
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <span>
                                {t("properties.insert.description.helper")}
                            </span>

                            <span>
                                {(formData.description || "").length}/3000
                            </span>
                        </Box>
                    }
                    error={Boolean(errors?.description)}
                />

                {errors?.description && (
                    <Typography
                        variant="caption"
                        color="error"
                    >
                        {errors.description}
                    </Typography>
                )}
            </Box>
        </SectionPaper>
    );
}