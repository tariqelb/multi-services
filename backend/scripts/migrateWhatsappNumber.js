// Move the WhatsApp number next to the phone number (one time).
//   npm run migrate:whatsapp
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import { moveWhatsappNumber } from "../services/migrations/moveWhatsappNumber.js";

try {
    await connectDB();
    const result = await moveWhatsappNumber();
    console.log("WhatsApp migration done:", result);
} catch (error) {
    console.error("WhatsApp migration failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
