
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
