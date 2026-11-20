
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    LayoutDashboard,
    House,
    CarFront,
    HardHat,
    Truck,
    CarTaxiFront,
    Building2,
} from "lucide-react";

const services = [
    {
        id: "main",
        label: "MultiServices",
        path: "/",
        icon: LayoutDashboard,
        paths: ["/"],
        exact: true,
    },
    {
        id: "property",
        label: "Property",
        path: "/properties",
        icon: House,
        paths: [
            "/properties",
            "/property",
            "/furnishedproperties",
            "/establishments",
            "/roommates",
            "/findbymap",
            "/externalListings",
        ],
    },
    {
        id: "cars",
        label: "Cars",
        path: "/cars/description",
        icon: CarFront,
        paths: ["/cars"],
    },
    {
        id: "daily-worker",
        label: "Daily Worker",
        path: "/daily-worker/description",
        icon: HardHat,
        paths: ["/daily-worker"],
    },
    {
        id: "delivery-man",
        label: "Delivery Man",
        path: "/delivery-man/description",
        icon: Truck,
        paths: ["/delivery-man"],
    },
    {
        id: "driver",
        label: "Driver",
        path: "/driver/description",
        icon: CarTaxiFront,
        paths: ["/driver"],
    },
    {
        id: "services-companies",
        label: "Services & Companies",
        path: "/services-companies/description",
        icon: Building2,
        paths: ["/services-companies"],
    },
];

export default function MainSideBar() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const currentPath = location.pathname;

    const isServiceActive = (service) => {
        if (service.exact) {
            return currentPath === "/";
        }

        return service.paths.some(
            (path) =>
                currentPath === path ||
                currentPath.startsWith(`${path}/`)
        );
    };

    return (
        <aside
            className="
                relative z-30
                flex h-14 w-full shrink-0
                box-border
                overflow-hidden
                bg-[#0B2E5C]
                shadow-sm

                md:sticky md:top-16
                md:h-[calc(100vh-4rem)]
                md:w-[64px]
                md:min-w-[64px]
                md:flex-col
                md:overflow-visible
            "
            aria-label={t("navigation.mainServices", "Main services navigation")}
        >
            <nav
                className="
                    flex h-full w-full min-w-0
                    flex-row items-center
                    justify-start gap-1
                    overflow-x-auto
                    px-2

                    md:flex-col
                    md:justify-start
                    md:gap-3
                    md:overflow-visible
                    md:px-0
                    md:py-4
                "
                style={{
                    scrollbarWidth: "none",
                }}
            >
                {services.map((service) => {
                    const Icon = service.icon;
                    const active = isServiceActive(service);

                    return (
                        <button
                            key={service.id}
                            type="button"
                            title={service.label}
                            aria-label={service.label}
                            aria-current={active ? "page" : undefined}
                            onClick={() => navigate(service.path)}
                            className={`
                                group relative
                                flex h-10 w-10 min-w-10 shrink-0
                                items-center justify-center
                                rounded-xl
                                transition-all duration-200

                                md:h-11 md:w-11 md:min-w-11

                                ${
                                    active
                                        ? "bg-white text-[#0B2E5C] shadow-md"
                                        : "text-white/75 hover:bg-white/15 hover:text-white"
                                }
                            `}
                        >
                            <Icon
                                size={20}
                                strokeWidth={active ? 2.4 : 1.9}
                            />

                            {/* Desktop tooltip */}
                            <span
                                className="
                                    pointer-events-none absolute
                                    start-full top-1/2 z-50 ms-3
                                    hidden -translate-y-1/2 translate-x-1
                                    whitespace-nowrap rounded-lg
                                    bg-slate-900 px-3 py-2
                                    text-xs font-medium text-white
                                    opacity-0 shadow-lg
                                    transition-all duration-200
                                    group-hover:translate-x-0
                                    group-hover:opacity-100

                                    md:block
                                "
                            >
                                {service.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
