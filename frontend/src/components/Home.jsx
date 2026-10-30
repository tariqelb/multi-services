import React, { useState } from "react";
import { Box } from "@mui/material";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import MiddleContent from "./MiddleContent";
import PublishFab from "./PublishFab";

export default function Home() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Dashboard");

    const user = {
        name: "Alex Morgan",
        role: "Workspace Admin",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-clip bg-gray-50 font-sans text-gray-800">
            {/* Top navigation */}
            <TopBar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
            />

            {/* Main layout */}
            <div className="relative flex min-h-0 w-full flex-1">
                {/* Mobile backdrop */}
                {sidebarOpen && (
                    <Box
                        onClick={() => setSidebarOpen(false)}
                        sx={{
                            display: { xs: "block", md: "none" },
                            position: "fixed",
                            top: "4rem",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: "rgba(0, 0, 0, 0.4)",
                            zIndex: 40,
                        }}
                    />
                )}

                {/* Sidebar */}
                <Sidebar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeNav={activeNav}
                    setActiveNav={setActiveNav}
                />

                {/* Middle content */}
                <main className="min-w-0 w-full flex-1">
                    <MiddleContent activeNav={activeNav} />
                </main>
            </div>

            {/* Floating publish button */}
            {/* <PublishFab /> */}
        </div>
    );
}