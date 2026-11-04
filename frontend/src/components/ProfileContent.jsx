import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Stack } from "@mui/material";
import { getProfile } from "../redux/actions/profile/profileAction";

import PageLayout from "./PageLayout";
import DisplayProfile from "./DisplayProfile";
import EditProfile from "./EditProfile";
import Password from "./Password";

const emptyProfile = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    bio: "",
    profileImage: "",
};

export default function ProfileContent() {
    const dispatch = useDispatch();

    const profileState = useSelector(
        (state) => state.profile ?? emptyProfile
    );

    const {
        loading = false,
        error = null,
    } = profileState;

    const profile = profileState;

    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    const handleEdit = () => {
        setSuccessMessage("");
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleProfileSaved = (message) => {
        setIsEditing(false);
        setSuccessMessage(message);
    };

    return (
        <PageLayout
            title="My Profile"
            subtitle="View and manage your personal information."
            maxWidth={900}
        >
            <Stack spacing={2} sx={{ mb: loading || error || successMessage ? 3 : 0 }}>
                {loading && <Alert severity="info" sx={{ borderRadius: "10px" }}>Loading profile...</Alert>}
                {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ borderRadius: "10px" }}>{successMessage}</Alert>}
            </Stack>

            {/* Always display the user's profile */}
            <DisplayProfile profile={profile} onEdit={handleEdit} />

            {/* The edit modal and the Password block were commented out in
                your original file. Uncomment them here when you need them. */}
        </PageLayout>
    );
}
