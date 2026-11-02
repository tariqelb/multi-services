import React from "react";

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
    const whatsappNumber = formData.whatsappPhoneNumber || "";

    return (
        <SectionPaper>
            <SectionHeader
                icon="👤"
                title="Owner Information"
                subtitle="Who is listing this property?"
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
                Your role regarding this property *
            </Typography>

            <ToggleButtonGroup
                value={formData.role || "Owner"}
                exclusive
                onChange={handleRoleChange}
                aria-label="property role"
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
                        border: "1px solid #e1e6ef",
                        borderRadius: "10px !important",
                        "&.Mui-selected": {
                            color: "#4f46e5",
                            bgcolor: "#ececec",
                            borderColor: "#a5b4fc",
                        },
                    },
                }}
            >
                <ToggleButton value="Owner">
                    Property Owner
                </ToggleButton>

                <ToggleButton value="Real Estate Agent">
                    Real Estate Agent
                </ToggleButton>

                <ToggleButton value="Agency">
                    Real Estate Agency
                </ToggleButton>
            </ToggleButtonGroup>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        sx={fieldSx}
                        label="First Name"
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
                        label="Last Name"
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
                        label="Email Address"
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
                                    Display my email publicly
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
                        label="WhatsApp Number"
                        value={whatsappNumber}
                        placeholder="No verified WhatsApp number found"
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
                            ? "Your WhatsApp number will be used as the property contact."
                            : "No WhatsApp number found. Please update your WhatsApp information in your profile."}
                    </Typography>
                </Grid>
            </Grid>
        </SectionPaper>
    );
}