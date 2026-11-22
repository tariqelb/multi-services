// Colour and icon of each kind of publication (review page and cards).

import Groups2Outlined from "@mui/icons-material/Groups2Outlined";
import HomeWorkOutlined from "@mui/icons-material/HomeWorkOutlined";
import HotelOutlined from "@mui/icons-material/HotelOutlined";

export const KIND_META = {
    property: { color: "primary", icon: <HomeWorkOutlined fontSize="small" /> },
    establishment: { color: "secondary", icon: <HotelOutlined fontSize="small" /> },
    roommate: { color: "info", icon: <Groups2Outlined fontSize="small" /> },
};
