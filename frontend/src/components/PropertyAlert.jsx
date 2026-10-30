

import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Autocomplete,
    TextField,
    Chip,
    Button,
    Stack,
    Divider,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert as MuiAlert,
} from "@mui/material";

import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import Check from "@mui/icons-material/Check";

import axiosInstance from "../api/axiosInstance";

const API_URL = "/property/alerts";

const cities = [
    "Agadir",
    "Ain Harrouda",
    "Aït Melloul",
    "Ait Ourir",
    "Al Hoceima",
    "Azrou",
    "Benguerir",
    "Beni Ansar",
    "Beni Mellal",
    "Benslimane",
    "Berrechid",
    "Berkane",
    "Biougra",
    "Bni Yakhlef",
    "Bouskoura",
    "Bouznika",
    "Casablanca",
    "Dcheira El Jihadia",
    "Dar Bouazza (Tamaris)",
    "Drargua",
    "Ech-challalate",
    "El Jadida",
    "El Kelaa Des Sraghna",
    "Essaouira",
    "Errachidia",
    "Fez",
    "Fquih Ben Salah",
    "Fnideq",
    "Guelmim",
    "Guercif",
    "Inezgane",
    "Kenitra",
    "Khemisset",
    "Khenifra",
    "Khouribga",
    "Ksar El Kebir",
    "Lahraouyine",
    "Larache",
    "Lqliaa",
    "M'diq",
    "Marrakesh",
    "Martil",
    "Mehdya",
    "Meknes",
    "Midelt",
    "Mohammedia",
    "Nador",
    "Ouarzazate",
    "Oued Zem",
    "Oujda",
    "Oulad Teima",
    "Ouazzane",
    "Rabat",
    "Salé",
    "Safi",
    "Sefrou",
    "Settat",
    "Skhirat",
    "Sidi Bennour",
    "Sidi Kacem",
    "Sidi Slimane",
    "Sidi Taibi",
    "Souk El Arbaa",
    "Souk Sebt Ouled Nemma",
    "Taourirt",
    "Tamensourte",
    "Tan-Tan",
    "Tanger",
    "Taza",
    "Temara",
    "Tetouan",
    "Tifelt",
    "Tit Mellil",
    "Tiznit",
    "Youssoufia",
].sort((a, b) => a.localeCompare(b, "en"));

const propertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Store",
    "Office",
    "Land",
    "Warehouse",
    "Commercial space",
    "Commercial store",
    "Garage",
    "Other",
];

const listingTypeOptions = ["For Sale", "For Rent"];

export default function PropertyAlert() {
    const [city, setCity] = useState("Marrakech");
    const [selectedTypes, setSelectedTypes] = useState([
        "Apartment",
        "Villa",
        "House",
    ]);
    const [listingTypes, setListingTypes] = useState(["For Sale"]);
    const [alerts, setAlerts] = useState([]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axiosInstance.get(API_URL);
            setAlerts(response.data.propertyAlerts || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to load your property alerts."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    const togglePropertyType = (type) => {
        setSelectedTypes((previous) =>
            previous.includes(type)
                ? previous.filter((item) => item !== type)
                : [...previous, type]
        );

        setError("");
        setSuccess("");
    };

    const toggleListingType = (type) => {
        setListingTypes((previous) =>
            previous.includes(type)
                ? previous.filter((item) => item !== type)
                : [...previous, type]
        );

        setError("");
        setSuccess("");
    };

    const removeSelectedType = (type) => {
        setSelectedTypes((previous) =>
            previous.filter((item) => item !== type)
        );

        setError("");
        setSuccess("");
    };

    const handleAddAlert = async () => {
        setError("");
        setSuccess("");

        const normalizedCity = city.trim();

        if (!normalizedCity) {
            setError("Please enter or select a city.");
            return;
        }

        if (selectedTypes.length === 0) {
            setError("Please select at least one property type.");
            return;
        }

        if (listingTypes.length === 0) {
            setError("Please select For Sale, For Rent, or both.");
            return;
        }

        const duplicate = alerts.some((alert) => {
            const existingPropertyTypes = alert.propertyTypes || [];
            const existingListingTypes = alert.listingTypes || [];

            return (
                alert.city === city &&
                existingPropertyTypes.length === selectedTypes.length &&
                existingPropertyTypes.every((type) =>
                    selectedTypes.includes(type)
                ) &&
                existingListingTypes.length === listingTypes.length &&
                existingListingTypes.every((type) =>
                    listingTypes.includes(type)
                )
            );
        });

        if (duplicate) {
            setError("This alert already exists.");
            return;
        }

        setSaving(true);

        try {
            const response = await axiosInstance.post(API_URL, {
                city,
                propertyTypes: selectedTypes,
                listingTypes,
            });

            const newAlert = response.data.propertyAlert;

            if (!newAlert) {
                throw new Error(
                    "The server did not return the created alert."
                );
            }

            setAlerts((previous) => [newAlert, ...previous]);
            setSelectedTypes([]);
            setListingTypes([]);
            setSuccess("Property alert created successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Unable to create the property alert."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveAlert = async (id) => {
        setError("");
        setSuccess("");
        setDeletingId(id);

        try {
            await axiosInstance.delete(`${API_URL}/${id}`);

            setAlerts((previous) =>
                previous.filter((alert) => alert._id !== id)
            );

            setSuccess("Property alert deleted successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to delete the property alert."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const sectionTitleSx = {
        fontSize: { xs: "1.05rem", sm: "1.15rem" },
        fontWeight: 700,
        color: "#1e293b",
        mb: 2.5,
    };

    const chipContainerSx = {
        display: "flex",
        flexWrap: "wrap",
        gap: { xs: 1, sm: 1.5 },
        mb: { xs: 4, sm: 5 },
    };

    const selectionChipSx = (selected) => ({
        minHeight: { xs: 40, sm: 44 },
        height: "auto",
        maxWidth: "100%",
        px: { xs: 0.75, sm: 1.25 },
        py: 0.5,
        borderRadius: 2.5,
        fontWeight: 600,
        fontSize: { xs: "0.875rem", sm: "1rem" },
        bgcolor: selected ? "#eff6ff" : "transparent",
        color: selected ? "#1d4ed8" : "#334155",
        borderColor: selected ? "#93c5fd" : "#cbd5e1",
        "& .MuiChip-label": {
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            py: 0.5,
        },
        "& .MuiChip-icon": {
            ml: 1,
        },
        "&:hover": {
            bgcolor: selected ? "#dbeafe" : "#f1f5f9",
        },
    });

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1100,
                mx: "auto",
                px: {
                    xs: 1.5,
                    sm: 3,
                    md: 4,
                },
                py: {
                    xs: 3,
                    sm: 4,
                    md: 6,
                },
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: {
                    xs: 3,
                    sm: 4,
                    md: 5,
                },
                boxSizing: "border-box",
                minWidth: 0,
            }}
        >
            {/* Page header */}
            <Stack
                direction="row"
                alignItems="center"
                spacing={{ xs: 1.5, sm: 2.5, md: 3 }}
                sx={{
                    width: "100%",
                    minWidth: 0,
                    borderBottom: "1px solid #939292",
                    pb: { xs: 2.5, sm: 3, md: 4 },
                }}
            >
                <Box
                    sx={{
                        width: { xs: 46, sm: 56, md: 64 },
                        height: { xs: 46, sm: 56, md: 64 },
                        borderRadius: { xs: 2.5, sm: 3 },
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.1)",
                        flexShrink: 0,
                    }}
                >
                    <NotificationsActiveOutlined
                        sx={{ fontSize: { xs: 27, sm: 32, md: 36 } }}
                    />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="h3"
                        fontWeight={900}
                        color="#0f172a"
                        sx={{
                            fontSize: {
                                xs: "1.5rem",
                                sm: "2rem",
                                md: "2.5rem",
                            },
                            lineHeight: 1.2,
                            mb: 1,
                            overflowWrap: "anywhere",
                        }}
                    >
                        Property Alerts
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{
                            fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                            lineHeight: 1.7,
                        }}
                    >
                        Get notified about properties matching your preferences.
                    </Typography>
                </Box>
            </Stack>

            {/* Feedback */}
            {error && (
                <MuiAlert
                    severity="error"
                    onClose={() => setError("")}
                    sx={{
                        width: "100%",
                        boxSizing: "border-box",
                        borderRadius: 2,
                        overflowWrap: "anywhere",
                    }}
                >
                    {error}
                </MuiAlert>
            )}

            {success && (
                <MuiAlert
                    severity="success"
                    onClose={() => setSuccess("")}
                    sx={{
                        width: "100%",
                        boxSizing: "border-box",
                        borderRadius: 2,
                        overflowWrap: "anywhere",
                    }}
                >
                    {success}
                </MuiAlert>
            )}

            {/* Create alert form */}
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    p: { xs: 2.5, sm: 4, md: 6 },
                    border: "1px solid #939292",
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: "#ffffff",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                }}
            >
                <Typography
                    variant="h5"
                    fontWeight={800}
                    color="#0f172a"
                    sx={{
                        fontSize: { xs: "1.35rem", sm: "1.5rem", md: "1.6rem" },
                        mb: 2,
                    }}
                >
                    Create an alert
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{
                        fontSize: { xs: "0.9rem", sm: "1rem", md: "1.05rem" },
                        lineHeight: 1.8,
                        mb: { xs: 3.5, sm: 5 },
                    }}
                >
                    Select a city, listing type, and one or more property types.
                </Typography>

                {/* City */}
                {/* City autocomplete */}
                <Autocomplete
                    freeSolo
                    fullWidth
                    options={cities}
                    value={city}
                    onChange={(event, newValue) => {
                        setCity(newValue || "");
                        setError("");
                        setSuccess("");
                    }}
                    onInputChange={(event, newInputValue, reason) => {
                        if (reason === "input" || reason === "clear") {
                            setCity(newInputValue);
                            setError("");
                            setSuccess("");
                        }
                    }}
                    filterOptions={(options, { inputValue }) =>
                        options.filter((option) =>
                            option.toLowerCase().includes(inputValue.trim().toLowerCase())
                        )
                    }
                    sx={{
                        mb: { xs: 4, sm: 5 },
                        "& .MuiOutlinedInput-root": {
                            minHeight: { xs: 54, sm: 60 },
                            borderRadius: 2.5,
                            fontSize: { xs: "1rem", sm: "1.05rem" },
                        },
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="City"
                            placeholder="Type or select a city"
                        />
                    )}
                />

                {/* Listing types */}
                <Typography sx={sectionTitleSx}>
                    Listing type
                </Typography>

                <Box sx={chipContainerSx}>
                    {listingTypeOptions.map((type) => {
                        const selected = listingTypes.includes(type);

                        return (
                            <Chip
                                key={type}
                                label={type}
                                clickable
                                onClick={() => toggleListingType(type)}
                                variant={selected ? "filled" : "outlined"}
                                sx={{
                                    ...selectionChipSx(selected),
                                    px: { xs: 1, sm: 1.5 },
                                }}
                            />
                        );
                    })}
                </Box>

                {/* Property types */}
                <Typography sx={sectionTitleSx}>
                    Property types
                </Typography>

                <Box sx={chipContainerSx}>
                    {propertyTypes.map((type) => {
                        const selected = selectedTypes.includes(type);

                        return (
                            <Chip
                                key={type}
                                label={type}
                                icon={
                                    selected ? (
                                        <Check
                                            sx={{
                                                color: "#1d4ed8 !important",
                                                fontSize: "1.2rem !important",
                                            }}
                                        />
                                    ) : undefined
                                }
                                clickable
                                onClick={() => togglePropertyType(type)}
                                variant={selected ? "filled" : "outlined"}
                                sx={selectionChipSx(selected)}
                            />
                        );
                    })}
                </Box>

                {/* Selection summary */}
                <Box
                    sx={{
                        bgcolor: "#f8fafc",
                        border: "1px solid #939292",
                        borderRadius: 3,
                        p: { xs: 2, sm: 3 },
                        mb: { xs: 3, sm: 4 },
                        minWidth: 0,
                    }}
                >
                    <Typography
                        fontWeight={700}
                        sx={{
                            fontSize: { xs: "1rem", sm: "1.1rem" },
                            color: "#0f172a",
                            mb: 1.5,
                        }}
                    >
                        Selected for this alert ({selectedTypes.length})
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{
                            fontSize: { xs: "0.9rem", sm: "1rem" },
                            lineHeight: 1.7,
                            mb: 2,
                            overflowWrap: "anywhere",
                        }}
                    >
                        {city || "Any city"} ·{" "}
                        {listingTypes.length
                            ? listingTypes.join(", ")
                            : "No listing type selected"}
                    </Typography>

                    {selectedTypes.length > 0 ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1.2,
                            }}
                        >
                            {selectedTypes.map((type) => (
                                <Chip
                                    key={type}
                                    label={type}
                                    onDelete={() => removeSelectedType(type)}
                                    deleteIcon={<Close />}
                                    sx={{
                                        maxWidth: "100%",
                                        height: "auto",
                                        minHeight: 38,
                                        bgcolor: "#ffffff",
                                        border: "1px solid #939292",
                                        fontWeight: 600,
                                        fontSize: { xs: "0.85rem", sm: "0.95rem" },
                                        borderRadius: 2,
                                        "& .MuiChip-label": {
                                            whiteSpace: "normal",
                                            py: 1,
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    ) : (
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                        >
                            No property types selected. Choose at least one above.
                        </Typography>
                    )}
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    startIcon={
                        saving ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <Add />
                        )
                    }
                    disabled={saving || loading}
                    onClick={handleAddAlert}
                    sx={{
                        minHeight: { xs: 50, sm: 58 },
                        bgcolor: "#2563eb",
                        fontWeight: 700,
                        textTransform: "none",
                        py: 1.5,
                        px: 2,
                        borderRadius: 2.5,
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        boxShadow: "0 6px 18px rgba(37, 99, 235, 0.25)",
                        "&:hover": { bgcolor: "#1d4ed8" },
                    }}
                >
                    {saving ? "Saving..." : "Save alert"}
                </Button>
            </Paper>

            {/* Existing alerts */}
            <Box sx={{ width: "100%", minWidth: 0 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: { xs: 2, sm: 3 }, minWidth: 0 }}
                >
                    <Typography
                        variant="h5"
                        fontWeight={800}
                        color="#0f172a"
                        sx={{
                            fontSize: { xs: "1.25rem", sm: "1.45rem", md: "1.6rem" },
                            minWidth: 0,
                        }}
                    >
                        Your alerts
                    </Typography>

                    <Chip
                        label={`${alerts.length} active`}
                        size="medium"
                        color="primary"
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.8rem", sm: "0.95rem" },
                            flexShrink: 0,
                        }}
                    />
                </Stack>

                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            p: { xs: 4, sm: 6 },
                            width: "100%",
                            boxSizing: "border-box",
                            bgcolor: "#ffffff",
                            border: "1px solid #939292",
                            borderRadius: 4,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : alerts.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 5, md: 6 },
                            textAlign: "center",
                            border: "1px dashed #939292",
                            borderRadius: 4,
                            bgcolor: "#ffffff",
                            boxSizing: "border-box",
                        }}
                    >
                        <NotificationsActiveOutlined
                            sx={{
                                fontSize: { xs: 42, sm: 54 },
                                color: "#94a3b8",
                                mb: 2,
                            }}
                        />

                        <Typography
                            fontWeight={700}
                            variant="h6"
                            sx={{
                                fontSize: { xs: "1.05rem", sm: "1.2rem" },
                                mb: 1,
                            }}
                        >
                            No saved alerts yet
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                        >
                            Create your first alert to track matching properties.
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={{ xs: 2, sm: 3 }} sx={{ width: "100%" }}>
                        {alerts.map((alert) => (
                            <Paper
                                key={alert._id}
                                elevation={0}
                                sx={{
                                    width: "100%",
                                    minWidth: 0,
                                    boxSizing: "border-box",
                                    p: { xs: 2.5, sm: 4, md: 5 },
                                    border: "1px solid #939292",
                                    borderRadius: { xs: 3, sm: 4 },
                                    bgcolor: "#ffffff",
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                                }}
                            >
                                {/* Alert heading */}
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    spacing={1.5}
                                    sx={{ width: "100%", minWidth: 0 }}
                                >
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={{ xs: 1.5, sm: 2.5 }}
                                        sx={{ minWidth: 0, flex: 1 }}
                                    >
                                        <Box
                                            sx={{
                                                width: { xs: 42, sm: 52 },
                                                height: { xs: 42, sm: 52 },
                                                flexShrink: 0,
                                                borderRadius: 2.5,
                                                bgcolor: "#eff6ff",
                                                color: "#2563eb",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <NotificationsActiveOutlined
                                                sx={{
                                                    fontSize: {
                                                        xs: 22,
                                                        sm: 26,
                                                    },
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                fontWeight={800}
                                                variant="h6"
                                                sx={{
                                                    fontSize: {
                                                        xs: "1.05rem",
                                                        sm: "1.2rem",
                                                    },
                                                    color: "#0f172a",
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {alert.city}
                                            </Typography>

                                            <Typography
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: {
                                                        xs: "0.85rem",
                                                        sm: "0.95rem",
                                                    },
                                                    mt: 0.5,
                                                }}
                                            >
                                                {(alert.propertyTypes || []).length}{" "}
                                                property type
                                                {(alert.propertyTypes || []).length === 1
                                                    ? ""
                                                    : "s"}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Tooltip title="Delete alert">
                                        <span>
                                            <Button
                                                aria-label={`Delete alert for ${alert.city}`}
                                                disabled={deletingId === alert._id}
                                                onClick={() =>
                                                    handleRemoveAlert(alert._id)
                                                }
                                                sx={{
                                                    flexShrink: 0,
                                                    color: "#ef4444",
                                                    bgcolor: "#fef2f2",
                                                    border: "1px solid #fecaca",
                                                    borderRadius: 2,
                                                    fontSize: "1rem",
                                                    width: "130px",
                                                    height: "40px",
                                                    p: { xs: 1, sm: 1.5 },
                                                    "&:hover": {
                                                        bgcolor: "#fee2e2",
                                                    },
                                                }}
                                            >
                                                {deletingId === alert._id ? (
                                                     <CircularProgress size={22} />
                                                ) : (
                                                    // <Delete />
                                                    <Box>Delete</Box>
                                                )}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Stack>

                                <Divider sx={{ my: { xs: 2.5, sm: 3 } }} />

                                <Stack spacing={{ xs: 2, sm: 2.5 }}>
                                    {/* Listing type chips */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1.2,
                                        }}
                                    >
                                        {(alert.listingTypes || []).map((type) => (
                                            <Chip
                                                key={type}
                                                label={type}
                                                size="medium"
                                                color={
                                                    type === "For Rent"
                                                        ? "info"
                                                        : "success"
                                                }
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: {
                                                        xs: "0.8rem",
                                                        sm: "0.9rem",
                                                    },
                                                    maxWidth: "100%",
                                                }}
                                            />
                                        ))}
                                    </Box>

                                    {/* Property type chips */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1.2,
                                        }}
                                    >
                                        {(alert.propertyTypes || []).map((type) => (
                                            <Chip
                                                key={type}
                                                label={type}
                                                sx={{
                                                    maxWidth: "100%",
                                                    bgcolor: "#f8fafc",
                                                    border: "1px solid #939292",
                                                    color: "#334155",
                                                    fontWeight: 600,
                                                    fontSize: {
                                                        xs: "0.8rem",
                                                        sm: "0.9rem",
                                                    },
                                                    "& .MuiChip-label": {
                                                        whiteSpace: "normal",
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
