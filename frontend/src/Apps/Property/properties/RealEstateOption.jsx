import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";


import allPropertiesImage from "../../../assets/all-properties.jpg";
import apartmentImage from "../../../assets/apartment.jpg";
import houseImage from "../../../assets/house.jpg";
import villaImage from "../../../assets/villa.jpg";
import studioImage from "../../../assets/studio.jpg";
import roomImage from "../../../assets/room.jpg";
import storeImage from "../../../assets/store.jpg";
import officeImage from "../../../assets/office.jpg";
import landImage from "../../../assets/land.jpg";
import warehouseImage from "../../../assets/warehouse.jpg";
import commercialSpaceImage from "../../../assets/commercial-space.jpg";
import garageImage from "../../../assets/garage.jpg";
import otherImage from "../../../assets/other.jpg";
import commercialStoreImage from "../../../assets/commercial-store.jpg";

export default function RealEstateOption({
    onSelectCategory,
    listRef,
}) {
    const { t } = useTranslation();

    const categories = [
        { title: "All Properties", image: allPropertiesImage, key: "all" },
        { title: "Apartment", image: apartmentImage, key: "apartment" },
        { title: "House", image: houseImage, key: "house" },
        { title: "Villa", image: villaImage, key: "villa" },
        { title: "Studio", image: studioImage, key: "studio" },
        { title: "Room", image: roomImage, key: "room" },
        { title: "Store", image: storeImage, key: "store" },
        { title: "Office", image: officeImage, key: "office" },
        { title: "Land", image: landImage, key: "land" },
        { title: "Warehouse", image: warehouseImage, key: "warehouse" },
        {
            title: "Commercial space",
            image: commercialSpaceImage,
            key: "commercialSpace",
        },
        {
            title: "Commercial store",
            image: commercialStoreImage,
            key: "commercialStore",
        },
        { title: "Garage", image: garageImage, key: "garage" },
        { title: "other", image: otherImage, key: "other" },
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

    const handleCategoryKeyDown = (event, title) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCategoryClick(title);
        }
    };

    return (
        <Box
            sx={{
                px: { xs: 2, sm: 3, md: 4 },
                pt: { xs: 2.5, md: 3.5 },
                pb: 1,
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t("properties.categories.title")}
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    gap: 1.5,
                    overflowX: "auto",
                    pb: 1.5,
                    scrollSnapType: "x proximity",
                    scrollbarWidth: "thin",
                }}
            >
                {categories.map((category) => {
                    const label = t(`properties.categories.${category.key}`);

                    return (
                        <Box
                            key={category.key}
                            onClick={() => handleCategoryClick(category.title)}
                            onKeyDown={(event) => handleCategoryKeyDown(event, category.title)}
                            role="button"
                            tabIndex={0}
                            aria-label={label}
                            sx={{
                                flex: "0 0 auto",
                                width: { xs: 104, md: 118 },
                                cursor: "pointer",
                                scrollSnapAlign: "start",
                                textAlign: "center",
                                outline: "none",
                                "&:hover img, &:focus-visible img": { transform: "scale(1.06)" },
                                "&:focus-visible .cat-img": { boxShadow: "0 0 0 3px rgba(37,99,235,.45)" },
                            }}
                        >
                            <Box
                                className="cat-img"
                                sx={{
                                    height: { xs: 72, md: 80 },
                                    borderRadius: "14px",
                                    overflow: "hidden",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: "background.muted",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={category.image}
                                    alt=""
                                    loading="lazy"
                                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .25s ease" }}
                                />
                            </Box>
                            <Typography
                                variant="caption"
                                sx={{ display: "block", mt: 0.75, fontWeight: 600, lineHeight: 1.25, color: "text.primary" }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
