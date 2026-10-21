
// import React, { useState, useEffect } from "react";
// import {
//     Box,
//     Button,
//     Chip,
//     Divider,
//     Grid,
//     IconButton,
//     Paper,
//     Stack,
//     Typography,
// } from "@mui/material";
// import {
//     Bookmark,
//     BookmarkAdded,
// } from "@mui/icons-material";
// import {
//     ArrowBack,
//     ArrowForward,
//     LocationOn,
//     HomeWork,
//     Map as MapIcon,
// } from "@mui/icons-material";
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

// export default function PropertyDetails({
//     property: initialProperty,
//     onBack,
//     similarProperties = [],
//     onSelectSimilar,
//     showContact = true,
//     onSaveProperty,
//     isSaved = false,
// }) {
//     const [property, setProperty] = useState(initialProperty || {});
//     const [activeImage, setActiveImage] = useState(0);
//     const [saved, setSaved] = useState(isSaved);
//     const [saving, setSaving] = useState(false);

    
//     useEffect(() => {
//         setSaved(Boolean(isSaved));
//     }, [isSaved, initialProperty?._id, initialProperty?.id]);


//     useEffect(() => {
//         setProperty(initialProperty || {});
//         setActiveImage(0);
//         window.scrollTo({ top: 0, behavior: "smooth" });
//     }, [initialProperty]);

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
//             component="main"
//             sx={{
//                 maxWidth: 1100,
//                 mx: "auto",
//                 px: { xs: 2, md: 4 },
//                 py: 4,
//                 width: "100%",
//                 bgcolor: "#f8fafc",
//                 minHeight: "calc(100vh - 64px)",
//             }}
//         >
//             <Button
//                 onClick={onBack}
//                 startIcon={<ArrowBack />}
//                 sx={{ mb: 3, textTransform: "none", fontWeight: 700, fontSize: "0.95rem" }}
//             >
//                 Back to properties
//             </Button>

//             {/* Image Gallery */}
//             <Paper
//                 variant="outlined"
//                 sx={{
//                     borderRadius: 4,
//                     overflow: "hidden",
//                     mb: 4,
//                     boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
//                 }}
//             >
//                 <Box
//                     sx={{
//                         height: { xs: 300, sm: 450, md: 540 },
//                         position: "relative",
//                         bgcolor: "#0f172a",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                     }}
//                 >
//                     {images.length > 0 ? (
//                         <Box
//                             component="img"
//                             src={images[activeImage]}
//                             alt={title}
//                             sx={{
//                                 width: "100%",
//                                 height: "100%",
//                                 objectFit: "cover",
//                                 transition: "transform 0.3s ease",
//                             }}
//                         />
//                     ) : (
//                         <Stack alignItems="center" spacing={1}>
//                             <HomeWork sx={{ fontSize: 64, color: "#94a3b8" }} />
//                             <Typography sx={{ color: "#94a3b8" }}>
//                                 No images available
//                             </Typography>
//                         </Stack>
//                     )}

//                     {images.length > 1 && (
//                         <>
//                             <IconButton
//                                 aria-label="Previous image"
//                                 onClick={() => changeImage(-1)}
//                                 sx={{
//                                     position: "absolute",
//                                     left: 16,
//                                     top: "50%",
//                                     transform: "translateY(-50%)",
//                                     bgcolor: "rgba(255,255,255,0.9)",
//                                     "&:hover": { bgcolor: "white" },
//                                     boxShadow: 2,
//                                 }}
//                             >
//                                 <ArrowBack />
//                             </IconButton>

//                             <IconButton
//                                 aria-label="Next image"
//                                 onClick={() => changeImage(1)}
//                                 sx={{
//                                     position: "absolute",
//                                     right: 16,
//                                     top: "50%",
//                                     transform: "translateY(-50%)",
//                                     bgcolor: "rgba(255,255,255,0.9)",
//                                     "&:hover": { bgcolor: "white" },
//                                     boxShadow: 2,
//                                 }}
//                             >
//                                 <ArrowForward />
//                             </IconButton>

//                             <Chip
//                                 label={`${activeImage + 1} / ${images.length}`}
//                                 size="small"
//                                 sx={{
//                                     position: "absolute",
//                                     bottom: 16,
//                                     left: "50%",
//                                     transform: "translateX(-50%)",
//                                     bgcolor: "rgba(15,23,42,0.85)",
//                                     color: "white",
//                                     fontWeight: 700,
//                                 }}
//                             />
//                         </>
//                     )}
//                 </Box>

//                 {images.length > 1 && (
//                     <Stack
//                         direction="row"
//                         spacing={1.5}
//                         sx={{
//                             p: 2,
//                             overflowX: "auto",
//                             bgcolor: "white",
//                         }}
//                     >
//                         {images.map((src, index) => (
//                             <Box
//                                 key={`${src}-${index}`}
//                                 component="button"
//                                 onClick={() => setActiveImage(index)}
//                                 aria-label={`View image ${index + 1}`}
//                                 sx={{
//                                     flex: "0 0 90px",
//                                     height: 68,
//                                     p: 0,
//                                     border:
//                                         index === activeImage
//                                             ? "3px solid #059669"
//                                             : "1px solid #cbd5e1",
//                                     borderRadius: 2,
//                                     overflow: "hidden",
//                                     cursor: "pointer",
//                                     bgcolor: "white",
//                                 }}
//                             >
//                                 <Box
//                                     component="img"
//                                     src={src}
//                                     alt=""
//                                     sx={{
//                                         width: "100%",
//                                         height: "100%",
//                                         objectFit: "cover",
//                                         display: "block",
//                                     }}
//                                 />
//                             </Box>
//                         ))}
//                     </Stack>
//                 )}
//             </Paper>

//             {/* Main Info Section */}
//             <Paper
//                 variant="outlined"
//                 sx={{
//                     p: { xs: 3, md: 4 },
//                     borderRadius: 4,
//                     mb: 4,
//                     boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
//                 }}
//             >
//                 <Stack
//                     direction={{ xs: "column", sm: "row" }}
//                     justifyContent="space-between"
//                     alignItems="flex-start"
//                     spacing={3}
//                 >
//                     <Box>
//                         <Typography
//                             variant="h5"
//                             sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}
//                         >
//                             {title}
//                         </Typography>

//                         {location && (
//                             <Stack direction="row" spacing={0.5} alignItems="center">
//                                 <LocationOn sx={{ fontSize: 20, color: "#059669" }} />
//                                 <Typography
//                                     variant="body1"
//                                     sx={{ color: "#475569", fontWeight: 600 }}
//                                 >
//                                     {location}
//                                 </Typography>
//                             </Stack>
//                         )}
//                     </Box>

//                     <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
//                         <Typography
//                             variant="h4"
//                             sx={{
//                                 fontWeight: 900,
//                                 color: "#047857",
//                                 mb: 0.5,
//                             }}
//                         >
//                             {price} MAD
//                         </Typography>

//                         <Stack
//                             direction="row"
//                             spacing={2}
//                             alignItems="center"
//                             justifyContent={{ xs: "flex-start", sm: "flex-end" }}
//                         >
//                             <Chip
//                                 label={property.listingType || "For Sale"}
//                                 size="medium"
//                                 sx={{
//                                     bgcolor: "#ecfdf5",
//                                     color: "#059669",
//                                     fontWeight: 800,
//                                     fontSize: "1rem",
//                                 }}
//                             />

//                             {statusInfo && (
//                                 <Chip
//                                     label={statusInfo.label}
//                                     size="medium"
//                                     sx={{
//                                         bgcolor: statusInfo.bgcolor,
//                                         color: statusInfo.color,
//                                         fontWeight: 800,
//                                         textTransform: "capitalize",
//                                         fontSize: "1rem",
//                                     }}
//                                 />
//                             )}
//                         </Stack>
//                     </Box>
//                 </Stack>

//                 <Divider sx={{ my: 3 }} />

//                 <Grid container spacing={2}>
//                     <Grid item xs={6} sm={4}>
//                         <InfoItem label="Surface (m²)" value={property.surface} />
//                     </Grid>
//                     <Grid item xs={6} sm={4}>
//                         <InfoItem label="Rooms" value={property.rooms} />
//                     </Grid>
//                     <Grid item xs={6} sm={4}>
//                         <InfoItem label="Bathrooms" value={property.bathrooms} />
//                     </Grid>
//                     <Grid item xs={6} sm={4}>
//                         <InfoItem label="Salons" value={property.salons} />
//                     </Grid>
//                     <Grid item xs={6} sm={4}>
//                         <InfoItem label="Floor" value={property.floor} />
//                     </Grid>
//                     <Grid item xs={6} sm={4}>
//                         <InfoItem
//                             label="Property type"
//                             value={property.propertyType}
//                         />
//                     </Grid>
//                 </Grid>
                
//                 <Box
//                     sx={{
//                         display: "flex",
//                         flexDirection: { xs: "column", sm: "row" },
//                         justifyContent: "space-between",
//                         alignItems: { xs: "flex-start", sm: "center" },
//                         gap: 2,
//                         width: "100%",
//                     }}
//                 >
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

//                     <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
//                         <Button
//                             variant={saved ? "contained" : "outlined"}
//                             color={saved ? "success" : "inherit"}
//                             startIcon={saved ? <BookmarkAdded /> : <Bookmark />}
//                             disabled={saving || !onSaveProperty}
//                             onClick={async () => {
//                                 const id = property._id || property.id;

//                                 if (!id || saving || !onSaveProperty) return;

//                                 const shouldSave = !saved;

//                                 try {
//                                     setSaving(true);
//                                     await onSaveProperty(id, shouldSave);
//                                     setSaved(shouldSave);
//                                 } catch (error) {
//                                     console.error(
//                                         "Failed to update saved property:",
//                                         error.response?.data || error.message
//                                     );
//                                 } finally {
//                                     setSaving(false);
//                                 }
//                             }}
//                             sx={{
//                                 mt: 2,
//                                 textTransform: "none",
//                                 fontWeight: 700,
//                                 borderRadius: 2,
//                                 px: 2.5,
//                             }}
//                         >
//                             {saving
//                                 ? "Saving..."
//                                 : saved
//                                     ? "Saved"
//                                     : "Save Property"}
//                         </Button>
//                     </Box>
//                 </Box>

//             </Paper>

//             {/* Description Section */}
//             <Paper
//                 variant="outlined"
//                 sx={{
//                     p: { xs: 3, md: 4 },
//                     borderRadius: 4,
//                     mb: 4,
//                     boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
//                 }}
//             >
//                 <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: "#0f172a" }}>
//                     Property description
//                 </Typography>

//                 <Typography
//                     variant="body1"
//                     sx={{
//                         color: "#334155",
//                         whiteSpace: "pre-line",
//                         lineHeight: 1.8,
//                         overflowWrap: "anywhere",
//                     }}
//                 >
//                     {description}
//                 </Typography>

//                 {property.syndicateFees != null && property.syndicateFees !== "" && (
//                     <Typography
//                         variant="body1"
//                         sx={{ mt: 3, fontWeight: 700, color: "#1e293b" }}
//                     >
//                         Syndicate fees: {Number(property.syndicateFees).toLocaleString()} MAD
//                     </Typography>
//                 )}
//             </Paper>

//             {/* Owner Contact Component */}
//             {showContact && <PropertyContactOwner property={property} />}

//             {/* Similar Properties Component */}
//             {similarProperties.length > 0 && (
//                 <Box sx={{ mt: 4, width: "100%" }}>
//                     <SimilarProperties
//                         properties={similarProperties}
//                         onSelectProperty={onSelectSimilar}
//                     />
//                 </Box>
//             )}
//         </Box>
//     );
// }



import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
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
    Alert,
    Snackbar,
} from "@mui/material";
import {
    Bookmark,
    BookmarkAdded,
    ArrowBack,
    ArrowForward,
    LocationOn,
    HomeWork,
    Map as MapIcon,
} from "@mui/icons-material";
import SimilarProperties from "./SimilarProperties";
import PropertyContactOwner from "./PropertyContactOwner";
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
    const normalizedStatus = String(status || "").toLowerCase();

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

        default:
            return {
                bgcolor: "#f1f5f9",
                color: "#475569",
                label: status,
            };
    }
}

export default function PropertyDetails({
    property: initialProperty,
    onBack,
    similarProperties = [],
    onSelectSimilar,
    showContact = true,
    onSaveProperty,
    isSaved = false,
}) {
    const [property, setProperty] = useState(initialProperty || {});
    const [activeImage, setActiveImage] = useState(0);
    const [saved, setSaved] = useState(Boolean(isSaved));
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();

    const [feedback, setFeedback] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        setSaved(Boolean(isSaved));
    }, [isSaved, initialProperty?._id, initialProperty?.id]);

    useEffect(() => {
        setProperty(initialProperty || {});
        setActiveImage(0);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, [initialProperty]);

    const images = (property.images || [])
        .map(getImageUrl)
        .filter(Boolean);

    const title = property.title || "Property details";
    const city = property.city || "";
    const neighborhood = property.neighborhood || "";
    const location = [neighborhood, city].filter(Boolean).join(", ");

    const price = Number(property.price || 0).toLocaleString("en-US");

    const description =
        property.description ||
        property.details ||
        "No description has been provided for this property.";

    const googleMapLink =
        property.googleMapLink ||
        property.mapLink ||
        property.locationUrl;

    const statusInfo = property.status
        ? getStatusStyles(property.status)
        : null;

    const changeImage = (direction) => {
        if (!images.length) return;

        setActiveImage(
            (current) =>
                (current + direction + images.length) % images.length
        );
    };

    const handleSaveClick = async () => {
        const id = property._id || property.id;

        if (!id || saving) return;

        const shouldSave = !saved;

        try {
            setSaving(true);
            
            if (onSaveProperty) {
                await onSaveProperty(id, shouldSave);
            } else if (shouldSave) {
                await axiosInstance.post(`/property/save/${id}`);
            } else {
                await axiosInstance.delete(`/property/unsave/${id}`);
            }

            setSaved(shouldSave);

            setFeedback({
                open: true,
                message: shouldSave
                    ? "Property saved successfully!"
                    : "Property removed from saved properties.",
                severity: "success",
            });
        } catch (error) {
            console.error(
                "Failed to update saved property:",
                error.response?.data || error.message
            );

            setFeedback({
                open: true,
                message:
                    error.response?.data?.message ||
                    "Unable to update saved property. Please try again.",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCloseFeedback = (_, reason) => {
        if (reason === "clickaway") return;

        setFeedback((previous) => ({
            ...previous,
            open: false,
        }));
    };

    return (
        <Box
            component="main"
            sx={{
                maxWidth: 1100,
                mx: "auto",
                px: { xs: 2, md: 4 },
                py: 1,
                width: "100%",
                bgcolor: "#f8fafc",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            <Button
                //onClick={onBack}
                onClick={() => navigate(-1)}
                startIcon={<ArrowBack />}
                sx={{
                    mb: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                }}
            >
                Back to properties
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

            {/* Main Info Section */}
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
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                color: "#0f172a",
                                mb: 1,
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
                            spacing={2}
                            alignItems="center"
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

                            {statusInfo && (
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
                            )}
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

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: {
                            xs: "flex-start",
                            sm: "center",
                        },
                        gap: 2,
                        width: "100%",
                    }}
                >
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

                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={
                                saving
                                    ? null
                                    : saved
                                        ? <BookmarkAdded />
                                        : <Bookmark />
                            }
                            disabled={saving || !(property._id || property.id)}
                            onClick={handleSaveClick}
                            sx={{
                                mt: 2,
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 1,
                                px: 2,
                                py: 0.75,
                                borderColor: "#059669",
                                color: "#059669",
                                bgcolor: "transparent",
                                boxShadow: "none",
                                "&:hover": {
                                    borderColor: "#047857",
                                    bgcolor: "#ecfdf5",
                                    boxShadow: "none",
                                },
                                "&.Mui-disabled": {
                                    borderColor: "#cbd5e1",
                                    color: "#94a3b8",
                                },
                            }}
                        >
                            {saving
                                ? "Saving..."
                                : saved
                                    ? "Unsave Property"
                                    : "Save Property"}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Description Section */}

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


            {/* Owner Contact Component */}
            {showContact && (
                <PropertyContactOwner property={property} />
            )}

            {/* Similar Properties Component */}
            {similarProperties.length > 0 && (
                <Box sx={{ mt: 4, width: "100%" }}>
                    <SimilarProperties
                        properties={similarProperties}
                        onSelectProperty={onSelectSimilar}
                    />
                </Box>
            )}

            {/* Save/Unsave success and error feedback */}
            <Snackbar
                open={feedback.open}
                autoHideDuration={3500}
                onClose={handleCloseFeedback}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                <Alert
                    onClose={handleCloseFeedback}
                    severity={feedback.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {feedback.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
