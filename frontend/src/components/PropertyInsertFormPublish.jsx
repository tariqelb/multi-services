import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    CircularProgress,
} from '@mui/material';

export default function PropertyInsertFormPublish({
    loading = false,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2.5, sm: 3 },
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                bgcolor: '#ffffff',
            }}
        >
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
            >
                <Box>
                    <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: '#0F172A' }}
                    >
                        Ready to publish?
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: '#5B6577', mt: 0.5 }}
                    >
                        Review your details before submitting your listing.
                    </Typography>
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    endIcon={
                        loading ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : (
                            <Typography
                                component="span"
                                sx={{ fontSize: '1rem', ml: 0.5 }}
                            >
                                ✓
                            </Typography>
                        )
                    }
                    sx={{
                        minWidth: { sm: 230 },
                        py: 1.5,
                        px: 3,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        bgcolor: '#2563EB',
                        boxShadow: '0 5px 12px rgba(37, 99, 235,0.2)',
                        '&:hover': {
                            bgcolor: '#1D4ED8',
                            boxShadow: '0 7px 16px rgba(37, 99, 235,0.28)',
                        },
                    }}
                >
                    {loading ? 'Publishing...' : 'Publish Property Listing'}
                </Button>
            </Stack>
        </Paper>
    );
}