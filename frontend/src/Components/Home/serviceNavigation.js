// src/Components/Home/serviceNavigation.js
//
// Navigation of each service, shared by its sidebar (ServiceSidebar) and its
// top bar (TopBar). Add a service here to give it its own sidebar items
// and profile menu entries.
//
//   prefixes  paths that belong to the service
//   nav       pages of the service (its sidebar items)
//   profile   entries of the profile menu (between Notifications and Feedback)
//
// Item: { path, labelKey, label, icon, exact }
//   icon:  key of the icon (see ITEM_ICONS in ServiceSidebar and TopBar)
//   exact: active only on that exact path

export const VEHICLE_NAV = [
    { path: "/vehicles", exact: true, labelKey: "vehiclesApp.sidebar.browse", label: "Find a vehicle", icon: "browse" },
    { path: "/motos", exact: true, labelKey: "vehiclesApp.sidebar.browseMotos", label: "Motos & bikes", icon: "browseMoto" },
    { path: "/vehicles/parts", exact: true, labelKey: "vehiclesApp.sidebar.parts", label: "Spare parts", icon: "parts" },
    // One search for cars, motos & bikes and spare parts, with a map (like the property "Search").
    { path: "/vehicles/search", exact: true, labelKey: "vehiclesApp.sidebar.search", label: "Search", icon: "search" },
    { path: "/vehicles/map", exact: true, labelKey: "vehiclesApp.sidebar.map", label: "Find on map", icon: "map" },
    { path: "/vehicles/publish", exact: true, labelKey: "vehiclesApp.sidebar.publish", label: "Publish a vehicle", icon: "publish" },
    { path: "/motos/publish", exact: true, labelKey: "vehiclesApp.sidebar.publishMoto", label: "Publish a moto or bike", icon: "publishMoto" },
    { path: "/vehicles/parts/publish", exact: true, labelKey: "vehiclesApp.sidebar.publishPart", label: "Publish a spare part", icon: "publish" },
    // Vehicles, motos & bikes and spare parts together (tabs on the page), like the property "My publications".
    { path: "/vehicles/mine", exact: true, labelKey: "topbar.myPublication", label: "My Publication", icon: "mine" },
    { path: "/vehicles/saved", exact: true, labelKey: "vehiclesApp.sidebar.saved", label: "Saved vehicles", icon: "saved" },
    { path: "/vehicles/alerts", exact: true, labelKey: "vehiclesApp.sidebar.alerts", label: "Vehicle alerts", icon: "alerts" },
    { path: "/vehicles/reviews", exact: true, labelKey: "vehiclesApp.sidebar.reviews", label: "Reviews", icon: "reviews" },
];

export const SERVICE_NAVIGATION = [
    {
        id: "vehicles",
        prefixes: ["/vehicles", "/motos"],
        titleKey: "vehiclesApp.topbar.title",
        title: "Vehicles",
        icon: "browse",
        home: "/vehicles",
        nav: VEHICLE_NAV,
        descriptionPath: "/vehicles/description",
        // "My profile" in the profile menu opens this page.
        profilePath: "/vehicles/profile",
        profile: [
            { path: "/vehicles/mine", labelKey: "topbar.myPublication", label: "My Publication", icon: "mine" },
            { path: "/vehicles/saved", labelKey: "vehiclesApp.sidebar.saved", label: "Saved vehicles", icon: "saved" },
            { path: "/vehicles/alerts", labelKey: "vehiclesApp.sidebar.alerts", label: "Vehicle alerts", icon: "alerts" },
        ],
    },
];

/** Service of a path, or null (real estate pages and shared pages). */
export const serviceForPath = (pathname) =>
    SERVICE_NAVIGATION.find((service) => service.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) || null;
