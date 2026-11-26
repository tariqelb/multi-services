// src/Components/Dashboard/About/aboutServices.js
//
// What the About pages show (Dashboard sidebar > About ...). Texts are in the
// translation files under "aboutServices.<service>":
//   title, intro, highlights.{one,two,three}
//   entries.<entry>.{what,how}        one per entry of the service's sidebar
//   menu.<item>                       the top bar profile menu in that service
// Keep "entries" in the same order as the service's sidebar.

import {
    Apartment,
    BookmarksOutlined,
    BuildOutlined,
    BusinessCenterOutlined,
    CampaignOutlined,
    CloudUpload,
    DirectionsCarOutlined,
    EngineeringOutlined,
    FeedbackOutlined,
    HomeWork,
    Hotel,
    LibraryBooksOutlined,
    LocalShippingOutlined,
    LocalTaxiOutlined,
    ManageSearch,
    MenuBook,
    NotificationsActiveOutlined,
    NotificationsOutlined,
    PeopleAlt,
    PersonOutlined,
    PostAddOutlined,
    Public,
    ReviewsOutlined,
    SettingsOutlined,
    TravelExplore,
    TwoWheelerOutlined,
} from "@mui/icons-material";

/** Profile menu of the top bar (same order as in TopBar). */
export const MENU_ITEMS = [
    { key: "profile", labelKey: "topbar.myProfile", label: "My Profile", Icon: PersonOutlined },
    { key: "notification", labelKey: "topbar.notification", label: "Notification", Icon: NotificationsOutlined },
    { key: "publication", labelKey: "topbar.myPublication", label: "My Publication", Icon: LibraryBooksOutlined },
    { key: "saved", labelKey: "topbar.saved", label: "Saved", Icon: BookmarksOutlined },
    { key: "feedback", labelKey: "topbar.feedback", label: "Feedback", Icon: FeedbackOutlined },
    { key: "alert", labelKey: "topbar.alert", label: "Alert", Icon: NotificationsActiveOutlined },
    { key: "settings", labelKey: "topbar.settings", label: "Settings", Icon: SettingsOutlined },
];

const SHARED_MENU = { notification: "/notificationpage", feedback: "/feedback", settings: "/setting" };

export const ABOUT_SERVICES = [
    {
        id: "property",
        status: "live",
        Icon: HomeWork,
        color: "#2563EB",
        home: "/properties",
        entries: [
            { key: "findProperty", path: "/properties", labelKey: "sidebar.properties", label: "Find a Property", Icon: HomeWork },
            { key: "findRoommate", path: "/roommates", labelKey: "sidebar.findRoommate", label: "Find a Roommate", Icon: PeopleAlt },
            { key: "furnished", path: "/furnishedProperties", labelKey: "sidebar.furnishedProperties", label: "Find Furnished Rental", Icon: Apartment },
            { key: "establishments", path: "/establishments", labelKey: "sidebar.establishments", label: "Find Hotels & Riads", Icon: Hotel },
            { key: "externalListings", path: "/externalListings", labelKey: "sidebar.externalListing", label: "External listing", Icon: Public },
            { key: "search", path: "/search", labelKey: "sidebar.search", label: "Search", Icon: ManageSearch },
            { key: "findByMap", path: "/findbymap", labelKey: "sidebar.findbymap", label: "Find by map", Icon: TravelExplore },
            { key: "publishProperty", path: "/properties/publish", labelKey: "sidebar.publish", label: "Publish a Property", Icon: CloudUpload },
            { key: "publishEstablishment", path: "/establishments/publish", labelKey: "sidebar.publishEstablishment", label: "Publish an Establishment", Icon: CloudUpload },
            { key: "postRequest", path: "/requests/new", labelKey: "requests.nav.post", label: "Post a request", Icon: PostAddOutlined },
            { key: "requestBoard", path: "/requests/board", labelKey: "requests.nav.board", label: "Requests board", Icon: CampaignOutlined },
            { key: "reviews", path: "/reviews", labelKey: "sidebar.reviews", label: "Reviews", Icon: ReviewsOutlined },
            { key: "knowledge", path: "/knowledge", labelKey: "sidebar.knowledge", label: "Knowledge Center", Icon: MenuBook },
        ],
        menu: { profile: "/profile", publication: "/mypublication", saved: "/saved", alert: "/alert", ...SHARED_MENU },
    },
    {
        id: "vehicles",
        status: "live",
        Icon: DirectionsCarOutlined,
        color: "#EA580C",
        home: "/vehicles",
        entries: [
            { key: "findVehicle", path: "/vehicles", labelKey: "vehiclesApp.sidebar.browse", label: "Find a vehicle", Icon: DirectionsCarOutlined },
            { key: "motos", path: "/motos", labelKey: "vehiclesApp.sidebar.browseMotos", label: "Motos & bikes", Icon: TwoWheelerOutlined },
            { key: "parts", path: "/vehicles/parts", labelKey: "vehiclesApp.sidebar.parts", label: "Spare parts", Icon: BuildOutlined },
            { key: "search", path: "/vehicles/search", labelKey: "vehiclesApp.sidebar.search", label: "Search", Icon: ManageSearch },
            { key: "map", path: "/vehicles/map", labelKey: "vehiclesApp.sidebar.map", label: "Find on map", Icon: TravelExplore },
            { key: "external", path: "/vehicles/external", labelKey: "vehicleExternal.nav", label: "External listing", Icon: Public },
            { key: "publishVehicle", path: "/vehicles/publish", labelKey: "vehiclesApp.sidebar.publish", label: "Publish a vehicle", Icon: CloudUpload },
            { key: "publishMoto", path: "/motos/publish", labelKey: "vehiclesApp.sidebar.publishMoto", label: "Publish a moto or bike", Icon: CloudUpload },
            { key: "publishPart", path: "/vehicles/parts/publish", labelKey: "vehiclesApp.sidebar.publishPart", label: "Publish a spare part", Icon: CloudUpload },
            { key: "postRequest", path: "/vehicles/requests/new", labelKey: "requests.nav.post", label: "Post a request", Icon: PostAddOutlined },
            { key: "requestBoard", path: "/vehicles/requests/board", labelKey: "requests.nav.board", label: "Requests board", Icon: CampaignOutlined },
            { key: "mine", path: "/vehicles/mine", labelKey: "topbar.myPublication", label: "My Publication", Icon: LibraryBooksOutlined },
            { key: "reviews", path: "/vehicles/reviews", labelKey: "vehiclesApp.sidebar.reviews", label: "Reviews", Icon: ReviewsOutlined },
        ],
        menu: { profile: "/vehicles/profile", publication: "/vehicles/mine", saved: "/vehicles/saved", alert: "/vehicles/alerts", ...SHARED_MENU },
    },
    // Not available yet: a short description and the link to its presentation page.
    { id: "services-companies", status: "soon", Icon: BusinessCenterOutlined, color: "#7C3AED", home: "/services-companies/description" },
    { id: "daily-worker", status: "soon", Icon: EngineeringOutlined, color: "#0D9488", home: "/daily-worker/description" },
    { id: "delivery-man", status: "soon", Icon: LocalShippingOutlined, color: "#DB2777", home: "/delivery-man/description" },
    { id: "driver", status: "soon", Icon: LocalTaxiOutlined, color: "#CA8A04", home: "/driver/description" },
];

/** Translation key of a service ("services-companies" -> "servicesCompanies"). */
export const textKey = (id) => id.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

export const aboutServiceById = (id) => ABOUT_SERVICES.find((service) => service.id === id) || null;
