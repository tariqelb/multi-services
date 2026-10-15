import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import PropertyCard from './PropertyCard';
import axiosInstance from "../api/axiosInstance";

export default function PropertyList() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await axiosInstance.get('/property/getlist'); 
                setProperties(response.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch properties');
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1f2937' }}>
                Property Listings
            </Typography>

            <div className="flex flex-row justify-around items-center p-6">
                <Box sx={{ width: '100%', px: { xs: 2, sm: 4, md: 6 }, pb: 8, display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
                    {properties.length === 0 ? (
                        <Typography variant="body1" sx={{ color: '#6b7280' }}>
                            No properties found. Be the first to publish one!
                        </Typography>
                    ) : (
                        <Grid
                            container
                            spacing={8}
                            alignItems="stretch"
                        >
                            {properties.map((property, index) => {
                                // Properly map backend static image path with backend host URL
                                const imagePath = property.images?.[0]?.path;
                                const fullImageUrl = imagePath 
                                    ? `http://localhost:3000${imagePath.startsWith('/') ? '' : '/'}${imagePath}` 
                                    : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500';

                                const formattedProperty = {
                                    title: property.title,
                                    price: property.price ? `${property.price.toLocaleString()} MAD` : '0 MAD',
                                    image: fullImageUrl,
                                    listingType: property.listingType,
                                    propertyType: property.propertyType,
                                    referenceCode: property._id ? `#${property._id.slice(-4)}` : '#48',
                                    city: property.city,
                                    neighborhood: property.neighborhood,
                                    surface: property.surface,
                                    rooms: property.rooms,
                                    salons: property.salons,
                                    bathrooms: property.bathrooms,
                                    createdDate: property.createdAt 
                                        ? new Date(property.createdAt).toLocaleDateString('en-GB') 
                                        : '15/10/2026',
                                };

                                return (
                                    <Grid
                                        item
                                        xs={12}
                                        sm={6}
                                        md={4}
                                        key={property._id || index}
                                        sx={{ display: "flex", minWidth: 0 }}
                                    >
                                        <PropertyCard property={formattedProperty} />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            </div>
        </Box>
    );
}