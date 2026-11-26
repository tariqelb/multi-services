import mongoose from "mongoose";

// MongoDB (Atlas) connection.
//   family: 4                 IPv4 only: networks without IPv6 failed with
//                             "connect ENETUNREACH 2c0f:...".
//   serverSelectionTimeoutMS  a query waits at most 10 s for the database
//                             instead of 30 s when the network is down.
// Lost connections are retried automatically by the driver; the events
// below say once when it is lost and when it is back.
const OPTIONS = {
    family: 4,
    serverSelectionTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
};

let listening = false;

function watchConnection() {
    if (listening) return;
    listening = true;

    mongoose.connection.on("disconnected", () => {
        console.warn("[Database] Connection lost. Reconnecting automatically...");
    });
    mongoose.connection.on("reconnected", () => {
        console.log("[Database] Connection restored.");
    });
}

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env");
        }

        watchConnection();
        await mongoose.connect(process.env.MONGODB_URI, OPTIONS);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;
