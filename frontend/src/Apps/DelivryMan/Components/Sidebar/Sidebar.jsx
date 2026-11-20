// /home/tariq/multi-services/app/frontend/src/Apps/DelivryMan/Components/Sidebar/Sidebar.jsx
// src/Apps/DelivryMan/Components/Sidebar/Sidebar.jsx

import React from "react";
import ServiceSidebar from "../../../../Components/Home/ServiceSidebar";

export default function Sidebar(props) {
    return (
        <ServiceSidebar
            {...props}
            title="Delivery Man"
            descriptionPath="/delivery-man/description"
            translationKey="deliveryMan"
        />
    );
}