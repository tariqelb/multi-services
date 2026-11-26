// src/Components/Home/serviceNavigation.js
//
// Navigation of each service, shared by its sidebar (ServiceSidebar) and its
// top bar (TopBar). Add a service here to give it its own sidebar items
// and profile menu entries.
//
//   prefixes  paths that belong to the service
//   nav       pages of the service (its sidebar items)
//   menu      profile menu of the top bar: My Profile, Notification,
//             My Publication, Saved, Feedback, Alert, Settings (paths of the service)
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
    // Listings of other websites (Avito, Moteur.ma...), like the property "External listing".
    { path: "/vehicles/external", exact: true, labelKey: "vehicleExternal.nav", label: "External listing", icon: "external" },
    { path: "/vehicles/publish", exact: true, labelKey: "vehiclesApp.sidebar.publish", label: "Publish a vehicle", icon: "publish" },
    { path: "/motos/publish", exact: true, labelKey: "vehiclesApp.sidebar.publishMoto", label: "Publish a moto or bike", icon: "publishMoto" },
    { path: "/vehicles/parts/publish", exact: true, labelKey: "vehiclesApp.sidebar.publishPart", label: "Publish a spare part", icon: "publish" },
    // Requests: "I am looking for..." (post one / board for dealers and owners).
    { path: "/vehicles/requests/new", exact: true, labelKey: "requests.nav.post", label: "Post a request", icon: "postRequest" },
    { path: "/vehicles/requests/board", exact: true, labelKey: "requests.nav.board", label: "Requests board", icon: "requestBoard" },
    // Vehicles, motos & bikes and spare parts together (tabs on the page), like the property "My publications".
    { path: "/vehicles/mine", exact: true, labelKey: "topbar.myPublication", label: "My Publication", icon: "mine" },
    // Saved and Alerts are in the profile menu of the top bar; my requests are a tab of My Publication.
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
        // Pages of the profile menu for this service.
        menu: {
            profile: "/vehicles/profile",
            publication: "/vehicles/mine",
            saved: "/vehicles/saved",
            alert: "/vehicles/alerts",
        },
    },
];

/** Service of a path, or null (real estate pages and shared pages). */
export const serviceForPath = (pathname) =>
    SERVICE_NAVIGATION.find((service) => service.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) || null;
