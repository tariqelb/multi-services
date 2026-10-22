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
//     properties = [],
//     selectedCategory = "All Properties",
//     onCategoryChange,
// }) {
//     const getCategoryCount = (category) => {
//         if (category === "All Properties") {
//             return properties.length;
//         }

//         return properties.filter(
//             (property) =>
//                 property.propertyType?.toLowerCase() ===
//                 category.toLowerCase()
//         ).length;
//     };

//     return (
//         <Box
//             component="nav"
//             aria-label="Property Categories"
//             sx={{
//                 display: "flex",
//                 flexWrap: "nowrap",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 gap: 1.5,
//                 width: "100%",
//                 minWidth: 0,
//                 maxWidth: "100%",
//                 overflowX: "auto",
//                 overflowY: "hidden",
//                 boxSizing: "border-box",
//                 py: 1.5,
//                 px: 0.5,
//                 mb: 3,
//                 position: "relative",
//                 zIndex: 10,
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
//                 const categoryCount = getCategoryCount(category);

//                 return (
//                     <Button
//                         key={category}
//                         variant={active ? "contained" : "outlined"}
//                         disableElevation
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
//                             backgroundColor: active ? "#059669" : "#fff",
//                             borderColor: active ? "#059669" : "#cbd5e1",
//                             boxShadow: active
//                                 ? "0 4px 12px rgba(5, 150, 105, 0.2)"
//                                 : "none",
//                             transition: "all 0.2s ease",
//                             "&:hover": {
//                                 backgroundColor: active
//                                     ? "#047857"
//                                     : "#f8fafc",
//                                 borderColor: active
//                                     ? "#047857"
//                                     : "#94a3b8",
//                                 boxShadow: active
//                                     ? "0 6px 16px rgba(5, 150, 105, 0.3)"
//                                     : "none",
//                             },
//                         }}
//                     >
//                         {category}

//                         <Box
//                             component="span"
//                             sx={{
//                                 display: "inline-flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 minWidth: 22,
//                                 height: 22,
//                                 px: 0.6,
//                                 ml: 1,
//                                 borderRadius: "6px",
//                                 fontSize: "0.75rem",
//                                 fontWeight: 800,
//                                 lineHeight: 1,
//                                 backgroundColor: active
//                                     ? "rgba(255, 255, 255, 0.2)"
//                                     : "#f1f5f9",
//                                 color: active ? "#fff" : "#64748b",
//                             }}
//                         >
//                             {categoryCount}
//                         </Box>
//                     </Button>
//                 );
//             })}
//         </Box>
//     );
// }

import React from "react";
import {
    Autocomplete,
    Box,
    Button,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";

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
    "Commercial space",
    "Commercial store",
    "Garage",
    "other",
];

const moroccanCities = [
    "Agadir",
    "Ain Harrouda",
    "Aït Melloul",
    "Ait Ourir",
    "Al Hoceima",
    "Azrou",
    "Benguerir",
    "Beni Ansar",
    "Beni Mellal",
    "Benslimane",
    "Berrechid",
    "Berkane",
    "Biougra",
    "Bni Yakhlef",
    "Bouskoura",
    "Bouznika",
    "Casablanca",
    "Dcheira El Jihadia",
    "Dar Bouazza (Tamaris)",
    "Drargua",
    "Ech-challalate",
    "El Jadida",
    "El Kelaa Des Sraghna",
    "Essaouira",
    "Errachidia",
    "Fez",
    "Fquih Ben Salah",
    "Fnideq",
    "Guelmim",
    "Guercif",
    "Inezgane",
    "Kenitra",
    "Khemisset",
    "Khenifra",
    "Khouribga",
    "Ksar El Kebir",
    "Lahraouyine",
    "Larache",
    "Lqliaa",
    "M'diq",
    "Marrakesh",
    "Martil",
    "Mehdya",
    "Meknes",
    "Midelt",
    "Mohammedia",
    "Nador",
    "Ouarzazate",
    "Oued Zem",
    "Oujda",
    "Oulad Teima",
    "Ouazzane",
    "Rabat",
    "Salé",
    "Safi",
    "Sefrou",
    "Settat",
    "Skhirat",
    "Sidi Bennour",
    "Sidi Kacem",
    "Sidi Slimane",
    "Sidi Taibi",
    "Souk El Arbaa",
    "Souk Sebt Ouled Nemma",
    "Taourirt",
    "Tamensourte",
    "Tan-Tan",
    "Tangier",
    "Taza",
    "Temara",
    "Tetouan",
    "Tifelt",
    "Tit Mellil",
    "Tiznit",
    "Youssoufia",
].sort((a, b) => a.localeCompare(b, "en"));

const transactionTypes = [
    { label: "All Transactions", value: "All" },
    { label: "For Sale", value: "For Sale" },
    { label: "For Rent", value: "For Rent" },
];

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const normalizeCity = (value) => {
    const city = normalize(value);

    // Account for common alternative spellings.
    if (city === "tanger") return "tangier";
    if (city === "marrakech") return "marrakesh";
    if (city === "fes") return "fez";

    return city;
};

export default function PropertyCategoryBar({
    properties = [],
    selectedCategory = "All Properties",
    onCategoryChange,
    selectedListingType = "All",
    onListingTypeChange,
    selectedCity = "All Cities",
    onCityChange,
}) {
    const getCategoryCount = (category) => {
        return properties.filter((property) => {
            const matchesCategory =
                category === "All Properties" ||
                normalize(property.propertyType) === normalize(category);

            const matchesTransaction =
                selectedListingType === "All" ||
                normalize(property.listingType) ===
                    normalize(selectedListingType);

            const matchesCity =
                selectedCity === "All Cities" ||
                normalizeCity(property.city) ===
                    normalizeCity(selectedCity);

            return (
                matchesCategory &&
                matchesTransaction &&
                matchesCity
            );
        }).length;
    };

    const filterFieldSx = {
        minWidth: { xs: "100%", sm: 190 },
        "& .MuiOutlinedInput-root": {
            borderRadius: 2.5,
            backgroundColor: "#fff",
        },
    };

    return (
        <div >
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 700,
                    color: "#1f2937",
                    pb: 2
                }}
            >
                Filter
            </Typography>
        <Box
            sx={{
                width: "95%",
                maxWidth: "100%",
                minWidth: 0,
                mb: 3,
                px: { xs: 1.5, sm: 2.5, md: 3 },
                py: 2,
                border: 1,
                borderRadius: 3,
                borderColor: "#d3d8dd",
                boxSizing: "border-box",
                overflow: "hidden",
                ml:5
            }}
        >
            {/* Property type categories */}
            
            {/* Property type categories */}
            <Box
                component="nav"
                aria-label="Property Categories"
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        sm: "repeat(3, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                        lg: "repeat(5, minmax(0, 1fr))",
                        xl: "repeat(7, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    py: 1.5,
                    px: 0.5,
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
                                minWidth: 0,
                                width: "100%",
                                minHeight: 44,
                                px: { xs: 1, sm: 1.5 },
                                py: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.75,
                                whiteSpace: "normal",
                                overflowWrap: "anywhere",
                                textAlign: "center",
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                lineHeight: 1.3,
                                borderRadius: 2.5,
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
                                },
                            }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    minWidth: 0,
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {category}
                            </Box>

                            <Box
                                component="span"
                                sx={{
                                    display: "inline-flex",
                                    flexShrink: 0,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: 22,
                                    height: 22,
                                    px: 0.6,
                                    borderRadius: "6px",
                                    fontSize: "0.72rem",
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


            {/* Transaction type and city filters */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 5,
                    mt: 1.5,
                    p: { xs: 2, sm: 1 },
                    // border: "1px solid #e5e7eb",
                    borderRadius: 3,
                    backgroundColor: "#f9fafb",
                    // marginLeft: 11,
                    // marginRight: 11,
                }}
            >
                <TextField
                    select
                    label="Transaction Type"
                    value={selectedListingType}
                    onChange={(event) =>
                        onListingTypeChange?.(event.target.value)
                    }
                    size="medium"
                    sx={{
                        ...filterFieldSx,
                        flex: { xs: "1 1 100%", sm: "1 1 190px" },
                    }}
                >
                    {transactionTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                            {type.label}
                        </MenuItem>
                    ))}
                </TextField>

                <Autocomplete
                    options={["All Cities", ...moroccanCities]}
                    value={selectedCity}
                    onChange={(_event, newValue) =>
                        onCityChange?.(newValue || "All Cities")
                    }
                    getOptionLabel={(option) => option}
                    isOptionEqualToValue={(option, value) =>
                        option === value
                    }
                    fullWidth
                    sx={{
                        ...filterFieldSx,
                        flex: { xs: "1 1 100%", sm: "1 1 220px" },
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="City"
                            placeholder="Search a city"
                        />
                    )}
                />

                <Button
                    variant="outlined"
                    onClick={() => {
                        onListingTypeChange?.("All");
                        onCityChange?.("All Cities");
                        onCategoryChange?.("All Properties");
                    }}
                    sx={{
                        minHeight: 56,
                        px: 2.5,
                        borderRadius: 2.5,
                        borderColor: "#cbd5e1",
                        color: "#475569",
                        fontWeight: 700,
                        textTransform: "none",
                        flexShrink: 0,
                    }}
                >
                    Clear Filters
                </Button>
            </Box>
        </Box>

        </div>
    );
}
