import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Grid,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton,
    Stack,
} from '@mui/material';

export default function PropertyInsertFormDetails({
    formData,
    handleChange,
    handleListingTypeChange,
    propertyTypes,
    fieldSx,
    SectionPaper,
    SectionHeader,
    errors = {},
}) {
    const renderField = (
        name,
        label,
        options = {}
    ) => (
        <TextField
            fullWidth
            size="medium"
            sx={fieldSx}
            name={name}
            label={label}
            value={formData[name] ?? ''}
            onChange={handleChange}
            error={Boolean(errors[name])}
            helperText={errors[name] || ''}
            {...options}
        />
    );

    return (
        <SectionPaper>
            <SectionHeader
                icon="🏠"
                title="Property Details"
                subtitle="Describe the property you want to publish."
                number={2}
            />

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                    {renderField('title', 'Listing Title *', {
                        placeholder: 'e.g. Modern Apartment in the City Center',
                    })}
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1.2, fontWeight: 650, color: '#344054' }}
                    >
                        Transaction Type *
                    </Typography>

                    <ToggleButtonGroup
                        value={formData.listingType}
                        exclusive
                        onChange={handleListingTypeChange}
                        aria-label="transaction type"
                        sx={{
                            display: 'flex',
                            width: '100%',
                            gap: 1.5,
                            border: 0,
                            '& .MuiToggleButton-root': {
                                flex: 1,
                                minWidth: 0,
                                py: 1.4,
                                px: 2,
                                border: '1px solid #e1e6ef',
                                borderRadius: '10px !important',
                                textTransform: 'none',
                                fontWeight: 650,
                                color: '#667085',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: '#ececec',
                                    borderColor: '#c7d2fe',
                                },
                                '&.Mui-selected': {
                                    bgcolor: '#eef2ff',
                                    color: '#4f46e5',
                                    borderColor: '#a5b4fc',
                                },
                                '&.Mui-selected:hover': {
                                    bgcolor: '#ececec',
                                },
                            },
                        }}
                    >
                        <ToggleButton value="For Sale">For Sale</ToggleButton>
                        <ToggleButton value="For Rent">For Rent</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField('propertyType', 'Property Type *', {
                        select: true,
                        children: propertyTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        )),
                    })}
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ color: '#4f46e5', fontWeight: 700 }}>
                        📍
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 750, color: '#263248' }}
                    >
                        Property Location
                    </Typography>
                </Stack>

                <Typography
                    variant="body2"
                    sx={{ color: '#8490a3', mt: 0.5 }}
                >
                    Help people find your property more easily.
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField('city', 'City *', {
                        placeholder: 'e.g. Casablanca',
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField('neighborhood', 'Neighborhood / Area', {
                        placeholder: 'e.g. Maarif',
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField('fullAddress', 'Full Address', {
                        placeholder: 'Street name, building...',
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField('mapLink', 'Google Maps Location Link', {
                        placeholder: 'https://maps.google.com/...',
                        type: 'url',
                    })}
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ color: '#4f46e5', fontWeight: 700 }}>
                        💳
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 750, color: '#263248' }}
                    >
                        Price and Specifications
                    </Typography>
                </Stack>

                <Typography
                    variant="body2"
                    sx={{ color: '#8490a3', mt: 0.5 }}
                >
                    Add the price, surface area, and property characteristics.
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField('price', 'Price (MAD) *', {
                        type: 'number',
                        slotProps: { htmlInput: { min: 0 } },
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField('surface', 'Surface (m²) *', {
                        type: 'number',
                        slotProps: { htmlInput: { min: 1 } },
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField('rooms', 'Rooms / Bedrooms', {
                        type: 'number',
                        slotProps: { htmlInput: { min: 0 } },
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField('salons', 'Salons', {
                        type: 'number',
                        slotProps: { htmlInput: { min: 0 } },
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {renderField('bathrooms', 'Bathrooms', {
                        type: 'number',
                        slotProps: { htmlInput: { min: 0 } },
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {renderField('floor', 'Floor Level', {
                        type: 'number',
                        slotProps: { htmlInput: { min: 0 } },
                    })}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {renderField('syndicateFees', 'Syndicate Fees (MAD/month)', {
                        type: 'number',
                        slotProps: { htmlInput: { min: 0 } },
                    })}
                </Grid>
            </Grid>
        </SectionPaper>
    );
}
