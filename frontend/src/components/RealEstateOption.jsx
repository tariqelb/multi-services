import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

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
                px: { xs: 2, md: 6 },
                py: 4,
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: "#0F172A",
                }}
            >
                {t("properties.categories.title")}
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
                {categories.map((category) => (
                    <Box
                        key={category.key}
                        onClick={() =>
                            handleCategoryClick(category.title)
                        }
                        onKeyDown={(event) =>
                            handleCategoryKeyDown(
                                event,
                                category.title
                            )
                        }
                        role="button"
                        tabIndex={0}
                        aria-label={t(
                            `properties.categories.${category.key}`
                        )}
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
                            "&:focus-visible": {
                                outline: "2px solid #2563EB",
                                outlineOffset: "2px",
                            },
                        }}
                    >
                        <CategoryCard
                            title={t(
                                `properties.categories.${category.key}`
                            )}
                            image={category.image}
                            width="80%"
                            height="100px"
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
}