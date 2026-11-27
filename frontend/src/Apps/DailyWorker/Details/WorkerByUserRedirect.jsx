// src/Apps/DailyWorker/Details/WorkerByUserRedirect.jsx
//
// /daily-worker/user/:userId — opens the worker page of a user (links that
// only know the account, like the admin portfolio review).

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, CircularProgress, Stack } from "@mui/material";

import axiosInstance from "../../../api/axiosInstance";
import { pagePaddingSx } from "../../../Components/ui/PageContainer";

export default function WorkerByUserRedirect() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get(`/workers/user/${userId}`)
            .then(({ data }) => !cancelled && navigate(`/daily-worker/${data.id}`, { replace: true }))
            .catch((requestError) => !cancelled && setError(requestError.response?.data?.message || t("workersApp.details.notFound", "Worker not found.")));
        return () => {
            cancelled = true;
        };
    }, [userId, navigate, t]);

    return (
        <Box sx={pagePaddingSx}>
            {error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Stack sx={{ alignItems: "center", py: 10 }}>
                    <CircularProgress />
                </Stack>
            )}
        </Box>
    );
}
