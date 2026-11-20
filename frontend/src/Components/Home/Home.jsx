// /home/tariq/multi-services/app/frontend/src/Components/Home/Home.jsx

import React, { useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";

import TopBar from "../TopBar";
import Sidebar from "../Sidebar";
import MainSideBar from "./MainSideBar";
import MiddleContent from "../MiddleContent";

export default function Home() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Dashboard");

    const { i18n } = useTranslation();

    const currentLanguage = (
        i18n.resolvedLanguage ||
        i18n.language ||
        "en"
    )
        .split("-")[0]
        .split("_")[0];

    const isRTL = currentLanguage === "ar";

    const user = {
        name: "Alex Morgan",
        role: "Workspace Admin",
        avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    };

    return (
        <Box
            dir={isRTL ? "rtl" : "ltr"}
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                width: "100%",
                maxWidth: "100%",
                overflowX: "hidden",
                bgcolor: "#F5F7FB",
                color: "#1E293B",
                fontFamily: "sans-serif",
            }}
        >
            {/* Top navigation */}
            <TopBar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
            />

            {/* Main application layout */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: {
                        xs: "column",
                        md: "row",
                    },
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                }}
            >
                {/* Main services navigation */}
                <MainSideBar />

                {/* Property sidebar + page content */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        flex: 1,
                        minWidth: 0,
                        width: "100%",
                        maxWidth: "100%",
                        position: "relative",
                    }}
                >
                    {/* Mobile backdrop */}
                    {sidebarOpen && (
                        <Box
                            onClick={() => setSidebarOpen(false)}
                            sx={{
                                display: {
                                    xs: "block",
                                    md: "none",
                                },
                                position: "fixed",
                                inset: "4rem 0 0",
                                bgcolor: "rgba(0, 0, 0, 0.4)",
                                zIndex: 40,
                            }}
                        />
                    )}

                    {/* Property sidebar */}
                    <Sidebar
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        activeNav={activeNav}
                        setActiveNav={setActiveNav}
                    />

                    {/* Main page content */}
                    <Box
                        component="main"
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            width: "100%",
                            maxWidth: "100%",
                            overflowX: "hidden",
                        }}
                    >
                        <MiddleContent activeNav={activeNav} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
