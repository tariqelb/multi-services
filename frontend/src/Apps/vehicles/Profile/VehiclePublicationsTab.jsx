// src/Apps/vehicles/Profile/VehiclePublicationsTab.jsx
// Public vehicles (or motos & bikes, or spare parts with category="part") of
// a publisher: same cards and grid as the lists, 12 at a time with "Load more".

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";

import axiosInstance from "../../../api/axiosInstance";
import VehicleCard from "../VehicleList/VehicleCard";
import SparePartCard from "../SpareParts/SparePartCard";

const PER_PAGE = 12;

const gridSx = {
    display: "grid",
    gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
    gap: { xs: 2, sm: 2.5, md: 3 },
    alignItems: "stretch",
    "& > *": { minWidth: 0 },
};

export default function VehiclePublicationsTab({ userId, category }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isMoto = category === "moto";
    const isPart = category === "part";

    const [vehicles, setVehicles] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchPage = (nextPage) =>
        (isPart
            ? axiosInstance.get(`/vehicles/parts/by-user/${userId}`, { params: { page: nextPage, limit: PER_PAGE } })
            : axiosInstance.get(`/vehicles/profiles/${userId}/vehicles`, { params: { category, page: nextPage, limit: PER_PAGE } })
        ).then(({ data }) => ({ ...data, items: (isPart ? data.parts : data.vehicles) || [] }));
    const failed = (requestError) =>
        requestError.response?.data?.message || t("vehiclesApp.profile.errors.publications", "Unable to load the publications.");

    // First page (the tab is mounted again for another publisher or section).
    useEffect(() => {
        let cancelled = false;
        fetchPage(1)
            .then((data) => {
                if (cancelled) return;
                setVehicles(data.items);
                setPage(1);
                setHasMore(Boolean(data.pagination?.hasMore));
            })
            .catch((requestError) => !cancelled && setError(failed(requestError)))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, category]);

    const loadMore = async () => {
        setLoading(true);
        try {
            const data = await fetchPage(page + 1);
            setVehicles((previous) => [...previous, ...data.items]);
            setPage(page + 1);
            setHasMore(Boolean(data.pagination?.hasMore));
        } catch (requestError) {
            setError(failed(requestError));
        } finally {
            setLoading(false);
        }
    };

    if (error) return <Alert severity="error">{error}</Alert>;

    if (loading && vehicles.length === 0) {
        return (
            <Box sx={gridSx}>
                {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: 4 }} />
                ))}
            </Box>
        );
    }

    if (vehicles.length === 0) {
        const Icon = isPart ? BuildOutlined : isMoto ? TwoWheelerOutlined : DirectionsCarOutlined;
        return (
            <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 6, border: "1px dashed #CBD5E1", borderRadius: 3, bgcolor: "#F8FAFC" }}>
                <Icon sx={{ fontSize: 44, color: "text.disabled" }} />
                <Typography sx={{ fontWeight: 600, color: "#334155" }}>
                    {isPart
                        ? t("vehiclesApp.profile.emptyParts", "No spare part published")
                        : isMoto
                        ? t("vehiclesApp.profile.emptyMotos", "No moto or bike published")
                        : t("vehiclesApp.profile.emptyVehicles", "No vehicle published")}
                </Typography>
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <Box sx={gridSx}>
                {vehicles.map((item) =>
                    isPart ? (
                        <SparePartCard key={item._id} part={item} onClick={() => navigate(`/vehicles/parts/${item._id}`)} />
                    ) : (
                        <VehicleCard key={item._id} vehicle={item} onClick={() => navigate(`/vehicles/${item._id}`)} />
                    ),
                )}
            </Box>
            {hasMore && (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Button
                        variant="outlined"
                        onClick={loadMore}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                        {t("publicProfile.loadMore", "Load more")}
                    </Button>
                </Box>
            )}
        </Stack>
    );
}
