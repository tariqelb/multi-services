// src/Components/Analytics/StatisticsTabs.jsx
// Tab bar of a service's statistics page (icons on top, scrolls on mobile).

import { Card, Tab, Tabs } from "@mui/material";

export default function StatisticsTabs({ value, onChange, items = [] }) {
    return (
        <Card elevation={0} sx={{ mb: 3, p: { xs: 0.75, sm: 1 }, border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
            <Tabs
                value={value}
                onChange={(_, next) => onChange(next)}
                variant="scrollable"
                scrollButtons={false}
                sx={{
                    minHeight: 64,
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTab-root": { minHeight: 64, borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 13, px: 2 },
                    "& .Mui-selected": { bgcolor: "primary.main", color: "#fff !important" },
                }}
            >
                {items.map((item) => (
                    <Tab key={item.value} value={item.value} label={item.label} icon={item.icon} iconPosition="top" />
                ))}
            </Tabs>
        </Card>
    );
}
