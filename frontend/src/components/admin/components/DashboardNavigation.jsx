
import { Box, Card, Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MouseOutlinedIcon from "@mui/icons-material/MouseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";

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
        label: "Property Demand",
        value: "property demand",
        icon: <QueryStatsOutlinedIcon />,
    },
    {
        label: "Publications Review",
        value: "publications",
        icon: <ArticleOutlinedIcon />,
    },
    {
        label: "Feedback",
        value: "feedback",
        icon: <FeedbackOutlinedIcon />,
    },
    {
        label: "Client Call Actions",
        value: "client call action",
        icon: <PhoneInTalkOutlinedIcon />,
    },
];

export default function DashboardNavigation({
    activeTab,
    setActiveTab,
}) {
    const { t } = useTranslation();

    return (
        <Card
            elevation={0}
            sx={{
                width: "100%",
                minWidth: 0,
                mb: 3,
                p: { xs: 0.75, sm: 1 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                backgroundColor: "background.paper",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    minWidth: 0,
                    overflowX: "auto",
                    overflowY: "hidden",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",

                    "&::-webkit-scrollbar": {
                        display: "none",
                    },
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, value) => setActiveTab(value)}
                    variant="scrollable"
                    scrollButtons={false}
                    allowScrollButtonsMobile={false}
                    sx={{
                        minHeight: "auto",
                        width: "100%",

                        "& .MuiTabs-scroller": {
                            overflowX: "auto !important",
                            overflowY: "hidden !important",
                        },

                        "& .MuiTabs-flexContainer": {
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: { xs: 0.5, sm: 0.75 },
                            width: { xs: "max-content", md: "100%" },
                        },

                        "& .MuiTabs-indicator": {
                            display: "none",
                        },

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
                            fontSize: {
                                xs: "0.68rem",
                                sm: "0.7rem",
                                md: "0.74rem",
                            },
                            fontWeight: 600,
                            lineHeight: 1.25,
                            textTransform: "none",
                            whiteSpace: "normal",
                            textAlign: "center",
                            transition: "all 0.2s ease",

                            "& .MuiTab-iconWrapper": {
                                mb: 0,
                                fontSize: { xs: 21, sm: 23 },
                                color: "inherit",
                            },

                            "&:hover": {
                                backgroundColor: "action.hover",
                                color: "primary.main",
                            },

                            "&.Mui-selected": {
                                color: "primary.main",
                                backgroundColor: "action.selected",
                            },
                        },
                    }}
                >
                    {navigationItems.map((item) => (
                        <Tab
                            key={item.value}
                            value={item.value}
                            label={t(
                                `dashboardNavigation.${item.value}`,
                                item.label
                            )}
                            icon={item.icon}
                            iconPosition="top"
                        />
                    ))}
                </Tabs>
            </Box>
        </Card>
    );
}
