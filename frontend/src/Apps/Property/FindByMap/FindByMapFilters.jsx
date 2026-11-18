import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";

const ESTABLISHMENT_TYPES = [
    "Hotel",
    "Riad",
    "Guesthouse",
    "Hostel",
    "Aparthotel",
    "Other",
];

export default function FindByMapFilters({
    filters,
    setFilters,
    cities,
    propertyTypes,
}) {
    const { t } = useTranslation();

    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    const handleChange = (field, value) => {
        setFilters((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleListingChange = (value) => {
        setFilters((previous) => ({
            ...previous,
            listingType: value,
            rentalType:
                value === "For Rent"
                    ? previous.rentalType || "All"
                    : "All",
        }));
    };

    return (
        <Box
            className="find-map-filters"
            sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                width: "100%",
                "& .MuiFormControl-root": {
                    minWidth: 150,
                    flex: "1 1 150px",
                },
                "& .MuiTextField-root": {
                    minWidth: 180,
                    flex: "1 1 180px",
                },
            }}
        >
            {/* City */}
            <FormControl size="small">
                <InputLabel>
                    {translate("findMap.filters.city", "City")}
                </InputLabel>

                <Select
                    value={filters.city}
                    label={translate("findMap.filters.city", "City")}
                    onChange={(event) =>
                        handleChange("city", event.target.value)
                    }
                >
                    <MenuItem value="All">
                        {translate("findMap.filters.allMorocco", "All Morocco")}
                    </MenuItem>

                    {cities.map((city) => (
                        <MenuItem key={city} value={city}>
                            {city}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Property type */}
            <FormControl size="small">
                <InputLabel>
                    {translate("findMap.filters.propertyType", "Property type")}
                </InputLabel>

                <Select
                    value={filters.propertyType}
                    label={translate(
                        "findMap.filters.propertyType",
                        "Property type"
                    )}
                    onChange={(event) =>
                        handleChange("propertyType", event.target.value)
                    }
                >
                    <MenuItem value="All">
                        {translate("findMap.filters.allTypes", "All types")}
                    </MenuItem>

                    {propertyTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                            {t(
                                `findMap.propertyTypes.${type.toLowerCase()}`,
                                { defaultValue: type }
                            )}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Establishment type */}
            <FormControl size="small">
                <InputLabel>
                    {translate(
                        "findMap.filters.establishmentType",
                        "Establishment type"
                    )}
                </InputLabel>

                <Select
                    value={filters.accommodationType || "All"}
                    label={translate(
                        "findMap.filters.establishmentType",
                        "Establishment type"
                    )}
                    onChange={(event) =>
                        handleChange("accommodationType", event.target.value)
                    }
                >
                    <MenuItem value="All">
                        {translate(
                            "findMap.filters.allEstablishments",
                            "All establishments"
                        )}
                    </MenuItem>

                    {ESTABLISHMENT_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                            {t(
                                `findMap.accommodationTypes.${type.toLowerCase()}`,
                                { defaultValue: type }
                            )}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Listing */}
            <FormControl size="small">
                <InputLabel>
                    {translate("findMap.filters.listing", "Listing")}
                </InputLabel>

                <Select
                    value={filters.listingType}
                    label={translate("findMap.filters.listing", "Listing")}
                    onChange={(event) =>
                        handleListingChange(event.target.value)
                    }
                >
                    <MenuItem value="All">
                        {translate("findMap.filters.allListings", "All listings")}
                    </MenuItem>

                    <MenuItem value="For Sale">
                        {translate("findMap.filters.forSale", "For Sale")}
                    </MenuItem>

                    <MenuItem value="For Rent">
                        {translate("findMap.filters.forRent", "For Rent")}
                    </MenuItem>
                </Select>
            </FormControl>

            {/* Rental type */}
            {filters.listingType === "For Rent" && (
                <FormControl size="small">
                    <InputLabel>
                        {translate("findMap.filters.rentalType", "Rental type")}
                    </InputLabel>

                    <Select
                        value={filters.rentalType || "All"}
                        label={translate(
                            "findMap.filters.rentalType",
                            "Rental type"
                        )}
                        onChange={(event) =>
                            handleChange("rentalType", event.target.value)
                        }
                    >
                        <MenuItem value="All">
                            {translate("findMap.filters.allRentals", "All rentals")}
                        </MenuItem>

                        <MenuItem value="Property">
                            {translate(
                                "findMap.filters.regularRental",
                                "Regular rent"
                            )}
                        </MenuItem>

                        <MenuItem value="Roommate">
                            {translate(
                                "findMap.filters.roommate",
                                "Roommate"
                            )}
                        </MenuItem>
                    </Select>
                </FormControl>
            )}

            {/* Maximum price */}
            <TextField
                size="small"
                label={translate(
                    "findMap.filters.maximumPrice",
                    "Maximum price (MAD)"
                )}
                type="number"
                value={filters.maxPrice}
                onChange={(event) =>
                    handleChange("maxPrice", event.target.value)
                }
                inputProps={{ min: 0 }}
            />
        </Box>
    );
}
// import React from "react";
// import { useTranslation } from "react-i18next";

// import {
//     Box,
//     FormControl,
//     InputLabel,
//     MenuItem,
//     Select,
//     TextField,
// } from "@mui/material";

// const ESTABLISHMENT_TYPES = [
//     "Hotel",
//     "Riad",
//     "Guesthouse",
//     "Hostel",
//     "Aparthotel",
//     "Other",
// ];

// export default function FindByMapFilters({
//     filters,
//     setFilters,
//     cities,
//     propertyTypes,
// }) {
//     const { t } = useTranslation();

//     const translate = (key, fallback) =>
//         t(key, { defaultValue: fallback });

//     const handleChange = (field, value) => {
//         setFilters((previous) => ({
//             ...previous,
//             [field]: value,
//         }));
//     };

//     const handleListingChange = (value) => {
//         setFilters((previous) => ({
//             ...previous,
//             listingType: value,
//             rentalType:
//                 value === "For Rent"
//                     ? previous.rentalType || "All"
//                     : "All",
//         }));
//     };

//     return (
//         <Box
//             className="find-map-filters"
//             sx={{
//                 display: "flex",
//                 alignItems: "center",
//                 flexWrap: "wrap",
//                 gap: 2,
//                 width: "100%",
//                 "& .MuiFormControl-root": {
//                     minWidth: 150,
//                     flex: "1 1 150px",
//                 },
//                 "& .MuiTextField-root": {
//                     minWidth: 180,
//                     flex: "1 1 180px",
//                 },
//             }}
//         >
//             {/* City */}
//             <FormControl size="small">
//                 <InputLabel>
//                     {translate("findMap.filters.city", "City")}
//                 </InputLabel>

//                 <Select
//                     value={filters.city}
//                     label={translate("findMap.filters.city", "City")}
//                     onChange={(event) =>
//                         handleChange("city", event.target.value)
//                     }
//                 >
//                     <MenuItem value="All">
//                         {translate("findMap.filters.allMorocco", "All Morocco")}
//                     </MenuItem>

//                     {cities.map((city) => (
//                         <MenuItem key={city} value={city}>
//                             {city}
//                         </MenuItem>
//                     ))}
//                 </Select>
//             </FormControl>

//             {/* Property type */}
//             <FormControl size="small">
//                 <InputLabel>
//                     {translate("findMap.filters.propertyType", "Property type")}
//                 </InputLabel>

//                 <Select
//                     value={filters.propertyType}
//                     label={translate(
//                         "findMap.filters.propertyType",
//                         "Property type"
//                     )}
//                     onChange={(event) =>
//                         handleChange("propertyType", event.target.value)
//                     }
//                 >
//                     <MenuItem value="All">
//                         {translate("findMap.filters.allTypes", "All types")}
//                     </MenuItem>

//                     {propertyTypes.map((type) => (
//                         <MenuItem key={type} value={type}>
//                             {type}
//                         </MenuItem>
//                     ))}
//                 </Select>
//             </FormControl>

//             {/* Establishment type */}
//             <FormControl size="small">
//                 <InputLabel>Establishment type</InputLabel>

//                 <Select
//                     value={filters.accommodationType || "All"}
//                     label="Establishment type"
//                     onChange={(event) =>
//                         handleChange("accommodationType", event.target.value)
//                     }
//                 >
//                     <MenuItem value="All">All establishments</MenuItem>

//                     {ESTABLISHMENT_TYPES.map((type) => (
//                         <MenuItem key={type} value={type}>
//                             {type}
//                         </MenuItem>
//                     ))}
//                 </Select>
//             </FormControl>

//             {/* Listing */}
//             <FormControl size="small">
//                 <InputLabel>
//                     {translate("findMap.filters.listing", "Listing")}
//                 </InputLabel>

//                 <Select
//                     value={filters.listingType}
//                     label={translate("findMap.filters.listing", "Listing")}
//                     onChange={(event) =>
//                         handleListingChange(event.target.value)
//                     }
//                 >
//                     <MenuItem value="All">
//                         {translate("findMap.filters.allListings", "All listings")}
//                     </MenuItem>

//                     <MenuItem value="For Sale">
//                         {translate("findMap.filters.forSale", "For Sale")}
//                     </MenuItem>

//                     <MenuItem value="For Rent">
//                         {translate("findMap.filters.forRent", "For Rent")}
//                     </MenuItem>
//                 </Select>
//             </FormControl>

//             {/* Rental type */}
//             {filters.listingType === "For Rent" && (
//                 <FormControl size="small">
//                     <InputLabel>
//                         {translate("findMap.filters.rentalType", "Rental type")}
//                     </InputLabel>

//                     <Select
//                         value={filters.rentalType || "All"}
//                         label={translate(
//                             "findMap.filters.rentalType",
//                             "Rental type"
//                         )}
//                         onChange={(event) =>
//                             handleChange("rentalType", event.target.value)
//                         }
//                     >
//                         <MenuItem value="All">
//                             {translate("findMap.filters.allRentals", "All rentals")}
//                         </MenuItem>

//                         <MenuItem value="Property">
//                             {translate(
//                                 "findMap.filters.regularRental",
//                                 "Regular rent"
//                             )}
//                         </MenuItem>

//                         <MenuItem value="Roommate">
//                             {translate(
//                                 "findMap.filters.roommate",
//                                 "Roommate"
//                             )}
//                         </MenuItem>
//                     </Select>
//                 </FormControl>
//             )}

//             {/* Maximum price */}
//             <TextField
//                 size="small"
//                 label={translate(
//                     "findMap.filters.maximumPrice",
//                     "Maximum price (MAD)"
//                 )}
//                 type="number"
//                 value={filters.maxPrice}
//                 onChange={(event) =>
//                     handleChange("maxPrice", event.target.value)
//                 }
//                 inputProps={{ min: 0 }}
//             />
//         </Box>
//     );
// }
