import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import RealEstateBanner from './RealEstateBanner';
import RealEstateOption from './RealEstateOption';
import PropertyCard from './PropertyCard';
import PropertyInsertForm from './PropertyInsertForm';
import PropertyList from './PropertyList.jsx'


export default function Properties() {


  return (
    <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f9fafb', minHeight: 'calc(100vh - 4rem)' }}>
      {/* Banner Component */}
        <RealEstateBanner />

      {/* Categories Options Component */}
        <RealEstateOption />

      {/* Property Listings Section */}

        <PropertyList/>
      {/* Property Insertion Form */}
        <PropertyInsertForm />
    </Box>
  );
}