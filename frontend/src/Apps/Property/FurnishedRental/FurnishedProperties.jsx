
import React, { useState, useRef } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

import FurnishedPropertyList from "./FurnishedPropertiesList";
import PublishFab from "../propertyInsertForm/PublishFab";

export default function FurnishedProperties() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const propertySectionRef = useRef(null);
    const navigate = useNavigate();

    const handlePropertyAdded = () => {
        setRefreshTrigger((previous) => previous + 1);
    };

    const handleSelectProperty = (property) => {
        const id = property?._id || property?.id;

        if (id) {
            navigate(`/furnishedproperties/${id}`);
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
                bgcolor: "#F4F7FB",
                minHeight: "calc(100vh - 4rem)",
                overflowX: "clip",
            }}
        >
            <FurnishedPropertyList
                refreshTrigger={refreshTrigger}
                onSelectProperty={handleSelectProperty}
                listRef={propertySectionRef}
            />

            <PublishFab onPropertyAdded={handlePropertyAdded} />
        </Box>
    );
}
