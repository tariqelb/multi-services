import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../api/axiosInstance";

export default function ExternalListingSources() {
    const { t } = useTranslation();

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
                        typeof source === "string" ? source : source.url
                    )
                    .filter(Boolean)
                    .reverse()
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("externalSources.errors.load")
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
                    t("externalSources.messages.refreshSuccess")
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("externalSources.errors.refresh")
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
                    t("externalSources.messages.importSuccess")
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("externalSources.errors.import")
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
                    t("externalSources.messages.addSuccess")
            );

            setUrl("");

            await loadSources();

            if (response.data.added) {
                await handleRefresh();
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("externalSources.errors.add")
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

            setMessage(t("externalSources.messages.deleteSuccess"));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    t("externalSources.errors.delete")
            );
        } finally {
            setRemovingUrl("");
        }
    }

    return (
        <section className="mx-auto box-border w-full min-w-0 max-w-[1120px] overflow-x-clip px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="mb-6">
                <h1 className="text-[1.875rem] font-bold leading-tight text-slate-900">
                    {t("externalSources.title")}
                </h1>

                <p className="mt-1.5 max-w-3xl text-base text-[#5B6577]">
                    {t("externalSources.subtitle")}
                </p>
            </div>

            <form
                onSubmit={handleAdd}
                className="mb-6 flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:p-4"
            >
                <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder={t("externalSources.form.placeholder")}
                    required
                    aria-label={t("externalSources.form.ariaLabel")}
                    className="box-border h-12 w-full min-w-0 flex-1 rounded-[10px] border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:px-4 sm:text-base"
                />

                <button
                    type="submit"
                    disabled={refreshing || importing}
                    className="h-12 w-full shrink-0 rounded-[10px] bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    {t("externalSources.form.addUrl")}
                </button>
            </form>

            <p className="mb-5 text-sm text-slate-500">
                {t("externalSources.supportedWebsites")}
            </p>

            {error && (
                <div
                    role="alert"
                    className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <span className="min-w-0 break-words">{error}</span>

                    <button
                        type="button"
                        onClick={loadSources}
                        className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-900"
                    >
                        {t("common.retry")}
                    </button>
                </div>
            )}

            {message && (
                <p
                    role="status"
                    className="mb-5 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                    {message}
                </p>
            )}

            <div className="w-full min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                        {t("externalSources.registeredSources")}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                            {t("externalSources.sourceCount", {
                                count: urls.length,
                            })}
                        </span>

                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={
                                importing ||
                                refreshing ||
                                loading ||
                                urls.length === 0
                            }
                            className="flex h-9 items-center justify-center gap-2 rounded-[10px] border border-blue-200 px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                            {importing
                                ? t("externalSources.actions.importing")
                                : t("externalSources.actions.import")}
                        </button>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={
                                refreshing ||
                                importing ||
                                loading ||
                                urls.length === 0
                            }
                            className="flex h-9 items-center justify-center gap-2 rounded-[10px] border border-blue-200 px-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                            {refreshing
                                ? t("externalSources.actions.refreshing")
                                : t("externalSources.actions.refresh")}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-40 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
                        <p className="text-sm text-slate-500">
                            {t("externalSources.loading")}
                        </p>
                    </div>
                ) : urls.length === 0 ? (
                    <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center sm:py-12">
                        <p className="font-semibold text-slate-700">
                            {t("externalSources.empty.title")}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            {t("externalSources.empty.description")}
                        </p>
                    </div>
                ) : (
                    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:gap-4">
                        {urls.map((sourceUrl, index) => (
                            <article
                                key={sourceUrl}
                                className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 sm:flex-row sm:items-center sm:gap-4 sm:p-4 lg:p-5"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-sm font-bold text-blue-700">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {t("externalSources.listingSource")}
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

                                <div className="flex w-full shrink-0 items-center sm:w-auto">
                                    <a
                                        href={sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mr-2 flex h-10 min-w-0 flex-1 items-center justify-center rounded-[10px] border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                                    >
                                        {t("externalSources.actions.openLink")}
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => handleRemove(sourceUrl)}
                                        disabled={removingUrl === sourceUrl}
                                        className="h-10 shrink-0 rounded-[10px] border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                                    >
                                        {removingUrl === sourceUrl
                                            ? t("externalSources.actions.deleting")
                                            : t("externalSources.actions.delete")}
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