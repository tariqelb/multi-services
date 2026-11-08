// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";

// import en from "./locales/en.json";
// import fr from "./locales/fr.json";
// import ar from "./locales/ar.json";

// const savedLanguage = localStorage.getItem("appLanguage") || "en";

// i18n.use(initReactI18next).init({
//     resources: {
//         en: { translation: en },
//         fr: { translation: fr },
//         ar: { translation: ar },
//     },

//     lng: savedLanguage,
//     fallbackLng: "en",

//     interpolation: {
//         escapeValue: false,
//     },
// });

// // Update the document language and direction.
// function updateDocumentDirection(language) {
//     const direction = language === "ar" ? "rtl" : "ltr";

//     document.documentElement.lang = language;
//     document.documentElement.dir = direction;
// }

// updateDocumentDirection(i18n.resolvedLanguage || savedLanguage);

// i18n.on("languageChanged", (language) => {
//     localStorage.setItem("appLanguage", language);
//     updateDocumentDirection(language);
// });

// export default i18n;


import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import fr from "./locales/fr/translation.json";
import ar from "./locales/ar/translation.json";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr },
            ar: { translation: ar },
        },

        fallbackLng: "en",

        supportedLngs: ["en", "fr", "ar"],

        defaultNS: "translation",

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
        },
    });

export default i18n;
