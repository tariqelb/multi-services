import React from "react";
import PropertyInsertForm from "./PropertyInsertForm";
import { Box, Typography } from "@mui/material";

export default function PublishPropertyPage() {
    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                minWidth: 0,
                p: { xs: 2, md: 4 },
                bgcolor: "#f9fafb",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            {/* <Typography
                variant="h4"
                sx={{
                    fontWeight: 800,
                    color: "#1f2937",
                    mb: 3,
                }}
            >
                Publish a Property
            </Typography> */}

            <PropertyInsertForm />
        </Box>
    );
}