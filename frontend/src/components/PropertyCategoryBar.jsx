// import React from "react";
// import { Box, Button } from "@mui/material";

// const categories = [
//     "All Properties",
//     "Apartment",
//     "House",
//     "Villa",
//     "Studio",
//     "Room",
//     "Store",
//     "Office",
//     "Land",
//     "Warehouse",
// ];

// export default function PropertyCategoryBar({
//     selectedCategory = "All Properties",
//     onCategoryChange,
// }) {
//     return (
//         <Box
//             component="nav"
//             aria-label="Property Categories"
//             sx={{
//                 display: "flex",
//                 flexWrap: "nowrap",
//                 justifyContent: "center",
//                 gap: 1.5,
//                 width: "100%",
//                 minWidth: 0, // Prevents flex container collapse
//                 maxWidth: "100%",
//                 overflowX: "auto",
//                 py: 1.5,
//                 px: 0.5,
//                 mb: 3,
//                 position: "relative",
//                 zIndex: 10,
//                 // Custom smooth scrollbar styling
//                 "&::-webkit-scrollbar": {
//                     height: "6px",
//                 },
//                 "&::-webkit-scrollbar-track": {
//                     background: "#f1f5f9",
//                     borderRadius: "4px",
//                 },
//                 "&::-webkit-scrollbar-thumb": {
//                     background: "#cbd5e1",
//                     borderRadius: "4px",
//                     "&:hover": {
//                         background: "#94a3b8",
//                     },
//                 },
//             }}
//         >
//             {categories.map((category) => {
//                 const active = selectedCategory === category;

//                 return (
//                     <Button
//                         key={category}
//                         variant={active ? "contained" : "outlined"}
//                         onClick={() => onCategoryChange?.(category)}
//                         sx={{
//                             flexShrink: 0,
//                             whiteSpace: "nowrap",
//                             textTransform: "none",
//                             fontWeight: 700,
//                             fontSize: "0.9rem",
//                             borderRadius: 2.5,
//                             px: 2.5,
//                             py: 1,
//                             color: active ? "#fff" : "#334155",
//                             backgroundColor: active ? "#059669" : "#ffffff",
//                             borderColor: active ? "#059669" : "#cbd5e1",
//                             boxShadow: active ? "0 4px 12px rgba(5, 150, 105, 0.2)" : "none",
//                             transition: "all 0.2s ease",
//                             "&:hover": {
//                                 backgroundColor: active ? "#047857" : "#f8fafc",
//                                 borderColor: active ? "#047857" : "#94a3b8",
//                                 boxShadow: active ? "0 6px 16px rgba(5, 150, 105, 0.3)" : "none",
//                             },
//                         }}
//                     >
//                         {category}
//                     </Button>
//                 );
//             })}
//         </Box>
//     );
// }
import React from "react";
import { Box, Button } from "@mui/material";

const categories = [
    "All Properties",
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Store",
    "Office",
    "Land",
    "Warehouse",
];

export default function PropertyCategoryBar({
    properties = [],
    selectedCategory = "All Properties",
    onCategoryChange,
}) {
    const getCategoryCount = (category) => {
        if (category === "All Properties") {
            return properties.length;
        }

        return properties.filter(
            (property) =>
                property.propertyType?.toLowerCase() ===
                category.toLowerCase()
        ).length;
    };

    return (
        <Box
            component="nav"
            aria-label="Property Categories"
            sx={{
                display: "flex",
                flexWrap: "nowrap",
                justifyContent: "center",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                boxSizing: "border-box",
                py: 1.5,
                px: 0.5,
                mb: 3,
                position: "relative",
                zIndex: 10,
                "&::-webkit-scrollbar": {
                    height: "6px",
                },
                "&::-webkit-scrollbar-track": {
                    background: "#f1f5f9",
                    borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                    background: "#cbd5e1",
                    borderRadius: "4px",
                    "&:hover": {
                        background: "#94a3b8",
                    },
                },
            }}
        >
            {categories.map((category) => {
                const active = selectedCategory === category;
                const categoryCount = getCategoryCount(category);

                return (
                    <Button
                        key={category}
                        variant={active ? "contained" : "outlined"}
                        disableElevation
                        onClick={() => onCategoryChange?.(category)}
                        sx={{
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            borderRadius: 2.5,
                            px: 2.5,
                            py: 1,
                            color: active ? "#fff" : "#334155",
                            backgroundColor: active ? "#059669" : "#fff",
                            borderColor: active ? "#059669" : "#cbd5e1",
                            boxShadow: active
                                ? "0 4px 12px rgba(5, 150, 105, 0.2)"
                                : "none",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                backgroundColor: active
                                    ? "#047857"
                                    : "#f8fafc",
                                borderColor: active
                                    ? "#047857"
                                    : "#94a3b8",
                                boxShadow: active
                                    ? "0 6px 16px rgba(5, 150, 105, 0.3)"
                                    : "none",
                            },
                        }}
                    >
                        {category}

                        <Box
                            component="span"
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: 22,
                                height: 22,
                                px: 0.6,
                                ml: 1,
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                lineHeight: 1,
                                backgroundColor: active
                                    ? "rgba(255, 255, 255, 0.2)"
                                    : "#f1f5f9",
                                color: active ? "#fff" : "#64748b",
                            }}
                        >
                            {categoryCount}
                        </Box>
                    </Button>
                );
            })}
        </Box>
    );
}
