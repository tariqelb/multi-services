
import { Card, Tab, Tabs } from "@mui/material";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MouseOutlinedIcon from "@mui/icons-material/MouseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

const navigationItems = [
    {
        label: "Users",
        value: "users",
        icon: <PeopleAltOutlinedIcon />,
    },
    {
        label: "Clicks",
        value: "clicks",
        icon: <MouseOutlinedIcon />,
    },
    {
        label: "Visits",
        value: "visits",
        icon: <VisibilityOutlinedIcon />,
    },
];

export default function DashboardNavigation({
    activeTab,
    setActiveTab,
}) {
    return (
        <Card
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                    px: 1,
                    "& .MuiTab-root": {
                        minHeight: 64,
                        textTransform: "none",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                    },
                }}
            >
                {navigationItems.map((item) => (
                    <Tab
                        key={item.value}
                        value={item.value}
                        label={item.label}
                        icon={item.icon}
                        iconPosition="start"
                    />
                ))}
            </Tabs>
        </Card>
    );
}
