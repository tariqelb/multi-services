
import nodemailer from "nodemailer";

const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } =
        process.env;

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

export const sendPropertyAlertEmail = async ({
    to,
    property,
}) => {
    if (!to || !property) {
        throw new Error(
            "A recipient email and property are required."
        );
    }

    const transporter = createTransporter();

    const propertyUrl = `${process.env.FRONTEND_URL}/properties/${property._id}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: `New property matching your alert: ${property.title}`,
        text: [
            "A new property matches your saved alert.",
            "",
            `Title: ${property.title}`,
            `City: ${property.city}`,
            `Type: ${property.propertyType}`,
            `Listing: ${property.listingType}`,
            `Price: ${property.price} MAD`,
            "",
            `View property: ${propertyUrl}`,
        ].join("\n"),
        html: `
            <h2>A new property matches your alert!</h2>
            <p><strong>${escapeHtml(property.title)}</strong></p>
            <p>City: ${escapeHtml(property.city)}</p>
            <p>Type: ${escapeHtml(property.propertyType)}</p>
            <p>Listing: ${escapeHtml(property.listingType)}</p>
            <p>Price: ${escapeHtml(property.price)} MAD</p>
            <p>
                <a href="${propertyUrl}">View property</a>
            </p>
        `,
    });
};

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);



export const sendVerificationEmail = async ({ to, code }) => {
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
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">
                ${escapeHtml(code)}
            </p>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this code, you can ignore this email.</p>
        `,
    });
};



// export const sendRoommateAlertEmail = async ({
//     to,
//     roommateListing,
// }) => {
//     if (!to || !roommateListing) {
//         throw new Error(
//             "A recipient email and roommate listing are required."
//         );
//     }

//     const transporter = createTransporter();

//     const roommateUrl =
//         `${process.env.FRONTEND_URL}/roommates/${roommateListing._id}`;

//     await transporter.sendMail({
//         from: process.env.EMAIL_FROM || process.env.SMTP_USER,
//         to,
//         subject: `New roommate announcement matching your alert: ${roommateListing.title}`,
//         text: [
//             "A new roommate announcement matches your saved alert.",
//             "",
//             `Title: ${roommateListing.title}`,
//             `City: ${roommateListing.city}`,
//             `Purpose: ${roommateListing.purpose}`,
//             `Property type: ${roommateListing.propertyType || "Not specified"}`,
//             `Rental period: ${roommateListing.rentalPeriod || "Not specified"}`,
//             `Rent: ${roommateListing.totalRent ?? "Not specified"} MAD`,
//             "",
//             `View announcement: ${roommateUrl}`,
//         ].join("\n"),
//         html: `
//             <h2>A new roommate announcement matches your alert!</h2>

//             <p>
//                 <strong>${escapeHtml(roommateListing.title)}</strong>
//             </p>

//             <p>City: ${escapeHtml(roommateListing.city)}</p>
//             <p>Purpose: ${escapeHtml(roommateListing.purpose)}</p>
//             <p>Property type: ${escapeHtml(roommateListing.propertyType || "Not specified")}</p>
//             <p>Rental period: ${escapeHtml(roommateListing.rentalPeriod || "Not specified")}</p>
//             <p>Rent: ${escapeHtml(roommateListing.totalRent ?? "Not specified")} MAD</p>

//             <p>
//                 <a href="${roommateUrl}">View roommate announcement</a>
//             </p>
//         `,
//     });
// };
export const sendRoommateAlertEmail = async ({
    to,
    roommateListing,
}) => {
    if (!to || !roommateListing) {
        throw new Error(
            "Email address and roommate listing are required."
        );
    }

    const transporter = createTransporter();

    const roommateUrl =
        `${process.env.FRONTEND_URL}/roommates/${roommateListing._id}`;

    const title = roommateListing.title || "Roommate announcement";

    const text = [
        "A new roommate announcement matches your alert.",
        "",
        `Title: ${title}`,
        `City: ${roommateListing.city}`,
        `Purpose: ${roommateListing.purpose}`,
        `Property type: ${roommateListing.propertyType}`,
        `Rental period: ${roommateListing.rentalPeriod || "Not specified"}`,
        "",
        `View announcement: ${roommateUrl}`,
    ].join("\n");

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: `New roommate announcement: ${title}`,
        text,
        html: `
            <h2>A new roommate announcement matches your alert!</h2>

            <p>
                <strong>${escapeHtml(title)}</strong>
            </p>

            <p>
                City: ${escapeHtml(roommateListing.city)}
            </p>

            <p>
                Purpose: ${escapeHtml(roommateListing.purpose)}
            </p>

            <p>
                Property type: ${escapeHtml(roommateListing.propertyType)}
            </p>

            <p>
                Rental period:
                ${escapeHtml(roommateListing.rentalPeriod || "Not specified")}
            </p>

            <p>
                <a href="${roommateUrl}">
                    View roommate announcement
                </a>
            </p>
        `,
    });
};