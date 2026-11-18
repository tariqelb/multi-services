
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Typography,
    TextField,
    Grid,
    ToggleButtonGroup,
    ToggleButton,
    FormControlLabel,
    Switch,
    Box,
} from "@mui/material";

export default function PropertyInsertFormOwnerInfo({
    formData,
    handleChange,
    handleRoleChange,
    fieldSx,
    SectionPaper,
    SectionHeader,
    errors = {},
}) {
    const { t } = useTranslation();

    const whatsappNumber = formData.whatsappPhoneNumber || "";

    return (
        <SectionPaper>
            <SectionHeader
                icon="👤"
                title={t("properties.insert.ownerInfo.title")}
                subtitle={t("properties.insert.ownerInfo.subtitle")}
                number={1}
            />

            <Typography
                variant="body2"
                sx={{
                    fontWeight: 650,
                    color: "#344054",
                    mb: 1.5,
                }}
            >
                {t("properties.insert.ownerInfo.roleLabel")}
            </Typography>

            <ToggleButtonGroup
                value={formData.role || "Owner"}
                exclusive
                onChange={handleRoleChange}
                aria-label={t("properties.insert.ownerInfo.roleLabel")}
                fullWidth
                sx={{
                    display: "flex",
                    gap: 1.5,
                    mb: 3,
                    border: 0,
                    "& .MuiToggleButton-root": {
                        flex: 1,
                        minWidth: 0,
                        py: 1.3,
                        px: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: {
                            xs: "0.72rem",
                            sm: "0.88rem",
                        },
                        color: "#667085",
                        border: "1px solid #D5DCE8",
                        borderRadius: "10px !important",
                        "&.Mui-selected": {
                            color: "#2563EB",
                            bgcolor: "#EFF6FF",
                            borderColor: "#93C5FD",
                        },
                    },
                }}
            >
                <ToggleButton value="Owner">
                    {t("properties.insert.ownerInfo.roles.owner")}
                </ToggleButton>

                <ToggleButton value="Real Estate Agent">
                    {t("properties.insert.ownerInfo.roles.agent")}
                </ToggleButton>

                <ToggleButton value="Agency">
                    {t("properties.insert.ownerInfo.roles.agency")}
                </ToggleButton>
            </ToggleButtonGroup>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        label={t("properties.insert.ownerInfo.firstName")}
                        value={formData.firstName || ""}
                        slotProps={{
                            input: { readOnly: true },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        label={t("properties.insert.ownerInfo.lastName")}
                        value={formData.lastName || ""}
                        slotProps={{
                            input: { readOnly: true },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        type="email"
                        label={t("properties.insert.ownerInfo.email")}
                        value={formData.email || ""}
                        slotProps={{
                            input: { readOnly: true },
                        }}
                    />

                    <Box sx={{ mt: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    name="showEmail"
                                    checked={Boolean(formData.showEmail)}
                                    onChange={handleChange}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography
                                    variant="body2"
                                    sx={{ color: "#475467" }}
                                >
                                    {t("properties.insert.ownerInfo.showEmail")}
                                </Typography>
                            }
                        />
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        label={t("properties.insert.ownerInfo.whatsapp")}
                        value={whatsappNumber}
                        placeholder={t("properties.insert.ownerInfo.noWhatsapp")}
                        slotProps={{
                            input: { readOnly: true },
                        }}
                    />

                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            mt: 0.8,
                            color: whatsappNumber
                                ? "#16a34a"
                                : "#dc2626",
                        }}
                    >
                        {whatsappNumber
                            ? t("properties.insert.ownerInfo.whatsappVerified")
                            : t("properties.insert.ownerInfo.whatsappMissing")}
                    </Typography>
                </Grid>
            </Grid>
        </SectionPaper>
    );
}
