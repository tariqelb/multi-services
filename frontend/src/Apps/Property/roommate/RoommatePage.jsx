
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Container,
    Paper,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";

import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";

import RoommateList from "./RoommateList";
import RoommateInsertForm from "./RoommateInsertForm";

export default function RoommatePage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);

    // Switch back to announcements after successful publication.
    const handleListingAdded = () => {
        setActiveTab(0);
    };

    return (
        <Container
            maxWidth="xl"
            sx={{
                py: { xs: 2, md: 4 },
                px: { xs: 1.5, sm: 2, md: 3 },
            }}
        >
            {/* Page header */}
            <Box sx={{ mb: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1,
                    }}
                >
                    <PeopleAltIcon
                        sx={{
                            fontSize: 34,
                            color: "primary.main",
                        }}
                    />

                    <Typography
                        variant="h4"
                        fontWeight={700}
                        sx={{
                            fontSize: {
                                xs: "1.5rem",
                                sm: "1.8rem",
                                md: "2rem",
                            },
                        }}
                    >
                        {t("roommates.title", {
                            defaultValue: "Find a Roommate",
                        })}
                    </Typography>
                </Box>

                <Typography
                    color="text.secondary"
                    sx={{ maxWidth: 750 }}
                >
                    {t("roommates.subtitle", {
                        defaultValue:
                            "Find a room, share your property, or connect with people looking to rent together.",
                    })}
                </Typography>
            </Box>

            {/* Tabs */}
            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                        "& .MuiTab-root": {
                            minHeight: 58,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: {
                                xs: "0.8rem",
                                sm: "0.95rem",
                            },
                        },
                    }}
                >
                    <Tab
                        icon={<PeopleAltIcon />}
                        iconPosition="start"
                        label={t("roommates.announcements", {
                            defaultValue: "Announcements",
                        })}
                    />

                    <Tab
                        icon={<AddCircleOutlineOutlinedIcon />}
                        iconPosition="start"
                        label={t("roommates.addAnnouncement", {
                            defaultValue: "Add an announcement",
                        })}
                    />
                </Tabs>
            </Paper>

            {/* Announcements tab */}
            {activeTab === 0 && <RoommateList />}

            {/* Add announcement tab */}
            {activeTab === 1 && (
                <RoommateInsertForm
                    onAddListing={handleListingAdded}
                />
            )}
        </Container>
    );
}
