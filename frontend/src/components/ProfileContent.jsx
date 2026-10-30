
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "../redux/actions/profile/profileAction";

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
        <main className="min-h-screen flex-1 bg-gray-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Profile
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        View and manage your personal information.
                    </p>

                    {loading && (
                        <p className="mt-2 text-sm text-gray-500">
                            Loading profile...
                        </p>
                    )}

                    {error && (
                        <p role="alert" className="mt-2 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    {successMessage && (
                        <p role="status" className="mt-3 text-sm text-green-700">
                            {successMessage}
                        </p>
                    )}
                </div>

                {/* Always display the user's profile */}
                <DisplayProfile
                    profile={profile}
                    onEdit={handleEdit}
                />

                {/* Show the edit form in a modal */}
                {/* {isEditing && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={handleCancel}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="edit-profile-title"
                            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2
                                    id="edit-profile-title"
                                    className="text-xl font-bold text-gray-900"
                                >
                                    Edit profile
                                </h2>

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    aria-label="Close edit profile"
                                    className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
                                >
                                    &times;
                                </button>
                            </div>

                            <EditProfile
                                profile={profile}
                                onCancel={handleCancel}
                                onSaved={handleProfileSaved}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    <Password />
                </div> */}
            </div>
        </main>
    );
}