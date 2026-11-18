
import React from "react";
import {
    Paper,
    Stack,
    TextField,
    MenuItem,
    Typography,
} from "@mui/material";
import HomeWorkIcon from "@mui/icons-material/HomeWork";

import { SectionHeader } from "./RoommateFormUI";

export default function RoommateAnnouncementSection({
    formData,
    errors,
    onChange,
    t,
}) {
    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <SectionHeader
                icon={<HomeWorkIcon />}
                title={translate(
                    "roommates.form.announcement",
                    "Announcement"
                )}
                subtitle={translate(
                    "roommates.form.announcementDescription",
                    "Introduce your accommodation or explain what you are looking for."
                )}
            />

            <Stack spacing={2.5}>
                <TextField
                    fullWidth
                    required
                    label={translate(
                        "roommates.form.title",
                        "Title"
                    )}
                    name="title"
                    value={formData.title}
                    onChange={onChange}
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                    placeholder={translate(
                        "roommates.form.titlePlaceholder",
                        "Example: Looking for 2 roommates in Marrakech"
                    )}
                />

                <TextField
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    label={translate(
                        "roommates.form.description",
                        "Description"
                    )}
                    name="description"
                    value={formData.description}
                    onChange={onChange}
                    error={Boolean(errors.description)}
                    helperText={errors.description}
                    placeholder={translate(
                        "roommates.form.descriptionPlaceholder",
                        "Describe the accommodation and expectations."
                    )}
                />

                <TextField
                    select
                    fullWidth
                    required
                    label={translate(
                        "roommates.form.purpose",
                        "Purpose"
                    )}
                    name="purpose"
                    value={formData.purpose}
                    onChange={onChange}
                    error={Boolean(errors.purpose)}
                    helperText={errors.purpose}
                >
                    {[
                        {
                            value: "Share My Apartment",
                            label: translate(
                                "roommates.purpose.shareApartment",
                                "Share my apartment"
                            ),
                        },
                        {
                            value: "Find a Room",
                            label: translate(
                                "roommates.purpose.findRoom",
                                "Find a room"
                            ),
                        },
                        {
                            value: "Rent Together",
                            label: translate(
                                "roommates.purpose.rentTogether",
                                "Rent together"
                            ),
                        },
                    ].map((option) => (
                        <MenuItem
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>
        </Paper>
    );
}
