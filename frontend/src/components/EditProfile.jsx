
// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//     updateProfile,
// } from "../redux/actions/profile/profileAction";

// const emptyProfile = {
//     firstName: "",
//     lastName: "",
//     email: "",
//     phoneNumber: "",
//     address: "",
//     bio: "",
//     profileImage: "",
// };

// export default function EditProfile({
//     profile,
//     onCancel,
//     onSaved,
// }) {
//     const dispatch = useDispatch();

//     const { loading = false } = useSelector(
//         (state) => state.profile ?? {}
//     );

//     const [formData, setFormData] = useState(emptyProfile);
//     const [formError, setFormError] = useState("");

//     useEffect(() => {
//         setFormData({
//             firstName: profile.firstName ?? "",
//             lastName: profile.lastName ?? "",
//             email: profile.email ?? "",
//             phoneNumber: profile.phoneNumber ?? "",
//             address: profile.address ?? "",
//             bio: profile.bio ?? "",
//             profileImage: profile.profileImage ?? "",
//         });
//     }, [
//         profile.firstName,
//         profile.lastName,
//         profile.email,
//         profile.phoneNumber,
//         profile.address,
//         profile.bio,
//         profile.profileImage,
//     ]);

//     const handleChange = (event) => {
//         const { name, value } = event.target;

//         setFormData((previous) => ({
//             ...previous,
//             [name]: value,
//         }));

//         setFormError("");
//     };

//     const handleSave = async (event) => {
//         event.preventDefault();
//         setFormError("");

//         const fields = [
//             "firstName",
//             "lastName",
//             "phoneNumber",
//             "address",
//             "bio",
//         ];

//         const payload = {};

//         for (const field of fields) {
//             const newValue = (formData[field] ?? "").trim();
//             const oldValue = (profile[field] ?? "").trim();

//             if (newValue !== oldValue) {
//                 payload[field] = newValue;
//             }
//         }

//         if (Object.keys(payload).length === 0) {
//             setFormError("No changes to save.");
//             return;
//         }

//         if (
//             "firstName" in payload &&
//             (payload.firstName.length < 2 ||
//                 payload.firstName.length > 50)
//         ) {
//             setFormError("First name must contain 2–50 characters.");
//             return;
//         }

//         if (
//             "lastName" in payload &&
//             (payload.lastName.length < 2 ||
//                 payload.lastName.length > 50)
//         ) {
//             setFormError("Last name must contain 2–50 characters.");
//             return;
//         }

//         if (
//             "phoneNumber" in payload &&
//             payload.phoneNumber !== "" &&
//             !/^\+?[0-9\s().-]{7,20}$/.test(payload.phoneNumber)
//         ) {
//             setFormError("Please enter a valid phone number.");
//             return;
//         }

//         if ("address" in payload && payload.address.length > 300) {
//             setFormError("Address cannot exceed 300 characters.");
//             return;
//         }

//         if ("bio" in payload && payload.bio.length > 1000) {
//             setFormError("Bio cannot exceed 1000 characters.");
//             return;
//         }

//         try {
//             const result = await dispatch(
//                 updateProfile(payload)
//             ).unwrap();

//             onSaved(
//                 result?.message || "Profile updated successfully."
//             );
//         } catch (err) {
//             setFormError(
//                 typeof err === "string"
//                     ? err
//                     : err?.message ||
//                         "Unable to update your profile."
//             );
//         }
//     };

//     return (
//         <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
//             <div className="mb-6">
//                 <h2 className="text-lg font-semibold text-gray-900">
//                     Personal information
//                 </h2>

//                 <p className="mt-1 text-sm text-gray-500">
//                     Update your personal account information.
//                 </p>
//             </div>

//             <form onSubmit={handleSave}>
//                 <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
//                     <div>
//                         <label
//                             htmlFor="firstName"
//                             className="mb-2 block text-sm font-medium text-gray-700"
//                         >
//                             First name
//                         </label>

//                         <input
//                             id="firstName"
//                             name="firstName"
//                             type="text"
//                             value={formData.firstName}
//                             onChange={handleChange}
//                             required
//                             minLength={2}
//                             maxLength={50}
//                             className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
//                         />
//                     </div>

//                     <div>
//                         <label
//                             htmlFor="lastName"
//                             className="mb-2 block text-sm font-medium text-gray-700"
//                         >
//                             Last name
//                         </label>

//                         <input
//                             id="lastName"
//                             name="lastName"
//                             type="text"
//                             value={formData.lastName}
//                             onChange={handleChange}
//                             required
//                             minLength={2}
//                             maxLength={50}
//                             className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
//                         />
//                     </div>

//                     <div className="sm:col-span-2">
//                         <label
//                             htmlFor="email"
//                             className="mb-2 block text-sm font-medium text-gray-700"
//                         >
//                             Email address
//                         </label>

//                         <input
//                             id="email"
//                             type="email"
//                             value={formData.email}
//                             readOnly
//                             className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
//                         />

//                         <p className="mt-1 text-xs text-gray-500">
//                             Your email address cannot be edited here.
//                         </p>
//                     </div>

//                     <div className="sm:col-span-2">
//                         <label
//                             htmlFor="phoneNumber"
//                             className="mb-2 block text-sm font-medium text-gray-700"
//                         >
//                             Phone number
//                         </label>

//                         <input
//                             id="phoneNumber"
//                             name="phoneNumber"
//                             type="tel"
//                             autoComplete="tel"
//                             value={formData.phoneNumber}
//                             onChange={handleChange}
//                             maxLength={20}
//                             placeholder="Enter your phone number"
//                             className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
//                         />
//                     </div>

//                     <div className="sm:col-span-2">
//                         <label
//                             htmlFor="address"
//                             className="mb-2 block text-sm font-medium text-gray-700"
//                         >
//                             Address
//                         </label>

//                         <input
//                             id="address"
//                             name="address"
//                             type="text"
//                             value={formData.address}
//                             onChange={handleChange}
//                             maxLength={300}
//                             placeholder="Enter your address"
//                             className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
//                         />
//                     </div>

//                     <div className="sm:col-span-2">
//                         <label
//                             htmlFor="bio"
//                             className="mb-2 block text-sm font-medium text-gray-700"
//                         >
//                             Bio
//                         </label>

//                         <textarea
//                             id="bio"
//                             name="bio"
//                             value={formData.bio}
//                             onChange={handleChange}
//                             maxLength={1000}
//                             rows={4}
//                             placeholder="Tell us a little about yourself"
//                             className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
//                         />
//                     </div>
//                 </div>

//                 {formError && (
//                     <p role="alert" className="mt-4 text-sm text-red-600">
//                         {formError}
//                     </p>
//                 )}

//                 <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
//                     <button
//                         type="button"
//                         onClick={onCancel}
//                         className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
//                     >
//                         Cancel
//                     </button>

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
//                     >
//                         {loading ? "Saving..." : "Save changes"}
//                     </button>
//                 </div>
//             </form>
//         </section>
//     );
// }

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    updateProfile,
} from "../redux/actions/profile/profileAction";

const emptyProfile = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    bio: "",
    profileImage: "",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

export default function EditProfile({
    profile,
    onCancel,
    onSaved,
}) {
    const dispatch = useDispatch();
    const imageInputRef = useRef(null);

    const { loading = false } = useSelector(
        (state) => state.profile ?? {}
    );

    const [formData, setFormData] = useState(emptyProfile);
    const [formError, setFormError] = useState("");

    // Initialize the form with the existing profile information.
    useEffect(() => {
        setFormData({
            firstName: profile?.firstName ?? "",
            lastName: profile?.lastName ?? "",
            email: profile?.email ?? "",
            phoneNumber: profile?.phoneNumber ?? "",
            address: profile?.address ?? "",
            bio: profile?.bio ?? "",
            profileImage: profile?.profileImage ?? "",
        });

        setFormError("");
    }, [
        profile?.firstName,
        profile?.lastName,
        profile?.email,
        profile?.phoneNumber,
        profile?.address,
        profile?.bio,
        profile?.profileImage,
    ]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setFormError("");
    };

    // Select an image and immediately display its preview.
    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        // Allow selecting the same file again.
        event.target.value = "";

        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setFormError(
                "Please select a JPG, PNG, or WEBP image."
            );
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setFormError(
                "The profile image must be smaller than 2 MB."
            );
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                setFormError("Unable to read the selected image.");
                return;
            }

            setFormData((previous) => ({
                ...previous,
                profileImage: reader.result,
            }));

            setFormError("");
        };

        reader.onerror = () => {
            setFormError("Unable to read the selected image.");
        };

        reader.readAsDataURL(file);
    };

    // Remove the current image from the form.
    const handleRemoveImage = () => {
        setFormData((previous) => ({
            ...previous,
            profileImage: "",
        }));

        setFormError("");

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setFormError("");

        const fields = [
            "firstName",
            "lastName",
            "phoneNumber",
            "address",
            "bio",
            "profileImage",
        ];

        const payload = {};

        for (const field of fields) {
            const newValue = formData[field] ?? "";
            const oldValue = profile?.[field] ?? "";

            if (newValue !== oldValue) {
                payload[field] =
                    typeof newValue === "string" &&
                    field !== "profileImage"
                        ? newValue.trim()
                        : newValue;
            }
        }

        if (Object.keys(payload).length === 0) {
            setFormError("No changes to save.");
            return;
        }

        // Validate first name.
        if (
            "firstName" in payload &&
            (payload.firstName.length < 2 ||
                payload.firstName.length > 50)
        ) {
            setFormError(
                "First name must contain 2–50 characters."
            );
            return;
        }

        // Validate last name.
        if (
            "lastName" in payload &&
            (payload.lastName.length < 2 ||
                payload.lastName.length > 50)
        ) {
            setFormError(
                "Last name must contain 2–50 characters."
            );
            return;
        }

        // Validate phone number.
        if (
            "phoneNumber" in payload &&
            payload.phoneNumber !== "" &&
            !/^\+?[0-9\s().-]{7,20}$/.test(
                payload.phoneNumber
            )
        ) {
            setFormError("Please enter a valid phone number.");
            return;
        }

        // Validate address.
        if (
            "address" in payload &&
            payload.address.length > 300
        ) {
            setFormError(
                "Address cannot exceed 300 characters."
            );
            return;
        }

        // Validate bio.
        if (
            "bio" in payload &&
            payload.bio.length > 1000
        ) {
            setFormError("Bio cannot exceed 1000 characters.");
            return;
        }

        try {
            const result = await dispatch(
                updateProfile(payload)
            ).unwrap();

            onSaved(
                result?.message ||
                    "Profile updated successfully."
            );
        } catch (err) {
            setFormError(
                typeof err === "string"
                    ? err
                    : err?.message ||
                        "Unable to update your profile."
            );
        }
    };

    const initials =
        `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`
            .toUpperCase() || "?";

    return (
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Personal information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Update your personal account information.
                </p>
            </div>

            <form onSubmit={handleSave}>
                {/* Profile Image */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <h3 className="text-sm font-semibold text-gray-900">
                        Profile picture
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Upload or change your profile picture.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-5">
                        {/* Image preview */}
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                            {formData.profileImage ? (
                                <img
                                    src={formData.profileImage}
                                    alt="Profile preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-indigo-600">
                                    {initials}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    imageInputRef.current?.click()
                                }
                                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Upload image
                            </button>

                            {formData.profileImage && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white"
                                >
                                    Remove image
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                        JPG, PNG, or WEBP. Maximum file size: 2 MB.
                    </p>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="firstName"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            First name
                        </label>

                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            minLength={2}
                            maxLength={50}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="lastName"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Last name
                        </label>

                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            minLength={2}
                            maxLength={50}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Email address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            readOnly
                            className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                            Your email address cannot be edited here.
                        </p>
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="phoneNumber"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Phone number
                        </label>

                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            autoComplete="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            maxLength={20}
                            placeholder="Enter your phone number"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="address"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Address
                        </label>

                        <input
                            id="address"
                            name="address"
                            type="text"
                            value={formData.address}
                            onChange={handleChange}
                            maxLength={300}
                            placeholder="Enter your address"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="bio"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Bio
                        </label>

                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            maxLength={1000}
                            rows={4}
                            placeholder="Tell us a little about yourself"
                            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {formError && (
                    <p
                        role="alert"
                        className="mt-4 text-sm text-red-600"
                    >
                        {formError}
                    </p>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </section>
    );
}
