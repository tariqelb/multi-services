// src/Components/listings/ReportListingLink.jsx
// "Report this listing": opens the feedback page filled in with this listing.

import { useTranslation } from "react-i18next";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Button } from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";

export default function ReportListingLink({ title = "", owner = "" }) {
    const { t } = useTranslation();
    const { pathname } = useLocation();

    const params = new URLSearchParams({ report: pathname, title, owner });

    return (
        <Button
            component={RouterLink}
            to={`/feedback?${params.toString()}`}
            size="small"
            color="inherit"
            startIcon={<FlagOutlinedIcon fontSize="small" />}
            sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600, alignSelf: "flex-start" }}
        >
            {t("listingReport.link", "Report this listing")}
        </Button>
    );
}
