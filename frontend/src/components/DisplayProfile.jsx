
export default function DisplayProfile({ profile = {}, onEdit }) {
    const firstName = profile.firstName || "";
    const lastName = profile.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || "User";

    const initials =
        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

    const fields = [
        { label: "First name", value: firstName },
        { label: "Last name", value: lastName },
        { label: "Email address", value: profile.email },
        { label: "Phone number", value: profile.phoneNumber },
        { label: "Address", value: profile.address, fullWidth: true },
        { label: "Bio", value: profile.bio, fullWidth: true },
    ];

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Profile header */}
            <div className="flex flex-col gap-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white p-6 sm:flex-row sm:items-center">
                {profile.profileImage ? (
                    <img
                        src={profile.profileImage}
                        alt={`${fullName}'s profile`}
                        className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-sm"
                    />
                ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-indigo-100 text-2xl font-bold text-indigo-600 shadow-sm">
                        {initials}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                        {fullName}
                    </h2>

                    <p className="mt-1 break-words text-sm text-gray-500">
                        {profile.email || "No email provided"}
                    </p>

                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-indigo-600">
                        Personal account
                    </p>
                </div>

                {/* <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Edit profile
                </button> */}
            </div>

            {/* Personal information */}
            <div className="p-6">
                <div className="mb-5">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Personal information
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Your personal details and contact information.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {fields.map(({ label, value, fullWidth }) => (
                        <div
                            key={label}
                            className={`min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 ${
                                fullWidth ? "sm:col-span-2" : ""
                            }`}
                        >
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {label}
                            </p>

                            <p className="min-h-5 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-gray-900">
                                {value || (
                                    <span className="font-normal italic text-gray-400">
                                        Not provided
                                    </span>
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}