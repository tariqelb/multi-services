// /home/tariq/multi-services/app/frontend/src/Apps/cars/Components/Sidebar/Sidebar.jsx
// src/Apps/cars/Components/Sidebar/Sidebar.jsx

import React from "react";
import ServiceSidebar from "../../../../Components/Home/ServiceSidebar";

export default function Sidebar(props) {
    return (
        <ServiceSidebar
            {...props}
            title="Cars"
            descriptionPath="/cars/description"
            translationKey="cars"
        />
    );
}