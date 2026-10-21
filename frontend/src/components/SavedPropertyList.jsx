
// import React, { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Box,
//     Typography,
//     Button,
//     Stack,
//     CircularProgress,
//     Alert,
// } from "@mui/material";
// import { BookmarkRemove } from "@mui/icons-material";

// import axiosInstance from "../api/axiosInstance";
// import SavedPropertyCard from "./SavedPropertyCard";

// export default function SavedPropertiesList({ onViewDetails }) {
//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const [removingId, setRemovingId] = useState(null);

//     // Fetch saved properties for the current user.
//     const fetchSavedProperties = useCallback(async () => {
//         try {
//             setLoading(true);
//             setError("");

//             const response = await axiosInstance.get("/property/saved");

//             const data = response.data;

//             const savedProperties = Array.isArray(data)
//                 ? data
//                 : data?.savedProperties || [];

//             setProperties(savedProperties);
//         } catch (err) {
//             console.error(
//                 "Failed to fetch saved properties:",
//                 err.response?.data || err.message
//             );

//             setError(
//                 err.response?.data?.message ||
//                     "Failed to load saved properties. Please try again."
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchSavedProperties();
//     }, [fetchSavedProperties]);

//     // Remove a saved record without deleting the original property.
//     const handleRemoveSaved = async (property) => {
//         const propertyId = property._id || property.id;

//         if (!propertyId || removingId) return;

//         try {
//             setRemovingId(propertyId);
//             setError("");

//             await axiosInstance.delete(
//                 `/property/unsave/${propertyId}`
//             );

//             setProperties((previous) =>
//                 previous.filter(
//                     (record) => record.propertyId?._id !== propertyId
//                 )
//             );
//         } catch (err) {
//             console.error(
//                 "Failed to remove saved property:",
//                 err.response?.data || err.message
//             );

//             setError(
//                 err.response?.data?.message ||
//                     "Failed to remove this property from your saved list."
//             );
//         } finally {
//             setRemovingId(null);
//         }
//     };
//     const navigate = useNavigate();

//     const handleViewDetails = (property) => {
//         const propertyId = property?._id || property?.id;

//         if (!propertyId) {
//             console.error("Property ID is missing.");
//             return;
//         }

//         navigate(`/properties/${propertyId}`);
//     }

//     if (loading) {
//         return (
//             <Box
//                 sx={{
//                     display: "flex",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     py: 8,
//                 }}
//             >
//                 <CircularProgress sx={{ color: "#059669" }} />
//             </Box>
//         );
//     }

//     return (
//         <Box sx={{ width: "100%" , p: 10}}>
//             {/* Header */}
//             <Box sx={{ mb: 3 }}>
//                 <Typography
//                     variant="h5"
//                     sx={{
//                         fontWeight: 900,
//                         color: "#0f172a",
//                     }}
//                 >
//                     Saved Properties
//                 </Typography>

//                 <Typography
//                     variant="body2"
//                     sx={{
//                         color: "#64748b",
//                         mt: 0.5,
//                     }}
//                 >
//                     Properties you have saved for later.
//                 </Typography>
//             </Box>

//             {/* Error */}
//             {error && (
//                 <Alert
//                     severity="error"
//                     sx={{ mb: 3, borderRadius: 2 }}
//                     action={
//                         <Button
//                             color="inherit"
//                             size="small"
//                             onClick={fetchSavedProperties}
//                         >
//                             Retry
//                         </Button>
//                     }
//                 >
//                     {error}
//                 </Alert>
//             )}

//             {/* Empty State */}
//             {!error && properties.length === 0 && (
//                 <Box
//                     sx={{
//                         textAlign: "center",
//                         py: 8,
//                         px: 3,
//                         border: "1px dashed #cbd5e1",
//                         borderRadius: 3,
//                         bgcolor: "#f8fafc",
//                     }}
//                 >
//                     <BookmarkRemove
//                         sx={{
//                             fontSize: 48,
//                             color: "#94a3b8",
//                             mb: 1,
//                         }}
//                     />

//                     <Typography
//                         variant="h6"
//                         sx={{
//                             fontWeight: 800,
//                             color: "#0f172a",
//                         }}
//                     >
//                         No saved properties yet
//                     </Typography>

//                     <Typography
//                         variant="body2"
//                         sx={{
//                             color: "#64748b",
//                             mt: 1,
//                         }}
//                     >
//                         Save properties you like, and they will appear here.
//                     </Typography>
//                 </Box>
//             )}

//             {/* Cards */}
//             <Stack spacing={2.5}>
//                 {properties.map((savedRecord) => {
//                     const property = savedRecord.propertyId;

//                     // A deleted or unpopulated property cannot be displayed.
//                     if (!property || typeof property !== "object") {
//                         return null;
//                     }

//                     const propertyId = property._id || property.id;

//                     return (
//                         <SavedPropertyCard
//                             key={savedRecord._id || propertyId}
//                             property={property}
//                             onViewDetails={handleViewDetails}
//                             onRemove={handleRemoveSaved}
//                             removing={removingId === propertyId}
//                         />
//                     );
//                 })}
//             </Stack>
//         </Box>
//     );
// }

// import React, { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Box,
//     Typography,
//     Button,
//     Stack,
//     CircularProgress,
//     Alert,
//     Pagination,
// } from "@mui/material";
// import { BookmarkRemove } from "@mui/icons-material";

// import axiosInstance from "../api/axiosInstance";
// import SavedPropertyCard from "./SavedPropertyCard";
// import PropertyCategoryBar from "./PropertyCategoryBar";

// export default function SavedPropertiesList({ onViewDetails }) {
//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const [removingId, setRemovingId] = useState(null);

//     const [selectedCategory, setSelectedCategory] =
//         useState("All Properties");
//     const [page, setPage] = useState(1);

//     const itemsPerPage = 5;
//     const navigate = useNavigate();

//     // Fetch saved properties for the current user.
//     const fetchSavedProperties = useCallback(async () => {
//         try {
//             setLoading(true);
//             setError("");

//             const response = await axiosInstance.get("/property/saved");
//             const data = response.data;

//             const savedProperties = Array.isArray(data)
//                 ? data
//                 : data?.savedProperties || [];

//             setProperties(savedProperties);
//             setPage(1);
//         } catch (err) {
//             console.error(
//                 "Failed to fetch saved properties:",
//                 err.response?.data || err.message
//             );

//             setError(
//                 err.response?.data?.message ||
//                     "Failed to load saved properties. Please try again."
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchSavedProperties();
//     }, [fetchSavedProperties]);

//     // Extract actual property objects from saved records.
//     const validSavedRecords = properties.filter(
//         (record) =>
//             record.propertyId &&
//             typeof record.propertyId === "object"
//     );

//     const savedPropertyObjects = validSavedRecords.map(
//         (record) => record.propertyId
//     );

//     // Remove a saved record without deleting the original property.
//     const handleRemoveSaved = async (property) => {
//         const propertyId = property._id || property.id;

//         if (!propertyId || removingId) return;

//         try {
//             setRemovingId(propertyId);
//             setError("");

//             await axiosInstance.delete(
//                 `/property/unsave/${propertyId}`
//             );

//             setProperties((previous) =>
//                 previous.filter((record) => {
//                     const savedPropertyId =
//                         record.propertyId?._id ||
//                         record.propertyId?.id;

//                     return String(savedPropertyId) !== String(propertyId);
//                 })
//             );
//         } catch (err) {
//             console.error(
//                 "Failed to remove saved property:",
//                 err.response?.data || err.message
//             );

//             setError(
//                 err.response?.data?.message ||
//                     "Failed to remove this property from your saved list."
//             );
//         } finally {
//             setRemovingId(null);
//         }
//     };

//     const handleViewDetails = (property) => {
//         const propertyId = property?._id || property?.id;

//         if (!propertyId) {
//             console.error("Property ID is missing.");
//             return;
//         }

//         if (onViewDetails) {
//             onViewDetails(property);
//             return;
//         }

//         navigate(`/properties/${propertyId}`);
//     };

//     // Filter saved properties by category.
//     const filteredSavedRecords =
//         selectedCategory === "All Properties"
//             ? validSavedRecords
//             : validSavedRecords.filter((record) => {
//                   const property = record.propertyId;

//                   return (
//                       property.propertyType?.toLowerCase() ===
//                       selectedCategory.toLowerCase()
//                   );
//               });

//     const handleCategoryChange = (category) => {
//         setSelectedCategory(category);
//         setPage(1);
//     };

//     const totalPages = Math.ceil(
//         filteredSavedRecords.length / itemsPerPage
//     );

//     const displayedSavedRecords = filteredSavedRecords.slice(
//         (page - 1) * itemsPerPage,
//         page * itemsPerPage
//     );

//     if (loading) {
//         return (
//             <Box
//                 sx={{
//                     display: "flex",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     py: 8,
//                 }}
//             >
//                 <CircularProgress sx={{ color: "#059669" }} />
//             </Box>
//         );
//     }

//     return (
//         <Box
//             sx={{
//                 width: "100%",
//                 minWidth: 0,
//                 p: 10,
//                 boxSizing: "border-box",
//             }}
//         >
//             {/* Error */}
//             {error && (
//                 <Alert
//                     severity="error"
//                     sx={{ mb: 3, borderRadius: 2 }}
//                     action={
//                         <Button
//                             color="inherit"
//                             size="small"
//                             onClick={fetchSavedProperties}
//                         >
//                             Retry
//                         </Button>
//                     }
//                 >
//                     {error}
//                 </Alert>
//             )}

//             {/* Category banner */}
//             {validSavedRecords.length > 0 && (
//                 <Box sx={{ mb: 3 }}>
//                     <PropertyCategoryBar
//                         properties={savedPropertyObjects}
//                         selectedCategory={selectedCategory}
//                         onCategoryChange={handleCategoryChange}
//                     />
//                 </Box>
//             )}

//             {/* Empty state */}
//             {!error && validSavedRecords.length === 0 && (
//                 <Box
//                     sx={{
//                         textAlign: "center",
//                         py: 8,
//                         px: 3,
//                         border: "1px dashed #cbd5e1",
//                         borderRadius: 3,
//                         bgcolor: "#f8fafc",
//                     }}
//                 >
//                     <BookmarkRemove
//                         sx={{
//                             fontSize: 48,
//                             color: "#94a3b8",
//                             mb: 1,
//                         }}
//                     />

//                     <Typography
//                         variant="h6"
//                         sx={{
//                             fontWeight: 800,
//                             color: "#0f172a",
//                         }}
//                     >
//                         No saved properties yet
//                     </Typography>

//                     <Typography
//                         variant="body2"
//                         sx={{
//                             color: "#64748b",
//                             mt: 1,
//                         }}
//                     >
//                         Save properties you like, and they will appear here.
//                     </Typography>
//                 </Box>
//             )}

//             {/* No matches for selected category */}
//             {!error &&
//                 validSavedRecords.length > 0 &&
//                 filteredSavedRecords.length === 0 && (
//                     <Box
//                         sx={{
//                             py: 6,
//                             textAlign: "center",
//                             border: "1px dashed #cbd5e1",
//                             borderRadius: 3,
//                             bgcolor: "#f8fafc",
//                         }}
//                     >
//                         <Typography
//                             variant="h6"
//                             sx={{ fontWeight: 700, color: "#334155", mb: 1 }}
//                         >
//                             No saved properties in this category
//                         </Typography>

//                         <Button
//                             variant="outlined"
//                             onClick={() => handleCategoryChange("All Properties")}
//                             sx={{ textTransform: "none" }}
//                         >
//                             View all properties
//                         </Button>
//                     </Box>
//                 )}
//                         {/* Existing header — layout preserved */}
//             <Box sx={{ mb: 3 }}>
//                 <Typography
//                     variant="h5"
//                     sx={{
//                         fontWeight: 900,
//                         color: "#0f172a",
//                     }}
//                 >
//                     Saved Properties
//                 </Typography>

//                 <Typography
//                     variant="body2"
//                     sx={{
//                         color: "#64748b",
//                         mt: 0.5,
//                     }}
//                 >
//                     Properties you have saved for later.
//                 </Typography>
//             </Box>

//             {/* Existing horizontal card layout — unchanged */}
//             <Stack spacing={2.5}>
//                 {displayedSavedRecords.map((savedRecord) => {
//                     const property = savedRecord.propertyId;
//                     const propertyId = property._id || property.id;

//                     return (
//                         <SavedPropertyCard
//                             key={savedRecord._id || propertyId}
//                             property={property}
//                             onViewDetails={handleViewDetails}
//                             onRemove={handleRemoveSaved}
//                             removing={removingId === propertyId}
//                         />
//                     );
//                 })}
//             </Stack>

//             {/* Pagination */}
//             {totalPages > 1 && (
//                 <Box
//                     sx={{
//                         display: "flex",
//                         justifyContent: "center",
//                         mt: 5,
//                     }}
//                 >
//                     <Pagination
//                         count={totalPages}
//                         page={page}
//                         onChange={(event, value) => setPage(value)}
//                         color="primary"
//                         size="large"
//                         showFirstButton
//                         showLastButton
//                     />
//                 </Box>
//             )}
//         </Box>
//     );
// }

// import React, { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Box,
//     Typography,
//     Button,
//     Stack,
//     CircularProgress,
//     Alert,
//     Pagination,
// } from "@mui/material";
// import { BookmarkRemove } from "@mui/icons-material";

// import axiosInstance from "../api/axiosInstance";
// import SavedPropertyCard from "./SavedPropertyCard";
// import PropertyCategoryBar from "./PropertyCategoryBar";

// export default function SavedPropertiesList({ onViewDetails }) {
//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const [removingId, setRemovingId] = useState(null);

//     const [selectedCategory, setSelectedCategory] =
//         useState("All Properties");
//     const [page, setPage] = useState(1);

//     const itemsPerPage = 5;
//     const navigate = useNavigate();

//     // Fetch saved properties for the current user.
//     const fetchSavedProperties = useCallback(async () => {
//         try {
//             setLoading(true);
//             setError("");

//             const response = await axiosInstance.get("/property/saved");
//             const data = response.data;

//             const savedProperties = Array.isArray(data)
//                 ? data
//                 : data?.savedProperties || [];

//             setProperties(savedProperties);
//             setPage(1);
//         } catch (err) {
//             console.error(
//                 "Failed to fetch saved properties:",
//                 err.response?.data || err.message
//             );

//             setError(
//                 err.response?.data?.message ||
//                     "Failed to load saved properties. Please try again."
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchSavedProperties();
//     }, [fetchSavedProperties]);

//     // Extract valid saved property records.
//     const validSavedRecords = properties.filter(
//         (record) =>
//             record.propertyId &&
//             typeof record.propertyId === "object"
//     );

//     const savedPropertyObjects = validSavedRecords.map(
//         (record) => record.propertyId
//     );

//     // Remove a saved record without deleting the original property.
//     const handleRemoveSaved = async (property) => {
//         const propertyId = property._id || property.id;

//         if (!propertyId || removingId) return;

//         try {
//             setRemovingId(propertyId);
//             setError("");

//             await axiosInstance.delete(
//                 `/property/unsave/${propertyId}`
//             );

//             setProperties((previous) =>
//                 previous.filter((record) => {
//                     const savedPropertyId =
//                         record.propertyId?._id ||
//                         record.propertyId?.id;

//                     return (
//                         String(savedPropertyId) !== String(propertyId)
//                     );
//                 })
//             );
//         } catch (err) {
//             console.error(
//                 "Failed to remove saved property:",
//                 err.response?.data || err.message
//             );

//             setError(
//                 err.response?.data?.message ||
//                     "Failed to remove this property from your saved list."
//             );
//         } finally {
//             setRemovingId(null);
//         }
//     };

//     // Open the selected property's details.
//     const handleViewDetails = (property) => {
//         const propertyId = property?._id || property?.id;

//         if (!propertyId) {
//             console.error("Property ID is missing.");
//             return;
//         }

//         if (onViewDetails) {
//             onViewDetails(property);
//             return;
//         }

//         navigate(`/properties/${propertyId}`);
//     };

//     // Filter saved properties by category.
//     const filteredSavedRecords =
//         selectedCategory === "All Properties"
//             ? validSavedRecords
//             : validSavedRecords.filter((record) => {
//                   const property = record.propertyId;

//                   return (
//                       property.propertyType?.toLowerCase() ===
//                       selectedCategory.toLowerCase()
//                   );
//               });

//     const handleCategoryChange = (category) => {
//         setSelectedCategory(category);
//         setPage(1);
//     };

//     const handlePageChange = (event, value) => {
//         setPage(value);
//     };

//     const totalPages = Math.ceil(
//         filteredSavedRecords.length / itemsPerPage
//     );

//     const displayedSavedRecords = filteredSavedRecords.slice(
//         (page - 1) * itemsPerPage,
//         page * itemsPerPage
//     );

//     if (loading) {
//         return (
//             <Box
//                 sx={{
//                     display: "flex",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     py: 8,
//                 }}
//             >
//                 <CircularProgress sx={{ color: "#059669" }} />
//             </Box>
//         );
//     }

//     return (
//         <Box
//             sx={{
//                 width: "100%",
//                 minWidth: 0,
//                 boxSizing: "border-box",
//                 p: { xs: 2, md: 4 },
//                 scrollMarginTop: "0px",
//                 mx: "auto",
//             }}
//         >
//             {/* Page heading */}
//             <Box
//                 sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     flexWrap: "wrap",
//                     gap: 1,
//                     mb: 3,
//                 }}
//             >
//                 <Box>
//                     <Typography
//                         variant="h5"
//                         sx={{
//                             fontWeight: 900,
//                             color: "#0f172a",
//                         }}
//                     >
//                         Saved Properties
//                     </Typography>

//                     <Typography
//                         variant="body2"
//                         sx={{
//                             color: "#64748b",
//                             mt: 0.5,
//                         }}
//                     >
//                         Properties you have saved for later.
//                     </Typography>
//                 </Box>

//                 <Typography
//                     variant="body2"
//                     sx={{
//                         color: "#6b7280",
//                         fontWeight: 600,
//                     }}
//                 >
//                     {filteredSavedRecords.length}{" "}
//                     {filteredSavedRecords.length === 1
//                         ? "property"
//                         : "properties"}
//                 </Typography>
//             </Box>

//             {/* Error */}
//             {error && (
//                 <Alert
//                     severity="error"
//                     sx={{ mb: 3, borderRadius: 2 }}
//                     action={
//                         <Button
//                             color="inherit"
//                             size="small"
//                             onClick={fetchSavedProperties}
//                         >
//                             Retry
//                         </Button>
//                     }
//                 >
//                     {error}
//                 </Alert>
//             )}

//             {/* Category banner */}
//             {validSavedRecords.length > 0 && (
//                 <Box sx={{ mb: 3 }}>
//                     <PropertyCategoryBar
//                         properties={savedPropertyObjects}
//                         selectedCategory={selectedCategory}
//                         onCategoryChange={handleCategoryChange}
//                     />
//                 </Box>
//             )}

//             {/* Empty state */}
//             {!error && validSavedRecords.length === 0 && (
//                 <Box
//                     sx={{
//                         textAlign: "center",
//                         py: 8,
//                         px: 3,
//                         border: "1px dashed #cbd5e1",
//                         borderRadius: 3,
//                         bgcolor: "#f8fafc",
//                     }}
//                 >
//                     <BookmarkRemove
//                         sx={{
//                             fontSize: 48,
//                             color: "#94a3b8",
//                             mb: 1,
//                         }}
//                     />

//                     <Typography
//                         variant="h6"
//                         sx={{
//                             fontWeight: 800,
//                             color: "#0f172a",
//                         }}
//                     >
//                         No saved properties yet
//                     </Typography>

//                     <Typography
//                         variant="body2"
//                         sx={{
//                             color: "#64748b",
//                             mt: 1,
//                         }}
//                     >
//                         Save properties you like, and they will appear here.
//                     </Typography>
//                 </Box>
//             )}

//             {/* No matches for selected category */}
//             {!error &&
//                 validSavedRecords.length > 0 &&
//                 filteredSavedRecords.length === 0 && (
//                     <Box
//                         sx={{
//                             py: 6,
//                             textAlign: "center",
//                             border: "1px dashed #cbd5e1",
//                             borderRadius: 3,
//                             bgcolor: "#f8fafc",
//                         }}
//                     >
//                         <Typography
//                             variant="h6"
//                             sx={{
//                                 fontWeight: 700,
//                                 color: "#334155",
//                                 mb: 1,
//                             }}
//                         >
//                             No saved properties in this category
//                         </Typography>

//                         <Button
//                             variant="outlined"
//                             onClick={() =>
//                                 handleCategoryChange("All Properties")
//                             }
//                             sx={{ textTransform: "none" }}
//                         >
//                             View all properties
//                         </Button>
//                     </Box>
//                 )}

//             {/* Existing horizontal saved-property cards */}
//             <Stack spacing={2.5}>
//                 {displayedSavedRecords.map((savedRecord) => {
//                     const property = savedRecord.propertyId;
//                     const propertyId = property._id || property.id;

//                     return (
//                         <SavedPropertyCard
//                             key={savedRecord._id || propertyId}
//                             property={property}
//                             onViewDetails={handleViewDetails}
//                             onRemove={handleRemoveSaved}
//                             removing={removingId === propertyId}
//                         />
//                     );
//                 })}
//             </Stack>

//             {/* Pagination */}
//             {totalPages > 1 && (
//                 <Box
//                     sx={{
//                         display: "flex",
//                         justifyContent: "center",
//                         mt: 5,
//                     }}
//                 >
//                     <Pagination
//                         count={totalPages}
//                         page={page}
//                         onChange={handlePageChange}
//                         color="primary"
//                         size="large"
//                         showFirstButton
//                         showLastButton
//                     />
//                 </Box>
//             )}
//         </Box>
//     );
// }
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Pagination,
} from "@mui/material";
import { BookmarkRemove } from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";
import SavedPropertyCard from "./SavedPropertyCard";
import PropertyCategoryBar from "./PropertyCategoryBar";

export default function SavedPropertiesList({ onViewDetails }) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);

    const [selectedCategory, setSelectedCategory] =
        useState("All Properties");
    const [page, setPage] = useState(1);

    const itemsPerPage = 5;
    const navigate = useNavigate();

    // Fetch saved properties for the current user.
    const fetchSavedProperties = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get("/property/saved");
            const data = response.data;

            const savedProperties = Array.isArray(data)
                ? data
                : data?.savedProperties || [];

            setProperties(savedProperties);
            setPage(1);
        } catch (err) {
            console.error(
                "Failed to fetch saved properties:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Failed to load saved properties. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSavedProperties();
    }, [fetchSavedProperties]);

    // Extract valid saved property records.
    const validSavedRecords = properties.filter(
        (record) =>
            record.propertyId &&
            typeof record.propertyId === "object"
    );

    const savedPropertyObjects = validSavedRecords.map(
        (record) => record.propertyId
    );

    // Remove a saved record without deleting the original property.
    const handleRemoveSaved = async (property) => {
        const propertyId = property._id || property.id;

        if (!propertyId || removingId) return;

        try {
            setRemovingId(propertyId);
            setError("");

            await axiosInstance.delete(
                `/property/unsave/${propertyId}`
            );

            setProperties((previous) =>
                previous.filter((record) => {
                    const savedPropertyId =
                        record.propertyId?._id ||
                        record.propertyId?.id;

                    return (
                        String(savedPropertyId) !== String(propertyId)
                    );
                })
            );
        } catch (err) {
            console.error(
                "Failed to remove saved property:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Failed to remove this property from your saved list."
            );
        } finally {
            setRemovingId(null);
        }
    };

    // Open the selected property's details.
    const handleViewDetails = (property) => {
        const propertyId = property?._id || property?.id;

        if (!propertyId) {
            console.error("Property ID is missing.");
            return;
        }

        if (onViewDetails) {
            onViewDetails(property);
            return;
        }

        navigate(`/properties/${propertyId}`);
    };

    // Filter saved properties by category.
    const filteredSavedRecords =
        selectedCategory === "All Properties"
            ? validSavedRecords
            : validSavedRecords.filter((record) => {
                const property = record.propertyId;

                return (
                    property.propertyType?.toLowerCase() ===
                    selectedCategory.toLowerCase()
                );
            });

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const totalPages = Math.ceil(
        filteredSavedRecords.length / itemsPerPage
    );

    const displayedSavedRecords = filteredSavedRecords.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 8,
                }}
            >
                <CircularProgress sx={{ color: "#059669" }} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: { xs: 2, md: 4 },
                scrollMarginTop: "0px",
                maxWidth: "100%",
                mx: "auto",
            }}
        >
            {/* Property category filter bar */}
            {validSavedRecords.length > 0 && (
                <PropertyCategoryBar
                    properties={savedPropertyObjects}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                />
            )}

            {/* Listings heading & count matching ProfilePropertyList layout */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 3,
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "#1f2937",
                    }}
                >
                    {selectedCategory === "All Properties"
                        ? "Saved Properties"
                        : `${selectedCategory} Saved Properties`}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", fontWeight: 600 }}
                >
                    {filteredSavedRecords.length}{" "}
                    {filteredSavedRecords.length === 1
                        ? "property"
                        : "properties"}
                </Typography>
            </Box>

            {/* Error */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3, borderRadius: 2 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={fetchSavedProperties}
                        >
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Empty state (No properties saved at all) */}
            {!error && validSavedRecords.length === 0 ? (
                <Box
                    sx={{
                        py: 6,
                        textAlign: "center",
                        border: "1px dashed #d1d5db",
                        borderRadius: 3,
                        backgroundColor: "#fafafa",
                    }}
                >
                    <BookmarkRemove
                        sx={{
                            fontSize: 48,
                            color: "#94a3b8",
                            mb: 1,
                        }}
                    />

                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#374151",
                            mb: 1,
                        }}
                    >
                        No saved properties found
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#6b7280", mb: 2 }}
                    >
                        Save properties you like, and they will appear here.
                    </Typography>
                </Box>
            ) : !error && filteredSavedRecords.length === 0 ? (
                /* No matches for selected category */
                <Box
                    sx={{
                        py: 6,
                        textAlign: "center",
                        border: "1px dashed #d1d5db",
                        borderRadius: 3,
                        backgroundColor: "#fafafa",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: "#374151",
                            mb: 1,
                        }}
                    >
                        No saved properties in this category
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#6b7280", mb: 2 }}
                    >
                        You haven't saved any listings in this category yet.
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={() => handleCategoryChange("All Properties")}
                        sx={{ textTransform: "none" }}
                    >
                        View all properties
                    </Button>
                </Box>
            ) : (
                <>
                    {/* Vertical Column Stack of Horizontal Saved Property Cards */}
                    <Stack spacing={2.5}>
                        {displayedSavedRecords.map((savedRecord) => {
                            const property = savedRecord.propertyId;
                            const propertyId = property._id || property.id;

                            return (
                                <SavedPropertyCard
                                    key={savedRecord._id || propertyId}
                                    property={property}
                                    onViewDetails={handleViewDetails}
                                    onRemove={handleRemoveSaved}
                                    removing={removingId === propertyId}
                                />
                            );
                        })}
                    </Stack>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                mt: 5,
                            }}
                        >
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}