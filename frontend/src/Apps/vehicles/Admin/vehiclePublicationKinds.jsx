// src/Apps/vehicles/Admin/vehiclePublicationKinds.jsx
// Colour and icon of each kind of vehicle publication (admin review page and cards).

import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";

export const KIND_META = {
    car: { color: "primary", icon: <DirectionsCarOutlined fontSize="small" /> },
    moto: { color: "warning", icon: <TwoWheelerOutlined fontSize="small" /> },
    part: { color: "success", icon: <BuildOutlined fontSize="small" /> },
};
