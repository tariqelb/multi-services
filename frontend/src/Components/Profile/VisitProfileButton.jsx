// src/Components/Profile/VisitProfileButton.jsx
//
// "Visit profile" button of the details pages. Each service opens its own
// public profile of the publisher:
//   service="property"  /profile/:userId           (properties, roommates, hotels & riads)
//   service="vehicles"  /vehicles/profile/:userId  (vehicles, motos, spare parts)
// tab: opens a tab directly (e.g. "parts", "reviews").

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import { ownerIdOf, publicProfilePath } from "./profilePaths";

export default function VisitProfileButton({ service = "property", userId, tab = "", variant = "outlined", fullWidth = true, size, label, sx }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const id = ownerIdOf(userId);
    if (!id) return null;

    return (
        <Button
            variant={variant}
            size={size}
            startIcon={<AccountCircleOutlinedIcon />}
            onClick={() => navigate(publicProfilePath(service, id, tab))}
            fullWidth={fullWidth}
            sx={sx}
        >
            {label || t("properties.contactOwner.visitProfile", "Visit profile")}
        </Button>
    );
}
