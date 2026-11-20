
import React from "react";

import {
    Box,
    Paper,
    Typography,
    Stack,
    Divider,
    Chip,
    Button,
    Tooltip,
    CircularProgress,
} from "@mui/material";

import HomeWorkOutlined from "@mui/icons-material/HomeWorkOutlined";
import People from "@mui/icons-material/People";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlined from "@mui/icons-material/UnarchiveOutlined";

export default function AlertCard({
    alert,
    archived = false,
    isPropertyAlert,
    archivingId,
    restoringId,
    onArchive,
    onRestore,
    translate,
    getCityLabel,
    getPropertyTypeLabel,
    getListingTypeLabel,
    getRoommatePurposeLabel,
    getRentalPeriodLabel,
}) {
    const busy =
        archivingId === alert._id ||
        restoringId === alert._id;

    const types = alert.propertyTypes || [];

    const actionButtonSx = {
        flexShrink: 0,
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
    };

    const chipSx = {
        maxWidth: "100%",
        fontWeight: 600,
        fontSize: {
            xs: "0.8rem",
            sm: "0.9rem",
        },
        "& .MuiChip-label": {
            whiteSpace: "normal",
        },
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                p: {
                    xs: 2.5,
                    sm: 4,
                    md: 5,
                },
                border: "1px solid #E2E8F0",
                borderRadius: {
                    xs: 3,
                    sm: 4,
                },
                bgcolor: archived ? "#F8FAFC" : "#ffffff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                opacity: archived ? 0.9 : 1,
            }}
        >
            <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", justifyContent: "space-between",
                    width: "100%",
                    minWidth: 0,
                    flexWrap: {
                        xs: "wrap",
                        sm: "nowrap",
                    },
                }}
            >
                <Stack
                    direction="row"
                    spacing={{
                        xs: 1.5,
                        sm: 2.5,
                    }}
                    sx={{ alignItems: "center",
                        minWidth: 0,
                        flex: 1,
                    }}
                >
                    <Box
                        sx={{
                            width: {
                                xs: 42,
                                sm: 52,
                            },
                            height: {
                                xs: 42,
                                sm: 52,
                            },
                            flexShrink: 0,
                            borderRadius: "10px",
                            bgcolor: archived
                                ? "#F1F5F9"
                                : isPropertyAlert
                                  ? "#eff6ff"
                                  : "#F0FDF4",
                            color: archived
                                ? "#64748B"
                                : isPropertyAlert
                                  ? "#2563EB"
                                  : "#15803D",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {isPropertyAlert ? (
                            <HomeWorkOutlined
                                sx={{
                                    fontSize: {
                                        xs: 22,
                                        sm: 26,
                                    },
                                }}
                            />
                        ) : (
                            <People
                                sx={{
                                    fontSize: {
                                        xs: 22,
                                        sm: 26,
                                    },
                                }}
                            />
                        )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 700,
                                fontSize: {
                                    xs: "1.05rem",
                                    sm: "1.2rem",
                                },
                                color: "#0f172a",
                                overflowWrap: "anywhere",
                            }}
                        >
                            {getCityLabel(alert.city)}
                        </Typography>

                        <Typography
                            sx={{ color: "text.secondary",
                                fontSize: {
                                    xs: "0.85rem",
                                    sm: "0.95rem",
                                },
                                mt: 0.5,
                            }}
                        >
                            {translate(
                                "alerts.propertyTypeCount",
                                `${types.length} property types`,
                                { count: types.length }
                            )}
                        </Typography>
                    </Box>
                </Stack>

                {archived ? (
                    <Tooltip
                        title={translate(
                            "alerts.restoreAlert",
                            "Restore alert"
                        )}
                    >
                        <span>
                            <Button
                                aria-label={translate(
                                    "alerts.restoreAlert",
                                    "Restore alert"
                                )}
                                disabled={busy}
                                onClick={() => onRestore(alert._id)}
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
                                    ...actionButtonSx,
                                    color: "#15803D",
                                    bgcolor: "#F0FDF4",
                                    border: "1px solid #BBF7D0",
                                    "&:hover": {
                                        bgcolor: "#DCFCE7",
                                    },
                                }}
                            >
                                {restoringId === alert._id
                                    ? translate(
                                          "alerts.restoring",
                                          "Restoring..."
                                      )
                                    : translate(
                                          "alerts.restore",
                                          "Restore"
                                      )}
                            </Button>
                        </span>
                    </Tooltip>
                ) : (
                    <Tooltip
                        title={translate(
                            "alerts.archiveAlert",
                            "Archive alert"
                        )}
                    >
                        <span>
                            <Button
                                aria-label={translate(
                                    "alerts.archiveAlert",
                                    "Archive alert"
                                )}
                                disabled={busy}
                                onClick={() => onArchive(alert._id)}
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
                                    ...actionButtonSx,
                                    color: "#B45309",
                                    bgcolor: "#FFFBEB",
                                    border: "1px solid #FDE68A",
                                    "&:hover": {
                                        bgcolor: "#FEF3C7",
                                    },
                                }}
                            >
                                {archivingId === alert._id
                                    ? translate(
                                          "alerts.archiving",
                                          "Archiving..."
                                      )
                                    : translate(
                                          "alerts.archive",
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
                    label={translate(
                        "alerts.archivedLabel",
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

            <Divider
                sx={{
                    my: {
                        xs: 2.5,
                        sm: 3,
                    },
                }}
            />

            {isPropertyAlert ? (
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
                        {types.map((type) => (
                            <Chip
                                key={type}
                                label={getPropertyTypeLabel(type)}
                                sx={{
                                    ...chipSx,
                                    bgcolor: "#f8fafc",
                                    border: "1px solid #E2E8F0",
                                    color: "#334155",
                                }}
                            />
                        ))}
                    </Box>
                </Stack>
            ) : (
                <Stack spacing={{ xs: 2, sm: 2.5 }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1.2,
                        }}
                    >
                        {(alert.purposes || []).map((purpose) => (
                            <Chip
                                key={purpose}
                                label={getRoommatePurposeLabel(purpose)}
                                color="success"
                                variant="outlined"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: {
                                        xs: "0.8rem",
                                        sm: "0.9rem",
                                    },
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
                        {types.map((type) => (
                            <Chip
                                key={type}
                                label={getPropertyTypeLabel(type)}
                                sx={{
                                    ...chipSx,
                                    bgcolor: "#f8fafc",
                                    border: "1px solid #E2E8F0",
                                    color: "#334155",
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
                        {(alert.rentalPeriods || []).length > 0 ? (
                            alert.rentalPeriods.map((period) => (
                                <Chip
                                    key={period}
                                    label={getRentalPeriodLabel(period)}
                                    color="info"
                                    variant="outlined"
                                    sx={{ fontWeight: 700 }}
                                />
                            ))
                        ) : (
                            <Chip
                                label={translate(
                                    "alerts.anyRentalPeriod",
                                    "Any rental period"
                                )}
                                color="info"
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                            />
                        )}
                    </Box>
                </Stack>
            )}
        </Paper>
    );
}
