
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

function getImageUrl(roommate) {
    const image =
        roommate?.images?.[0] ||
        roommate?.photos?.[0] ||
        roommate?.media?.coverPhoto ||
        roommate?.coverPhoto ||
        roommate?.image ||
        roommate?.photo;

    if (!image) return null;

    const path =
        typeof image === "string"
            ? image
            : image.path || image.url || image.filename;

    if (!path || typeof path !== "string") return null;

    if (
        path.startsWith("http://") ||
        path.startsWith("https://") ||
        path.startsWith("data:")
    ) {
        return path;
    }

    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function RoommateMapCard({
    roommate,
    onViewDetails,
}) {
    const { t } = useTranslation();

    if (!roommate) return null;

    const imageUrl = getImageUrl(roommate);

    const price = Number(
        roommate.rentPerPerson ??
        roommate.individualRoomPrice ??
        roommate.totalRent
    );

    const formattedPrice = Number.isFinite(price)
        ? new Intl.NumberFormat("fr-MA").format(price)
        : null;

    const availablePlaces =
        roommate.availablePlaces ??
        Math.max(
            0,
            Number(roommate.totalPeople || 0) -
            Number(roommate.currentPeople || 0)
        );

    return (
        <Box
            sx={{
                width: 250,
                overflow: "hidden",
                backgroundColor: "#fff",
                borderRadius: 2,
                color: "#1f2937",
            }}
        >
            {imageUrl && (
                <Box
                    component="img"
                    src={imageUrl}
                    alt={roommate.title || t("findMap.cards.roommateAnnouncement")}
                    onError={(event) => {
                        event.currentTarget.style.display = "none";
                    }}
                    sx={{
                        width: "100%",
                        height: 135,
                        display: "block",
                        objectFit: "cover",
                    }}
                />
            )}

            <Box sx={{ p: 1.5 }}>
                <Typography fontWeight={700} fontSize={14}>
                    {roommate.title || t("findMap.cards.roommateAnnouncement")}
                </Typography>

                <Typography
                    color="text.secondary"
                    fontSize={12}
                    sx={{ mt: 0.5 }}
                >
                    {roommate.neighborhood
                        ? `${roommate.neighborhood}, `
                        : ""}
                    {roommate.city || ""}
                </Typography>

                {roommate.purpose && (
                    <Typography
                        fontSize={12}
                        sx={{ mt: 1 }}
                    >
                        {roommate.purpose}
                    </Typography>
                )}

                {formattedPrice !== null && (
                    <Typography
                        fontWeight={700}
                        color="success.main"
                        fontSize={14}
                        sx={{ mt: 1 }}
                    >
                        {formattedPrice} MAD
                        {roommate.rentalPeriod
                            ? ` / ${t(
                                `findMap.rentalPeriods.${String(roommate.rentalPeriod).toLowerCase()}`,
                                { defaultValue: roommate.rentalPeriod }
                            )}`
                            : ""}
                    </Typography>
                )}

                <Typography
                    color="text.secondary"
                    fontSize={12}
                    sx={{ mt: 0.5 }}
                >
                    {t("findMap.cards.availablePlaces", {
                        count: availablePlaces,
                    })}
                </Typography>

                <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={onViewDetails}
                    sx={{ mt: 1.5 }}
                >
                    {t("findMap.cards.viewAnnouncement")}
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

// function getImageUrl(roommate) {
//     const image =
//         roommate?.images?.[0] ||
//         roommate?.photos?.[0] ||
//         roommate?.media?.coverPhoto ||
//         roommate?.coverPhoto ||
//         roommate?.image ||
//         roommate?.photo;

//     if (!image) return null;

//     const path =
//         typeof image === "string"
//             ? image
//             : image.path || image.url || image.filename;

//     if (!path || typeof path !== "string") return null;

//     if (
//         path.startsWith("http://") ||
//         path.startsWith("https://") ||
//         path.startsWith("data:")
//     ) {
//         return path;
//     }

//     return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
// }

// export default function RoommateMapCard({
//     roommate,
//     onViewDetails,
// }) {
//     if (!roommate) return null;

//     const imageUrl = getImageUrl(roommate);

//     const price = Number(
//         roommate.rentPerPerson ??
//         roommate.individualRoomPrice ??
//         roommate.totalRent
//     );

//     const formattedPrice = Number.isFinite(price)
//         ? new Intl.NumberFormat("fr-MA").format(price)
//         : null;

//     const availablePlaces =
//         roommate.availablePlaces ??
//         Math.max(
//             0,
//             Number(roommate.totalPeople || 0) -
//             Number(roommate.currentPeople || 0)
//         );

//     return (
//         <Box
//             sx={{
//                 width: 250,
//                 overflow: "hidden",
//                 backgroundColor: "#fff",
//                 borderRadius: 2,
//                 color: "#1f2937",
//             }}
//         >
//             {imageUrl && (
//                 <Box
//                     component="img"
//                     src={imageUrl}
//                     alt={roommate.title || "Roommate announcement"}
//                     onError={(event) => {
//                         event.currentTarget.style.display = "none";
//                     }}
//                     sx={{
//                         width: "100%",
//                         height: 135,
//                         display: "block",
//                         objectFit: "cover",
//                     }}
//                 />
//             )}

//             <Box sx={{ p: 1.5 }}>
//                 <Typography fontWeight={700} fontSize={14}>
//                     {roommate.title || "Roommate announcement"}
//                 </Typography>

//                 <Typography
//                     color="text.secondary"
//                     fontSize={12}
//                     sx={{ mt: 0.5 }}
//                 >
//                     {roommate.neighborhood
//                         ? `${roommate.neighborhood}, `
//                         : ""}
//                     {roommate.city || ""}
//                 </Typography>

//                 {roommate.purpose && (
//                     <Typography
//                         fontSize={12}
//                         sx={{ mt: 1 }}
//                     >
//                         {roommate.purpose}
//                     </Typography>
//                 )}

//                 {formattedPrice !== null && (
//                     <Typography
//                         fontWeight={700}
//                         color="success.main"
//                         fontSize={14}
//                         sx={{ mt: 1 }}
//                     >
//                         {formattedPrice} MAD
//                         {roommate.rentalPeriod
//                             ? ` / ${roommate.rentalPeriod}`
//                             : ""}
//                     </Typography>
//                 )}

//                 <Typography
//                     color="text.secondary"
//                     fontSize={12}
//                     sx={{ mt: 0.5 }}
//                 >
//                     {availablePlaces} places available
//                 </Typography>

//                 <Button
//                     fullWidth
//                     size="small"
//                     variant="contained"
//                     color="success"
//                     onClick={onViewDetails}
//                     sx={{ mt: 1.5 }}
//                 >
//                     View announcement
//                 </Button>
//             </Box>
//         </Box>
//     );
// }
