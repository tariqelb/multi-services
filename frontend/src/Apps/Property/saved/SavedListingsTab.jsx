// src/Apps/Property/saved/SavedListingsTab.jsx
// Saved roommate announcements or hotels / riads (type: "roommate" or
// "establishment"), in the Saved page. Same cards as their lists, with the
// save date and "Remove" under each card.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import BookmarkRemoveOutlinedIcon from "@mui/icons-material/BookmarkRemoveOutlined";
import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import axiosInstance from "../../../api/axiosInstance";
import RoommateCard from "../roommate/RoommateCard";
import EstablishmentCard from "../Establishment/EstablishmentCard";

const PER_PAGE = 9;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const gridSx = {
    display: "grid",
    gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
    gap: { xs: 2, sm: 2.5, md: 3 },
    alignItems: "stretch",
    "& > *": { minWidth: 0 },
};

function imageUrl(image) {
    const path = typeof image === "string" ? image : image?.path || image?.url || image?.filename || "";
    if (!path) return "";
    if (/^(https?:|data:)/.test(path)) return path;
    return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function startingPrice(rooms = []) {
    const prices = rooms.map((room) => Number(room.pricePerNight)).filter((price) => Number.isFinite(price) && price > 0);
    return prices.length ? Math.min(...prices) : null;
}

const TEXTS = {
    roommate: {
        empty: ["savedListings.emptyRoommates", "No saved roommate announcement yet"],
        browse: ["savedListings.browseRoommates", "Find a roommate"],
        path: "/roommates",
    },
    establishment: {
        empty: ["savedListings.emptyEstablishments", "No saved hotel or riad yet"],
        browse: ["savedListings.browseEstablishments", "Browse hotels & riads"],
        path: "/establishments",
    },
};

export default function SavedListingsTab({ type, onCountChange }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get("/property/saved-listings", { params: { type } })
            .then(({ data }) => !cancelled && setItems(data.items || []))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("savedListings.loadError", "Unable to load your saved list.")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [type, t]);

    useEffect(() => {
        if (!loading) onCountChange?.(items.length);
    }, [items.length, loading, onCountChange]);

    const remove = async (listingId) => {
        setRemovingId(listingId);
        setError("");
        try {
            await axiosInstance.delete(`/property/saved-listings/${type}/${listingId}`);
            setItems((list) => list.filter((item) => item.listing._id !== listingId));
        } catch (requestError) {
            setError(requestError.response?.data?.message || t("savedListings.error", "Unable to update your saved list."));
        } finally {
            setRemovingId(null);
        }
    };

    const texts = TEXTS[type];
    const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const shown = items.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    const dateOf = (value) => (value ? new Date(value).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" }) : "");

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {items.length === 0 ? (
                <Box sx={{ py: 6, px: 2, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: "16px", bgcolor: "#F5F7FB" }}>
                    <BookmarksOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155", mb: 1 }}>
                        {t(...texts.empty)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                        {t("savedListings.emptyHint", "Open a listing and press “Save” to keep it here.")}
                    </Typography>
                    <Button variant="contained" startIcon={<SearchRoundedIcon />} onClick={() => navigate(texts.path)} sx={{ textTransform: "none" }}>
                        {t(...texts.browse)}
                    </Button>
                </Box>
            ) : (
                <>
                    <Box sx={gridSx}>
                        {shown.map(({ listing, savedAt }) => (
                            <Stack key={listing._id} spacing={1}>
                                {type === "roommate" ? (
                                    <RoommateCard listing={listing} />
                                ) : (
                                    <EstablishmentCard
                                        establishment={listing}
                                        image={imageUrl(listing.media?.coverPhoto)}
                                        startingPrice={startingPrice(listing.rooms)}
                                        onClick={() => navigate(`/establishments/${listing._id}`)}
                                    />
                                )}
                                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {t("savedListings.savedOn", "Saved on {{date}}", { date: dateOf(savedAt) })}
                                    </Typography>
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={removingId === listing._id ? <CircularProgress size={14} color="inherit" /> : <BookmarkRemoveOutlinedIcon />}
                                        disabled={removingId === listing._id}
                                        onClick={() => remove(listing._id)}
                                        sx={{ textTransform: "none", fontWeight: 600 }}
                                    >
                                        {t("savedListings.remove", "Remove")}
                                    </Button>
                                </Stack>
                            </Stack>
                        ))}
                    </Box>
                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                            <Pagination count={totalPages} page={currentPage} onChange={(_event, value) => setPage(value)} color="primary" shape="rounded" />
                        </Box>
                    )}
                </>
            )}
        </>
    );
}
