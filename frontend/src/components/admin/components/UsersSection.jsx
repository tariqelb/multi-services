
import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

import axiosInstance from "../../../api/axiosInstance";
import UserCard from "./UserCard";

export default function UsersSection() {
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
                        "Failed to load users."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <Box>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
                mb={3}
            >
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        Users
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                    >
                        Account information and marketplace activity.
                    </Typography>
                </Box>

                <Chip
                    icon={<PeopleAltOutlinedIcon />}
                    label={`${users.length} users`}
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
                    No users found.
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
