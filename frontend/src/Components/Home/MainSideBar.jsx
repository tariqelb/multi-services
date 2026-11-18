// /home/tariq/multi-services/app/frontend/src/Components/Home/MainSideBar.jsx


import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
                sticky top-16 z-30
                flex h-[calc(100vh-4rem)] w-[64px] shrink-0
                flex-col items-center
                bg-[#0B2E5C]
                py-4
                shadow-sm
            "
            aria-label="Main services navigation"
        >
            <nav className="flex w-full flex-col items-center gap-3">
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
                                group relative flex h-11 w-11
                                items-center justify-center
                                rounded-xl transition-all duration-200
                                ${
                                    active
                                        ? "bg-white text-[#0B2E5C] shadow-md"
                                        : "text-white/75 hover:bg-white/15 hover:text-white"
                                }
                            `}
                        >
                            <Icon
                                size={21}
                                strokeWidth={active ? 2.4 : 1.9}
                            />

                            <span
                                className="
                                    pointer-events-none absolute
                                    left-full top-1/2 z-50 ml-3
                                    -translate-y-1/2 translate-x-1
                                    whitespace-nowrap rounded-lg
                                    bg-gray-900 px-3 py-2
                                    text-xs font-medium text-white
                                    opacity-0 shadow-lg
                                    transition-all duration-200
                                    group-hover:translate-x-0
                                    group-hover:opacity-100
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
