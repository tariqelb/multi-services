// src/Apps/Property/propertyInsertForm/PublishPropertyPage.jsx

import React from "react";
import { Box } from "@mui/material";

import PropertyInsertForm from "./PropertyInsertForm";

export default function PublishPropertyPage() {
    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                minWidth: 0,
                bgcolor: "background.default",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            <PropertyInsertForm />
        </Box>
    );
}
