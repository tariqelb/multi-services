// import React, { useState, useEffect, useRef } from 'react';
// import { Box } from '@mui/material';
// import { useNavigate } from "react-router-dom";
// import RealEstateBanner from './RealEstateBanner';
// import RealEstateOption from './RealEstateOption';
// import PropertyInsertForm from './PropertyInsertForm';
// import PropertyList from './PropertyList';
// import PropertyDetails from './PropertyDetails';
// import SimilarProperties from "./SimilarProperties";
// import axiosInstance from '../api/axiosInstance';

// export default function Properties() {
//     const [refreshTrigger, setRefreshTrigger] = useState(0);
//     const [selectedProperty, setSelectedProperty] = useState(null);
//     const [similarProperties, setSimilarProperties] = useState([]);
    
//     // Shared category state for filtering from RealEstateOption & PropertyList
//     const [selectedCategory, setSelectedCategory] = useState("All Properties");

//     const propertySectionRef = useRef(null);
//     const selectedCardRef = useRef(null);

//     const propertyId = selectedProperty?._id || selectedProperty?.id;

//     // Fetch similar properties whenever selectedProperty changes
//     useEffect(() => {
//         if (!propertyId || !selectedProperty) {
//             setSimilarProperties([]);
//             return;
//         }

//         let cancelled = false;
//         const fetchSimilar = async () => {
//             try {
//                 const listRes = await axiosInstance.get('/property/getlist');
//                 const allProps = Array.isArray(listRes.data)
//                     ? listRes.data
//                     : Array.isArray(listRes.data?.properties)
//                         ? listRes.data.properties
//                         : [];

//                 if (!cancelled) {
//                     const filtered = allProps.filter(
//                         (p) => 
//                             (p._id !== propertyId && p.id !== propertyId) &&
//                             p.propertyType?.toLowerCase() === selectedProperty.propertyType?.toLowerCase()
//                     );
//                     setSimilarProperties(filtered);
//                 }
//             } catch (err) {
//                 console.error("Failed to load similar properties:", err);
//             }
//         };

//         fetchSimilar();

//         return () => {
//             cancelled = true;
//         };
//     }, [propertyId, selectedProperty]);

//     const handlePropertyAdded = () => {
//         setRefreshTrigger((previous) => previous + 1);
//     };

//     const navigate = useNavigate();

//     const handleSelectProperty = (property) => {
//         const id = property._id || property.id;

//         if (id) {
//             navigate(`/properties/${id}`);
//         }
//     };

//     const handleSelectSimilar = (simProp) => {
//         setSelectedProperty(simProp);
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//     };

//     const handleBackToListings = () => {
//         setSelectedProperty(null);

//         requestAnimationFrame(() => {
//             requestAnimationFrame(() => {
//                 const target =
//                     selectedCardRef.current ||
//                     propertySectionRef.current;

//                 target?.scrollIntoView({
//                     behavior: 'smooth',
//                     block: 'start',
//                 });
//             });
//         });
//     };

//     return (
//         <Box
//             component="main"
//             sx={{
//                 flexGrow: 1,
//                 bgcolor: '#f9fafb',
//                 minHeight: 'calc(100vh - 4rem)',
//             }}
//         >
//             {selectedProperty ? (
//                 <PropertyDetails
//                     property={property}
//                     onBack={handleBackToListings}
//                     similarProperties={similarProperties}
//                     onSelectSimilar={handleSelectSimilar}
//                     isSaved={property.isSaved || false}
//                     onSaveProperty={handleSaveProperty}
//                 />
//             ) : (
//                 <>
//                     <RealEstateBanner />
                    
//                     {/* Pass category setter and section ref down to RealEstateOption */}
//                     <RealEstateOption 
//                         onSelectCategory={(category) => setSelectedCategory(category)}
//                         listRef={propertySectionRef}
//                     />

//                     <Box ref={propertySectionRef}>
//                         <PropertyList
//                             refreshTrigger={refreshTrigger}
//                             onSelectProperty={handleSelectProperty}
//                             listRef={propertySectionRef}
//                             selectedCategory={selectedCategory}
//                             onCategoryChange={setSelectedCategory}
//                         />
//                     </Box>

//                     <PropertyInsertForm
//                         onAddProperty={handlePropertyAdded}
//                     />
//                 </>
//             )}
//         </Box>
//     );
// }
import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from "react-router-dom";
import RealEstateBanner from './RealEstateBanner';
import RealEstateOption from './RealEstateOption';
import PropertyInsertForm from './PropertyInsertForm';
import PropertyList from './PropertyList';
import PublishFab from './PublishFab'; // Import the floating button

export default function Properties() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState("All Properties");

    const propertySectionRef = useRef(null);
    const navigate = useNavigate();

    const handlePropertyAdded = () => {
        setRefreshTrigger((previous) => previous + 1);
    };

    // When a property is clicked, navigate to its detail URL route
    const handleSelectProperty = (property) => {
        const id = property._id || property.id;
        if (id) {
            navigate(`/properties/${id}`);
        }
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
            {/* Banner is at the very top of /properties */}
            <RealEstateBanner />
            
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
                    onCategoryChange={setSelectedCategory}
                />
            </Box>
            <PublishFab />
            {/* <PropertyInsertForm
                onAddProperty={handlePropertyAdded}
            /> */}
        </Box>
    );
}