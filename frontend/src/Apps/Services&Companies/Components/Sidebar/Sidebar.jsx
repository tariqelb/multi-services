// /home/tariq/multi-services/app/frontend/src/Apps/Services&Companies/Components/Sidebar/Sidebar.jsx
// src/Apps/Services&Companies/Components/Sidebar/Sidebar.jsx

import React from "react";
import ServiceSidebar from "../../../../Components/Home/ServiceSidebar";

export default function Sidebar(props) {
    return (
        <ServiceSidebar
            {...props}
            title="Services & Companies"
            descriptionPath="/services-companies/description"
            translationKey="servicesCompanies"
        />
    );
}