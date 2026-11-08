
import React from "react";

import {
    Box,
    Button,
    Typography,
} from "@mui/material";

const API_BASE_URL = "http://localhost:3000";

function getImageUrl(property) {
    const image = property.images?.[0];

    if (!image) return null;

    const path = image.path || image;

    if (typeof path !== "string") return null;

    if (path.startsWith("http")) return path;

    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function PropertyMapCard({
    property,
    onViewDetails,
}) {
    if (!property) return null;

    const imageUrl = getImageUrl(property);

    const formattedPrice = new Intl.NumberFormat("fr-MA").format(
        Number(property.price || 0)
    );

    return (
        <Box
            className="property-map-card"
            sx={{
                width: 250,
                overflow: "hidden",
                backgroundColor: "#fff",
                borderRadius: 2,
            }}
        >
            {imageUrl ? (
                <Box
                    component="img"
                    src={imageUrl}
                    alt={property.title || "Property"}
                    className="property-map-card-image"
                    sx={{
                        width: "100%",
                        height: 135,
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : (
                <Box
                    className="property-map-card-placeholder"
                    sx={{
                        width: "100%",
                        height: 135,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                    }}
                >
                    No image available
                </Box>
            )}

            <Box sx={{ p: 1.5 }}>
                <Typography
                    fontWeight={700}
                    fontSize="14px"
                    sx={{ mb: 0.5 }}
                >
                    {property.title || "Untitled property"}
                </Typography>

                <Typography
                    color="text.secondary"
                    fontSize="12px"
                >
                    {property.neighborhood
                        ? `${property.neighborhood}, `
                        : ""}
                    {property.city || ""}
                </Typography>

                <Typography
                    fontWeight={700}
                    color="primary"
                    fontSize="14px"
                    sx={{ mt: 1 }}
                >
                    {formattedPrice} MAD
                </Typography>

                <Typography
                    fontSize="12px"
                    color="text.secondary"
                >
                    {property.listingType} · {property.propertyType}
                </Typography>

                <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    onClick={onViewDetails}
                    sx={{ mt: 1.5 }}
                >
                    View details
                </Button>
            </Box>
        </Box>
    );
}

// import React from "react";

// import {
//     Box,
//     Button,
//     Typography,
// } from "@mui/material";

// const API_BASE_URL = "http://localhost:3000";

// function getImageUrl(property) {
//     const image = property.images?.[0];

//     if (!image) return null;

//     const path = image.path || image;

//     if (typeof path !== "string") return null;

//     if (path.startsWith("http")) return path;

//     return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
// }

// export default function PropertyMapCard({
//     property,
//     onViewDetails,
// }) {
//     const imageUrl = getImageUrl(property);

//     const formattedPrice = new Intl.NumberFormat("fr-MA").format(
//         Number(property.price || 0)
//     );

//     return (
//         <Box className="property-map-card">
//             {imageUrl ? (
//                 <Box
//                     component="img"
//                     src={imageUrl}
//                     alt={property.title}
//                     className="property-map-card-image"
//                 />
//             ) : (
//                 <Box className="property-map-card-placeholder">
//                     No image
//                 </Box>
//             )}

//             <Box sx={{ p: 1.5 }}>
//                 <Typography
//                     fontWeight={700}
//                     fontSize="14px"
//                     sx={{ mb: 0.5 }}
//                 >
//                     {property.title}
//                 </Typography>

//                 <Typography
//                     color="text.secondary"
//                     fontSize="12px"
//                 >
//                     {property.neighborhood
//                         ? `${property.neighborhood}, `
//                         : ""}
//                     {property.city}
//                 </Typography>

//                 <Typography
//                     fontWeight={700}
//                     color="primary"
//                     fontSize="14px"
//                     sx={{ mt: 1 }}
//                 >
//                     {formattedPrice} MAD
//                 </Typography>

//                 <Typography fontSize="12px" color="text.secondary">
//                     {property.listingType} · {property.propertyType}
//                 </Typography>

//                 <Button
//                     fullWidth
//                     size="small"
//                     variant="contained"
//                     onClick={onViewDetails}
//                     sx={{ mt: 1.5 }}
//                 >
//                     View details
//                 </Button>
//             </Box>
//         </Box>
//     );
// }
