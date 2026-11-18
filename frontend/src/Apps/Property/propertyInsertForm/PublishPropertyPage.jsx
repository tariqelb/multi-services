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
                bgcolor: "background.default",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            {/* <Typography
                variant="h4"
                sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                    mb: 3,
                }}
            >
                Publish a Property
            </Typography> */}

            <PropertyInsertForm />
        </Box>
    );
}