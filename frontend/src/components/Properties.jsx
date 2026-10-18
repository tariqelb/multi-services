import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

import RealEstateBanner from './RealEstateBanner';
import RealEstateOption from './RealEstateOption';
import PropertyInsertForm from './PropertyInsertForm';
import PropertyList from './PropertyList';
import PropertyDetails from './PropertyDetails';
import SimilarProperties from "./SimilarProperties";
import axiosInstance from '../api/axiosInstance';

export default function Properties() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [similarProperties, setSimilarProperties] = useState([]);
    
    // Shared category state for filtering from RealEstateOption & PropertyList
    const [selectedCategory, setSelectedCategory] = useState("All Properties");

    const propertySectionRef = useRef(null);
    const selectedCardRef = useRef(null);

    const propertyId = selectedProperty?._id || selectedProperty?.id;

    // Fetch similar properties whenever selectedProperty changes
    useEffect(() => {
        if (!propertyId || !selectedProperty) {
            setSimilarProperties([]);
            return;
        }

        let cancelled = false;
        const fetchSimilar = async () => {
            try {
                const listRes = await axiosInstance.get('/property/getlist');
                const allProps = Array.isArray(listRes.data)
                    ? listRes.data
                    : Array.isArray(listRes.data?.properties)
                        ? listRes.data.properties
                        : [];

                if (!cancelled) {
                    const filtered = allProps.filter(
                        (p) => 
                            (p._id !== propertyId && p.id !== propertyId) &&
                            p.propertyType?.toLowerCase() === selectedProperty.propertyType?.toLowerCase()
                    );
                    setSimilarProperties(filtered);
                }
            } catch (err) {
                console.error("Failed to load similar properties:", err);
            }
        };

        fetchSimilar();

        return () => {
            cancelled = true;
        };
    }, [propertyId, selectedProperty]);

    const handlePropertyAdded = () => {
        setRefreshTrigger((previous) => previous + 1);
    };

    const handleSelectProperty = (property, cardElement) => {
        setSelectedProperty(property);
        selectedCardRef.current = null;
    };

    const handleSelectSimilar = (simProp) => {
        setSelectedProperty(simProp);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToListings = () => {
        setSelectedProperty(null);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const target =
                    selectedCardRef.current ||
                    propertySectionRef.current;

                target?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            });
        });
    };

    return (
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                bgcolor: '#f9fafb',
                minHeight: 'calc(100vh - 4rem)',
            }}
        >
            {selectedProperty ? (
                <PropertyDetails
                    property={selectedProperty}
                    onBack={handleBackToListings}
                    similarProperties={similarProperties}
                    onSelectSimilar={handleSelectSimilar}
                />
            ) : (
                <>
                    <RealEstateBanner />
                    
                    {/* Pass category setter and section ref down to RealEstateOption */}
                    <RealEstateOption 
                        onSelectCategory={(category) => setSelectedCategory(category)}
                        listRef={propertySectionRef}
                    />

                    <Box ref={propertySectionRef}>
                        <PropertyList
                            refreshTrigger={refreshTrigger}
                            onSelectProperty={handleSelectProperty}
                            listRef={propertySectionRef} 
                            selectedCategory={selectedCategory}
                            onCategoryChange={(category) => setSelectedCategory(category)}
                        />
                    </Box>

                    <PropertyInsertForm
                        onAddProperty={handlePropertyAdded}
                    />
                </>
            )}
        </Box>
    );
}