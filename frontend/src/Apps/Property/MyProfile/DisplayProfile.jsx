
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Card,
    CardContent,
    Grid,
    Stack,
    Typography,
} from "@mui/material";

import {
    Person,
    Email,
    Phone,
    LocationOn,
    Description,
} from "@mui/icons-material";

const fields = [
    {
        key: "firstName",
        label: "First name",
        icon: Person,
    },
    {
        key: "lastName",
        label: "Last name",
        icon: Person,
    },
    {
        key: "email",
        label: "Email address",
        icon: Email,
    },
    {
        key: "phoneNumber",
        label: "Phone number",
        icon: Phone,
    },
    {
        key: "address",
        label: "Address",
        icon: LocationOn,
        fullWidth: true,
    },
    {
        key: "bio",
        label: "Bio",
        icon: Description,
        fullWidth: true,
    },
];

export default function DisplayProfile({ profile = {} }) {
    const { t } = useTranslation();

    return (
        <Card
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                overflow: "hidden",
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={0.5} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                        {t(
                            "myProfile.personalInformation.title",
                            "Personal information"
                        )}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {t(
                            "myProfile.personalInformation.subtitle",
                            "Your personal details and contact information."
                        )}
                    </Typography>
                </Stack>

                <Grid container spacing={2}>
                    {fields.map((field) => {
                        const Icon = field.icon;
                        const value = profile[field.key];

                        return (
                            <Grid
                                key={field.key}
                                size={{
                                    xs: 12,
                                    sm: field.fullWidth ? 12 : 6,
                                }}
                            >
                                <Box
                                    sx={{
                                        height: "100%",
                                        minWidth: 0,
                                        p: 2,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        bgcolor: "background.default",
                                        transition: "border-color 0.2s",
                                        "&:hover": {
                                            borderColor: "primary.light",
                                        },
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{ mb: 1.2 }}
                                    >
                                        <Icon
                                            fontSize="small"
                                            color="action"
                                        />

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight={700}
                                        >
                                            {t(
                                                `myProfile.personalInformation.${field.key}`,
                                                field.label
                                            )}
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        sx={{
                                            minHeight: 24,
                                            whiteSpace: "pre-line",
                                            overflowWrap: "anywhere",
                                            color: value
                                                ? "text.primary"
                                                : "text.disabled",
                                        }}
                                    >
                                        {value ||
                                            t(
                                                "myProfile.personalInformation.notProvided",
                                                "Not provided"
                                            )}
                                    </Typography>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </CardContent>
        </Card>
    );
}
