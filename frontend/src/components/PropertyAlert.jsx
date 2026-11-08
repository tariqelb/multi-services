
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
    Tooltip,
    CircularProgress,
    Alert as MuiAlert,
} from "@mui/material";

import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import Check from "@mui/icons-material/Check";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlined from "@mui/icons-material/UnarchiveOutlined";

import axiosInstance from "../api/axiosInstance";

const API_URL = "/property/alerts";

const cities = [
    "Agadir", "Ain Harrouda", "Aït Melloul", "Ait Ourir",
    "Al Hoceima", "Azrou", "Benguerir", "Beni Ansar",
    "Beni Mellal", "Benslimane", "Berrechid", "Berkane",
    "Biougra", "Bni Yakhlef", "Bouskoura", "Bouznika",
    "Casablanca", "Dcheira El Jihadia", "Dar Bouazza (Tamaris)",
    "Drargua", "Ech-challalate", "El Jadida",
    "El Kelaa Des Sraghna", "Essaouira", "Errachidia",
    "Fez", "Fquih Ben Salah", "Fnideq", "Guelmim",
    "Guercif", "Inezgane", "Kenitra", "Khemisset",
    "Khenifra", "Khouribga", "Ksar El Kebir",
    "Lahraouyine", "Larache", "Lqliaa", "M'diq",
    "Marrakesh", "Martil", "Mehdya", "Meknes",
    "Midelt", "Mohammedia", "Nador", "Ouarzazate",
    "Oued Zem", "Oujda", "Oulad Teima", "Ouazzane",
    "Rabat", "Salé", "Safi", "Sefrou", "Settat",
    "Skhirat", "Sidi Bennour", "Sidi Kacem",
    "Sidi Slimane", "Sidi Taibi", "Souk El Arbaa",
    "Souk Sebt Ouled Nemma", "Taourirt", "Tamensourte",
    "Tan-Tan", "Tanger", "Taza", "Temara",
    "Tetouan", "Tifelt", "Tit Mellil", "Tiznit",
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

const propertyTypeTranslationKeys = {
    Apartment: "apartment",
    House: "house",
    Villa: "villa",
    Studio: "studio",
    Room: "room",
    Store: "store",
    Office: "office",
    Land: "land",
    Warehouse: "warehouse",
    "Commercial space": "commercialSpace",
    "Commercial store": "commercialStore",
    Garage: "garage",
    Other: "other",
};

export default function PropertyAlert() {
    const { t } = useTranslation();

    const [city, setCity] = useState("Marrakesh");
    const [selectedTypes, setSelectedTypes] = useState([
        "Apartment",
        "Villa",
        "House",
    ]);
    const [listingTypes, setListingTypes] = useState(["For Sale"]);

    const [alerts, setAlerts] = useState([]);
    const [archivedAlerts, setArchivedAlerts] = useState([]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [archivingId, setArchivingId] = useState(null);
    const [restoringId, setRestoringId] = useState(null);

    const getPropertyTypeLabel = (type) => {
        const key = propertyTypeTranslationKeys[type];

        return key
            ? t(`properties.categories.${key}`)
            : type;
    };

    const getListingTypeLabel = (type) => {
        const keys = {
            "For Sale": "properties.card.forSale",
            "For Rent": "properties.card.forRent",
        };

        return keys[type] ? t(keys[type]) : type;
    };

    // Load both active and archived alerts.
    const loadAlerts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axiosInstance.get(API_URL, {
                params: {
                    includeArchived: true,
                },
            });

            const propertyAlerts =
                response.data.propertyAlerts || [];

            setAlerts(
                propertyAlerts.filter(
                    (alert) => !alert.isArchived
                )
            );

            setArchivedAlerts(
                propertyAlerts.filter(
                    (alert) => alert.isArchived
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("properties.alerts.errors.load")
            );
        } finally {
            setLoading(false);
        }
    }, [t]);

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

    // Create a new property alert.
    const handleAddAlert = async () => {
        setError("");
        setSuccess("");

        const normalizedCity = city.trim();

        if (!normalizedCity) {
            setError(t("properties.alerts.errors.cityRequired"));
            return;
        }

        if (selectedTypes.length === 0) {
            setError(
                t("properties.alerts.errors.propertyTypeRequired")
            );
            return;
        }

        if (listingTypes.length === 0) {
            setError(
                t("properties.alerts.errors.listingTypeRequired")
            );
            return;
        }

        // Only active alerts should prevent duplicate creation.
        const duplicate = alerts.some((alert) => {
            const existingPropertyTypes =
                alert.propertyTypes || [];

            const existingListingTypes =
                alert.listingTypes || [];

            return (
                alert.city.trim().toLowerCase() ===
                    normalizedCity.toLowerCase() &&
                existingPropertyTypes.length ===
                    selectedTypes.length &&
                existingPropertyTypes.every((type) =>
                    selectedTypes.includes(type)
                ) &&
                existingListingTypes.length ===
                    listingTypes.length &&
                existingListingTypes.every((type) =>
                    listingTypes.includes(type)
                )
            );
        });

        if (duplicate) {
            setError(t("properties.alerts.errors.duplicate"));
            return;
        }

        setSaving(true);

        try {
            const response = await axiosInstance.post(API_URL, {
                city: normalizedCity,
                propertyTypes: selectedTypes,
                listingTypes,
            });

            const newAlert = response.data.propertyAlert;

            if (!newAlert) {
                throw new Error(
                    t("properties.alerts.errors.missingCreatedAlert")
                );
            }

            setAlerts((previous) => [
                newAlert,
                ...previous,
            ]);

            setSelectedTypes([]);
            setListingTypes([]);

            setSuccess(
                t("properties.alerts.success.created")
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    t("properties.alerts.errors.create")
            );
        } finally {
            setSaving(false);
        }
    };

    // Archive an active alert instead of deleting it.
    const handleArchiveAlert = async (id) => {
        setError("");
        setSuccess("");
        setArchivingId(id);

        try {
            await axiosInstance.delete(`${API_URL}/${id}`);

            const archivedAlert = alerts.find(
                (alert) => alert._id === id
            );

            if (archivedAlert) {
                setAlerts((previous) =>
                    previous.filter(
                        (alert) => alert._id !== id
                    )
                );

                setArchivedAlerts((previous) => [
                    {
                        ...archivedAlert,
                        isArchived: true,
                    },
                    ...previous,
                ]);
            }

            setSuccess(
                t(
                    "properties.alerts.successArchive.archived",
                    "Alert archived successfully."
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t(
                        "properties.alerts.errorsArchive.archive",
                        "Failed to archive alert."
                    )
            );
        } finally {
            setArchivingId(null);
        }
    };

    // Restore an archived alert.
    const handleRestoreAlert = async (id) => {
        setError("");
        setSuccess("");
        setRestoringId(id);

        try {
            const response = await axiosInstance.patch(
                `${API_URL}/${id}/restore`
            );

            const restoredAlert =
                response.data.propertyAlert ||
                archivedAlerts.find(
                    (alert) => alert._id === id
                );

            if (restoredAlert) {
                setArchivedAlerts((previous) =>
                    previous.filter(
                        (alert) => alert._id !== id
                    )
                );

                setAlerts((previous) => [
                    {
                        ...restoredAlert,
                        isArchived: false,
                    },
                    ...previous,
                ]);
            }

            setSuccess(
                t(
                    "properties.alerts.successArchive.restored",
                    "Alert restored successfully."
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t(
                        "properties.alerts.errorsArchive.restore",
                        "Failed to restore alert."
                    )
            );
        } finally {
            setRestoringId(null);
        }
    };

    const sectionTitleSx = {
        fontSize: { xs: "1.05rem", sm: "1.15rem" },
        fontWeight: 700,
        color: "#0F172A",
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
        borderRadius: "10px",
        fontWeight: 600,
        fontSize: { xs: "0.875rem", sm: "1rem" },
        bgcolor: selected ? "#eff6ff" : "transparent",
        color: selected ? "#1d4ed8" : "#334155",
        borderColor: selected ? "#93c5fd" : "#D5DCE8",
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

    // Shared alert card for active and archived alerts.
    const renderAlertCard = (alert, archived = false) => {
        const busy =
            archivingId === alert._id ||
            restoringId === alert._id;

        return (
            <Paper
                key={alert._id}
                elevation={0}
                sx={{
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    p: { xs: 2.5, sm: 4, md: 5 },
                    border: "1px solid #E2E8F0",
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: archived ? "#F8FAFC" : "#ffffff",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                    opacity: archived ? 0.9 : 1,
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={{ xs: 1.5, sm: 2.5 }}
                        sx={{
                            minWidth: 0,
                            flex: 1,
                        }}
                    >
                        <Box
                            sx={{
                                width: { xs: 42, sm: 52 },
                                height: { xs: 42, sm: 52 },
                                flexShrink: 0,
                                borderRadius: "10px",
                                bgcolor: archived
                                    ? "#F1F5F9"
                                    : "#eff6ff",
                                color: archived
                                    ? "#64748B"
                                    : "#2563EB",
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
                                fontWeight={700}
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
                                {t(
                                    "properties.alerts.propertyTypeCount",
                                    {
                                        count: (
                                            alert.propertyTypes || []
                                        ).length,
                                    }
                                )}
                            </Typography>
                        </Box>
                    </Stack>

                    {archived ? (
                        <Tooltip
                            title={t(
                                "properties.alerts.restoreAlert",
                                "Restore alert"
                            )}
                        >
                            <span>
                                <Button
                                    aria-label={t(
                                        "properties.alerts.restoreAlert",
                                        "Restore alert"
                                    )}
                                    disabled={busy}
                                    onClick={() =>
                                        handleRestoreAlert(alert._id)
                                    }
                                    startIcon={
                                        restoringId === alert._id ? (
                                            <CircularProgress
                                                size={17}
                                                color="inherit"
                                            />
                                        ) : (
                                            <UnarchiveOutlined />
                                        )
                                    }
                                    sx={{
                                        flexShrink: 0,
                                        color: "#15803D",
                                        bgcolor: "#F0FDF4",
                                        border: "1px solid #BBF7D0",
                                        borderRadius: 2,
                                        fontSize: "0.9rem",
                                        minWidth: {
                                            xs: "105px",
                                            sm: "125px",
                                        },
                                        height: 40,
                                        px: 1.5,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": {
                                            bgcolor: "#DCFCE7",
                                        },
                                    }}
                                >
                                    {restoringId === alert._id
                                        ? t(
                                              "properties.alerts.restoring",
                                              "Restoring..."
                                          )
                                        : t(
                                              "properties.alerts.restore",
                                              "Restore"
                                          )}
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Tooltip
                            title={t(
                                "properties.alerts.archiveAlert",
                                "Archive alert"
                            )}
                        >
                            <span>
                                <Button
                                    aria-label={t(
                                        "properties.alerts.archiveAlertForCity",
                                        {
                                            city: alert.city,
                                            defaultValue: `Archive alert for ${alert.city}`,
                                        }
                                    )}
                                    disabled={busy}
                                    onClick={() =>
                                        handleArchiveAlert(alert._id)
                                    }
                                    startIcon={
                                        archivingId === alert._id ? (
                                            <CircularProgress
                                                size={17}
                                                color="inherit"
                                            />
                                        ) : (
                                            <ArchiveOutlined />
                                        )
                                    }
                                    sx={{
                                        flexShrink: 0,
                                        color: "#B45309",
                                        bgcolor: "#FFFBEB",
                                        border: "1px solid #FDE68A",
                                        borderRadius: 2,
                                        fontSize: "0.9rem",
                                        minWidth: {
                                            xs: "105px",
                                            sm: "125px",
                                        },
                                        height: 40,
                                        px: 1.5,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": {
                                            bgcolor: "#FEF3C7",
                                        },
                                    }}
                                >
                                    {archivingId === alert._id
                                        ? t(
                                              "properties.alerts.archiving",
                                              "Archiving..."
                                          )
                                        : t(
                                              "properties.alerts.archive",
                                              "Archive"
                                          )}
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Stack>

                {archived && (
                    <Chip
                        size="small"
                        icon={<ArchiveOutlined />}
                        label={t(
                            "properties.alerts.archivedLabel",
                            "Archived"
                        )}
                        sx={{
                            mt: 2,
                            bgcolor: "#F1F5F9",
                            color: "#475569",
                            fontWeight: 700,
                        }}
                    />
                )}

                <Divider sx={{ my: { xs: 2.5, sm: 3 } }} />

                <Stack spacing={{ xs: 2, sm: 2.5 }}>
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
                                label={getListingTypeLabel(type)}
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
                                label={getPropertyTypeLabel(type)}
                                sx={{
                                    maxWidth: "100%",
                                    bgcolor: "#f8fafc",
                                    border: "1px solid #E2E8F0",
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
        );
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1100,
                mx: "auto",
                px: { xs: 1.5, sm: 3, md: 4 },
                py: { xs: 3, sm: 4, md: 6 },
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: { xs: 3, sm: 4, md: 5 },
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
                    borderBottom: "1px solid #E2E8F0",
                    pb: { xs: 2.5, sm: 3, md: 4 },
                }}
            >
                <Box
                    sx={{
                        width: { xs: 46, sm: 56, md: 64 },
                        height: { xs: 46, sm: 56, md: 64 },
                        borderRadius: { xs: 2.5, sm: 3 },
                        bgcolor: "#eff6ff",
                        color: "#2563EB",
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
                        variant="h4"
                        component="h1"
                        fontWeight={700}
                        color="#0f172a"
                        sx={{
                            fontSize: {
                                xs: "1.5rem",
                                sm: "1.75rem",
                                md: "1.875rem",
                            },
                            lineHeight: 1.2,
                            mb: 1,
                            overflowWrap: "anywhere",
                        }}
                    >
                        {t("properties.alerts.title")}
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{
                            fontSize: {
                                xs: "0.9rem",
                                sm: "1rem",
                                md: "1.1rem",
                            },
                            lineHeight: 1.7,
                        }}
                    >
                        {t("properties.alerts.subtitle")}
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
                    border: "1px solid #E2E8F0",
                    borderRadius: { xs: 3, sm: 4 },
                    bgcolor: "#ffffff",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                }}
            >
                <Typography
                    variant="h5"
                    fontWeight={700}
                    color="#0f172a"
                    sx={{
                        fontSize: {
                            xs: "1.35rem",
                            sm: "1.5rem",
                            md: "1.6rem",
                        },
                        mb: 2,
                    }}
                >
                    {t("properties.alerts.createTitle")}
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{
                        fontSize: {
                            xs: "0.9rem",
                            sm: "1rem",
                            md: "1.05rem",
                        },
                        lineHeight: 1.8,
                        mb: { xs: 3.5, sm: 5 },
                    }}
                >
                    {t("properties.alerts.createSubtitle")}
                </Typography>

                {/* City */}
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
                        if (
                            reason === "input" ||
                            reason === "clear"
                        ) {
                            setCity(newInputValue);
                            setError("");
                            setSuccess("");
                        }
                    }}
                    filterOptions={(options, { inputValue }) =>
                        options.filter((option) =>
                            option
                                .toLowerCase()
                                .includes(
                                    inputValue.trim().toLowerCase()
                                )
                        )
                    }
                    sx={{
                        mb: { xs: 4, sm: 5 },
                        "& .MuiOutlinedInput-root": {
                            minHeight: { xs: 54, sm: 60 },
                            borderRadius: "10px",
                            fontSize: {
                                xs: "1rem",
                                sm: "1.05rem",
                            },
                        },
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t("properties.alerts.city")}
                            placeholder={t(
                                "properties.alerts.cityPlaceholder"
                            )}
                        />
                    )}
                />

                {/* Listing types */}
                <Typography sx={sectionTitleSx}>
                    {t("properties.alerts.listingType")}
                </Typography>

                <Box sx={chipContainerSx}>
                    {listingTypeOptions.map((type) => {
                        const selected =
                            listingTypes.includes(type);

                        return (
                            <Chip
                                key={type}
                                label={getListingTypeLabel(type)}
                                clickable
                                onClick={() =>
                                    toggleListingType(type)
                                }
                                variant={
                                    selected ? "filled" : "outlined"
                                }
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
                    {t("properties.alerts.propertyTypes")}
                </Typography>

                <Box sx={chipContainerSx}>
                    {propertyTypes.map((type) => {
                        const selected =
                            selectedTypes.includes(type);

                        return (
                            <Chip
                                key={type}
                                label={getPropertyTypeLabel(type)}
                                icon={
                                    selected ? (
                                        <Check
                                            sx={{
                                                color:
                                                    "#1d4ed8 !important",
                                                fontSize:
                                                    "1.2rem !important",
                                            }}
                                        />
                                    ) : undefined
                                }
                                clickable
                                onClick={() =>
                                    togglePropertyType(type)
                                }
                                variant={
                                    selected ? "filled" : "outlined"
                                }
                                sx={selectionChipSx(selected)}
                            />
                        );
                    })}
                </Box>

                {/* Selection summary */}
                <Box
                    sx={{
                        bgcolor: "#f8fafc",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        p: { xs: 2, sm: 3 },
                        mb: { xs: 3, sm: 4 },
                        minWidth: 0,
                    }}
                >
                    <Typography
                        fontWeight={700}
                        sx={{
                            fontSize: {
                                xs: "1rem",
                                sm: "1.1rem",
                            },
                            color: "#0f172a",
                            mb: 1.5,
                        }}
                    >
                        {t(
                            "properties.alerts.selectedForAlert",
                            {
                                count: selectedTypes.length,
                            }
                        )}
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{
                            fontSize: {
                                xs: "0.9rem",
                                sm: "1rem",
                            },
                            lineHeight: 1.7,
                            mb: 2,
                            overflowWrap: "anywhere",
                        }}
                    >
                        {city || t("properties.alerts.anyCity")} ·{" "}
                        {listingTypes.length
                            ? listingTypes
                                  .map(getListingTypeLabel)
                                  .join(", ")
                            : t(
                                  "properties.alerts.noListingType"
                              )}
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
                                    label={getPropertyTypeLabel(type)}
                                    onDelete={() =>
                                        removeSelectedType(type)
                                    }
                                    deleteIcon={<Close />}
                                    sx={{
                                        maxWidth: "100%",
                                        height: "auto",
                                        minHeight: 38,
                                        bgcolor: "#ffffff",
                                        border: "1px solid #E2E8F0",
                                        fontWeight: 600,
                                        fontSize: {
                                            xs: "0.85rem",
                                            sm: "0.95rem",
                                        },
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
                            sx={{
                                fontSize: {
                                    xs: "0.9rem",
                                    sm: "1rem",
                                },
                            }}
                        >
                            {t(
                                "properties.alerts.noPropertyTypes"
                            )}
                        </Typography>
                    )}
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    startIcon={
                        saving ? (
                            <CircularProgress
                                size={20}
                                color="inherit"
                            />
                        ) : (
                            <Add />
                        )
                    }
                    disabled={saving || loading}
                    onClick={handleAddAlert}
                    sx={{
                        minHeight: { xs: 50, sm: 58 },
                        bgcolor: "#2563EB",
                        fontWeight: 700,
                        textTransform: "none",
                        py: 1.5,
                        px: 2,
                        borderRadius: "10px",
                        fontSize: {
                            xs: "1rem",
                            sm: "1.1rem",
                        },
                        boxShadow:
                            "0 6px 18px rgba(37, 99, 235, 0.25)",
                        "&:hover": {
                            bgcolor: "#1d4ed8",
                        },
                    }}
                >
                    {saving
                        ? t("properties.alerts.saving")
                        : t("properties.alerts.save")}
                </Button>
            </Paper>

            {/* Active alerts */}
            <Box sx={{ width: "100%", minWidth: 0 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{
                        mb: { xs: 2, sm: 3 },
                        minWidth: 0,
                    }}
                >
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        color="#0f172a"
                        sx={{
                            fontSize: {
                                xs: "1.25rem",
                                sm: "1.45rem",
                                md: "1.6rem",
                            },
                            minWidth: 0,
                        }}
                    >
                        {t("properties.alerts.yourAlerts")}
                    </Typography>

                    <Chip
                        label={t(
                            "properties.alerts.activeCount",
                            { count: alerts.length }
                        )}
                        size="medium"
                        color="primary"
                        sx={{
                            fontWeight: 700,
                            fontSize: {
                                xs: "0.8rem",
                                sm: "0.95rem",
                            },
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
                            border: "1px solid #E2E8F0",
                            borderRadius: "16px",
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
                            border: "1px dashed #E2E8F0",
                            borderRadius: "16px",
                            bgcolor: "#ffffff",
                            boxSizing: "border-box",
                        }}
                    >
                        <NotificationsActiveOutlined
                            sx={{
                                fontSize: {
                                    xs: 42,
                                    sm: 54,
                                },
                                color: "#94a3b8",
                                mb: 2,
                            }}
                        />

                        <Typography
                            fontWeight={700}
                            variant="h6"
                            sx={{
                                fontSize: {
                                    xs: "1.05rem",
                                    sm: "1.2rem",
                                },
                                mb: 1,
                            }}
                        >
                            {t("properties.alerts.emptyTitle")}
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{
                                fontSize: {
                                    xs: "0.9rem",
                                    sm: "1rem",
                                },
                            }}
                        >
                            {t(
                                "properties.alerts.emptySubtitle"
                            )}
                        </Typography>
                    </Paper>
                ) : (
                    <Stack
                        spacing={{ xs: 2, sm: 3 }}
                        sx={{ width: "100%" }}
                    >
                        {alerts.map((alert) =>
                            renderAlertCard(alert)
                        )}
                    </Stack>
                )}
            </Box>

            {/* Archived alerts */}
            <Box sx={{ width: "100%", minWidth: 0 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{
                        mb: { xs: 2, sm: 3 },
                        minWidth: 0,
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                    >
                        <ArchiveOutlined
                            sx={{
                                color: "#64748B",
                                fontSize: {
                                    xs: 23,
                                    sm: 27,
                                },
                            }}
                        />

                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="#0f172a"
                            sx={{
                                fontSize: {
                                    xs: "1.15rem",
                                    sm: "1.4rem",
                                    md: "1.5rem",
                                },
                            }}
                        >
                            {t(
                                "properties.alerts.archivedAlerts",
                                "Archived alerts"
                            )}
                        </Typography>
                    </Stack>

                    <Chip
                        label={archivedAlerts.length}
                        size="medium"
                        sx={{
                            fontWeight: 700,
                            bgcolor: "#F1F5F9",
                            color: "#475569",
                            flexShrink: 0,
                        }}
                    />
                </Stack>

                {!loading && archivedAlerts.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 4 },
                            textAlign: "center",
                            border: "1px dashed #CBD5E1",
                            borderRadius: "16px",
                            bgcolor: "#F8FAFC",
                        }}
                    >
                        <ArchiveOutlined
                            sx={{
                                fontSize: 38,
                                color: "#94A3B8",
                                mb: 1,
                            }}
                        />

                        <Typography
                            fontWeight={600}
                            color="#475569"
                        >
                            {t(
                                "properties.alerts.noArchivedAlerts",
                                "You don't have any archived alerts."
                            )}
                        </Typography>
                    </Paper>
                ) : (
                    <Stack
                        spacing={{ xs: 2, sm: 3 }}
                        sx={{ width: "100%" }}
                    >
                        {archivedAlerts.map((alert) =>
                            renderAlertCard(alert, true)
                        )}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
