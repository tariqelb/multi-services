
import React from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

export default function ChangePassword({
    passwords,
    setPasswords,
    error,
    success,
    loading,
    onSubmit,
}) {
    const handleChange = (event) => {
        const { name, value } = event.target;

        setPasswords((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (
            !passwords.currentPassword ||
            !passwords.newPassword ||
            !passwords.confirmPassword
        ) {
            return;
        }

        if (passwords.newPassword.length < 8) {
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            return;
        }

        if (passwords.currentPassword === passwords.newPassword) {
            return;
        }

        onSubmit(event);
    };

    const newPasswordError =
        passwords.newPassword.length > 0 &&
        passwords.newPassword.length < 8;

    const confirmPasswordError =
        passwords.confirmPassword.length > 0 &&
        passwords.newPassword !== passwords.confirmPassword;

    const samePasswordError =
        passwords.currentPassword.length > 0 &&
        passwords.newPassword.length > 0 &&
        passwords.currentPassword === passwords.newPassword;

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3.5,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            }}
        >
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack
                    direction="row"
                    spacing={2.5}
                    alignItems="center"
                    sx={{ mb: 4.5 }}
                >
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 2.5,
                            bgcolor: "#ecfdf5",
                            color: "#047857",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <LockOutlined sx={{ fontSize: 26 }} />
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{ mb: 0.5 }}
                        >
                            Change Password
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            Use a strong, unique password to protect your account.
                        </Typography>
                    </Box>
                </Stack>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Current password"
                            name="currentPassword"
                            type="password"
                            value={passwords.currentPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            autoComplete="current-password"
                        />

                        <TextField
                            label="New password"
                            name="newPassword"
                            type="password"
                            value={passwords.newPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            autoComplete="new-password"
                            error={newPasswordError || samePasswordError}
                            helperText={
                                newPasswordError
                                    ? "Password must be at least 8 characters long."
                                    : samePasswordError
                                      ? "New password must differ from the current password."
                                      : "Use at least 8 characters."
                            }
                        />

                        <TextField
                            label="Confirm new password"
                            name="confirmPassword"
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            autoComplete="new-password"
                            error={confirmPasswordError}
                            helperText={
                                confirmPasswordError
                                    ? "Passwords do not match."
                                    : ""
                            }
                        />
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2.5 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mt: 2.5 }}>
                            {success}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={<LockOutlined />}
                        sx={{
                            mt: 4,
                            bgcolor: "#047857",
                            "&:hover": { bgcolor: "#065f46" },
                            textTransform: "none",
                            fontWeight: 700,
                            py: 1.25,
                            px: 3,
                            borderRadius: 2.5,
                        }}
                    >
                        {loading ? "Updating..." : "Update password"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
