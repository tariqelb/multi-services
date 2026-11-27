import { useTranslation } from "react-i18next";
import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Floating "publish" button, bottom right. Defaults to properties; pass
// `to`, `label` and `tooltip` to reuse it (e.g. hotels & riads).
export default function PublishFab({ to = "/properties/publish", label, tooltip }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <Tooltip title={tooltip || t("publishFab.tooltip", "Publish a new property listing")} placement="left">
            <Fab
                variant="extended"
                color="primary"
                aria-label={label || t("publishFab.label", "Add property")}
                onClick={() => navigate(to)}
                sx={{
                    position: 'fixed !important',
                    bottom: { xs: 16, md: 32 },
                    insetInlineEnd: { xs: 16, md: 32 },
                    zIndex: 9999,
                    bgcolor: '#2563EB',
                    color: '#ffffff',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                    '&:hover': {
                        bgcolor: '#1D4ED8',
                    },
                }}
            >
                <AddIcon sx={{ marginInlineEnd: 1, fontSize: 24 }} />
                {label || t("publishFab.label", "Add property")}
            </Fab>
        </Tooltip>
    );
}