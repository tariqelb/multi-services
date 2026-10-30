import React, { useState, useRef } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

import RealEstateBanner from "./RealEstateBanner";
import RealEstateOption from "./RealEstateOption";
import PropertyInsertForm from "./PropertyInsertForm";
import PropertyList from "./PropertyList";
import PublishFab from "./PublishFab";

export default function Properties() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedCategory, setSelectedCategory] =
        useState("All Properties");

    const propertySectionRef = useRef(null);
    const navigate = useNavigate();

    const handlePropertyAdded = () => {
        setRefreshTrigger((previous) => previous + 1);
    };

    // Navigate to the selected property's details page.
    const handleSelectProperty = (property) => {
        const id = property._id || property.id;

        if (id) {
            navigate(`/properties/${id}`);
        }
    };

    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                minWidth: 0,
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                bgcolor: "#f9fafb",
                minHeight: "calc(100vh - 4rem)",
                overflowX: "clip",
            }}
        >
            {/* Banner */}
            <Box
                sx={{
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                }}
            >
                <RealEstateBanner />
            </Box>

            {/* Property Categories */}
            <Box
                sx={{
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                }}
            >
                <RealEstateOption
                    onSelectCategory={setSelectedCategory}
                    listRef={propertySectionRef}
                />
            </Box>

            {/* Property List */}
            <Box
                ref={propertySectionRef}
                sx={{
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                }}
            >
                <PropertyList
                    refreshTrigger={refreshTrigger}
                    onSelectProperty={handleSelectProperty}
                    listRef={propertySectionRef}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />
            </Box>

            {/* Floating Publish Button */}
            <PublishFab />

            {/* Property Insert Form */}
            {/* 
            <PropertyInsertForm
                onAddProperty={handlePropertyAdded}
            /> 
            */}
        </Box>
    );
}