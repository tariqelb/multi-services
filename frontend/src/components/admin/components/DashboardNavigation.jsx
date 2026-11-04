
import { Card, Tab, Tabs } from "@mui/material";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MouseOutlinedIcon from "@mui/icons-material/MouseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import ArticleIcon from "@mui/icons-material/Article";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";

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
    {
        label: "Publications Review",
        value: "publications",
        icon: <ArticleIcon />,
    },
    {
        label: "Feedback",
        value: "feedback",
        icon: <FeedbackOutlinedIcon />,
    }
];

export default function DashboardNavigation({
    activeTab,
    setActiveTab,
}) {
    return (
        <Card
            sx={{
                width: "100%",
                minWidth: 0,
                overflow: "hidden",
                borderRadius: 2,
                mb: 5,
            }}
        >
            <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                variant="scrollable"
                scrollButtons={false}
                allowScrollButtonsMobile={false}
                sx={{
                    width: "100%",
                    minHeight: 64,

                    "& .MuiTabs-scroller": {
                        overflowX: "auto !important",
                        scrollbarWidth: "none",
                        "&::-webkit-scrollbar": {
                            display: "none",
                        },
                    },

                    "& .MuiTabs-flexContainer": {
                        width: { xs: "max-content", sm: "100%" },
                    },

                    "& .MuiTab-root": {
                        flex: { xs: "0 0 auto", sm: 1 },
                        minWidth: { xs: 145, sm: 0 },
                        minHeight: 64,
                        px: { xs: 2, sm: 1.5, md: 2 },
                        py: 1.5,
                        fontSize: {
                            xs: "0.75rem",
                            sm: "0.8rem",
                            md: "0.9rem",
                        },
                        fontWeight: 600,
                        gap: 1,
                        whiteSpace: "normal",
                        lineHeight: 1.3,
                        transition: "background-color 0.2s ease",
                    },

                    "& .MuiTab-iconWrapper": {
                        fontSize: { xs: 19, sm: 21 },
                        marginBottom: "0 !important",
                    },

                    "& .Mui-selected": {
                        color: "#1D4ED8",
                        backgroundColor: "#EFF6FF",
                    },

                    "& .MuiTabs-indicator": {
                        height: 3,
                        backgroundColor: "#2563EB",
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
