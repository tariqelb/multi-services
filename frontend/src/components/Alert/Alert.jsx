
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    Stack,
    CircularProgress,
    Alert as MuiAlert,
    Tabs,
    Tab,
} from "@mui/material";

import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";

import axiosInstance from "../../api/axiosInstance";

import AlertCard from "./AlertCard";
import CityAutocomplete from "./CityAutocomplete";
import AlertSelectionChips from "./AlertSelectionChips";

import {
    API_URLS,
    ALERT_TYPES,
    propertyTypes,
    roommatePropertyTypes,
    listingTypeOptions,
    roommatePurposeOptions,
    rentalPeriodOptions,
    propertyTypeTranslationKeys,
    sameArray,
    getCanonicalCity,
    getCityLabel,
} from "./alertHelpers";

export default function Alerts() {
    const { t, i18n } = useTranslation();

    // --------------------------------------------------
    // Main state
    // --------------------------------------------------

    const [activeAlertType, setActiveAlertType] = useState(
        ALERT_TYPES.PROPERTY
    );

    const [city, setCity] = useState("Marrakesh");

    const [alerts, setAlerts] = useState([]);
    const [archivedAlerts, setArchivedAlerts] = useState([]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [archivingId, setArchivingId] = useState(null);
    const [restoringId, setRestoringId] = useState(null);

    // --------------------------------------------------
    // Property alert form state
    // --------------------------------------------------

    const [selectedTypes, setSelectedTypes] = useState([
        "Apartment",
        "Villa",
        "House",
    ]);

    const [listingTypes, setListingTypes] = useState([
        "For Sale",
    ]);

    // --------------------------------------------------
    // Roommate alert form state
    // --------------------------------------------------

    const [roommateSelectedTypes, setRoommateSelectedTypes] =
        useState(["Apartment", "Studio"]);

    const [roommatePurposes, setRoommatePurposes] = useState([
        "Find a Room",
    ]);

    // Empty array means any rental period.
    const [rentalPeriods, setRentalPeriods] = useState([]);

    const isPropertyAlert =
        activeAlertType === ALERT_TYPES.PROPERTY;

    const currentApiUrl = API_URLS[activeAlertType];

    // --------------------------------------------------
    // Translation helpers
    // --------------------------------------------------

    const translate = (key, fallback, options = {}) =>
        t(key, {
            ...options,
            defaultValue: fallback,
        });

    const getDisplayedCity = (cityName) => {
        const language =
            i18n.resolvedLanguage ||
            i18n.language ||
            "en";

        return getCityLabel(cityName, language);
    };

    const getPropertyTypeLabel = (type) => {
        const key = propertyTypeTranslationKeys[type];

        return key
            ? t(`properties.categories.${key}`, {
                  defaultValue: type,
              })
            : type;
    };

    const getListingTypeLabel = (type) => {
        const keys = {
            "For Sale": "properties.card.forSale",
            "For Rent": "properties.card.forRent",
        };

        return keys[type]
            ? t(keys[type], { defaultValue: type })
            : type;
    };

    const getRoommatePurposeLabel = (purpose) => {
        const keys = {
            "Share My Property": "roommate.purposes.shareMyProperty",
            "Find a Room": "roommate.purposes.findARoom",
            "Rent Together": "roommate.purposes.rentTogether",
        };

        return keys[purpose]
            ? t(keys[purpose], { defaultValue: purpose })
            : purpose;
    };

    const getRentalPeriodLabel = (period) => {
        const keys = {
            Daily: "roommate.rentalPeriods.daily",
            Monthly: "roommate.rentalPeriods.monthly",
        };

        return keys[period]
            ? t(keys[period], { defaultValue: period })
            : period;
    };

    // --------------------------------------------------
    // Load alerts
    // --------------------------------------------------

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axiosInstance.get(
                API_URLS[activeAlertType],
                {
                    params: {
                        includeArchived: true,
                    },
                }
            );

            const responseKey = isPropertyAlert
                ? "propertyAlerts"
                : "roommateAlerts";

            const fetchedAlerts =
                response.data[responseKey] || [];

            setAlerts(
                fetchedAlerts.filter(
                    (alert) => !alert.isArchived
                )
            );

            setArchivedAlerts(
                fetchedAlerts.filter(
                    (alert) => alert.isArchived
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    translate(
                        "alerts.errors.load",
                        "Failed to load alerts."
                    )
            );
        } finally {
            setLoading(false);
        }
    }, [activeAlertType, isPropertyAlert, t]);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    // --------------------------------------------------
    // Switch tabs
    // --------------------------------------------------

    const handleTabChange = (event, newValue) => {
        setActiveAlertType(newValue);
        setError("");
        setSuccess("");
    };

    // --------------------------------------------------
    // Selection handlers
    // --------------------------------------------------

    const removeSelectedType = (type, setter) => {
        setter((previous) =>
            previous.filter((item) => item !== type)
        );

        setError("");
        setSuccess("");
    };

    // --------------------------------------------------
    // Duplicate validation
    // --------------------------------------------------

    const isDuplicateAlert = () => {
        const normalizedCity =
            getCanonicalCity(city).toLowerCase();

        return alerts.some((alert) => {
            if (
                getCanonicalCity(alert.city).toLowerCase() !==
                normalizedCity
            ) {
                return false;
            }

            if (isPropertyAlert) {
                return (
                    sameArray(
                        alert.propertyTypes || [],
                        selectedTypes
                    ) &&
                    sameArray(
                        alert.listingTypes || [],
                        listingTypes
                    )
                );
            }

            return (
                sameArray(
                    alert.propertyTypes || [],
                    roommateSelectedTypes
                ) &&
                sameArray(
                    alert.purposes || [],
                    roommatePurposes
                ) &&
                sameArray(
                    alert.rentalPeriods || [],
                    rentalPeriods
                )
            );
        });
    };

    // --------------------------------------------------
    // Create alert
    // --------------------------------------------------

    const handleAddAlert = async () => {
        setError("");
        setSuccess("");

        // Always send the canonical English city name.
        const normalizedCity = getCanonicalCity(city);

        if (!normalizedCity) {
            setError(
                translate(
                    "alerts.errors.cityRequired",
                    "Please select a city."
                )
            );
            return;
        }

        if (isPropertyAlert) {
            if (selectedTypes.length === 0) {
                setError(
                    translate(
                        "properties.alerts.errors.propertyTypeRequired",
                        "Please select at least one property type."
                    )
                );
                return;
            }

            if (listingTypes.length === 0) {
                setError(
                    translate(
                        "properties.alerts.errors.listingTypeRequired",
                        "Please select at least one listing type."
                    )
                );
                return;
            }
        } else {
            if (roommateSelectedTypes.length === 0) {
                setError(
                    translate(
                        "alerts.errors.propertyTypeRequired",
                        "Please select at least one property type."
                    )
                );
                return;
            }

            if (roommatePurposes.length === 0) {
                setError(
                    translate(
                        "alerts.errors.purposeRequired",
                        "Please select at least one roommate purpose."
                    )
                );
                return;
            }
        }

        if (isDuplicateAlert()) {
            setError(
                translate(
                    "alerts.errors.duplicate",
                    "This alert already exists."
                )
            );
            return;
        }

        const payload = isPropertyAlert
            ? {
                  city: normalizedCity,
                  propertyTypes: selectedTypes,
                  listingTypes,
              }
            : {
                  city: normalizedCity,
                  propertyTypes: roommateSelectedTypes,
                  purposes: roommatePurposes,
                  rentalPeriods,
              };

        setSaving(true);

        try {
            const response = await axiosInstance.post(
                currentApiUrl,
                payload
            );

            const responseKey = isPropertyAlert
                ? "propertyAlert"
                : "roommateAlert";

            const newAlert = response.data[responseKey];

            if (!newAlert) {
                throw new Error(
                    translate(
                        "alerts.errors.missingCreatedAlert",
                        "The created alert was not returned by the server."
                    )
                );
            }

            setAlerts((previous) => [
                newAlert,
                ...previous,
            ]);

            if (isPropertyAlert) {
                setSelectedTypes([]);
                setListingTypes([]);
            } else {
                setRoommateSelectedTypes([]);
                setRoommatePurposes([]);
                setRentalPeriods([]);
            }

            setSuccess(
                translate(
                    "alerts.success.created",
                    "Alert created successfully."
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    translate(
                        "alerts.errors.create",
                        "Failed to create alert."
                    )
            );
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // Archive alert
    // --------------------------------------------------

    const handleArchiveAlert = async (id) => {
        setError("");
        setSuccess("");
        setArchivingId(id);

        try {
            await axiosInstance.delete(
                `${currentApiUrl}/${id}`
            );

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
                translate(
                    "alerts.success.archived",
                    "Alert archived successfully."
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    translate(
                        "alerts.errors.archive",
                        "Failed to archive alert."
                    )
            );
        } finally {
            setArchivingId(null);
        }
    };

    // --------------------------------------------------
    // Restore alert
    // --------------------------------------------------

    const handleRestoreAlert = async (id) => {
        setError("");
        setSuccess("");
        setRestoringId(id);

        try {
            const response = await axiosInstance.patch(
                `${currentApiUrl}/${id}/restore`
            );

            const responseKey = isPropertyAlert
                ? "propertyAlert"
                : "roommateAlert";

            const restoredAlert =
                response.data[responseKey] ||
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
                translate(
                    "alerts.success.restored",
                    "Alert restored successfully."
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    translate(
                        "alerts.errors.restore",
                        "Failed to restore alert."
                    )
            );
        } finally {
            setRestoringId(null);
        }
    };

    // --------------------------------------------------
    // Alert card renderer
    // --------------------------------------------------

    const renderAlertCard = (alert, archived = false) => (
        <AlertCard
            key={alert._id}
            alert={alert}
            archived={archived}
            isPropertyAlert={isPropertyAlert}
            archivingId={archivingId}
            restoringId={restoringId}
            onArchive={handleArchiveAlert}
            onRestore={handleRestoreAlert}
            translate={translate}
            getCityLabel={getDisplayedCity}
            getPropertyTypeLabel={getPropertyTypeLabel}
            getListingTypeLabel={getListingTypeLabel}
            getRoommatePurposeLabel={getRoommatePurposeLabel}
            getRentalPeriodLabel={getRentalPeriodLabel}
        />
    );

    // --------------------------------------------------
    // Selection chip renderer
    // --------------------------------------------------

    const renderSelectionChips = (
        options,
        selected,
        setter,
        getLabel = (value) => value
    ) => (
        <AlertSelectionChips
            options={options}
            selected={selected}
            setter={setter}
            getLabel={getLabel}
            onSelectionChange={() => {
                setError("");
                setSuccess("");
            }}
        />
    );

    // --------------------------------------------------
    // Selection summary
    // --------------------------------------------------

    const currentSelectedTypes = isPropertyAlert
        ? selectedTypes
        : roommateSelectedTypes;

    const currentTypeSetter = isPropertyAlert
        ? setSelectedTypes
        : setRoommateSelectedTypes;

    // --------------------------------------------------
    // Shared styling
    // --------------------------------------------------

    const sectionTitleSx = {
        fontSize: {
            xs: "1.05rem",
            sm: "1.15rem",
        },
        fontWeight: 700,
        color: "#0F172A",
        mb: 2.5,
    };

    // --------------------------------------------------
    // Page
    // --------------------------------------------------

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
                spacing={{
                    xs: 1.5,
                    sm: 2.5,
                    md: 3,
                }}
                sx={{
                    width: "100%",
                    minWidth: 0,
                    borderBottom: "1px solid #E2E8F0",
                    pb: {
                        xs: 2.5,
                        sm: 3,
                        md: 4,
                    },
                }}
            >
                <Box
                    sx={{
                        width: {
                            xs: 46,
                            sm: 56,
                            md: 64,
                        },
                        height: {
                            xs: 46,
                            sm: 56,
                            md: 64,
                        },
                        borderRadius: {
                            xs: 2.5,
                            sm: 3,
                        },
                        bgcolor: "#eff6ff",
                        color: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow:
                            "0 4px 12px rgba(37, 99, 235, 0.1)",
                        flexShrink: 0,
                    }}
                >
                    <NotificationsActiveOutlined
                        sx={{
                            fontSize: {
                                xs: 27,
                                sm: 32,
                                md: 36,
                            },
                        }}
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
                        {translate("alerts.title", "My Alerts")}
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
                        {translate(
                            "alerts.subtitle",
                            "Manage your property and roommate notifications in one place."
                        )}
                    </Typography>
                </Box>
            </Stack>

            {/* Alert type tabs */}
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    border: "1px solid #E2E8F0",
                    borderRadius: 3,
                    p: 0.75,
                    bgcolor: "#F8FAFC",
                }}
            >
                <Tabs
                    value={activeAlertType}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                        minHeight: 52,
                        "& .MuiTabs-indicator": {
                            display: "none",
                        },
                        "& .MuiTab-root": {
                            minHeight: 52,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: {
                                xs: "0.85rem",
                                sm: "1rem",
                            },
                            borderRadius: 2,
                            color: "#64748B",
                        },
                        "& .MuiTab-root.Mui-selected": {
                            bgcolor: "#FFFFFF",
                            color: "#2563EB",
                            boxShadow:
                                "0 2px 8px rgba(0,0,0,0.07)",
                        },
                    }}
                >
                    <Tab
                        value="property"
                        label={translate(
                            "alerts.propertyAlerts",
                            "Property Alerts"
                        )}
                    />

                    <Tab
                        value="roommate"
                        label={translate(
                            "alerts.roommateAlerts",
                            "Roommate Alerts"
                        )}
                    />
                </Tabs>
            </Paper>

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
                    p: {
                        xs: 2.5,
                        sm: 4,
                        md: 6,
                    },
                    border: "1px solid #E2E8F0",
                    borderRadius: {
                        xs: 3,
                        sm: 4,
                    },
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
                    {isPropertyAlert
                        ? translate(
                              "properties.alerts.createTitle",
                              "Create property alert"
                          )
                        : translate(
                              "alerts.roommateCreateTitle",
                              "Create roommate alert"
                          )}
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
                        mb: {
                            xs: 3.5,
                            sm: 5,
                        },
                    }}
                >
                    {isPropertyAlert
                        ? translate(
                              "properties.alerts.createSubtitle",
                              "Choose the properties you want to be notified about."
                          )
                        : translate(
                              "alerts.roommateCreateSubtitle",
                              "Choose your preferred city, property types, purposes and rental periods to find matching roommate announcements."
                          )}
                </Typography>

                {/* City */}
                <CityAutocomplete
                    city={city}
                    setCity={setCity}
                    setError={setError}
                    setSuccess={setSuccess}
                />

                {isPropertyAlert ? (
                    <>
                        {/* Property listing types */}
                        <Typography sx={sectionTitleSx}>
                            {t(
                                "properties.alerts.listingType",
                                {
                                    defaultValue: "Listing type",
                                }
                            )}
                        </Typography>

                        {renderSelectionChips(
                            listingTypeOptions,
                            listingTypes,
                            setListingTypes,
                            getListingTypeLabel
                        )}

                        {/* Property types */}
                        <Typography sx={sectionTitleSx}>
                            {t(
                                "properties.alerts.propertyTypes",
                                {
                                    defaultValue: "Property types",
                                }
                            )}
                        </Typography>

                        {renderSelectionChips(
                            propertyTypes,
                            selectedTypes,
                            setSelectedTypes,
                            getPropertyTypeLabel
                        )}
                    </>
                ) : (
                    <>
                        {/* Roommate purposes */}
                        <Typography sx={sectionTitleSx}>
                            {translate(
                                "alerts.roommatePurposes",
                                "Roommate purpose"
                            )}
                        </Typography>

                        {renderSelectionChips(
                            roommatePurposeOptions,
                            roommatePurposes,
                            setRoommatePurposes,
                            getRoommatePurposeLabel
                        )}

                        {/* Roommate property types */}
                        <Typography sx={sectionTitleSx}>
                            {translate(
                                "alerts.roommatePropertyTypes",
                                "Property types"
                            )}
                        </Typography>

                        {renderSelectionChips(
                            roommatePropertyTypes,
                            roommateSelectedTypes,
                            setRoommateSelectedTypes,
                            getPropertyTypeLabel
                        )}

                        {/* Rental periods */}
                        <Typography sx={sectionTitleSx}>
                            {translate(
                                "alerts.rentalPeriods",
                                "Rental period"
                            )}
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{
                                fontSize: "0.9rem",
                                mb: 2,
                                mt: -1.5,
                            }}
                        >
                            {translate(
                                "alerts.rentalPeriodsHint",
                                "Leave both options unselected to receive announcements for any rental period."
                            )}
                        </Typography>

                        {renderSelectionChips(
                            rentalPeriodOptions,
                            rentalPeriods,
                            setRentalPeriods,
                            getRentalPeriodLabel
                        )}
                    </>
                )}

                {/* Selection summary */}
                <Box
                    sx={{
                        bgcolor: "#f8fafc",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        p: {
                            xs: 2,
                            sm: 3,
                        },
                        mb: {
                            xs: 3,
                            sm: 4,
                        },
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
                        {translate(
                            "alerts.selectedForAlert",
                            "Your alert preferences"
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
                        {city
                            ? getDisplayedCity(city)
                            : translate(
                                  "alerts.anyCity",
                                  "Any city"
                              )}
                    </Typography>

                    {!isPropertyAlert && (
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            {roommatePurposes.map((purpose) => (
                                <Chip
                                    key={purpose}
                                    size="small"
                                    label={getRoommatePurposeLabel(
                                        purpose
                                    )}
                                    color="success"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    )}

                    {isPropertyAlert && (
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            {listingTypes.map((type) => (
                                <Chip
                                    key={type}
                                    size="small"
                                    label={getListingTypeLabel(type)}
                                    color="info"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    )}

                    {currentSelectedTypes.length > 0 ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1.2,
                                mb: 2,
                            }}
                        >
                            {currentSelectedTypes.map((type) => (
                                <Chip
                                    key={type}
                                    label={getPropertyTypeLabel(type)}
                                    onDelete={() =>
                                        removeSelectedType(
                                            type,
                                            currentTypeSetter
                                        )
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
                                mb: 2,
                            }}
                        >
                            {translate(
                                "alerts.noPropertyTypes",
                                "No property types selected."
                            )}
                        </Typography>
                    )}

                    {!isPropertyAlert && (
                        <Typography
                            color="text.secondary"
                            sx={{
                                fontSize: "0.9rem",
                                lineHeight: 1.7,
                            }}
                        >
                            {translate(
                                "alerts.rentalPeriodSummary",
                                "Rental period:"
                            )}{" "}
                            {rentalPeriods.length > 0
                                ? rentalPeriods
                                      .map(getRentalPeriodLabel)
                                      .join(", ")
                                : translate(
                                      "alerts.anyRentalPeriod",
                                      "Any rental period"
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
                        minHeight: {
                            xs: 50,
                            sm: 58,
                        },
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
                        ? translate(
                              "alerts.saving",
                              "Saving..."
                          )
                        : translate(
                              "alerts.save",
                              "Create alert"
                          )}
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
                        mb: {
                            xs: 2,
                            sm: 3,
                        },
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
                        {translate(
                            "alerts.yourAlerts",
                            "Your active alerts"
                        )}
                    </Typography>

                    <Chip
                        label={alerts.length}
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
                            p: {
                                xs: 4,
                                sm: 6,
                            },
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
                            p: {
                                xs: 3,
                                sm: 5,
                                md: 6,
                            },
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
                            {translate(
                                "alerts.emptyTitle",
                                "No active alerts yet"
                            )}
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
                            {translate(
                                "alerts.emptySubtitle",
                                "Create an alert above to receive notifications about matching announcements."
                            )}
                        </Typography>
                    </Paper>
                ) : (
                    <Stack
                        spacing={{
                            xs: 2,
                            sm: 3,
                        }}
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
                        mb: {
                            xs: 2,
                            sm: 3,
                        },
                        minWidth: 0,
                    }}
                >
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
                        {translate(
                            "alerts.archivedAlerts",
                            "Archived alerts"
                        )}
                    </Typography>

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
                            p: {
                                xs: 3,
                                sm: 4,
                            },
                            textAlign: "center",
                            border: "1px dashed #CBD5E1",
                            borderRadius: "16px",
                            bgcolor: "#F8FAFC",
                        }}
                    >
                        <Typography
                            fontWeight={600}
                            color="#475569"
                        >
                            {translate(
                                "alerts.noArchivedAlerts",
                                "You don't have any archived alerts."
                            )}
                        </Typography>
                    </Paper>
                ) : (
                    <Stack
                        spacing={{
                            xs: 2,
                            sm: 3,
                        }}
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


// // /home/tariq/multi-services/app/frontend/src/components/Alert/Alert.jsx
// import React, { useCallback, useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";

// import {
//     Box,
//     Typography,
//     Paper,
//     Autocomplete,
//     TextField,
//     Chip,
//     Button,
//     Stack,
//     Divider,
//     Tooltip,
//     CircularProgress,
//     Alert as MuiAlert,
//     Tabs,
//     Tab,
// } from "@mui/material";

// import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
// import HomeWorkOutlined from "@mui/icons-material/HomeWorkOutlined";
// // import PeopleOutline from "@mui/icons-material/PeopleOutline";
// import People from "@mui/icons-material/People";
// import Add from "@mui/icons-material/Add";
// import Close from "@mui/icons-material/Close";
// import Check from "@mui/icons-material/Check";
// import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
// import UnarchiveOutlined from "@mui/icons-material/UnarchiveOutlined";

// import axiosInstance from "../../api/axiosInstance";
// import moroccanCities from "../../data/moroccanCities";

// const API_URLS = {
//     property: "/property/alerts",
//     roommate: "/roommate/alerts",
// };

// const ALERT_TYPES = {
//     PROPERTY: "property",
//     ROOMMATE: "roommate",
// };

// // --------------------------------------------------
// // Moroccan cities
// // --------------------------------------------------

// const normalizeCities = (source) => {
//     let cityList = [];

//     if (Array.isArray(source)) {
//         cityList = source;
//     } else if (Array.isArray(source?.cityNames)) {
//         cityList = source.cityNames;
//     }

//     return cityList
//         .map((city) => {
//             // Format: ["Agadir", "أكادير"]
//             if (Array.isArray(city)) {
//                 return {
//                     english: String(city[0] || "").trim(),
//                     arabic: String(city[1] || "").trim(),
//                 };
//             }

//             // Format: "Agadir"
//             if (typeof city === "string") {
//                 return {
//                     english: city.trim(),
//                     arabic: "",
//                 };
//             }

//             // Also support object-based city data.
//             if (city && typeof city === "object") {
//                 return {
//                     english: String(
//                         city.english ||
//                         city.en ||
//                         city.name ||
//                         city.label ||
//                         city.value ||
//                         ""
//                     ).trim(),
//                     arabic: String(
//                         city.arabic ||
//                         city.ar ||
//                         ""
//                     ).trim(),
//                 };
//             }

//             return null;
//         })
//         .filter((city) => city && city.english);
// };

// const cities = normalizeCities(moroccanCities);

// const getCityOptionLabel = (option) => {
//     if (typeof option === "string") {
//         return option;
//     }

//     return option?.english || "";
// };

// const filterCityOptions = (options, { inputValue }) => {
//     const search = inputValue.trim().toLowerCase();

//     if (!search) {
//         return options;
//     }

//     return options.filter((city) => {
//         const english = city.english.toLowerCase();
//         const arabic = city.arabic.toLowerCase();

//         return (
//             english.includes(search) ||
//             arabic.includes(search)
//         );
//     });
// };

// const propertyTypes = [
//     "Apartment",
//     "House",
//     "Villa",
//     "Studio",
//     "Room",
//     "Store",
//     "Office",
//     "Land",
//     "Warehouse",
//     "Commercial space",
//     "Commercial store",
//     "Garage",
//     "Other",
// ];

// const roommatePropertyTypes = [
//     "Apartment",
//     "House",
//     "Villa",
//     "Studio",
//     "Room",
//     "Other",
// ];

// const listingTypeOptions = ["For Sale", "For Rent"];

// const roommatePurposeOptions = [
//     "Share My Property",
//     "Find a Room",
//     "Rent Together",
// ];

// const rentalPeriodOptions = ["Daily", "Monthly"];

// const propertyTypeTranslationKeys = {
//     Apartment: "apartment",
//     House: "house",
//     Villa: "villa",
//     Studio: "studio",
//     Room: "room",
//     Store: "store",
//     Office: "office",
//     Land: "land",
//     Warehouse: "warehouse",
//     "Commercial space": "commercialSpace",
//     "Commercial store": "commercialStore",
//     Garage: "garage",
//     Other: "other",
// };

// export default function Alerts() {
//     const { t } = useTranslation();

//     // --------------------------------------------------
//     // Main state
//     // --------------------------------------------------

//     const [activeAlertType, setActiveAlertType] = useState(
//         ALERT_TYPES.PROPERTY
//     );

//     const [city, setCity] = useState("Marrakesh");
//     const [cityInputValue, setCityInputValue] = useState("");

//     const [alerts, setAlerts] = useState([]);
//     const [archivedAlerts, setArchivedAlerts] = useState([]);

//     const [error, setError] = useState("");
//     const [success, setSuccess] = useState("");

//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState(false);

//     const [archivingId, setArchivingId] = useState(null);
//     const [restoringId, setRestoringId] = useState(null);

//     // --------------------------------------------------
//     // Property alert form state
//     // --------------------------------------------------

//     const [selectedTypes, setSelectedTypes] = useState([
//         "Apartment",
//         "Villa",
//         "House",
//     ]);

//     const [listingTypes, setListingTypes] = useState([
//         "For Sale",
//     ]);

//     // --------------------------------------------------
//     // Roommate alert form state
//     // --------------------------------------------------

//     const [roommateSelectedTypes, setRoommateSelectedTypes] =
//         useState(["Apartment", "Studio"]);

//     const [roommatePurposes, setRoommatePurposes] = useState([
//         "Find a Room",
//     ]);

//     // Empty array means any rental period.
//     const [rentalPeriods, setRentalPeriods] = useState([]);

//     const isPropertyAlert =
//         activeAlertType === ALERT_TYPES.PROPERTY;

//     const currentApiUrl = API_URLS[activeAlertType];

//     // --------------------------------------------------
//     // Translation helpers
//     // --------------------------------------------------

//     const translate = (key, fallback, options = {}) =>
//         t(key, {
//             ...options,
//             defaultValue: fallback,
//         });

//     const getPropertyTypeLabel = (type) => {
//         const key = propertyTypeTranslationKeys[type];

//         return key
//             ? t(`properties.categories.${key}`, {
//                   defaultValue: type,
//               })
//             : type;
//     };

//     const getListingTypeLabel = (type) => {
//         const keys = {
//             "For Sale": "properties.card.forSale",
//             "For Rent": "properties.card.forRent",
//         };

//         return keys[type]
//             ? t(keys[type], { defaultValue: type })
//             : type;
//     };

//     const getRoommatePurposeLabel = (purpose) => {
//         const keys = {
//             "Share My Property": "roommate.purposes.shareMyProperty",
//             "Find a Room": "roommate.purposes.findARoom",
//             "Rent Together": "roommate.purposes.rentTogether",
//         };

//         return keys[purpose]
//             ? t(keys[purpose], { defaultValue: purpose })
//             : purpose;
//     };

//     const getRentalPeriodLabel = (period) => {
//         const keys = {
//             Daily: "roommate.rentalPeriods.daily",
//             Monthly: "roommate.rentalPeriods.monthly",
//         };

//         return keys[period]
//             ? t(keys[period], { defaultValue: period })
//             : period;
//     };

//     // --------------------------------------------------
//     // Load alerts
//     // --------------------------------------------------

//     const loadAlerts = useCallback(async () => {
//         setLoading(true);
//         setError("");

//         try {
//             const response = await axiosInstance.get(
//                 API_URLS[activeAlertType],
//                 {
//                     params: {
//                         includeArchived: true,
//                     },
//                 }
//             );

//             const responseKey = isPropertyAlert
//                 ? "propertyAlerts"
//                 : "roommateAlerts";

//             const fetchedAlerts =
//                 response.data[responseKey] || [];

//             setAlerts(
//                 fetchedAlerts.filter(
//                     (alert) => !alert.isArchived
//                 )
//             );

//             setArchivedAlerts(
//                 fetchedAlerts.filter(
//                     (alert) => alert.isArchived
//                 )
//             );
//         } catch (err) {
//             setError(
//                 err.response?.data?.message ||
//                     translate(
//                         "alerts.errors.load",
//                         "Failed to load alerts."
//                     )
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, [activeAlertType, isPropertyAlert, t]);

//     useEffect(() => {
//         loadAlerts();
//     }, [loadAlerts]);

//     // --------------------------------------------------
//     // Switch tabs
//     // --------------------------------------------------

//     const handleTabChange = (event, newValue) => {
//         setActiveAlertType(newValue);
//         setError("");
//         setSuccess("");
//     };

//     // --------------------------------------------------
//     // Selection handlers
//     // --------------------------------------------------

//     const toggleSelection = (value, setter) => {
//         setter((previous) =>
//             previous.includes(value)
//                 ? previous.filter((item) => item !== value)
//                 : [...previous, value]
//         );

//         setError("");
//         setSuccess("");
//     };

//     const removeSelectedType = (type, setter) => {
//         setter((previous) =>
//             previous.filter((item) => item !== type)
//         );

//         setError("");
//         setSuccess("");
//     };

//     // --------------------------------------------------
//     // Duplicate validation
//     // --------------------------------------------------

//     const sameArray = (first = [], second = []) => {
//         return (
//             first.length === second.length &&
//             first.every((item) => second.includes(item))
//         );
//     };

//     const isDuplicateAlert = () => {
//         const normalizedCity = city.trim().toLowerCase();

//         return alerts.some((alert) => {
//             if (
//                 alert.city?.trim().toLowerCase() !==
//                 normalizedCity
//             ) {
//                 return false;
//             }

//             if (isPropertyAlert) {
//                 return (
//                     sameArray(
//                         alert.propertyTypes || [],
//                         selectedTypes
//                     ) &&
//                     sameArray(
//                         alert.listingTypes || [],
//                         listingTypes
//                     )
//                 );
//             }

//             return (
//                 sameArray(
//                     alert.propertyTypes || [],
//                     roommateSelectedTypes
//                 ) &&
//                 sameArray(
//                     alert.purposes || [],
//                     roommatePurposes
//                 ) &&
//                 sameArray(
//                     alert.rentalPeriods || [],
//                     rentalPeriods
//                 )
//             );
//         });
//     };

//     // --------------------------------------------------
//     // Create alert
//     // --------------------------------------------------

//     const handleAddAlert = async () => {
//         setError("");
//         setSuccess("");

//         const normalizedCity = city.trim();

//         if (!normalizedCity) {
//             setError(
//                 translate(
//                     "alerts.errors.cityRequired",
//                     "Please select a city."
//                 )
//             );
//             return;
//         }

//         if (isPropertyAlert) {
//             if (selectedTypes.length === 0) {
//                 setError(
//                     translate(
//                         "properties.alerts.errors.propertyTypeRequired",
//                         "Please select at least one property type."
//                     )
//                 );
//                 return;
//             }

//             if (listingTypes.length === 0) {
//                 setError(
//                     translate(
//                         "properties.alerts.errors.listingTypeRequired",
//                         "Please select at least one listing type."
//                     )
//                 );
//                 return;
//             }
//         } else {
//             if (roommateSelectedTypes.length === 0) {
//                 setError(
//                     translate(
//                         "alerts.errors.propertyTypeRequired",
//                         "Please select at least one property type."
//                     )
//                 );
//                 return;
//             }

//             if (roommatePurposes.length === 0) {
//                 setError(
//                     translate(
//                         "alerts.errors.purposeRequired",
//                         "Please select at least one roommate purpose."
//                     )
//                 );
//                 return;
//             }
//         }

//         if (isDuplicateAlert()) {
//             setError(
//                 translate(
//                     "alerts.errors.duplicate",
//                     "This alert already exists."
//                 )
//             );
//             return;
//         }

//         const payload = isPropertyAlert
//             ? {
//                   city: normalizedCity,
//                   propertyTypes: selectedTypes,
//                   listingTypes,
//               }
//             : {
//                   city: normalizedCity,
//                   propertyTypes: roommateSelectedTypes,
//                   purposes: roommatePurposes,
//                   rentalPeriods,
//               };

//         setSaving(true);

//         try {
//             const response = await axiosInstance.post(
//                 currentApiUrl,
//                 payload
//             );

//             const responseKey = isPropertyAlert
//                 ? "propertyAlert"
//                 : "roommateAlert";

//             const newAlert = response.data[responseKey];

//             if (!newAlert) {
//                 throw new Error(
//                     translate(
//                         "alerts.errors.missingCreatedAlert",
//                         "The created alert was not returned by the server."
//                     )
//                 );
//             }

//             setAlerts((previous) => [
//                 newAlert,
//                 ...previous,
//             ]);

//             if (isPropertyAlert) {
//                 setSelectedTypes([]);
//                 setListingTypes([]);
//             } else {
//                 setRoommateSelectedTypes([]);
//                 setRoommatePurposes([]);
//                 setRentalPeriods([]);
//             }

//             setSuccess(
//                 translate(
//                     "alerts.success.created",
//                     "Alert created successfully."
//                 )
//             );
//         } catch (err) {
//             setError(
//                 err.response?.data?.message ||
//                     err.message ||
//                     translate(
//                         "alerts.errors.create",
//                         "Failed to create alert."
//                     )
//             );
//         } finally {
//             setSaving(false);
//         }
//     };

//     // --------------------------------------------------
//     // Archive alert
//     // --------------------------------------------------

//     const handleArchiveAlert = async (id) => {
//         setError("");
//         setSuccess("");
//         setArchivingId(id);

//         try {
//             await axiosInstance.delete(
//                 `${currentApiUrl}/${id}`
//             );

//             const archivedAlert = alerts.find(
//                 (alert) => alert._id === id
//             );

//             if (archivedAlert) {
//                 setAlerts((previous) =>
//                     previous.filter(
//                         (alert) => alert._id !== id
//                     )
//                 );

//                 setArchivedAlerts((previous) => [
//                     {
//                         ...archivedAlert,
//                         isArchived: true,
//                     },
//                     ...previous,
//                 ]);
//             }

//             setSuccess(
//                 translate(
//                     "alerts.success.archived",
//                     "Alert archived successfully."
//                 )
//             );
//         } catch (err) {
//             setError(
//                 err.response?.data?.message ||
//                     translate(
//                         "alerts.errors.archive",
//                         "Failed to archive alert."
//                     )
//             );
//         } finally {
//             setArchivingId(null);
//         }
//     };

//     // --------------------------------------------------
//     // Restore alert
//     // --------------------------------------------------

//     const handleRestoreAlert = async (id) => {
//         setError("");
//         setSuccess("");
//         setRestoringId(id);

//         try {
//             const response = await axiosInstance.patch(
//                 `${currentApiUrl}/${id}/restore`
//             );

//             const responseKey = isPropertyAlert
//                 ? "propertyAlert"
//                 : "roommateAlert";

//             const restoredAlert =
//                 response.data[responseKey] ||
//                 archivedAlerts.find(
//                     (alert) => alert._id === id
//                 );

//             if (restoredAlert) {
//                 setArchivedAlerts((previous) =>
//                     previous.filter(
//                         (alert) => alert._id !== id
//                     )
//                 );

//                 setAlerts((previous) => [
//                     {
//                         ...restoredAlert,
//                         isArchived: false,
//                     },
//                     ...previous,
//                 ]);
//             }

//             setSuccess(
//                 translate(
//                     "alerts.success.restored",
//                     "Alert restored successfully."
//                 )
//             );
//         } catch (err) {
//             setError(
//                 err.response?.data?.message ||
//                     translate(
//                         "alerts.errors.restore",
//                         "Failed to restore alert."
//                     )
//             );
//         } finally {
//             setRestoringId(null);
//         }
//     };

//     // --------------------------------------------------
//     // Shared styling
//     // --------------------------------------------------

//     const sectionTitleSx = {
//         fontSize: {
//             xs: "1.05rem",
//             sm: "1.15rem",
//         },
//         fontWeight: 700,
//         color: "#0F172A",
//         mb: 2.5,
//     };

//     const chipContainerSx = {
//         display: "flex",
//         flexWrap: "wrap",
//         gap: {
//             xs: 1,
//             sm: 1.5,
//         },
//         mb: {
//             xs: 4,
//             sm: 5,
//         },
//     };

//     const selectionChipSx = (selected) => ({
//         minHeight: {
//             xs: 40,
//             sm: 44,
//         },
//         height: "auto",
//         maxWidth: "100%",
//         px: {
//             xs: 0.75,
//             sm: 1.25,
//         },
//         py: 0.5,
//         borderRadius: "10px",
//         fontWeight: 600,
//         fontSize: {
//             xs: "0.875rem",
//             sm: "1rem",
//         },
//         bgcolor: selected ? "#eff6ff" : "transparent",
//         color: selected ? "#1d4ed8" : "#334155",
//         borderColor: selected ? "#93c5fd" : "#D5DCE8",
//         "& .MuiChip-label": {
//             whiteSpace: "normal",
//             overflowWrap: "anywhere",
//             py: 0.5,
//         },
//         "&:hover": {
//             bgcolor: selected ? "#dbeafe" : "#f1f5f9",
//         },
//     });

//     // --------------------------------------------------
//     // Alert card
//     // --------------------------------------------------

//     const renderAlertCard = (alert, archived = false) => {
//         const busy =
//             archivingId === alert._id ||
//             restoringId === alert._id;

//         const types = alert.propertyTypes || [];

//         return (
//             <Paper
//                 key={alert._id}
//                 elevation={0}
//                 sx={{
//                     width: "100%",
//                     minWidth: 0,
//                     boxSizing: "border-box",
//                     p: {
//                         xs: 2.5,
//                         sm: 4,
//                         md: 5,
//                     },
//                     border: "1px solid #E2E8F0",
//                     borderRadius: {
//                         xs: 3,
//                         sm: 4,
//                     },
//                     bgcolor: archived ? "#F8FAFC" : "#ffffff",
//                     boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
//                     opacity: archived ? 0.9 : 1,
//                 }}
//             >
//                 <Stack
//                     direction="row"
//                     alignItems="center"
//                     justifyContent="space-between"
//                     spacing={1.5}
//                     sx={{
//                         width: "100%",
//                         minWidth: 0,
//                         flexWrap: {
//                             xs: "wrap",
//                             sm: "nowrap",
//                         },
//                     }}
//                 >
//                     <Stack
//                         direction="row"
//                         alignItems="center"
//                         spacing={{
//                             xs: 1.5,
//                             sm: 2.5,
//                         }}
//                         sx={{
//                             minWidth: 0,
//                             flex: 1,
//                         }}
//                     >
//                         <Box
//                             sx={{
//                                 width: {
//                                     xs: 42,
//                                     sm: 52,
//                                 },
//                                 height: {
//                                     xs: 42,
//                                     sm: 52,
//                                 },
//                                 flexShrink: 0,
//                                 borderRadius: "10px",
//                                 bgcolor: archived
//                                     ? "#F1F5F9"
//                                     : isPropertyAlert
//                                       ? "#eff6ff"
//                                       : "#F0FDF4",
//                                 color: archived
//                                     ? "#64748B"
//                                     : isPropertyAlert
//                                       ? "#2563EB"
//                                       : "#15803D",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                             }}
//                         >
//                             {isPropertyAlert ? (
//                                 <HomeWorkOutlined
//                                     sx={{
//                                         fontSize: {
//                                             xs: 22,
//                                             sm: 26,
//                                         },
//                                     }}
//                                 />
//                             ) : (
//                                 <People
//                                     sx={{
//                                         fontSize: {
//                                             xs: 22,
//                                             sm: 26,
//                                         },
//                                     }}
//                                 />
//                             )}
//                         </Box>

//                         <Box sx={{ minWidth: 0 }}>
//                             <Typography
//                                 fontWeight={700}
//                                 variant="h6"
//                                 sx={{
//                                     fontSize: {
//                                         xs: "1.05rem",
//                                         sm: "1.2rem",
//                                     },
//                                     color: "#0f172a",
//                                     overflowWrap: "anywhere",
//                                 }}
//                             >
//                                 {alert.city}
//                             </Typography>

//                             <Typography
//                                 color="text.secondary"
//                                 sx={{
//                                     fontSize: {
//                                         xs: "0.85rem",
//                                         sm: "0.95rem",
//                                     },
//                                     mt: 0.5,
//                                 }}
//                             >
//                                 {translate(
//                                     "alerts.propertyTypeCount",
//                                     `${types.length} property types`,
//                                     { count: types.length }
//                                 )}
//                             </Typography>
//                         </Box>
//                     </Stack>

//                     {archived ? (
//                         <Tooltip
//                             title={translate(
//                                 "alerts.restoreAlert",
//                                 "Restore alert"
//                             )}
//                         >
//                             <span>
//                                 <Button
//                                     aria-label={translate(
//                                         "alerts.restoreAlert",
//                                         "Restore alert"
//                                     )}
//                                     disabled={busy}
//                                     onClick={() =>
//                                         handleRestoreAlert(alert._id)
//                                     }
//                                     startIcon={
//                                         restoringId === alert._id ? (
//                                             <CircularProgress
//                                                 size={17}
//                                                 color="inherit"
//                                             />
//                                         ) : (
//                                             <UnarchiveOutlined />
//                                         )
//                                     }
//                                     sx={{
//                                         flexShrink: 0,
//                                         color: "#15803D",
//                                         bgcolor: "#F0FDF4",
//                                         border: "1px solid #BBF7D0",
//                                         borderRadius: 2,
//                                         fontSize: "0.9rem",
//                                         minWidth: {
//                                             xs: "105px",
//                                             sm: "125px",
//                                         },
//                                         height: 40,
//                                         px: 1.5,
//                                         textTransform: "none",
//                                         fontWeight: 700,
//                                         "&:hover": {
//                                             bgcolor: "#DCFCE7",
//                                         },
//                                     }}
//                                 >
//                                     {restoringId === alert._id
//                                         ? translate(
//                                               "alerts.restoring",
//                                               "Restoring..."
//                                           )
//                                         : translate(
//                                               "alerts.restore",
//                                               "Restore"
//                                           )}
//                                 </Button>
//                             </span>
//                         </Tooltip>
//                     ) : (
//                         <Tooltip
//                             title={translate(
//                                 "alerts.archiveAlert",
//                                 "Archive alert"
//                             )}
//                         >
//                             <span>
//                                 <Button
//                                     aria-label={translate(
//                                         "alerts.archiveAlert",
//                                         "Archive alert"
//                                     )}
//                                     disabled={busy}
//                                     onClick={() =>
//                                         handleArchiveAlert(alert._id)
//                                     }
//                                     startIcon={
//                                         archivingId === alert._id ? (
//                                             <CircularProgress
//                                                 size={17}
//                                                 color="inherit"
//                                             />
//                                         ) : (
//                                             <ArchiveOutlined />
//                                         )
//                                     }
//                                     sx={{
//                                         flexShrink: 0,
//                                         color: "#B45309",
//                                         bgcolor: "#FFFBEB",
//                                         border: "1px solid #FDE68A",
//                                         borderRadius: 2,
//                                         fontSize: "0.9rem",
//                                         minWidth: {
//                                             xs: "105px",
//                                             sm: "125px",
//                                         },
//                                         height: 40,
//                                         px: 1.5,
//                                         textTransform: "none",
//                                         fontWeight: 700,
//                                         "&:hover": {
//                                             bgcolor: "#FEF3C7",
//                                         },
//                                     }}
//                                 >
//                                     {archivingId === alert._id
//                                         ? translate(
//                                               "alerts.archiving",
//                                               "Archiving..."
//                                           )
//                                         : translate(
//                                               "alerts.archive",
//                                               "Archive"
//                                           )}
//                                 </Button>
//                             </span>
//                         </Tooltip>
//                     )}
//                 </Stack>

//                 {archived && (
//                     <Chip
//                         size="small"
//                         icon={<ArchiveOutlined />}
//                         label={translate(
//                             "alerts.archivedLabel",
//                             "Archived"
//                         )}
//                         sx={{
//                             mt: 2,
//                             bgcolor: "#F1F5F9",
//                             color: "#475569",
//                             fontWeight: 700,
//                         }}
//                     />
//                 )}

//                 <Divider
//                     sx={{
//                         my: {
//                             xs: 2.5,
//                             sm: 3,
//                         },
//                     }}
//                 />

//                 {isPropertyAlert ? (
//                     <Stack spacing={{ xs: 2, sm: 2.5 }}>
//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1.2,
//                             }}
//                         >
//                             {(alert.listingTypes || []).map(
//                                 (type) => (
//                                     <Chip
//                                         key={type}
//                                         label={getListingTypeLabel(type)}
//                                         size="medium"
//                                         color={
//                                             type === "For Rent"
//                                                 ? "info"
//                                                 : "success"
//                                         }
//                                         variant="outlined"
//                                         sx={{
//                                             fontWeight: 700,
//                                             fontSize: {
//                                                 xs: "0.8rem",
//                                                 sm: "0.9rem",
//                                             },
//                                         }}
//                                     />
//                                 )
//                             )}
//                         </Box>

//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1.2,
//                             }}
//                         >
//                             {types.map((type) => (
//                                 <Chip
//                                     key={type}
//                                     label={getPropertyTypeLabel(type)}
//                                     sx={{
//                                         maxWidth: "100%",
//                                         bgcolor: "#f8fafc",
//                                         border: "1px solid #E2E8F0",
//                                         color: "#334155",
//                                         fontWeight: 600,
//                                         fontSize: {
//                                             xs: "0.8rem",
//                                             sm: "0.9rem",
//                                         },
//                                         "& .MuiChip-label": {
//                                             whiteSpace: "normal",
//                                         },
//                                     }}
//                                 />
//                             ))}
//                         </Box>
//                     </Stack>
//                 ) : (
//                     <Stack spacing={{ xs: 2, sm: 2.5 }}>
//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1.2,
//                             }}
//                         >
//                             {(alert.purposes || []).map(
//                                 (purpose) => (
//                                     <Chip
//                                         key={purpose}
//                                         label={getRoommatePurposeLabel(
//                                             purpose
//                                         )}
//                                         color="success"
//                                         variant="outlined"
//                                         sx={{
//                                             fontWeight: 700,
//                                             fontSize: {
//                                                 xs: "0.8rem",
//                                                 sm: "0.9rem",
//                                             },
//                                         }}
//                                     />
//                                 )
//                             )}
//                         </Box>

//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1.2,
//                             }}
//                         >
//                             {types.map((type) => (
//                                 <Chip
//                                     key={type}
//                                     label={getPropertyTypeLabel(type)}
//                                     sx={{
//                                         maxWidth: "100%",
//                                         bgcolor: "#f8fafc",
//                                         border: "1px solid #E2E8F0",
//                                         color: "#334155",
//                                         fontWeight: 600,
//                                     }}
//                                 />
//                             ))}
//                         </Box>

//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1.2,
//                             }}
//                         >
//                             {(alert.rentalPeriods || []).length > 0 ? (
//                                 alert.rentalPeriods.map((period) => (
//                                     <Chip
//                                         key={period}
//                                         label={getRentalPeriodLabel(period)}
//                                         color="info"
//                                         variant="outlined"
//                                         sx={{
//                                             fontWeight: 700,
//                                         }}
//                                     />
//                                 ))
//                             ) : (
//                                 <Chip
//                                     label={translate(
//                                         "alerts.anyRentalPeriod",
//                                         "Any rental period"
//                                     )}
//                                     color="info"
//                                     variant="outlined"
//                                     sx={{
//                                         fontWeight: 700,
//                                     }}
//                                 />
//                             )}
//                         </Box>
//                     </Stack>
//                 )}
//             </Paper>
//         );
//     };

//     // --------------------------------------------------
//     // Selection chip renderer
//     // --------------------------------------------------

//     const renderSelectionChips = (
//         options,
//         selected,
//         setter,
//         getLabel = (value) => value
//     ) => (
//         <Box sx={chipContainerSx}>
//             {options.map((option) => {
//                 const isSelected = selected.includes(option);

//                 return (
//                     <Chip
//                         key={option}
//                         label={getLabel(option)}
//                         icon={
//                             isSelected ? (
//                                 <Check
//                                     sx={{
//                                         color: "#1d4ed8 !important",
//                                         fontSize: "1.2rem !important",
//                                     }}
//                                 />
//                             ) : undefined
//                         }
//                         clickable
//                         onClick={() =>
//                             toggleSelection(option, setter)
//                         }
//                         variant={
//                             isSelected ? "filled" : "outlined"
//                         }
//                         sx={selectionChipSx(isSelected)}
//                     />
//                 );
//             })}
//         </Box>
//     );

//     // --------------------------------------------------
//     // Selection summary
//     // --------------------------------------------------

//     const currentSelectedTypes = isPropertyAlert
//         ? selectedTypes
//         : roommateSelectedTypes;

//     const currentTypeSetter = isPropertyAlert
//         ? setSelectedTypes
//         : setRoommateSelectedTypes;

//     // --------------------------------------------------
//     // Page
//     // --------------------------------------------------

//     return (
//         <Box
//             sx={{
//                 width: "100%",
//                 maxWidth: 1100,
//                 mx: "auto",
//                 px: {
//                     xs: 1.5,
//                     sm: 3,
//                     md: 4,
//                 },
//                 py: {
//                     xs: 3,
//                     sm: 4,
//                     md: 6,
//                 },
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "stretch",
//                 gap: {
//                     xs: 3,
//                     sm: 4,
//                     md: 5,
//                 },
//                 boxSizing: "border-box",
//                 minWidth: 0,
//             }}
//         >
//             {/* Page header */}
//             <Stack
//                 direction="row"
//                 alignItems="center"
//                 spacing={{
//                     xs: 1.5,
//                     sm: 2.5,
//                     md: 3,
//                 }}
//                 sx={{
//                     width: "100%",
//                     minWidth: 0,
//                     borderBottom: "1px solid #E2E8F0",
//                     pb: {
//                         xs: 2.5,
//                         sm: 3,
//                         md: 4,
//                     },
//                 }}
//             >
//                 <Box
//                     sx={{
//                         width: {
//                             xs: 46,
//                             sm: 56,
//                             md: 64,
//                         },
//                         height: {
//                             xs: 46,
//                             sm: 56,
//                             md: 64,
//                         },
//                         borderRadius: {
//                             xs: 2.5,
//                             sm: 3,
//                         },
//                         bgcolor: "#eff6ff",
//                         color: "#2563EB",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         boxShadow:
//                             "0 4px 12px rgba(37, 99, 235, 0.1)",
//                         flexShrink: 0,
//                     }}
//                 >
//                     <NotificationsActiveOutlined
//                         sx={{
//                             fontSize: {
//                                 xs: 27,
//                                 sm: 32,
//                                 md: 36,
//                             },
//                         }}
//                     />
//                 </Box>

//                 <Box sx={{ minWidth: 0, flex: 1 }}>
//                     <Typography
//                         variant="h4"
//                         component="h1"
//                         fontWeight={700}
//                         color="#0f172a"
//                         sx={{
//                             fontSize: {
//                                 xs: "1.5rem",
//                                 sm: "1.75rem",
//                                 md: "1.875rem",
//                             },
//                             lineHeight: 1.2,
//                             mb: 1,
//                             overflowWrap: "anywhere",
//                         }}
//                     >
//                         {translate("alerts.title", "My Alerts")}
//                     </Typography>

//                     <Typography
//                         color="text.secondary"
//                         sx={{
//                             fontSize: {
//                                 xs: "0.9rem",
//                                 sm: "1rem",
//                                 md: "1.1rem",
//                             },
//                             lineHeight: 1.7,
//                         }}
//                     >
//                         {translate(
//                             "alerts.subtitle",
//                             "Manage your property and roommate notifications in one place."
//                         )}
//                     </Typography>
//                 </Box>
//             </Stack>

//             {/* Alert type tabs */}
//             <Paper
//                 elevation={0}
//                 sx={{
//                     width: "100%",
//                     border: "1px solid #E2E8F0",
//                     borderRadius: 3,
//                     p: 0.75,
//                     bgcolor: "#F8FAFC",
//                 }}
//             >
//                 <Tabs
//                     value={activeAlertType}
//                     onChange={handleTabChange}
//                     variant="fullWidth"
//                     sx={{
//                         minHeight: 52,
//                         "& .MuiTabs-indicator": {
//                             display: "none",
//                         },
//                         "& .MuiTab-root": {
//                             minHeight: 52,
//                             textTransform: "none",
//                             fontWeight: 700,
//                             fontSize: {
//                                 xs: "0.85rem",
//                                 sm: "1rem",
//                             },
//                             borderRadius: 2,
//                             color: "#64748B",
//                         },
//                         "& .MuiTab-root.Mui-selected": {
//                             bgcolor: "#FFFFFF",
//                             color: "#2563EB",
//                             boxShadow:
//                                 "0 2px 8px rgba(0,0,0,0.07)",
//                         },
//                     }}
//                 >
//                     <Tab
//                         value="property"
//                         icon={<HomeWorkOutlined />}
//                         iconPosition="start"
//                         label={translate(
//                             "alerts.propertyAlerts",
//                             "Property Alerts"
//                         )}
//                     />

//                     <Tab
//                         value="roommate"
//                         icon={<People />}
//                         iconPosition="start"
//                         label={translate(
//                             "alerts.roommateAlerts",
//                             "Roommate Alerts"
//                         )}
//                     />
//                 </Tabs>
//             </Paper>

//             {/* Feedback */}
//             {error && (
//                 <MuiAlert
//                     severity="error"
//                     onClose={() => setError("")}
//                     sx={{
//                         width: "100%",
//                         boxSizing: "border-box",
//                         borderRadius: 2,
//                         overflowWrap: "anywhere",
//                     }}
//                 >
//                     {error}
//                 </MuiAlert>
//             )}

//             {success && (
//                 <MuiAlert
//                     severity="success"
//                     onClose={() => setSuccess("")}
//                     sx={{
//                         width: "100%",
//                         boxSizing: "border-box",
//                         borderRadius: 2,
//                         overflowWrap: "anywhere",
//                     }}
//                 >
//                     {success}
//                 </MuiAlert>
//             )}

//             {/* Create alert form */}
//             <Paper
//                 elevation={0}
//                 sx={{
//                     width: "100%",
//                     minWidth: 0,
//                     boxSizing: "border-box",
//                     p: {
//                         xs: 2.5,
//                         sm: 4,
//                         md: 6,
//                     },
//                     border: "1px solid #E2E8F0",
//                     borderRadius: {
//                         xs: 3,
//                         sm: 4,
//                     },
//                     bgcolor: "#ffffff",
//                     boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
//                 }}
//             >
//                 <Typography
//                     variant="h5"
//                     fontWeight={700}
//                     color="#0f172a"
//                     sx={{
//                         fontSize: {
//                             xs: "1.35rem",
//                             sm: "1.5rem",
//                             md: "1.6rem",
//                         },
//                         mb: 2,
//                     }}
//                 >
//                     {isPropertyAlert
//                         ? translate(
//                               "properties.alerts.createTitle",
//                               "Create property alert"
//                           )
//                         : translate(
//                               "alerts.roommateCreateTitle",
//                               "Create roommate alert"
//                           )}
//                 </Typography>

//                 <Typography
//                     color="text.secondary"
//                     sx={{
//                         fontSize: {
//                             xs: "0.9rem",
//                             sm: "1rem",
//                             md: "1.05rem",
//                         },
//                         lineHeight: 1.8,
//                         mb: {
//                             xs: 3.5,
//                             sm: 5,
//                         },
//                     }}
//                 >
//                     {isPropertyAlert
//                         ? translate(
//                               "properties.alerts.createSubtitle",
//                               "Choose the properties you want to be notified about."
//                           )
//                         : translate(
//                               "alerts.roommateCreateSubtitle",
//                               "Choose your preferred city, property types, purposes and rental periods to find matching roommate announcements."
//                           )}
//                 </Typography>

//                 {/* City */}
//                 {/* City */}
//                 <Autocomplete
//                     freeSolo
//                     fullWidth
//                     options={cities}
//                     value={city}
//                     getOptionLabel={getCityOptionLabel}
//                     isOptionEqualToValue={(option, value) =>
//                         getCityOptionLabel(option).toLowerCase() ===
//                         getCityOptionLabel(value).toLowerCase()
//                     }
//                     onChange={(event, newValue) => {
//                         setCity(getCityOptionLabel(newValue));
//                         setError("");
//                         setSuccess("");
//                     }}
//                     onInputChange={(event, newInputValue, reason) => {
//                         if (reason === "input" || reason === "clear") {
//                             setCity(newInputValue || "");
//                             setError("");
//                             setSuccess("");
//                         }
//                     }}
//                     filterOptions={(options, { inputValue }) => {
//                         const search = inputValue.trim().toLowerCase();

//                         return options.filter((option) =>
//                             Array.isArray(option)
//                                 ? option.some((name) =>
//                                     name.toLowerCase().includes(search)
//                                 )
//                                 : getCityOptionLabel(option)
//                                     .toLowerCase()
//                                     .includes(search)
//                         );
//                     }}
//                     sx={{
//                         mb: {
//                             xs: 4,
//                             sm: 5,
//                         },
//                         "& .MuiOutlinedInput-root": {
//                             minHeight: {
//                                 xs: 54,
//                                 sm: 60,
//                             },
//                             borderRadius: "10px",
//                             fontSize: {
//                                 xs: "1rem",
//                                 sm: "1.05rem",
//                             },
//                         },
//                     }}
//                     renderInput={(params) => (
//                         <TextField
//                             {...params}
//                             label={translate("alerts.city", "City")}
//                             placeholder={translate(
//                                 "alerts.cityPlaceholder",
//                                 "Choose or enter a city"
//                             )}
//                         />
//                     )}
//                 />

//                 {isPropertyAlert ? (
//                     <>
//                         {/* Property listing types */}
//                         <Typography sx={sectionTitleSx}>
//                             {t(
//                                 "properties.alerts.listingType",
//                                 {
//                                     defaultValue: "Listing type",
//                                 }
//                             )}
//                         </Typography>

//                         {renderSelectionChips(
//                             listingTypeOptions,
//                             listingTypes,
//                             setListingTypes,
//                             getListingTypeLabel
//                         )}

//                         {/* Property types */}
//                         <Typography sx={sectionTitleSx}>
//                             {t(
//                                 "properties.alerts.propertyTypes",
//                                 {
//                                     defaultValue: "Property types",
//                                 }
//                             )}
//                         </Typography>

//                         {renderSelectionChips(
//                             propertyTypes,
//                             selectedTypes,
//                             setSelectedTypes,
//                             getPropertyTypeLabel
//                         )}
//                     </>
//                 ) : (
//                     <>
//                         {/* Roommate purposes */}
//                         <Typography sx={sectionTitleSx}>
//                             {translate(
//                                 "alerts.roommatePurposes",
//                                 "Roommate purpose"
//                             )}
//                         </Typography>

//                         {renderSelectionChips(
//                             roommatePurposeOptions,
//                             roommatePurposes,
//                             setRoommatePurposes,
//                             getRoommatePurposeLabel
//                         )}

//                         {/* Roommate property types */}
//                         <Typography sx={sectionTitleSx}>
//                             {translate(
//                                 "alerts.roommatePropertyTypes",
//                                 "Property types"
//                             )}
//                         </Typography>

//                         {renderSelectionChips(
//                             roommatePropertyTypes,
//                             roommateSelectedTypes,
//                             setRoommateSelectedTypes,
//                             getPropertyTypeLabel
//                         )}

//                         {/* Rental periods */}
//                         <Typography sx={sectionTitleSx}>
//                             {translate(
//                                 "alerts.rentalPeriods",
//                                 "Rental period"
//                             )}
//                         </Typography>

//                         <Typography
//                             color="text.secondary"
//                             sx={{
//                                 fontSize: "0.9rem",
//                                 mb: 2,
//                                 mt: -1.5,
//                             }}
//                         >
//                             {translate(
//                                 "alerts.rentalPeriodsHint",
//                                 "Leave both options unselected to receive announcements for any rental period."
//                             )}
//                         </Typography>

//                         {renderSelectionChips(
//                             rentalPeriodOptions,
//                             rentalPeriods,
//                             setRentalPeriods,
//                             getRentalPeriodLabel
//                         )}
//                     </>
//                 )}

//                 {/* Selection summary */}
//                 <Box
//                     sx={{
//                         bgcolor: "#f8fafc",
//                         border: "1px solid #E2E8F0",
//                         borderRadius: "16px",
//                         p: {
//                             xs: 2,
//                             sm: 3,
//                         },
//                         mb: {
//                             xs: 3,
//                             sm: 4,
//                         },
//                         minWidth: 0,
//                     }}
//                 >
//                     <Typography
//                         fontWeight={700}
//                         sx={{
//                             fontSize: {
//                                 xs: "1rem",
//                                 sm: "1.1rem",
//                             },
//                             color: "#0f172a",
//                             mb: 1.5,
//                         }}
//                     >
//                         {translate(
//                             "alerts.selectedForAlert",
//                             "Your alert preferences"
//                         )}
//                     </Typography>

//                     <Typography
//                         color="text.secondary"
//                         sx={{
//                             fontSize: {
//                                 xs: "0.9rem",
//                                 sm: "1rem",
//                             },
//                             lineHeight: 1.7,
//                             mb: 2,
//                             overflowWrap: "anywhere",
//                         }}
//                     >
//                         {city || translate(
//                             "alerts.anyCity",
//                             "Any city"
//                         )}
//                     </Typography>

//                     {!isPropertyAlert && (
//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1,
//                                 mb: 2,
//                             }}
//                         >
//                             {roommatePurposes.map((purpose) => (
//                                 <Chip
//                                     key={purpose}
//                                     size="small"
//                                     label={getRoommatePurposeLabel(
//                                         purpose
//                                     )}
//                                     color="success"
//                                     variant="outlined"
//                                 />
//                             ))}
//                         </Box>
//                     )}

//                     {isPropertyAlert && (
//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1,
//                                 mb: 2,
//                             }}
//                         >
//                             {listingTypes.map((type) => (
//                                 <Chip
//                                     key={type}
//                                     size="small"
//                                     label={getListingTypeLabel(type)}
//                                     color="info"
//                                     variant="outlined"
//                                 />
//                             ))}
//                         </Box>
//                     )}

//                     {currentSelectedTypes.length > 0 ? (
//                         <Box
//                             sx={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 1.2,
//                                 mb: 2,
//                             }}
//                         >
//                             {currentSelectedTypes.map((type) => (
//                                 <Chip
//                                     key={type}
//                                     label={getPropertyTypeLabel(type)}
//                                     onDelete={() =>
//                                         removeSelectedType(
//                                             type,
//                                             currentTypeSetter
//                                         )
//                                     }
//                                     deleteIcon={<Close />}
//                                     sx={{
//                                         maxWidth: "100%",
//                                         height: "auto",
//                                         minHeight: 38,
//                                         bgcolor: "#ffffff",
//                                         border: "1px solid #E2E8F0",
//                                         fontWeight: 600,
//                                         fontSize: {
//                                             xs: "0.85rem",
//                                             sm: "0.95rem",
//                                         },
//                                         borderRadius: 2,
//                                         "& .MuiChip-label": {
//                                             whiteSpace: "normal",
//                                             py: 1,
//                                         },
//                                     }}
//                                 />
//                             ))}
//                         </Box>
//                     ) : (
//                         <Typography
//                             color="text.secondary"
//                             sx={{
//                                 fontSize: {
//                                     xs: "0.9rem",
//                                     sm: "1rem",
//                                 },
//                                 mb: 2,
//                             }}
//                         >
//                             {translate(
//                                 "alerts.noPropertyTypes",
//                                 "No property types selected."
//                             )}
//                         </Typography>
//                     )}

//                     {!isPropertyAlert && (
//                         <Typography
//                             color="text.secondary"
//                             sx={{
//                                 fontSize: "0.9rem",
//                                 lineHeight: 1.7,
//                             }}
//                         >
//                             {translate(
//                                 "alerts.rentalPeriodSummary",
//                                 "Rental period:"
//                             )}{" "}
//                             {rentalPeriods.length > 0
//                                 ? rentalPeriods
//                                       .map(getRentalPeriodLabel)
//                                       .join(", ")
//                                 : translate(
//                                       "alerts.anyRentalPeriod",
//                                       "Any rental period"
//                                   )}
//                         </Typography>
//                     )}
//                 </Box>

//                 <Button
//                     variant="contained"
//                     fullWidth
//                     startIcon={
//                         saving ? (
//                             <CircularProgress
//                                 size={20}
//                                 color="inherit"
//                             />
//                         ) : (
//                             <Add />
//                         )
//                     }
//                     disabled={saving || loading}
//                     onClick={handleAddAlert}
//                     sx={{
//                         minHeight: {
//                             xs: 50,
//                             sm: 58,
//                         },
//                         bgcolor: "#2563EB",
//                         fontWeight: 700,
//                         textTransform: "none",
//                         py: 1.5,
//                         px: 2,
//                         borderRadius: "10px",
//                         fontSize: {
//                             xs: "1rem",
//                             sm: "1.1rem",
//                         },
//                         boxShadow:
//                             "0 6px 18px rgba(37, 99, 235, 0.25)",
//                         "&:hover": {
//                             bgcolor: "#1d4ed8",
//                         },
//                     }}
//                 >
//                     {saving
//                         ? translate(
//                               "alerts.saving",
//                               "Saving..."
//                           )
//                         : translate(
//                               "alerts.save",
//                               "Create alert"
//                           )}
//                 </Button>
//             </Paper>

//             {/* Active alerts */}
//             <Box sx={{ width: "100%", minWidth: 0 }}>
//                 <Stack
//                     direction="row"
//                     alignItems="center"
//                     justifyContent="space-between"
//                     spacing={2}
//                     sx={{
//                         mb: {
//                             xs: 2,
//                             sm: 3,
//                         },
//                         minWidth: 0,
//                     }}
//                 >
//                     <Typography
//                         variant="h5"
//                         fontWeight={700}
//                         color="#0f172a"
//                         sx={{
//                             fontSize: {
//                                 xs: "1.25rem",
//                                 sm: "1.45rem",
//                                 md: "1.6rem",
//                             },
//                             minWidth: 0,
//                         }}
//                     >
//                         {translate(
//                             "alerts.yourAlerts",
//                             "Your active alerts"
//                         )}
//                     </Typography>

//                     <Chip
//                         label={alerts.length}
//                         size="medium"
//                         color="primary"
//                         sx={{
//                             fontWeight: 700,
//                             fontSize: {
//                                 xs: "0.8rem",
//                                 sm: "0.95rem",
//                             },
//                             flexShrink: 0,
//                         }}
//                     />
//                 </Stack>

//                 {loading ? (
//                     <Box
//                         sx={{
//                             display: "flex",
//                             justifyContent: "center",
//                             p: {
//                                 xs: 4,
//                                 sm: 6,
//                             },
//                             width: "100%",
//                             boxSizing: "border-box",
//                             bgcolor: "#ffffff",
//                             border: "1px solid #E2E8F0",
//                             borderRadius: "16px",
//                         }}
//                     >
//                         <CircularProgress />
//                     </Box>
//                 ) : alerts.length === 0 ? (
//                     <Paper
//                         elevation={0}
//                         sx={{
//                             p: {
//                                 xs: 3,
//                                 sm: 5,
//                                 md: 6,
//                             },
//                             textAlign: "center",
//                             border: "1px dashed #E2E8F0",
//                             borderRadius: "16px",
//                             bgcolor: "#ffffff",
//                             boxSizing: "border-box",
//                         }}
//                     >
//                         <NotificationsActiveOutlined
//                             sx={{
//                                 fontSize: {
//                                     xs: 42,
//                                     sm: 54,
//                                 },
//                                 color: "#94a3b8",
//                                 mb: 2,
//                             }}
//                         />

//                         <Typography
//                             fontWeight={700}
//                             variant="h6"
//                             sx={{
//                                 fontSize: {
//                                     xs: "1.05rem",
//                                     sm: "1.2rem",
//                                 },
//                                 mb: 1,
//                             }}
//                         >
//                             {translate(
//                                 "alerts.emptyTitle",
//                                 "No active alerts yet"
//                             )}
//                         </Typography>

//                         <Typography
//                             color="text.secondary"
//                             sx={{
//                                 fontSize: {
//                                     xs: "0.9rem",
//                                     sm: "1rem",
//                                 },
//                             }}
//                         >
//                             {translate(
//                                 "alerts.emptySubtitle",
//                                 "Create an alert above to receive notifications about matching announcements."
//                             )}
//                         </Typography>
//                     </Paper>
//                 ) : (
//                     <Stack
//                         spacing={{
//                             xs: 2,
//                             sm: 3,
//                         }}
//                         sx={{ width: "100%" }}
//                     >
//                         {alerts.map((alert) =>
//                             renderAlertCard(alert)
//                         )}
//                     </Stack>
//                 )}
//             </Box>

//             {/* Archived alerts */}
//             <Box sx={{ width: "100%", minWidth: 0 }}>
//                 <Stack
//                     direction="row"
//                     alignItems="center"
//                     justifyContent="space-between"
//                     spacing={2}
//                     sx={{
//                         mb: {
//                             xs: 2,
//                             sm: 3,
//                         },
//                         minWidth: 0,
//                     }}
//                 >
//                     <Stack
//                         direction="row"
//                         alignItems="center"
//                         spacing={1.5}
//                     >
//                         <ArchiveOutlined
//                             sx={{
//                                 color: "#64748B",
//                                 fontSize: {
//                                     xs: 23,
//                                     sm: 27,
//                                 },
//                             }}
//                         />

//                         <Typography
//                             variant="h5"
//                             fontWeight={700}
//                             color="#0f172a"
//                             sx={{
//                                 fontSize: {
//                                     xs: "1.15rem",
//                                     sm: "1.4rem",
//                                     md: "1.5rem",
//                                 },
//                             }}
//                         >
//                             {translate(
//                                 "alerts.archivedAlerts",
//                                 "Archived alerts"
//                             )}
//                         </Typography>
//                     </Stack>

//                     <Chip
//                         label={archivedAlerts.length}
//                         size="medium"
//                         sx={{
//                             fontWeight: 700,
//                             bgcolor: "#F1F5F9",
//                             color: "#475569",
//                             flexShrink: 0,
//                         }}
//                     />
//                 </Stack>

//                 {!loading && archivedAlerts.length === 0 ? (
//                     <Paper
//                         elevation={0}
//                         sx={{
//                             p: {
//                                 xs: 3,
//                                 sm: 4,
//                             },
//                             textAlign: "center",
//                             border: "1px dashed #CBD5E1",
//                             borderRadius: "16px",
//                             bgcolor: "#F8FAFC",
//                         }}
//                     >
//                         <ArchiveOutlined
//                             sx={{
//                                 fontSize: 38,
//                                 color: "#94A3B8",
//                                 mb: 1,
//                             }}
//                         />

//                         <Typography
//                             fontWeight={600}
//                             color="#475569"
//                         >
//                             {translate(
//                                 "alerts.noArchivedAlerts",
//                                 "You don't have any archived alerts."
//                             )}
//                         </Typography>
//                     </Paper>
//                 ) : (
//                     <Stack
//                         spacing={{
//                             xs: 2,
//                             sm: 3,
//                         }}
//                         sx={{ width: "100%" }}
//                     >
//                         {archivedAlerts.map((alert) =>
//                             renderAlertCard(alert, true)
//                         )}
//                     </Stack>
//                 )}
//             </Box>
//         </Box>
//     );
// }