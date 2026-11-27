// src/Components/Analytics/StatisticsTabs.jsx
// Tab bar of a service's statistics page. Same look as the property dashboard:
// tabs share the full width on tablet/desktop and scroll sideways on phones.

import { Card, Tab, Tabs } from "@mui/material";

export default function StatisticsTabs({ value, onChange, items = [] }) {
    return (
        <Card
            elevation={0}
            sx={{ mb: 3, p: { xs: 0.75, sm: 1 }, border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}
        >
            <Tabs
                value={value}
                onChange={(_, next) => onChange(next)}
                variant="scrollable"
                scrollButtons={false}
                allowScrollButtonsMobile={false}
                sx={{
                    minHeight: "auto",
                    width: "100%",
                    "& .MuiTabs-scroller": {
                        overflowX: "auto !important",
                        overflowY: "hidden !important",
                        scrollbarWidth: "none",
                        "&::-webkit-scrollbar": { display: "none" },
                    },
                    "& .MuiTabs-flexContainer": {
                        display: "flex",
                        flexWrap: "nowrap",
                        gap: { xs: 0.5, sm: 0.75 },
                        width: { xs: "max-content", md: "100%" },
                    },
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTab-root": {
                        flex: { xs: "0 0 105px", sm: "1 1 0" },
                        minWidth: { xs: 105, sm: 0 },
                        maxWidth: { md: "none" },
                        minHeight: { xs: 76, sm: 82 },
                        px: { xs: 0.75, sm: 1 },
                        py: 1.25,
                        gap: 0.75,
                        borderRadius: 2,
                        color: "text.secondary",
                        fontSize: { xs: "0.68rem", sm: "0.7rem", md: "0.74rem" },
                        fontWeight: 600,
                        lineHeight: 1.25,
                        textTransform: "none",
                        whiteSpace: "normal",
                        textAlign: "center",
                        transition: "all 0.2s ease",
                        "& .MuiTab-iconWrapper": { mb: 0, fontSize: { xs: 21, sm: 23 }, color: "inherit" },
                        "&:hover": { backgroundColor: "action.hover", color: "primary.main" },
                        "&.Mui-selected": { color: "primary.main", backgroundColor: "action.selected" },
                    },
                }}
            >
                {items.map((item) => (
                    <Tab key={item.value} value={item.value} label={item.label} icon={item.icon} iconPosition="top" />
                ))}
            </Tabs>
        </Card>
    );
}
