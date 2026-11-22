// src/Components/ui/PageContainer.jsx
// Every page uses the full available width with the same small padding.
import { Box } from "@mui/material";

export const pagePaddingSx = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    px: { xs: 2, sm: 3, md: 4 },
    py: { xs: 2.5, md: 3.5 },
};

export default function PageContainer({ children, sx, component = "div", ...rest }) {
    return (
        <Box component={component} sx={[pagePaddingSx, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
            {children}
        </Box>
    );
}
