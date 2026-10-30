
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

export default function Profile() {
    return (
        <Box sx={{ width: '100%', minHeight: 'calc(100vh - 4rem)', bgcolor: '#f9fafb' }}>
            {/* Outlet automatically renders index route or nested dynamic route */}
            <Outlet />
        </Box>
    );
}