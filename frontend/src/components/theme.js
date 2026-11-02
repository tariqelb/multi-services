import { createTheme } from "@mui/material/styles";

// One theme for the whole app. Blue matches Tailwind blue-600 / blue-700,
// so MUI pages and Tailwind pages use the exact same primary color.
const theme = createTheme({
    palette: {
        primary: { main: "#2563EB", dark: "#1D4ED8", light: "#DBEAFE" },
        success: { main: "#0B6B43", light: "#DDF3E8" },
        error: { main: "#B42323", light: "#FCE4E4" },
        background: { default: "#F4F7FB", paper: "#FFFFFF" },
        text: { primary: "#0F172A", secondary: "#5B6577" },
        divider: "#E2E8F0",
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.2 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 },
        button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { borderRadius: 10, minHeight: 40, paddingInline: 18 },
                outlined: { borderColor: "#D5DCE8", color: "#26324A" },
            },
        },
        MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: { borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "none" },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } },
        },
        MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
        MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    },
});

export default theme;
