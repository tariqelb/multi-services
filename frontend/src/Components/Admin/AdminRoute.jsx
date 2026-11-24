// src/Components/Admin/AdminRoute.jsx
//
// Guard of an admin panel page: admins, and members who were given its
// section. Members with "read" only see a "view only" notice (the server
// refuses their changes).

import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { pagePaddingSx } from "../ui/PageContainer";
import { useAdminAccess } from "./adminSections";

export default function AdminRoute({ section, children }) {
    const { t } = useTranslation();
    const access = useAdminAccess();

    if (!access.can(section)) {
        // Another section they can open, or the home page.
        return <Navigate to={access.firstPath || "/"} replace />;
    }

    if (access.level(section) === "read") {
        return (
            <>
                <Box sx={{ ...pagePaddingSx, pb: 0 }}>
                    <Alert severity="info" icon={<VisibilityOutlinedIcon />} sx={{ borderRadius: "12px" }}>
                        {t("adminPanel.viewOnly", "View only: you can see this page, but changes (delete, edit, status) are reserved to the team members with write access.")}
                    </Alert>
                </Box>
                {children}
            </>
        );
    }

    return children;
}

/** /admin: first page this user can open. */
export function AdminHome() {
    const access = useAdminAccess();
    return <Navigate to={access.firstPath || "/"} replace />;
}
