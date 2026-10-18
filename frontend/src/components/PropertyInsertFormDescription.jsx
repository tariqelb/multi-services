
import React from 'react';
import {
    Box,
    TextField,
    Typography,
} from '@mui/material';

export default function PropertyInsertFormDescription({
    formData,
    errors,
    handleChange,
    fieldSx,
    SectionPaper,
    SectionHeader,
}) {
    return (
        <SectionPaper>
            <SectionHeader
                icon="📝"
                title="Property Description"
                subtitle="Describe your property and highlight its main features."
                number={3}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    maxRows={10}
                    name="description"
                    label="Description (optional)"
                    placeholder="Describe the property, its condition, natural light, nearby amenities, and other important features..."
                    value={formData.description || ''}
                    onChange={handleChange}
                    sx={fieldSx}
                    inputProps={{ maxLength: 3000 }}
                    helperText={
                        <Box
                            component="span"
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <span>
                                Provide useful details to help buyers and tenants.
                            </span>
                            <span>
                                {(formData.description || '').length}/3000
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