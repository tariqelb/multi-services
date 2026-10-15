import React from 'react';
import {
    Typography,
    TextField,
    Grid,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';

export default function PropertyInsertFormOwnerInfo({
    formData,
    handleChange,
    handleRoleChange,
    fieldSx,
    SectionPaper,
    SectionHeader,
    errors = {},
}) {
    return (
        <SectionPaper>
            <SectionHeader
                icon="👤"
                title="Owner Information"
                subtitle="Who is listing this property?"
                number={1}
            />

            <Typography
                variant="body2"
                sx={{ fontWeight: 650, color: '#344054', mb: 1.5 }}
            >
                Your role regarding this property *
            </Typography>

            <ToggleButtonGroup
                value={formData.role}
                exclusive
                onChange={handleRoleChange}
                aria-label="property role"
                fullWidth
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 3,
                    border: 0,
                    '& .MuiToggleButton-root': {
                        flex: 1,
                        minWidth: 0,
                        py: 1.3,
                        px: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: { xs: '0.72rem', sm: '0.88rem' },
                        color: '#667085',
                        border: '1px solid #e1e6ef',
                        borderRadius: '10px !important',
                        '&.Mui-selected': {
                            color: '#4f46e5',
                            bgcolor: '#ececec',
                            borderColor: '#a5b4fc',
                        },
                    },
                }}
            >
                <ToggleButton value="Owner">Property Owner</ToggleButton>
                <ToggleButton value="Real Estate Agent">
                    Real Estate Agent
                </ToggleButton>
                <ToggleButton value="Agency">Real Estate Agency</ToggleButton>
            </ToggleButtonGroup>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        label="First Name *"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="e.g. Mohammed"
                        error={Boolean(errors.firstName)}
                        helperText={errors.firstName}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        label="Last Name *"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="e.g. Alami"
                        error={Boolean(errors.lastName)}
                        helperText={errors.lastName}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        type="email"
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        label="Phone Number *"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="06 XX XX XX XX"
                        error={Boolean(errors.phone)}
                        helperText={errors.phone}
                    />
                </Grid>
            </Grid>
        </SectionPaper>
    );
}