import React from "react";
import { Box, Typography } from "@mui/material";
import CategoryCard from "./CategoryCard";

import allPropertiesImage from "./../assets/all-properties.jpg";
import apartmentImage from "./../assets/apartment.jpg";
import houseImage from "./../assets/house.jpg";
import villaImage from "./../assets/villa.jpg";
import studioImage from "./../assets/studio.jpg";
import roomImage from "./../assets/room.jpg";
import storeImage from "./../assets/store.jpg";
import officeImage from "./../assets/office.jpg";
import landImage from "./../assets/land.jpg";
import warehouseImage from "./../assets/warehouse.jpg";
import commercialSpaceImage from "./../assets/commercial-space.jpg";
import garageImage from "./../assets/garage.jpg";
import otherImage from "./../assets/other.jpg";
import commercialStoreImage from "./../assets/commercial-store.jpg";

export default function RealEstateOption({ onSelectCategory, listRef }) {
    const categories = [
        { title: "All Properties", image: allPropertiesImage },
        { title: "Apartment", image: apartmentImage },
        { title: "House", image: houseImage },
        { title: "Villa", image: villaImage },
        { title: "Studio", image: studioImage },
        { title: "Room", image: roomImage },
        { title: "Store", image: storeImage },
        { title: "Office", image: officeImage },
        { title: "Land", image: landImage },
        { title: "Warehouse", image: warehouseImage },
        { title: "Commercial space", image: commercialSpaceImage },
        { title: "Commercial store", image: commercialStoreImage },
        { title: "Garage", image: garageImage },
        { title: "other", image: otherImage },
    ];

    const handleCategoryClick = (title) => {
        onSelectCategory?.(title);

        if (listRef?.current) {
            listRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    return (
        <Box sx={{ px: { xs: 2, md: 6 }, py: 4, width: "100%", boxSizing: "border-box" }}>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: "#0F172A",
                }}
            >
                Explore Categories
            </Typography>

<Box
    sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: "8px",
        width: "100%",
        boxSizing: "border-box",
        p: 1,
        borderRadius: "16px",
        backgroundColor: "white",
        border: "1px solid #E2E8F0",
    }}
>
                {categories.map((cat) => (
                    <Box
                        key={cat.title}
                        onClick={() => handleCategoryClick(cat.title)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleCategoryClick(cat.title);
                            }
                        }}
sx={{
    flex: {
        xs: "0 0 calc(50% - 4px)",
        sm: "0 0 calc(33.333% - 6px)",
        md: "0 0 calc(25% - 6px)",
        lg: "0 0 calc(14.2857% - 7px)",
    },
    minWidth: 0,
    cursor: "pointer",
    borderRadius: "8px",
    overflow: "hidden",
    boxSizing: "border-box",
    transition: "transform 0.2s ease",
    "&:hover": {
        transform: "translateY(-2px)",
    },
}}
                    >
                        <CategoryCard
                            title={cat.title}
                            image={cat.image}
                            width="80%"
                            height="100px"
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
