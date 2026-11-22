
import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import { Box } from "@mui/material";
import PageHeader from "../../../Components/ui/PageHeader";

/**
 * Shared page shell: full width with the common padding + title / subtitle / main action.
 * Use it as the root of every page.
 */
export default function PageLayout({
    title,
    subtitle,
    action,
    icon,
    children,
}) {
    return (
        <Box sx={pagePaddingSx}>
            <PageHeader icon={icon} title={title} subtitle={subtitle} action={action} />

            {children}
        </Box>
    );
}