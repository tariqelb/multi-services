// src/Apps/Property/Requests/PropertyRequestCta.jsx
//
// "Didn't find it? Post a request": shown where a search finds nothing. The
// request form opens prefilled with the search (city, offer, type, make,
// budget...): see propertyRequestQuery in propertyRequestOptions.js.

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography } from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";

import { REQUEST_BASE } from "./propertyRequestOptions";

export default function PropertyRequestCta({ query = "" }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Box sx={{ mt: 3, p: { xs: 2, sm: 2.5 }, maxWidth: 560, mx: "auto", border: "1px solid #BFDBFE", bgcolor: "#EFF6FF", borderRadius: "16px", textAlign: "center" }}>
            <Typography sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>{t("requests.cta.title", "Didn't find what you need?")}</Typography>
            <Typography variant="body2" sx={{ color: "#334155", mb: 1.5 }}>
                {t("requests.cta.textProperty", "Post a request: owners and agencies in your city are notified and contact you if they have it, even if it isn't published.")}
            </Typography>
            <Button variant="contained" startIcon={<CampaignOutlinedIcon />} onClick={() => navigate(`${REQUEST_BASE}/new${query ? `?${query}` : ""}`)} sx={{ textTransform: "none", fontWeight: 700 }}>
                {t("requests.post", "Post a request")}
            </Button>
        </Box>
    );
}
