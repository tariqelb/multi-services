import { Card, Tab, Tabs } from "@mui/material";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MouseOutlinedIcon from "@mui/icons-material/MouseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";

const navigationItems = [
    {
        label: "Users",
        value: "users",
        icon: <PeopleAltOutlinedIcon />,
    },
    {
        label: "External Listings Clicks",
        value: "external listings clicks",
        icon: <MouseOutlinedIcon />,
    },
    {
        label: "Visits",
        value: "visits",
        icon: <VisibilityOutlinedIcon />,
    },
    {
        label: "Internal Property Clicks",
        value: "internal property clicks",
        icon: <HomeWorkOutlinedIcon />,
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
                width: "100%",
                minWidth: 0,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
            }}
        >
            <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                variant="fullWidth"
                sx={{
                    width: "100%",
                    minHeight: 64,

                    "& .MuiTabs-flexContainer": {
                        width: "100%",
                    },

                    "& .MuiTab-root": {
                        flex: 1,
                        minWidth: 0,
                        minHeight: 64,
                        px: { xs: 1, sm: 2 },
                        py: 1.5,
                        textTransform: "none",
                        fontSize: { xs: "0.75rem", sm: "0.9rem" },
                        fontWeight: 700,
                        gap: 1,
                        whiteSpace: "normal",
                        lineHeight: 1.3,
                        transition: "background-color 0.2s ease",
                    },

                    "& .MuiTab-iconWrapper": {
                        fontSize: { xs: 19, sm: 21 },
                    },

                    "& .Mui-selected": {
                        color: "#047857",
                        backgroundColor: "#ecfdf5",
                    },

                    "& .MuiTabs-indicator": {
                        height: 3,
                        backgroundColor: "#059669",
                        borderRadius: "3px 3px 0 0",
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