
import { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";

export default function ExternalListingSources() {
    const [urls, setUrls] = useState([]);
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [removingUrl, setRemovingUrl] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [importing, setImporting] = useState(false);

    async function loadSources() {
        try {
            setLoading(true);
            setError("");

            const response = await axiosInstance.get(
                "/external-listings/sources"
            );

            const sources = response.data.urls || [];

            setUrls(
                sources
                    .map((source) =>
                        typeof source === "string"
                            ? source
                            : source.url
                    )
                    .filter(Boolean)
                    .reverse()
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load listing sources."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSources();
    }, []);

    async function handleRefresh() {
        setError("");
        setMessage("");
        setRefreshing(true);

        try {
            const response = await axiosInstance.post(
                "/external-listings/refresh"
            );

            setMessage(
                response.data.message ||
                    "External listings refreshed successfully."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to refresh external listings."
            );
        } finally {
            setRefreshing(false);
        }
    }

    async function handleImport() {
        setError("");
        setMessage("");
        setImporting(true);

        try {
            const response = await axiosInstance.post(
                "/external-listings/import"
            );

            setMessage(
                response.data.message ||
                    "New external listings imported successfully."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to import new external listings."
            );
        } finally {
            setImporting(false);
        }
    }

    async function handleAdd(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        const trimmedUrl = url.trim();

        try {
            const response = await axiosInstance.post(
                "/external-listings/sources",
                { url: trimmedUrl }
            );

            setMessage(
                response.data.message ||
                    "Listing source added successfully."
            );

            setUrl("");

            await loadSources();

            // Run the collector after adding a new source.
            if (response.data.added) {
                await handleRefresh();
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to add listing source."
            );
        }
    }

    async function handleRemove(sourceUrl) {
        setError("");
        setMessage("");
        setRemovingUrl(sourceUrl);

        try {
            await axiosInstance.delete(
                "/external-listings/sources",
                { data: { url: sourceUrl } }
            );

            setUrls((current) =>
                current.filter((item) => item !== sourceUrl)
            );

            setMessage("Listing source deleted successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to delete listing source."
            );
        } finally {
            setRemovingUrl("");
        }
    }

    return (
        <section className="box-border min-h-[80vh] w-full min-w-0 max-w-full overflow-x-clip px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">
                    External Listing Sources
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                    Manage the websites used to collect external
                    property listings.
                </p>
            </div>

            {/* Add Source Form */}
            <form
                onSubmit={handleAdd}
                className="mb-6 flex w-full min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:p-4"
            >
                <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="Paste an Aqari, Mr Semsar, or 3a9arai listing URL"
                    required
                    aria-label="External listing URL"
                    className="box-border h-12 w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:px-4 sm:text-base"
                />

                <button
                    type="submit"
                    disabled={refreshing || importing}
                    className="h-12 w-full shrink-0 rounded-lg bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    Add URL
                </button>
            </form>

            {/* Supported Websites */}
            <p className="mb-5 text-sm text-slate-500">
                Supported websites: Aqari Annonces, Mr Semsar, and
                3a9arai. New websites can also be registered automatically.
            </p>

            {/* Feedback Messages */}
            {error && (
                <div
                    role="alert"
                    className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <span className="min-w-0 break-words">{error}</span>

                    <button
                        type="button"
                        onClick={loadSources}
                        className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-900"
                    >
                        Retry
                    </button>
                </div>
            )}

            {message && (
                <p
                    role="status"
                    className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                    {message}
                </p>
            )}

            {/* Saved Sources */}
            <div className="w-full min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                        Registered Sources
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                            {urls.length} {urls.length === 1 ? "source" : "sources"}
                        </span>

                        {/* Import New Listings */}
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={
                                importing ||
                                refreshing ||
                                loading ||
                                urls.length === 0
                            }
                            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <svg
                                className={`h-4 w-4 ${importing ? "animate-spin" : ""}`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14"
                                />
                            </svg>

                            {importing ? "Importing..." : "Import New Listings"}
                        </button>

                        {/* Refresh Existing Listings */}
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={
                                refreshing ||
                                importing ||
                                loading ||
                                urls.length === 0
                            }
                            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <svg
                                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0 1 18 6l2 3M18.5 15A7 7 0 0 1 6 18l-2-3"
                                />
                            </svg>

                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-40 w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
                        <p className="text-sm text-slate-500">
                            Loading sources...
                        </p>
                    </div>
                ) : urls.length === 0 ? (
                    <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center sm:py-12">
                        <p className="font-semibold text-slate-700">
                            No external listing sources added yet.
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Add a supported property listing URL above
                            to get started.
                        </p>
                    </div>
                ) : (
                    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:gap-4">
                        {urls.map((sourceUrl, index) => (
                            <article
                                key={sourceUrl}
                                className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4 lg:p-5"
                            >
                                {/* Source Number */}
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                {/* Clickable URL */}
                                <div className="min-w-0 flex-1">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Listing source
                                    </p>

                                    <a
                                        href={sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={sourceUrl}
                                        className="block min-w-0 break-all text-sm font-medium leading-6 text-blue-600 hover:text-blue-800 hover:underline sm:text-base"
                                    >
                                        {sourceUrl}
                                    </a>
                                </div>

                                {/* Actions */}
                                <div className="flex w-full shrink-0 items-center sm:w-auto">
                                    <a
                                        href={sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mr-2 flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                                    >
                                        Open link
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => handleRemove(sourceUrl)}
                                        disabled={removingUrl === sourceUrl}
                                        className="h-10 shrink-0 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                                    >
                                        {removingUrl === sourceUrl
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
