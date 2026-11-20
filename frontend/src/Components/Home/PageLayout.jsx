import { Box } from "@mui/material";
import PageHeader from "../ui/PageHeader";

/**
 * Shared page shell: centered container + title / subtitle / main action.
 * Use it as the root of every page.
 */
export default function PageLayout({
    title,
    subtitle,
    action,
    icon,
    maxWidth = 1120,
    children,
}) {
    return (
        <Box
            sx={{
                width: "100%",
                minWidth: 0,
                maxWidth,
                mx: "auto",
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 3, md: 4 },
                boxSizing: "border-box",
            }}
        >
            <PageHeader icon={icon} title={title} subtitle={subtitle} action={action} />

            {children}
        </Box>
    );
}
