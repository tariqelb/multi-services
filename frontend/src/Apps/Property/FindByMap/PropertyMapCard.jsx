import React from "react";
import { useTranslation } from "react-i18next";

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

const isFurnishedRental = (property) => {
    return (
        String(property?.listingType || "").trim().toLowerCase() === "for rent" &&
        String(property?.furnishingStatus || "").trim().toLowerCase() === "furnished" &&
        ["room", "studio", "apartment", "villa", "house"].includes(
            String(property?.propertyType || "").trim().toLowerCase()
        )
    );
};

export default function PropertyMapCard({
    property,
    onViewDetails,
}) {
    const { t } = useTranslation();

    if (!property) return null;

    const imageUrl = getImageUrl(property);
    const furnished = isFurnishedRental(property);

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
                    alt={property.title || t("findMap.cards.property")}
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
                    {t("findMap.cards.noImage")}
                </Box>
            )}

            <Box sx={{ p: 1.5 }}>
                <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                >
                    <Typography
                        fontWeight={700}
                        fontSize="14px"
                        sx={{ mb: 0.5 }}
                    >
                        {property.title || t("findMap.cards.untitledProperty")}
                    </Typography>

                    {furnished && (
                        <Box
                            sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: 5,
                                backgroundColor: "#fff3cd",
                                color: "#a16207",
                                fontSize: "10px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {t("findMap.cards.furnished")}
                        </Box>
                    )}
                </Box>

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
                    {t(
                        `findMap.listingTypes.${String(property.listingType || "").toLowerCase().replace(/\s+/g, "")}`,
                        { defaultValue: property.listingType }
                    )}
                    {" · "}
                    {t(
                        `findMap.propertyTypes.${String(property.propertyType || "").toLowerCase()}`,
                        { defaultValue: property.propertyType }
                    )}
                </Typography>

                <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    onClick={onViewDetails}
                    sx={{ mt: 1.5 }}
                >
                    {t("findMap.cards.viewDetails")}
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

// const isFurnishedRental = (property) => {
//     return (
//         String(property?.listingType || "").trim().toLowerCase() === "for rent" &&
//         String(property?.furnishingStatus || "").trim().toLowerCase() === "furnished" &&
//         ["room", "studio", "apartment", "villa", "house"].includes(
//             String(property?.propertyType || "").trim().toLowerCase()
//         )
//     );
// };

// export default function PropertyMapCard({
//     property,
//     onViewDetails,
// }) {
//     if (!property) return null;

//     const imageUrl = getImageUrl(property);
//     const furnished = isFurnishedRental(property);

//     const formattedPrice = new Intl.NumberFormat("fr-MA").format(
//         Number(property.price || 0)
//     );

//     return (
//         <Box
//             className="property-map-card"
//             sx={{
//                 width: 250,
//                 overflow: "hidden",
//                 backgroundColor: "#fff",
//                 borderRadius: 2,
//             }}
//         >
//             {imageUrl ? (
//                 <Box
//                     component="img"
//                     src={imageUrl}
//                     alt={property.title || "Property"}
//                     className="property-map-card-image"
//                     sx={{
//                         width: "100%",
//                         height: 135,
//                         objectFit: "cover",
//                         display: "block",
//                     }}
//                 />
//             ) : (
//                 <Box
//                     className="property-map-card-placeholder"
//                     sx={{
//                         width: "100%",
//                         height: 135,
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         backgroundColor: "#f1f5f9",
//                         color: "#64748b",
//                     }}
//                 >
//                     No image available
//                 </Box>
//             )}

//             <Box sx={{ p: 1.5 }}>
//                 <Box
//                     display="flex"
//                     alignItems="center"
//                     gap={1}
//                     flexWrap="wrap"
//                 >
//                     <Typography
//                         fontWeight={700}
//                         fontSize="14px"
//                         sx={{ mb: 0.5 }}
//                     >
//                         {property.title || "Untitled property"}
//                     </Typography>

//                     {furnished && (
//                         <Box
//                             sx={{
//                                 px: 1,
//                                 py: 0.25,
//                                 borderRadius: 5,
//                                 backgroundColor: "#fff3cd",
//                                 color: "#a16207",
//                                 fontSize: "10px",
//                                 fontWeight: 700,
//                                 whiteSpace: "nowrap",
//                             }}
//                         >
//                             FURNISHED
//                         </Box>
//                     )}
//                 </Box>

//                 <Typography
//                     color="text.secondary"
//                     fontSize="12px"
//                 >
//                     {property.neighborhood
//                         ? `${property.neighborhood}, `
//                         : ""}
//                     {property.city || ""}
//                 </Typography>

//                 <Typography
//                     fontWeight={700}
//                     color="primary"
//                     fontSize="14px"
//                     sx={{ mt: 1 }}
//                 >
//                     {formattedPrice} MAD
//                 </Typography>

//                 <Typography
//                     fontSize="12px"
//                     color="text.secondary"
//                 >
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

