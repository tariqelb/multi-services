import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function PublishFab() {
    const navigate = useNavigate();

    return (
        <Tooltip title="Publish a new property listing" placement="left">
            <Fab
                variant="extended"
                color="primary"
                aria-label="add property"
                onClick={() => navigate('/properties/publish')}
                sx={{
                    position: 'fixed !important',
                    bottom: 32,
                    right: 32,
                    zIndex: 9999,
                    bgcolor: '#059669',
                    color: '#ffffff',
                    px: 3,
                    py: 1.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)',
                    '&:hover': {
                        bgcolor: '#047857',
                    },
                }}
            >
                <AddIcon sx={{ mr: 1, fontSize: 24 }} />
                Add Property
            </Fab>
        </Tooltip>
    );
}