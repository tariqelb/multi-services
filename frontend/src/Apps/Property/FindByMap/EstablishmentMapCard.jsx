import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Button,
    Typography,
} from "@mui/material";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api\/?$/, "");

function getEstablishmentImage(establishment) {
    const image =
        establishment.media?.coverPhoto ||
        establishment.media?.gallery?.[0];

    if (!image) return null;

    const path = image.path || image;

    if (typeof path !== "string") return null;

    if (/^https?:\/\//i.test(path)) return path;

    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function EstablishmentMapCard({
    establishment,
    onViewDetails,
}) {
    const { t } = useTranslation();

    if (!establishment) return null;

    const imageUrl = getEstablishmentImage(establishment);

    const city = establishment.location?.city || "";
    const neighborhood = establishment.location?.neighborhood || "";

    const lowestRoomPrice = Array.isArray(establishment.rooms)
        ? establishment.rooms
            .map((room) => Number(room.pricePerNight))
            .filter((price) => Number.isFinite(price) && price >= 0)
            .sort((a, b) => a - b)[0]
        : null;

    const formattedPrice =
        lowestRoomPrice !== undefined && lowestRoomPrice !== null
            ? new Intl.NumberFormat("fr-MA").format(lowestRoomPrice)
            : null;

    return (
        <Box
            className="establishment-map-card"
            sx={{
                width: 250,
                overflow: "hidden",
                backgroundColor: "#fff",
                borderRadius: 2,
                color: "#1f2937",
            }}
        >
            {imageUrl ? (
                <Box
                    component="img"
                    src={imageUrl}
                    alt={establishment.name || t("findMap.cards.establishment")}
                    sx={{
                        width: "100%",
                        height: 135,
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : (
                <Box
                    sx={{
                        width: "100%",
                        height: 135,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                        fontSize: 13,
                    }}
                >
                    {t("findMap.cards.noImage")}
                </Box>
            )}

            <Box sx={{ p: 1.5 }}>
                <Typography
                    fontWeight={700}
                    fontSize={14}
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                    }}
                >
                    {establishment.name || t("findMap.cards.unnamedEstablishment")}
                </Typography>

                <Box
                    sx={{
                        display: "inline-block",
                        mt: 0.75,
                        px: 1,
                        py: 0.35,
                        borderRadius: 5,
                        backgroundColor: "#f3e8ff",
                        color: "#7e22ce",
                        fontSize: 10,
                        fontWeight: 700,
                    }}
                >
                    {establishment.accommodationType
                        ? t(
                            `findMap.accommodationTypes.${establishment.accommodationType.toLowerCase()}`,
                            { defaultValue: establishment.accommodationType }
                        )
                        : t("findMap.cards.accommodation")}
                </Box>

                <Typography
                    color="text.secondary"
                    fontSize={12}
                    sx={{ mt: 0.75 }}
                >
                    {neighborhood ? `${neighborhood}, ` : ""}
                    {city}
                </Typography>

                {formattedPrice !== null && (
                    <Typography
                        fontWeight={700}
                        color="secondary"
                        fontSize={14}
                        sx={{ mt: 1 }}
                    >
                        {t("findMap.cards.fromPrice", {
                            price: formattedPrice,
                        })}
                    </Typography>
                )}

                {establishment.shortDescription && (
                    <Typography
                        color="text.secondary"
                        fontSize={12}
                        sx={{
                            mt: 0.75,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {establishment.shortDescription}
                    </Typography>
                )}

                <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={onViewDetails}
                    sx={{ mt: 1.5 }}
                >
                    {t("findMap.cards.viewEstablishment")}
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

// const API_BASE_URL = (
//     import.meta.env.VITE_API_URL || "http://localhost:3000/api"
// ).replace(/\/api\/?$/, "");

// function getEstablishmentImage(establishment) {
//     const image =
//         establishment.media?.coverPhoto ||
//         establishment.media?.gallery?.[0];

//     if (!image) return null;

//     const path = image.path || image;

//     if (typeof path !== "string") return null;

//     if (/^https?:\/\//i.test(path)) return path;

//     return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
// }

// export default function EstablishmentMapCard({
//     establishment,
//     onViewDetails,
// }) {
//     if (!establishment) return null;

//     const imageUrl = getEstablishmentImage(establishment);

//     const city = establishment.location?.city || "";
//     const neighborhood = establishment.location?.neighborhood || "";

//     const lowestRoomPrice = Array.isArray(establishment.rooms)
//         ? establishment.rooms
//             .map((room) => Number(room.pricePerNight))
//             .filter((price) => Number.isFinite(price) && price >= 0)
//             .sort((a, b) => a - b)[0]
//         : null;

//     const formattedPrice =
//         lowestRoomPrice !== undefined && lowestRoomPrice !== null
//             ? new Intl.NumberFormat("fr-MA").format(lowestRoomPrice)
//             : null;

//     return (
//         <Box
//             className="establishment-map-card"
//             sx={{
//                 width: 250,
//                 overflow: "hidden",
//                 backgroundColor: "#fff",
//                 borderRadius: 2,
//                 color: "#1f2937",
//             }}
//         >
//             {imageUrl ? (
//                 <Box
//                     component="img"
//                     src={imageUrl}
//                     alt={establishment.name || "Establishment"}
//                     sx={{
//                         width: "100%",
//                         height: 135,
//                         objectFit: "cover",
//                         display: "block",
//                     }}
//                 />
//             ) : (
//                 <Box
//                     sx={{
//                         width: "100%",
//                         height: 135,
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         backgroundColor: "#f1f5f9",
//                         color: "#64748b",
//                         fontSize: 13,
//                     }}
//                 >
//                     No image available
//                 </Box>
//             )}

//             <Box sx={{ p: 1.5 }}>
//                 <Typography
//                     fontWeight={700}
//                     fontSize={14}
//                     sx={{
//                         overflow: "hidden",
//                         textOverflow: "ellipsis",
//                         display: "-webkit-box",
//                         WebkitLineClamp: 2,
//                         WebkitBoxOrient: "vertical",
//                     }}
//                 >
//                     {establishment.name || "Unnamed establishment"}
//                 </Typography>

//                 <Box
//                     sx={{
//                         display: "inline-block",
//                         mt: 0.75,
//                         px: 1,
//                         py: 0.35,
//                         borderRadius: 5,
//                         backgroundColor: "#f3e8ff",
//                         color: "#7e22ce",
//                         fontSize: 10,
//                         fontWeight: 700,
//                     }}
//                 >
//                     {establishment.accommodationType || "Accommodation"}
//                 </Box>

//                 <Typography
//                     color="text.secondary"
//                     fontSize={12}
//                     sx={{ mt: 0.75 }}
//                 >
//                     {neighborhood ? `${neighborhood}, ` : ""}
//                     {city}
//                 </Typography>

//                 {formattedPrice !== null && (
//                     <Typography
//                         fontWeight={700}
//                         color="secondary"
//                         fontSize={14}
//                         sx={{ mt: 1 }}
//                     >
//                         From {formattedPrice} MAD / night
//                     </Typography>
//                 )}

//                 {establishment.shortDescription && (
//                     <Typography
//                         color="text.secondary"
//                         fontSize={12}
//                         sx={{
//                             mt: 0.75,
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             display: "-webkit-box",
//                             WebkitLineClamp: 2,
//                             WebkitBoxOrient: "vertical",
//                         }}
//                     >
//                         {establishment.shortDescription}
//                     </Typography>
//                 )}

//                 <Button
//                     fullWidth
//                     size="small"
//                     variant="contained"
//                     color="secondary"
//                     onClick={onViewDetails}
//                     sx={{ mt: 1.5 }}
//                 >
//                     View establishment
//                 </Button>
//             </Box>
//         </Box>
//     );
// }
