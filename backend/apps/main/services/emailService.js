
import nodemailer from "nodemailer";

const createTransporter = () => {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error("Email SMTP configuration is missing.");
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
};

const getFrontendUrl = () =>
    (process.env.FRONTEND_URL ||
        "https://multi-services-frontend.vercel.app"
    ).replace(/\/$/, "");

const normalizeLanguage = (language) =>
    ["en", "fr", "ar"].includes(language) ? language : "en";

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);

const translations = {
    en: {
        vehicleSubject: "New vehicle matching your alert: {{title}}",
        vehicleHeading: "A new vehicle matches your alert!",
        vehicleIntro: "A new vehicle matching your saved alert has just been published.",
        viewVehicle: "View vehicle",
        vehicleFallback: "New vehicle",
        forSale: "For sale",
        forRent: "For rent",
        perDay: "per day",
        manageAlerts: "Manage my alerts",
        propertySubject: "New property matching your alert: {{title}}",
        propertyHeading: "A new property matches your alert!",
        propertyIntro: "A new property matching your saved alert is available.",
        propertyTitle: "Title",
        city: "City",
        type: "Type",
        listing: "Listing",
        price: "Price",
        viewProperty: "View property",
        propertyFallback: "New property",

        roommateSubject: "New roommate announcement: {{title}}",
        roommateHeading: "A new roommate announcement matches your alert!",
        roommateIntro: "A new roommate announcement matching your saved alert is available.",
        purpose: "Purpose",
        propertyType: "Property type",
        rentalPeriod: "Rental period",
        rent: "Rent",
        notSpecified: "Not specified",
        viewRoommate: "View roommate announcement",

        mad: "MAD",
    },

    fr: {
        vehicleSubject: "Nouveau véhicule correspondant à votre alerte : {{title}}",
        vehicleHeading: "Un nouveau véhicule correspond à votre alerte !",
        vehicleIntro: "Un nouveau véhicule correspondant à votre alerte enregistrée vient d'être publié.",
        viewVehicle: "Voir le véhicule",
        vehicleFallback: "Nouveau véhicule",
        forSale: "À vendre",
        forRent: "À louer",
        perDay: "par jour",
        manageAlerts: "Gérer mes alertes",
        propertySubject: "Nouveau bien correspondant à votre alerte : {{title}}",
        propertyHeading: "Un nouveau bien correspond à votre alerte !",
        propertyIntro: "Un nouveau bien correspondant à votre alerte enregistrée est disponible.",
        propertyTitle: "Titre",
        city: "Ville",
        type: "Type",
        listing: "Annonce",
        price: "Prix",
        viewProperty: "Voir le bien",
        propertyFallback: "Nouveau bien",

        roommateSubject: "Nouvelle annonce de colocation : {{title}}",
        roommateHeading: "Une nouvelle annonce de colocation correspond à votre alerte !",
        roommateIntro: "Une nouvelle annonce de colocation correspondant à votre alerte enregistrée est disponible.",
        purpose: "Objectif",
        propertyType: "Type de logement",
        rentalPeriod: "Durée de location",
        rent: "Loyer",
        notSpecified: "Non précisé",
        viewRoommate: "Voir l'annonce de colocation",

        mad: "MAD",
    },

    ar: {
        vehicleSubject: "مركبة جديدة تطابق تنبيهك: {{title}}",
        vehicleHeading: "مركبة جديدة تطابق التنبيه الخاص بك!",
        vehicleIntro: "تم للتو نشر مركبة جديدة تطابق التنبيه الذي حفظته.",
        viewVehicle: "عرض المركبة",
        vehicleFallback: "مركبة جديدة",
        forSale: "للبيع",
        forRent: "للكراء",
        perDay: "في اليوم",
        manageAlerts: "إدارة تنبيهاتي",
        propertySubject: "عقار جديد يطابق تنبيهك: {{title}}",
        propertyHeading: "عقار جديد يطابق التنبيه الخاص بك!",
        propertyIntro: "عقار جديد يطابق التنبيه الذي حفظته أصبح متاحاً.",
        propertyTitle: "العنوان",
        city: "المدينة",
        type: "النوع",
        listing: "الإعلان",
        price: "السعر",
        viewProperty: "عرض العقار",
        propertyFallback: "عقار جديد",

        roommateSubject: "إعلان سكن مشترك جديد: {{title}}",
        roommateHeading: "إعلان سكن مشترك جديد يطابق التنبيه الخاص بك!",
        roommateIntro: "إعلان سكن مشترك جديد يطابق التنبيه الذي حفظته أصبح متاحاً.",
        purpose: "الغرض",
        propertyType: "نوع السكن",
        rentalPeriod: "مدة الإيجار",
        rent: "الإيجار",
        notSpecified: "غير محدد",
        viewRoommate: "عرض إعلان السكن المشترك",

        mad: "درهم",
    },
};

const makeEmailLayout = ({
    language,
    heading,
    intro,
    content,
    buttonText,
    buttonUrl,
}) => {
    const isArabic = language === "ar";

    return `
        <!DOCTYPE html>
        <html lang="${language}" dir="${isArabic ? "rtl" : "ltr"}">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>${escapeHtml(heading)}</title>
            </head>

            <body style="
                margin: 0;
                padding: 24px;
                background: #f5f7fa;
                font-family: Arial, Helvetica, sans-serif;
                direction: ${isArabic ? "rtl" : "ltr"};
                text-align: ${isArabic ? "right" : "left"};
            ">
                <div style="
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px;
                    background: #ffffff;
                    border-radius: 12px;
                ">
                    <h2 style="color: #263238;">
                        ${escapeHtml(heading)}
                    </h2>

                    <p style="color: #455a64; line-height: 1.7;">
                        ${escapeHtml(intro)}
                    </p>

                    <div style="
                        margin: 24px 0;
                        color: #37474f;
                        line-height: 1.9;
                    ">
                        ${content}
                    </div>

                    <a
                        href="${escapeHtml(buttonUrl)}"
                        style="
                            display: inline-block;
                            padding: 12px 22px;
                            background: #1976d2;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 7px;
                            font-weight: bold;
                        "
                    >
                        ${escapeHtml(buttonText)}
                    </a>

                    <p style="
                        margin-top: 30px;
                        color: #90a4ae;
                        font-size: 12px;
                    ">
                        MultiServices
                    </p>
                </div>
            </body>
        </html>
    `;
};

/**
 * Property alert email.
 */
export const sendPropertyAlertEmail = async ({
    to,
    property,
    language = "en",
}) => {
    if (!to || !property) {
        throw new Error(
            "A recipient email and property are required."
        );
    }

    const lang = normalizeLanguage(language);
    const t = translations[lang];

    const transporter = createTransporter();

    const propertyUrl =
        `${getFrontendUrl()}/properties/${property._id}`;

    const title = property.title || t.propertyFallback;
    const city = property.city || t.notSpecified;
    const type = property.propertyType || t.notSpecified;
    const listing = property.listingType || t.notSpecified;
    const price = property.price ?? t.notSpecified;

    const subject = t.propertySubject.replace(
        "{{title}}",
        title
    );

    const text = [
        t.propertyHeading,
        "",
        `${t.propertyTitle}: ${title}`,
        `${t.city}: ${city}`,
        `${t.type}: ${type}`,
        `${t.listing}: ${listing}`,
        `${t.price}: ${price} ${t.mad}`,
        "",
        `${t.viewProperty}: ${propertyUrl}`,
    ].join("\n");

    const html = makeEmailLayout({
        language: lang,
        heading: t.propertyHeading,
        intro: t.propertyIntro,
        content: `
            <p><strong>${escapeHtml(t.propertyTitle)}:</strong> ${escapeHtml(title)}</p>
            <p><strong>${escapeHtml(t.city)}:</strong> ${escapeHtml(city)}</p>
            <p><strong>${escapeHtml(t.type)}:</strong> ${escapeHtml(type)}</p>
            <p><strong>${escapeHtml(t.listing)}:</strong> ${escapeHtml(listing)}</p>
            <p><strong>${escapeHtml(t.price)}:</strong> ${escapeHtml(price)} ${escapeHtml(t.mad)}</p>
        `,
        buttonText: t.viewProperty,
        buttonUrl: propertyUrl,
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });
};

/**
 * Vehicle alert email.
 * vehicle: { _id, title, city, listingType ("sale"|"rent"), price, typeLabel }
 */
export const sendVehicleAlertEmail = async ({ to, vehicle, language = "en" }) => {
    if (!to || !vehicle) {
        throw new Error("A recipient email and vehicle are required.");
    }

    const lang = normalizeLanguage(language);
    const t = translations[lang];
    const transporter = createTransporter();

    const vehicleUrl = `${getFrontendUrl()}/vehicles/${vehicle._id}`;
    const alertsUrl = `${getFrontendUrl()}/vehicles/alerts`;
    const title = vehicle.title || t.vehicleFallback;
    const city = vehicle.city || t.notSpecified;
    const type = vehicle.typeLabel || t.notSpecified;
    const listing = vehicle.listingType === "rent" ? t.forRent : vehicle.listingType === "sale" ? t.forSale : t.notSpecified;
    const price = vehicle.price
        ? `${Number(vehicle.price).toLocaleString("fr-MA")} ${t.mad}${vehicle.listingType === "rent" ? ` ${t.perDay}` : ""}`
        : t.notSpecified;

    const subject = t.vehicleSubject.replace("{{title}}", title);

    const text = [
        t.vehicleHeading,
        "",
        `${t.propertyTitle}: ${title}`,
        `${t.city}: ${city}`,
        `${t.type}: ${type}`,
        `${t.listing}: ${listing}`,
        `${t.price}: ${price}`,
        "",
        `${t.viewVehicle}: ${vehicleUrl}`,
        `${t.manageAlerts}: ${alertsUrl}`,
    ].join("\n");

    const html = makeEmailLayout({
        language: lang,
        heading: t.vehicleHeading,
        intro: t.vehicleIntro,
        content: `
            <p><strong>${escapeHtml(t.propertyTitle)}:</strong> ${escapeHtml(title)}</p>
            <p><strong>${escapeHtml(t.city)}:</strong> ${escapeHtml(city)}</p>
            <p><strong>${escapeHtml(t.type)}:</strong> ${escapeHtml(type)}</p>
            <p><strong>${escapeHtml(t.listing)}:</strong> ${escapeHtml(listing)}</p>
            <p><strong>${escapeHtml(t.price)}:</strong> ${escapeHtml(price)}</p>
            <p style="font-size:13px;color:#64748b"><a href="${escapeHtml(alertsUrl)}">${escapeHtml(t.manageAlerts)}</a></p>
        `,
        buttonText: t.viewVehicle,
        buttonUrl: vehicleUrl,
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });
};

/**
 * Email verification.
 */
export const sendVerificationEmail = async ({
    to,
    code,
}) => {
    if (!to || !code) {
        throw new Error(
            "A recipient email and verification code are required."
        );
    }

    const transporter = createTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: "Verify your email address",
        text: [
            "You requested to verify your email address.",
            "",
            `Your verification code is: ${code}`,
            "",
            "This code expires in 10 minutes.",
            "If you did not request this code, you can ignore this email.",
        ].join("\n"),
        html: `
            <h2>Verify your email address</h2>
            <p>Use the following code to verify your email:</p>
            <p style="
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 6px;
            ">
                ${escapeHtml(code)}
            </p>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this code, you can ignore this email.</p>
        `,
    });
};

/**
 * Roommate alert email.
 */
export const sendRoommateAlertEmail = async ({
    to,
    roommateListing,
    language = "en",
}) => {
    if (!to || !roommateListing) {
        throw new Error(
            "Email address and roommate listing are required."
        );
    }

    const lang = normalizeLanguage(language);
    const t = translations[lang];

    const transporter = createTransporter();

    const roommateUrl =
        `${getFrontendUrl()}/roommates/${roommateListing._id}`;

    const title =
        roommateListing.title || t.propertyFallback;

    const city =
        roommateListing.city || t.notSpecified;

    const purpose =
        roommateListing.purpose || t.notSpecified;

    const propertyType =
        roommateListing.propertyType || t.notSpecified;

    const rentalPeriod =
        roommateListing.rentalPeriod || t.notSpecified;

    const rent =
        roommateListing.totalRent ?? t.notSpecified;

    const subject = t.roommateSubject.replace(
        "{{title}}",
        title
    );

    const text = [
        t.roommateHeading,
        "",
        `${t.propertyTitle}: ${title}`,
        `${t.city}: ${city}`,
        `${t.purpose}: ${purpose}`,
        `${t.propertyType}: ${propertyType}`,
        `${t.rentalPeriod}: ${rentalPeriod}`,
        `${t.rent}: ${rent} ${t.mad}`,
        "",
        `${t.viewRoommate}: ${roommateUrl}`,
    ].join("\n");

    const html = makeEmailLayout({
        language: lang,
        heading: t.roommateHeading,
        intro: t.roommateIntro,
        content: `
            <p><strong>${escapeHtml(t.propertyTitle)}:</strong> ${escapeHtml(title)}</p>
            <p><strong>${escapeHtml(t.city)}:</strong> ${escapeHtml(city)}</p>
            <p><strong>${escapeHtml(t.purpose)}:</strong> ${escapeHtml(purpose)}</p>
            <p><strong>${escapeHtml(t.propertyType)}:</strong> ${escapeHtml(propertyType)}</p>
            <p><strong>${escapeHtml(t.rentalPeriod)}:</strong> ${escapeHtml(rentalPeriod)}</p>
            <p><strong>${escapeHtml(t.rent)}:</strong> ${escapeHtml(rent)} ${escapeHtml(t.mad)}</p>
        `,
        buttonText: t.viewRoommate,
        buttonUrl: roommateUrl,
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });
};




/**
 * Password reset email.
 */
export const sendPasswordResetEmail = async ({
    to,
    resetUrl,
    language = "en",
}) => {
    if (!to || !resetUrl) {
        throw new Error(
            "Recipient email and reset URL are required."
        );
    }

    const lang = normalizeLanguage(language);

    const content = {
        en: {
            subject: "Reset your MultiServices password",
            heading: "Password reset request",
            intro: "We received a request to reset your password. Click the button below to choose a new password.",
            button: "Reset password",
            expiry: "This link expires in 15 minutes.",
            ignore: "If you did not request a password reset, you can safely ignore this email.",
        },
        fr: {
            subject: "Réinitialisation de votre mot de passe MultiServices",
            heading: "Demande de réinitialisation du mot de passe",
            intro: "Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
            button: "Réinitialiser le mot de passe",
            expiry: "Ce lien expire dans 15 minutes.",
            ignore: "Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.",
        },
        ar: {
            subject: "إعادة تعيين كلمة مرور MultiServices",
            heading: "طلب إعادة تعيين كلمة المرور",
            intro: "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه لاختيار كلمة مرور جديدة.",
            button: "إعادة تعيين كلمة المرور",
            expiry: "ستنتهي صلاحية هذا الرابط خلال 15 دقيقة.",
            ignore: "إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.",
        },
    }[lang];

    const transporter = createTransporter();

    const html = makeEmailLayout({
        language: lang,
        heading: content.heading,
        intro: content.intro,
        content: `
            <p style="color: #d97706; font-weight: bold;">
                ${escapeHtml(content.expiry)}
            </p>
            <p style="color: #64748b; font-size: 13px;">
                ${escapeHtml(content.ignore)}
            </p>
        `,
        buttonText: content.button,
        buttonUrl: resetUrl,
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: content.subject,
        text: [
            content.heading,
            "",
            content.intro,
            "",
            `${content.button}: ${resetUrl}`,
            "",
            content.expiry,
            content.ignore,
        ].join("\n"),
        html,
    });
};

// Account suspended / reactivated by an administrator.
export const sendAccountStatusEmail = async ({
    to,
    status,
    reason = "",
    language = "en",
}) => {
    if (!to || !["active", "suspended"].includes(status)) {
        throw new Error("Recipient email and a valid status are required.");
    }

    const lang = normalizeLanguage(language);

    const content = {
        en: {
            suspended: {
                subject: "Your MultiServices account has been suspended",
                heading: "Account suspended",
                intro: "An administrator suspended your account. You cannot log in and your publications are hidden for now.",
            },
            active: {
                subject: "Your MultiServices account is active again",
                heading: "Account reactivated",
                intro: "Your account has been reactivated. You can log in again and your publications are visible.",
            },
            reason: "Reason",
            contact: "If you think this is a mistake, reply to this email or contact us from the website.",
            button: "Open MultiServices",
        },
        fr: {
            suspended: {
                subject: "Votre compte MultiServices a été suspendu",
                heading: "Compte suspendu",
                intro: "Un administrateur a suspendu votre compte. Vous ne pouvez plus vous connecter et vos publications sont masquées pour le moment.",
            },
            active: {
                subject: "Votre compte MultiServices est de nouveau actif",
                heading: "Compte réactivé",
                intro: "Votre compte a été réactivé. Vous pouvez vous reconnecter et vos publications sont de nouveau visibles.",
            },
            reason: "Motif",
            contact: "Si vous pensez qu'il s'agit d'une erreur, répondez à cet e-mail ou contactez-nous depuis le site.",
            button: "Ouvrir MultiServices",
        },
        ar: {
            suspended: {
                subject: "تم تعليق حسابك على MultiServices",
                heading: "تم تعليق الحساب",
                intro: "قام أحد المسؤولين بتعليق حسابك. لا يمكنك تسجيل الدخول ومنشوراتك مخفية حالياً.",
            },
            active: {
                subject: "حسابك على MultiServices نشط من جديد",
                heading: "تمت إعادة تفعيل الحساب",
                intro: "تمت إعادة تفعيل حسابك. يمكنك تسجيل الدخول مجدداً ومنشوراتك ظاهرة من جديد.",
            },
            reason: "السبب",
            contact: "إذا كنت تعتقد أن هذا خطأ، يمكنك الرد على هذا البريد أو التواصل معنا عبر الموقع.",
            button: "فتح MultiServices",
        },
    }[lang];

    const text = content[status];
    const transporter = createTransporter();
    const showReason = status === "suspended" && reason.trim();

    const html = makeEmailLayout({
        language: lang,
        heading: text.heading,
        intro: text.intro,
        content: `
            ${showReason ? `<p><strong>${escapeHtml(content.reason)}:</strong> ${escapeHtml(reason.trim())}</p>` : ""}
            <p style="color: #64748b; font-size: 13px;">${escapeHtml(content.contact)}</p>
        `,
        buttonText: content.button,
        buttonUrl: getFrontendUrl(),
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: text.subject,
        text: [
            text.heading,
            "",
            text.intro,
            showReason ? `${content.reason}: ${reason.trim()}` : "",
            "",
            content.contact,
        ].join("\n"),
        html,
    });
};

// -----------------------------------------------------------------------------
// Listing expiry (60 days without confirmation)
//   kind "reminder": will become inactive in {days} days
//   kind "expired":  became inactive
// -----------------------------------------------------------------------------

const LISTING_EXPIRY_TEXT = {
    en: {
        reminder: {
            subject: "Is your listing still available?",
            heading: "Is your listing still available?",
            intro: "Your listing \"{title}\" has not been confirmed for a while. It will become inactive in {days} days unless you confirm it is still available.",
            button: "Confirm in My Publications",
        },
        expired: {
            subject: "Your listing is now inactive",
            heading: "Listing set to inactive",
            intro: "Your listing \"{title}\" was not confirmed, so it is now inactive: it is hidden from searches and visitors cannot contact you.",
            button: "Reactivate in My Publications",
        },
        footer: "Listings are confirmed again when you edit them, change their status or click \"Still available\".",
    },
    fr: {
        reminder: {
            subject: "Votre annonce est-elle toujours disponible ?",
            heading: "Votre annonce est-elle toujours disponible ?",
            intro: "Votre annonce « {title} » n'a pas été confirmée depuis un moment. Elle deviendra inactive dans {days} jours si vous ne confirmez pas qu'elle est toujours disponible.",
            button: "Confirmer dans Mes publications",
        },
        expired: {
            subject: "Votre annonce est maintenant inactive",
            heading: "Annonce passée en inactive",
            intro: "Votre annonce « {title} » n'a pas été confirmée : elle est maintenant inactive, masquée des recherches, et les visiteurs ne peuvent plus vous contacter.",
            button: "Réactiver dans Mes publications",
        },
        footer: "Une annonce est confirmée quand vous la modifiez, changez son statut ou cliquez sur « Toujours disponible ».",
    },
    ar: {
        reminder: {
            subject: "هل إعلانك ما زال متاحاً؟",
            heading: "هل إعلانك ما زال متاحاً؟",
            intro: "لم يتم تأكيد إعلانك «{title}» منذ مدة. سيصبح غير نشط خلال {days} أيام إذا لم تؤكد أنه ما زال متاحاً.",
            button: "التأكيد في منشوراتي",
        },
        expired: {
            subject: "أصبح إعلانك غير نشط",
            heading: "تم تحويل الإعلان إلى غير نشط",
            intro: "لم يتم تأكيد إعلانك «{title}»، لذلك أصبح غير نشط: لن يظهر في نتائج البحث ولا يمكن للزوار التواصل معك.",
            button: "إعادة التفعيل في منشوراتي",
        },
        footer: "يتم تأكيد الإعلان عند تعديله أو تغيير حالته أو الضغط على «ما زال متاحاً».",
    },
};

export const getListingExpiryText = (language, kind) => {
    const lang = normalizeLanguage(language);
    return { ...LISTING_EXPIRY_TEXT[lang][kind], footer: LISTING_EXPIRY_TEXT[lang].footer };
};

const fillTemplate = (template, values) =>
    String(template).replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ""));

export const sendListingExpiryEmail = async ({ to, language = "en", kind, title = "", days = 7 }) => {
    if (!to || !["reminder", "expired"].includes(kind)) {
        throw new Error("Recipient email and a valid kind are required.");
    }

    const lang = normalizeLanguage(language);
    const text = getListingExpiryText(lang, kind);
    const intro = fillTemplate(text.intro, { title, days });
    const buttonUrl = `${getFrontendUrl()}/mypublication`;

    const html = makeEmailLayout({
        language: lang,
        heading: text.heading,
        intro,
        content: `<p style="color: #64748b; font-size: 13px;">${escapeHtml(text.footer)}</p>`,
        buttonText: text.button,
        buttonUrl,
    });

    await createTransporter().sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: text.subject,
        text: [text.heading, "", intro, "", `${text.button}: ${buttonUrl}`, "", text.footer].join("\n"),
        html,
    });
};
