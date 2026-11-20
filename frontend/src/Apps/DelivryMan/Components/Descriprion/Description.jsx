
import React from "react";
import {
    Truck,
    Package,
    MapPin,
    Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const features = [
    {
        icon: Package,
        key: "packages",
    },
    {
        icon: MapPin,
        key: "localDelivery",
    },
    {
        icon: Clock,
        key: "flexibleDelivery",
    },
];

export default function Description() {
    const { t, i18n } = useTranslation();

    const currentLanguage = (
        i18n.resolvedLanguage ||
        i18n.language ||
        "en"
    )
        .split("-")[0]
        .split("_")[0];

    const isRTL = currentLanguage === "ar";

    return (
        <div
            dir={isRTL ? "rtl" : "ltr"}
            className="min-h-full bg-[#F5F7FB] p-4 sm:p-6 lg:p-8"
        >
            <div className="mx-auto max-w-6xl">
                <div className="rounded-3xl bg-gradient-to-r from-orange-800 to-orange-500 p-6 text-white sm:p-10">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                        <Truck size={30} />
                    </div>

                    <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-100">
                        {t("deliveryMan.brand")}
                    </p>

                    <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
                        {t("deliveryMan.heroTitle")}
                    </h1>

                    <p className="max-w-2xl text-sm leading-7 text-orange-100 sm:text-base">
                        {t("deliveryMan.heroDescription")}
                    </p>
                </div>

                <section className="mt-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        {t("deliveryMan.sectionTitle")}
                    </h2>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <div
                                    key={feature.key}
                                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                                        <Icon size={24} />
                                    </div>

                                    <h3 className="font-bold text-slate-900">
                                        {t(
                                            `deliveryMan.features.${feature.key}.title`
                                        )}
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {t(
                                            `deliveryMan.features.${feature.key}.description`
                                        )}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
