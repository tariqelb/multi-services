import React, { useState } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import ProfileContent from "./ProfileContent";

export default function Profile() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Profile");

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800 p-5 w-full">
                <ProfileContent />
        </div>
    );

}

