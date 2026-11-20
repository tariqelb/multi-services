// /home/tariq/multi-services/app/frontend/src/Apps/DailyWorker/Components/Sidebar/Sidebar.jsx
// src/Apps/DailyWorker/Components/Sidebar/Sidebar.jsx

import React from "react";
import ServiceSidebar from "../../../../Components/Home/ServiceSidebar";

export default function Sidebar(props) {
    return (
        <ServiceSidebar
            {...props}
            title="Daily Worker"
            descriptionPath="/daily-worker/description"
            translationKey="dailyWorker"
        />
    );
}