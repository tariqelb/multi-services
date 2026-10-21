// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//     Box,
//     CircularProgress,
//     Alert,
// } from "@mui/material";

// import axiosInstance from "../api/axiosInstance";
// import PropertyDetails from "./PropertyDetails";
// import SimilarProperties from "./SimilarProperties"
// export default function PropertyDetailsPage() {
//     const { id } = useParams();
//     const navigate = useNavigate();

//     const [property, setProperty] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//        // Navigate to the selected property's details page.
//    const handleSelectProperty = (property) => {
//         if (!property) return;

//         onSelectProperty?.(property);
//     };
//     useEffect(() => {
//         let cancelled = false;

//         const fetchProperty = async () => {
//             setLoading(true);
//             setError(null);
//             setProperty(null);

//             try {
//                 // Replace this URL if your backend uses another endpoint.
//                 const response = await axiosInstance.get(
//                     `/property/${id}`
//                 );

//                 const data = response.data?.property ?? response.data;

//                 if (!cancelled) {
//                     setProperty(data);
//                 }
//             } catch (err) {
//                 if (!cancelled) {
//                     setError(
//                         err.response?.data?.message ||
//                         "Failed to load property details."
//                     );
//                 }
//             } finally {
//                 if (!cancelled) {
//                     setLoading(false);
//                 }
//             }
//         };

//         fetchProperty();

//         return () => {
//             cancelled = true;
//         };
//     }, [id]);

//     if (loading) {
//         return (
//             <Box sx={{ display: "flex", justifyContent: "center", p: 6, flex: 1 }}>
//                 <CircularProgress />
//             </Box>
//         );
//     }

//     if (error || !property) {
//         return (
//             <Box sx={{ p: 4, flex: 1 }}>
//                 <Alert severity="error">
//                     {error || "Property not found."}
//                 </Alert>
//             </Box>
//         );
//     }

//     return (
//         <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
//             <PropertyDetails
//                 property={property}
//                 onBack={() => navigate("/properties")}
//             />
//         </Box>
//         // <SimilarProperties
//         //      property={property}
//         //      onClick={() => handleSelectProperty(property)}
//         // />
//     );
// }
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    CircularProgress,
    Alert,
} from "@mui/material";

import axiosInstance from "../api/axiosInstance";
import PropertyDetails from "./PropertyDetails";
import SimilarProperties from "./SimilarProperties";

export default function PropertyDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch property details and similar properties based on type
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setProperty(null);
            setSimilarProperties([]);

            try {
                // 1. Fetch current property details
                const response = await axiosInstance.get(`/property/${id}`);
                const propertyData = response.data?.property ?? response.data;

                if (cancelled) return;
                setProperty(propertyData);

                // 2. Fetch list to extract similar properties
                const listRes = await axiosInstance.get('/property/getlist');
                const allProps = Array.isArray(listRes.data)
                    ? listRes.data
                    : Array.isArray(listRes.data?.properties)
                        ? listRes.data.properties
                        : [];

                if (!cancelled) {
                    const currentId = propertyData._id || propertyData.id;
                    const filtered = allProps.filter(
                        (p) => 
                            (p._id !== currentId && p.id !== currentId) &&
                            p.propertyType?.toLowerCase() === propertyData.propertyType?.toLowerCase()
                    );
                    setSimilarProperties(filtered);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Failed to load property details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    // Handle clicking a similar property card
    const handleSelectSimilar = (simProp) => {
        const simId = simProp._id || simProp.id;
        if (simId) {
            navigate(`/properties/${simId}`);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6, flex: 1 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !property) {
        return (
            <Box sx={{ p: 4, flex: 1 }}>
                <Alert severity="error">
                    {error || "Property not found."}
                </Alert>
            </Box>
        );
    }

    return (
        <Box component="main" sx={{ flex: 1, minWidth: 0, pb: 6 }}>
            <PropertyDetails
                property={property}
                onBack={() => navigate("/properties")}
            />

            {/* Render Similar Properties below details if available */}
            {similarProperties.length > 0 && (
                <SimilarProperties
                    properties={similarProperties}
                    onSelectProperty={handleSelectSimilar}
                />
            )}
        </Box>
    );
}