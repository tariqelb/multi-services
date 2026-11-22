// src/Apps/Property/propertyInsertForm/EditPropertyPage.jsx
// /properties/:id/edit — the publish form in edit mode.

import { useParams } from "react-router-dom";
import { Box } from "@mui/material";

import PropertyInsertForm from "./PropertyInsertForm";

export default function EditPropertyPage() {
    const { id } = useParams();

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
            {/* key: a fresh form for each property */}
            <PropertyInsertForm key={id} propertyId={id} />
        </Box>
    );
}
