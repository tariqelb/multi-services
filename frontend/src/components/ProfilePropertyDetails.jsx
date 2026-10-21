
// import React, { useState, useEffect } from "react";
// import {
//     Alert,
//     Box,
//     Button,
//     Chip,
//     Divider,
//     Grid,
//     IconButton,
//     Paper,
//     Stack,
//     Typography,
//     CircularProgress,
// } from "@mui/material";
// import {
//     ArrowBack,
//     ArrowForward,
//     LocationOn,
//     HomeWork,
//     Map as MapIcon,
// } from "@mui/icons-material";
// import axiosInstance from "../api/axiosInstance";
// import SimilarProperties from "./SimilarProperties";
// import PropertyContactOwner from "./PropertyContactOwner";

// const API_URL = "http://localhost:3000";

// function getImageUrl(image) {
//     const path = typeof image === "string" ? image : image?.path;
//     if (!path) return "";
//     if (/^https?:\/\//i.test(path)) return path;
//     return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
// }

// function InfoItem({ label, value }) {
//     if (value === undefined || value === null || value === "") {
//         return null;
//     }

//     return (
//         <Box
//             sx={{
//                 bgcolor: "#f1f5f9",
//                 borderRadius: 2,
//                 p: 2,
//                 minWidth: 0,
//                 textAlign: "center",
//                 border: "1px solid #e2e8f0",
//             }}
//         >
//             <Typography
//                 sx={{
//                     fontWeight: 800,
//                     fontSize: "1.15rem",
//                     color: "#0f172a",
//                     overflowWrap: "anywhere",
//                 }}
//             >
//                 {value}
//             </Typography>

//             <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
//                 {label}
//             </Typography>
//         </Box>
//     );
// }

// // Helper function to handle status badge styles dynamically
// function getStatusStyles(status) {
//     const normalizedStatus = String(status || "").toLowerCase();

//     switch (normalizedStatus) {
//         case "available":
//         case "active":
//             return { bgcolor: "#dcfce7", color: "#15803d", label: status || "Available" };
//         case "pending":
//             return { bgcolor: "#fef9c3", color: "#a16207", label: status || "Pending" };
//         case "sold":
//         case "rented":
//         case "unavailable":
//             return { bgcolor: "#fee2e2", color: "#b91c1c", label: status || "Unavailable" };
//         default:
//             return { bgcolor: "#f1f5f9", color: "#475569", label: status };
//     }
// }

// export default function ProfilePropertyDetails({
//     property: initialProperty,
//     onBack,
//     similarProperties = [],
//     onSelectSimilar,
//     showContact = true,
// }) {
//     const [property, setProperty] = useState(initialProperty || {});
//     const [loading, setLoading] = useState(false);
//     const [fetchError, setFetchError] = useState(null);
//     const [activeImage, setActiveImage] = useState(0);

//     const propertyId = initialProperty?._id || initialProperty?.id;

//     useEffect(() => {
//         if (!propertyId) return;

//         let cancelled = false;
//         const fetchData = async () => {
//             setLoading(true);
//             setFetchError(null);
//             try {
//                 const res = await axiosInstance.get(`/property/${propertyId}`);
//                 const fetchedData = res.data.property || res.data;

//                 if (!cancelled) {
//                     setProperty(fetchedData);
//                 }
//             } catch (err) {
//                 if (!cancelled) {
//                     setFetchError(
//                         err.response?.data?.message ||
//                             err.message ||
//                             "Failed to load property details."
//                     );
//                 }
//             } finally {
//                 if (!cancelled) {
//                     setLoading(false);
//                 }
//             }
//         };

//         fetchData();
//         window.scrollTo({ top: 0, behavior: "smooth" });

//         return () => {
//             cancelled = true;
//         };
//     }, [propertyId]);

//     useEffect(() => {
//         setProperty(initialProperty || {});
//         setActiveImage(0);
//     }, [initialProperty]);

//     if (loading) {
//         return (
//             <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
//                 <CircularProgress size={48} />
//             </Box>
//         );
//     }

//     const images = (property.images || []).map(getImageUrl).filter(Boolean);
//     const title = property.title || "Property details";
//     const city = property.city || "";
//     const neighborhood = property.neighborhood || "";
//     const location = [neighborhood, city].filter(Boolean).join(", ");
//     const price = Number(property.price || 0).toLocaleString("en-US");

//     const description =
//         property.description ||
//         property.details ||
//         "No description has been provided for this property.";

//     const googleMapLink =
//         property.googleMapLink || property.mapLink || property.locationUrl;

//     const statusInfo = property.status ? getStatusStyles(property.status) : null;

//     const changeImage = (direction) => {
//         if (!images.length) return;
//         setActiveImage(
//             (current) => (current + direction + images.length) % images.length
//         );
//     };

//     return (
//         <Box
//             sx={{
//                 maxWidth: "100%",
//                 mx: "auto",
//                 px: { xs: 2, md: 4 },
//                 py: 4,
//                 bgcolor: "#f8fafc",
//                 minHeight: "calc(100vh - 64px)",
//             }}
//         >
//             <Box
//                 component="main"
//                 sx={{
//                     maxWidth: 1100,
//                     mx: "auto",
//                     px: { xs: 2, md: 4 },
//                     py: 4,
//                     bgcolor: "#f8fafc",
//                     minHeight: "calc(100vh - 64px)",
//                 }}
//             >
//                 <Button
//                     onClick={onBack}
//                     startIcon={<ArrowBack />}
//                     sx={{ mb: 3, textTransform: "none", fontWeight: 700, fontSize: "0.95rem" }}
//                 >
//                     Back to properties
//                 </Button>

//                 {fetchError && (
//                     <Alert severity="warning" sx={{ mb: 3 }}>
//                         Could not refresh full details from server ({fetchError}). Showing available card info.
//                     </Alert>
//                 )}

//                 {/* Image Gallery */}
//                 <Paper
//                     variant="outlined"
//                     sx={{
//                         borderRadius: 4,
//                         overflow: "hidden",
//                         mb: 4,
//                         boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
//                     }}
//                 >
//                     <Box
//                         sx={{
//                             height: { xs: 300, sm: 450, md: 540 },
//                             position: "relative",
//                             bgcolor: "#0f172a",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                         }}
//                     >
//                         {images.length > 0 ? (
//                             <Box
//                                 component="img"
//                                 src={images[activeImage]}
//                                 alt={title}
//                                 sx={{
//                                     width: "100%",
//                                     height: "100%",
//                                     objectFit: "cover",
//                                     transition: "transform 0.3s ease",
//                                 }}
//                             />
//                         ) : (
//                             <Stack alignItems="center" spacing={1}>
//                                 <HomeWork sx={{ fontSize: 64, color: "#94a3b8" }} />
//                                 <Typography sx={{ color: "#94a3b8" }}>
//                                     No images available
//                                 </Typography>
//                             </Stack>
//                         )}

//                         {images.length > 1 && (
//                             <>
//                                 <IconButton
//                                     aria-label="Previous image"
//                                     onClick={() => changeImage(-1)}
//                                     sx={{
//                                         position: "absolute",
//                                         left: 16,
//                                         top: "50%",
//                                         transform: "translateY(-50%)",
//                                         bgcolor: "rgba(255,255,255,0.9)",
//                                         "&:hover": { bgcolor: "white" },
//                                         boxShadow: 2,
//                                     }}
//                                 >
//                                     <ArrowBack />
//                                 </IconButton>

//                                 <IconButton
//                                     aria-label="Next image"
//                                     onClick={() => changeImage(1)}
//                                     sx={{
//                                         position: "absolute",
//                                         right: 16,
//                                         top: "50%",
//                                         transform: "translateY(-50%)",
//                                         bgcolor: "rgba(255,255,255,0.9)",
//                                         "&:hover": { bgcolor: "white" },
//                                         boxShadow: 2,
//                                     }}
//                                 >
//                                     <ArrowForward />
//                                 </IconButton>

//                                 <Chip
//                                     label={`${activeImage + 1} / ${images.length}`}
//                                     size="small"
//                                     sx={{
//                                         position: "absolute",
//                                         bottom: 16,
//                                         left: "50%",
//                                         transform: "translateX(-50%)",
//                                         bgcolor: "rgba(15,23,42,0.85)",
//                                         color: "white",
//                                         fontWeight: 700,
//                                     }}
//                                 />
//                             </>
//                         )}
//                     </Box>

//                     {images.length > 1 && (
//                         <Stack
//                             direction="row"
//                             spacing={1.5}
//                             sx={{
//                                 p: 2,
//                                 overflowX: "auto",
//                                 bgcolor: "white",
//                             }}
//                         >
//                             {images.map((src, index) => (
//                                 <Box
//                                     key={`${src}-${index}`}
//                                     component="button"
//                                     onClick={() => setActiveImage(index)}
//                                     aria-label={`View image ${index + 1}`}
//                                     sx={{
//                                         flex: "0 0 90px",
//                                         height: 68,
//                                         p: 0,
//                                         border:
//                                             index === activeImage
//                                                 ? "3px solid #059669"
//                                                 : "1px solid #cbd5e1",
//                                         borderRadius: 2,
//                                         overflow: "hidden",
//                                         cursor: "pointer",
//                                         bgcolor: "white",
//                                     }}
//                                 >
//                                     <Box
//                                         component="img"
//                                         src={src}
//                                         alt=""
//                                         sx={{
//                                             width: "100%",
//                                             height: "100%",
//                                             objectFit: "cover",
//                                             display: "block",
//                                         }}
//                                     />
//                                 </Box>
//                             ))}
//                         </Stack>
//                     )}
//                 </Paper>

//                 {/* Main Info Section */}
//                 <Paper
//                     variant="outlined"
//                     sx={{
//                         p: { xs: 3, md: 4 },
//                         borderRadius: 4,
//                         mb: 4,
//                         boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
//                     }}
//                 >

//                     <Stack
//                         display="flex"
//                         direction={{ xs: "column", sm: "row" }}
//                         justifyContent="space-between"
//                         alignItems="flex-start"
//                         spacing={5}
//                     >
//                     <div className="flex w-full flex-row items-start justify-between">
//                         <Box sx={{ textAlign: { xs: "right", sm: "right" } }}>
//                             <Typography
//                                 variant="h5"
//                                 sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}
//                             >
//                                 {title}
//                             </Typography>

//                             {location && (
//                                 <Stack
//                                     direction="row"
//                                     spacing={0.5}
//                                     alignItems="center"
//                                     justifyContent={{
//                                         xs: "flex-start",
//                                         sm: "flex-end",
//                                     }}
//                                 >
//                                     <LocationOn sx={{ fontSize: 20, color: "#059669" }} />
//                                     <Typography
//                                         variant="body1"
//                                         sx={{ color: "#475569", fontWeight: 600 }}
//                                     >
//                                         {location}
//                                     </Typography>
//                                 </Stack>
//                             )}
//                         </Box>
//                         <Box >
//                             <Typography
//                                 variant="h4"
//                                 sx={{
//                                     fontWeight: 900,
//                                     color: "#047857",
//                                     mb: 0.5,
//                                     textAlign: "right",
//                                 }}
                                
//                             >
//                                 {price} MAD
//                             </Typography>
                            
//                             <Stack direction="row" spacing={2} alignItems="center">
//                                 <Chip
//                                     label={property.listingType || "For Sale"}
//                                     size="medium"
//                                     sx={{
//                                         bgcolor: "#ecfdf5",
//                                         color: "#059669",
//                                         fontWeight: 800,
//                                         fontSize: "1rem",
//                                     }}
//                                 />

//                                 {/* Render status chip if property.status is provided */}
//                                 {statusInfo && (
//                                     <Chip
//                                         label={statusInfo.label}
//                                         size="medium"
//                                         sx={{
//                                             bgcolor: statusInfo.bgcolor,
//                                             color: statusInfo.color,
//                                             fontWeight: 800,
//                                             textTransform: "capitalize",
//                                             fontSize: "1rem",
//                                         }}
//                                     />
//                                 )}
//                             </Stack>
//                         </Box>

                        
//                     </div>
//                     </Stack>

//                     <Divider sx={{ my: 3 }} />

//                     <Grid container spacing={2}>
//                         <Grid item xs={6} sm={4}>
//                             <InfoItem label="Surface (m²)" value={property.surface} />
//                         </Grid>
//                         <Grid item xs={6} sm={4}>
//                             <InfoItem label="Rooms" value={property.rooms} />
//                         </Grid>
//                         <Grid item xs={6} sm={4}>
//                             <InfoItem label="Bathrooms" value={property.bathrooms} />
//                         </Grid>
//                         <Grid item xs={6} sm={4}>
//                             <InfoItem label="Salons" value={property.salons} />
//                         </Grid>
//                         <Grid item xs={6} sm={4}>
//                             <InfoItem label="Floor" value={property.floor} />
//                         </Grid>
//                         <Grid item xs={6} sm={4}>
//                             <InfoItem
//                                 label="Property type"
//                                 value={property.propertyType}
//                             />
//                         </Grid>
//                     </Grid>

//                     {googleMapLink && (
//                         <Box sx={{ mt: 3 }}>
//                             <Button
//                                 component="a"
//                                 href={googleMapLink}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 variant="outlined"
//                                 startIcon={<MapIcon />}
//                                 sx={{ textTransform: "none", fontWeight: 700 }}
//                             >
//                                 View location on Google Maps
//                             </Button>
//                         </Box>
//                     )}
//                 </Paper>

//                 {/* Description Section */}
//                 <Paper
//                     variant="outlined"
//                     sx={{
//                         p: { xs: 3, md: 4 },
//                         borderRadius: 4,
//                         mb: 4,
//                         boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
//                     }}
//                 >
//                     <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: "#0f172a" }}>
//                         Property description
//                     </Typography>

//                     <Typography
//                         variant="body1"
//                         sx={{
//                             color: "#334155",
//                             whiteSpace: "pre-line",
//                             lineHeight: 1.8,
//                             overflowWrap: "anywhere",
//                         }}
//                     >
//                         {description}
//                     </Typography>

//                     {property.syndicateFees != null && property.syndicateFees !== "" && (
//                         <Typography
//                             variant="body1"
//                             sx={{ mt: 3, fontWeight: 700, color: "#1e293b" }}
//                         >
//                             Syndicate fees: {Number(property.syndicateFees).toLocaleString()} MAD
//                         </Typography>
//                     )}
//                 </Paper>

//                 {/* Owner Contact Component */}
//                 {showContact && <PropertyContactOwner property={property} />}
//             </Box>

//             {/* Similar Properties Component */}
//             {similarProperties.length > 0 && (
//                 <div className="w-full">
//                     <SimilarProperties
//                         properties={similarProperties}
//                         onSelectProperty={onSelectSimilar}
//                     />
//                 </div>
//             )}
//         </Box>
//     );
// }


import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";

import {
    ArrowBack,
    ArrowForward,
    LocationOn,
    HomeWork,
    Map as MapIcon,
} from "@mui/icons-material";

import axiosInstance from "../api/axiosInstance";
import getImageUrl from "../utils/getImageUrl";
// const API_URL = "http://localhost:3000";

// function getImageUrl(image) {
//     const path = typeof image === "string" ? image : image?.path;

//     if (!path) return "";

//     if (/^https?:\/\//i.test(path)) return path;

//     return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
// }

function InfoItem({ label, value }) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return (
        <Box
            sx={{
                bgcolor: "#f1f5f9",
                borderRadius: 2,
                p: 2,
                minWidth: 0,
                textAlign: "center",
                border: "1px solid #e2e8f0",
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            <Typography
                sx={{
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "#0f172a",
                    overflowWrap: "anywhere",
                }}
            >
                {value}
            </Typography>

            <Typography
                variant="caption"
                sx={{ color: "#64748b", fontWeight: 600 }}
            >
                {label}
            </Typography>
        </Box>
    );
}

function getStatusStyles(status) {
    const normalizedStatus = String(status || "Available").toLowerCase();

    switch (normalizedStatus) {
        case "available":
        case "active":
            return {
                bgcolor: "#dcfce7",
                color: "#15803d",
                label: status || "Available",
            };

        case "pending":
            return {
                bgcolor: "#fef9c3",
                color: "#a16207",
                label: status || "Pending",
            };

        case "sold":
        case "rented":
        case "unavailable":
            return {
                bgcolor: "#fee2e2",
                color: "#b91c1c",
                label: status || "Unavailable",
            };

        case "inactive":
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
                label: status || "Inactive",
            };

        default:
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
                label: status || "Available",
            };
    }
}

export default function ProfilePropertyDetails() {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const [property, setProperty] = useState(state?.property || null);
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(!state?.property);
    const [error, setError] = useState("");

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchProperty = async () => {
            // Use the property passed through navigation when available.
            if (state?.property && String(state.property._id || state.property.id) === String(id)) {
                setProperty(state.property);
                setActiveImage(0);
                setLoading(false);
                setError("");
                return;
            }

            // Fetch the property if the page was refreshed or opened directly.
            setLoading(true);
            setError("");

            try {
                const response = await axiosInstance.get(`/property/${id}`);

                const data = response.data;
                const fetchedProperty =
                    data?.property || data?.data || data;

                if (!cancelled) {
                    setProperty(fetchedProperty);
                    setActiveImage(0);
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

        if (id) {
            fetchProperty();
        } else {
            setLoading(false);
            setError("Property ID is missing.");
        }

        return () => {
            cancelled = true;
        };
    }, [id, state]);

    const images = (property?.images || [])
        .map(getImageUrl)
        .filter(Boolean);

    const title = property?.title || "Property details";
    const city = property?.city || "";
    const neighborhood = property?.neighborhood || "";
    const location = [neighborhood, city].filter(Boolean).join(", ");

    const price = Number(property?.price || 0).toLocaleString("en-US");

    const description =
        property?.description ||
        property?.details ||
        "No description has been provided for this property.";

    const googleMapLink =
        property?.googleMapLink ||
        property?.mapLink ||
        property?.locationUrl;

    const statusInfo = getStatusStyles(property?.status);

    const changeImage = (direction) => {
        if (!images.length) return;

        setActiveImage(
            (current) =>
                (current + direction + images.length) % images.length
        );
    };

    if (loading) {
        return (
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 10,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !property) {
        return (
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    p: { xs: 2, md: 4 },
                }}
            >
                <Button
                    onClick={() => navigate("/mypublication")}
                    startIcon={<ArrowBack />}
                    sx={{
                        mb: 3,
                        textTransform: "none",
                        fontWeight: 700,
                    }}
                >
                    Back to My Publications
                </Button>

                <Alert severity="error">
                    {error || "Property not found."}
                </Alert>
            </Box>
        );
    }

    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                minWidth: 0,
                maxWidth: 1100,
                mx: "auto",
                px: { xs: 2, md: 4 },
                py: 1,
                width: "100%",
                boxSizing: "border-box",
                bgcolor: "#f8fafc",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            {/* Back to My Publications */}
            <Button
                onClick={() => navigate("/mypublication")}
                startIcon={<ArrowBack />}
                sx={{
                    mb: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                }}
            >
                Back to My Publications
            </Button>

            {/* Image Gallery */}
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    mb: 4,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                }}
            >
                <Box
                    sx={{
                        height: { xs: 300, sm: 450, md: 540 },
                        position: "relative",
                        bgcolor: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {images.length > 0 ? (
                        <Box
                            component="img"
                            src={images[activeImage]}
                            alt={title}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.3s ease",
                            }}
                        />
                    ) : (
                        <Stack alignItems="center" spacing={1}>
                            <HomeWork
                                sx={{ fontSize: 64, color: "#94a3b8" }}
                            />
                            <Typography sx={{ color: "#94a3b8" }}>
                                No images available
                            </Typography>
                        </Stack>
                    )}

                    {images.length > 1 && (
                        <>
                            <IconButton
                                aria-label="Previous image"
                                onClick={() => changeImage(-1)}
                                sx={{
                                    position: "absolute",
                                    left: 16,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    "&:hover": { bgcolor: "white" },
                                    boxShadow: 2,
                                }}
                            >
                                <ArrowBack />
                            </IconButton>

                            <IconButton
                                aria-label="Next image"
                                onClick={() => changeImage(1)}
                                sx={{
                                    position: "absolute",
                                    right: 16,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    "&:hover": { bgcolor: "white" },
                                    boxShadow: 2,
                                }}
                            >
                                <ArrowForward />
                            </IconButton>

                            <Chip
                                label={`${activeImage + 1} / ${images.length}`}
                                size="small"
                                sx={{
                                    position: "absolute",
                                    bottom: 16,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    bgcolor: "rgba(15,23,42,0.85)",
                                    color: "white",
                                    fontWeight: 700,
                                }}
                            />
                        </>
                    )}
                </Box>

                {images.length > 1 && (
                    <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                            p: 2,
                            overflowX: "auto",
                            bgcolor: "white",
                        }}
                    >
                        {images.map((src, index) => (
                            <Box
                                key={`${src}-${index}`}
                                component="button"
                                onClick={() => setActiveImage(index)}
                                aria-label={`View image ${index + 1}`}
                                sx={{
                                    flex: "0 0 90px",
                                    height: 68,
                                    p: 0,
                                    border:
                                        index === activeImage
                                            ? "3px solid #059669"
                                            : "1px solid #cbd5e1",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    bgcolor: "white",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={src}
                                    alt=""
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>

            {/* Main Property Information */}
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    mb: 4,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={3}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                color: "#0f172a",
                                mb: 1,
                                overflowWrap: "anywhere",
                            }}
                        >
                            {title}
                        </Typography>

                        {location && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                            >
                                <LocationOn
                                    sx={{ fontSize: 20, color: "#059669" }}
                                />

                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: "#475569",
                                        fontWeight: 600,
                                    }}
                                >
                                    {location}
                                </Typography>
                            </Stack>
                        )}
                    </Box>

                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 900,
                                color: "#047857",
                                mb: 0.5,
                            }}
                        >
                            {price} MAD
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            justifyContent={{
                                xs: "flex-start",
                                sm: "flex-end",
                            }}
                        >
                            <Chip
                                label={property.listingType || "For Sale"}
                                size="medium"
                                sx={{
                                    bgcolor: "#ecfdf5",
                                    color: "#059669",
                                    fontWeight: 800,
                                    fontSize: "1rem",
                                }}
                            />

                            <Chip
                                label={statusInfo.label}
                                size="medium"
                                sx={{
                                    bgcolor: statusInfo.bgcolor,
                                    color: statusInfo.color,
                                    fontWeight: 800,
                                    textTransform: "capitalize",
                                    fontSize: "1rem",
                                }}
                            />
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label="Surface (m²)"
                            value={property.surface}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label="Rooms"
                            value={property.rooms}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label="Bathrooms"
                            value={property.bathrooms}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label="Salons"
                            value={property.salons}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label="Floor"
                            value={property.floor}
                        />
                    </Grid>

                    <Grid item xs={6} sm={4}>
                        <InfoItem
                            label="Property type"
                            value={property.propertyType}
                        />
                    </Grid>
                </Grid>

                {/* Google Maps Location */}
                {googleMapLink && (
                    <Box sx={{ mt: 3 }}>
                        <Button
                            component="a"
                            href={googleMapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            startIcon={<MapIcon />}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                            }}
                        >
                            View location on Google Maps
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Property Description */}

            {/* Description Section */}
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    mb: 4,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 800,
                        mb: 2,
                        color: "#0f172a",
                    }}
                >
                    Property description
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: "#334155",
                        whiteSpace: "pre-line",
                        lineHeight: 1.8,
                        overflowWrap: "anywhere",
                    }}
                >
                    {description}
                </Typography>

                {/* Syndicate Fees */}
                {property.syndicateFees != null &&
                    property.syndicateFees !== "" && (
                        <Typography
                            variant="body1"
                            sx={{
                                mt: 3,
                                fontWeight: 700,
                                color: "#1e293b",
                            }}
                        >
                            Syndicate fees:{" "}
                            {Number(
                                property.syndicateFees
                            ).toLocaleString("en-US")} MAD
                        </Typography>
                    )}

                {/* Rental Information */}
                {property.listingType === "For Rent" && (
                    <>
                        <Divider sx={{ my: 3 }} />

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                color: "#0f172a",
                            }}
                        >
                            Rental Information
                        </Typography>

                        <Grid container spacing={2}>
                            {property.rentWithContract != null && (
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        label="Rental contract"
                                        value={
                                            property.rentWithContract
                                                ? "Contract available"
                                                : "No contract"
                                        }
                                    />
                                </Grid>
                            )}

                            {property.mortgageAgreement != null && (
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        label="Mortgage agreement"
                                        value={
                                            property.mortgageAgreement
                                                ? "Accepted"
                                                : "Not accepted"
                                        }
                                    />
                                </Grid>
                            )}

                            {property.deposit != null &&
                                property.deposit !== "" && (
                                    <Grid item xs={12} sm={6}>
                                        <InfoItem
                                            label="Security deposit"
                                            value={`${Number(
                                                property.deposit
                                            ).toLocaleString("en-US")} MAD`}
                                        />
                                    </Grid>
                                )}

                            {property.mediatorFee != null &&
                                property.mediatorFee !== "" && (
                                    <Grid item xs={12} sm={6}>
                                        <InfoItem
                                            label="Mediator fee"
                                            value={`${Number(
                                                property.mediatorFee
                                            ).toLocaleString("en-US")} MAD`}
                                        />
                                    </Grid>
                                )}
                        </Grid>
                    </>
                )}
            </Paper>

        </Box>
    );
}
