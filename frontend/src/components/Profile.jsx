// import React, { useState } from "react";
// import TopBar from "./TopBar";
// import Sidebar from "./Sidebar";
// import ProfileContent from "./ProfileContent";
// import ProfilePropertyList from "./ProfilePropertyList"

// export default function Profile() {
//     const [sidebarOpen, setSidebarOpen] = useState(false);
//     const [activeNav, setActiveNav] = useState("Profile");

//     return (
//         <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800 p-5 w-full">
//                 <ProfileContent />
//                 <ProfilePropertyList/>
//         </div>
//     );

// }

import React, { useState } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import ProfileContent from "./ProfileContent";
import ProfilePropertyList from "./ProfilePropertyList";
import PropertyDetails from "./PropertyDetails"; // 1. Import PropertyDetails component

export default function Profile() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Profile");
    
    // 2. Add state to track the currently selected property for details view
    const [selectedProperty, setSelectedProperty] = useState(null);

    const handleBackToListings = () => {
        setSelectedProperty(null);
    };

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-black font-sans text-gray-800 dark:text-gray-100 m-0 p-0 overflow-x-hidden">
            {selectedProperty ? (
                // 3. Show details view if a property is selected
                <PropertyDetails
                    property={selectedProperty}
                    onBack={handleBackToListings}
                    showContact={false}
                />
            ) : (
                // 4. Otherwise, show profile content and user publication list
                <>
                    <ProfileContent />
                    <ProfilePropertyList 
                        onSelectProperty={(property) => setSelectedProperty(property)} 
                    />
                </>
            )}
        </div>
    );
}