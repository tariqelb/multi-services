// /home/tariq/multi-services/app/frontend/src/Apps/Driver/Components/Sidebar/Sidebar.jsx
// src/Apps/Driver/Components/Sidebar/Sidebar.jsx

import React from "react";
import ServiceSidebar from "../../../../Components/Home/ServiceSidebar";

export default function Sidebar(props) {
    return (
        <ServiceSidebar
            {...props}
            title="Driver"
            descriptionPath="/driver/description"
            translationKey="driver"
        />
    );
}