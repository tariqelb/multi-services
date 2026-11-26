
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, ChevronDown, Check } from "lucide-react";

export default function LoginLanguageSwitcher({
    variant = "default",
}) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLanguage = (
        i18n.resolvedLanguage ||
        i18n.language ||
        "en"
    ).split("-")[0].split("_")[0];

    const languages = [
        { code: "en", label: "English" },
        { code: "fr", label: "Français" },
        { code: "ar", label: "العربية" },
    ];

    const selectedLanguage =
        languages.find((lang) => lang.code === currentLanguage) ||
        languages[0];

    const isLogin = variant === "login";

    const handleLanguageChange = (language) => {
        if (language !== currentLanguage) {
            i18n.changeLanguage(language);
        }

        setOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    return (
        // The switcher always sits in the top-right corner of the auth pages,
        // so it keeps the English (LTR) layout in every language: the menu
        // opens toward the left and always stays inside the page.
        <div ref={dropdownRef} className="relative" dir="ltr">
            {/* Dropdown trigger */}
            <button
                type="button"
                onClick={() => setOpen((previous) => !previous)}
                aria-label={t("language.select", "Select language")}
                aria-expanded={open}
                aria-haspopup="listbox"
                className={`flex items-center gap-2 rounded-xl transition-all duration-200 ${
                    isLogin
                        ? "min-w-[150px] border border-white/70 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-md hover:bg-white"
                        : "rounded-[10px] bg-white px-2 py-2 text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
                <Languages
                    size={19}
                    className={isLogin ? "text-blue-600" : ""}
                />

                <span className={`flex-1 text-left ${
                    isLogin
                        ? "text-sm font-semibold text-slate-800"
                        : "text-sm font-medium uppercase"
                }`}>
                    {isLogin
                        ? selectedLanguage.label
                        : currentLanguage}
                </span>

                <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-500 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Custom dropdown */}
            {open && (
                <div
                    role="listbox"
                    aria-label={t("language.available", "Available languages")}
                    className={`absolute right-0 left-auto z-[100] mt-2 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 ${
                        isLogin ? "w-48" : "w-40"
                    }`}
                >
                    {languages.map((language) => {
                        const selected =
                            currentLanguage === language.code;

                        return (
                            <button
                                key={language.code}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() =>
                                    handleLanguageChange(language.code)
                                }
                                className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                                    selected
                                        ? "bg-blue-50 font-semibold text-blue-700"
                                        : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <span>{language.label}</span>

                                {selected && (
                                    <Check
                                        size={17}
                                        className="text-blue-600"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
