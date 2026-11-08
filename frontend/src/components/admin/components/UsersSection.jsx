import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

import axiosInstance from "../../../api/axiosInstance";
import UserCard from "./UserCard";

export default function UsersSection() {
    const { t } = useTranslation();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axiosInstance.get(
                    "/dashboard/users"
                );

                setUsers(response.data.users ?? []);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        t("usersSection.loadError")
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <Box sx={{ mb: 2 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
                mb={3}
            >
                <Box sx={{pb:5}}>
                    <Typography variant="h5" fontWeight={700}>
                        {t("usersSection.title")}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        {t("usersSection.subtitle")}
                    </Typography>

                </Box>
                <Chip
                    icon={<PeopleAltOutlinedIcon />}
                    label={t("usersSection.userCount", {
                        count: users.length,
                    })}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                />
            </Stack>

            {loading ? (
                <Box
                    display="flex"
                    justifyContent="center"
                    py={5}
                >
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : users.length === 0 ? (
                <Typography color="text.secondary" py={3}>
                    {t("usersSection.empty")}
                </Typography>
            ) : (
                <Stack spacing={2.5}>
                    {users.map((user) => (
                        <UserCard
                            key={user._id}
                            user={user}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}