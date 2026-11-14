import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export default function LoginLanguageSwitcher() {
    const { i18n } = useTranslation();

    const currentLanguage = i18n.resolvedLanguage || "en";

    const handleLanguageChange = (event) => {
        i18n.changeLanguage(event.target.value);
    };

    return (
        <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/85 px-3 py-2 shadow-md backdrop-blur-md">
            <Languages size={18} className="text-gray-700" />

            <select
                value={currentLanguage}
                onChange={handleLanguageChange}
                aria-label="Select language"
                className="cursor-pointer bg-transparent text-sm font-semibold text-gray-800 outline-none"
            >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
            </select>
        </div>
    );
}