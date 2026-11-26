// backend/apps/main/scripts/migrateRequestsToServices.js
//
// Requests moved from the main service to each service:
//   service_requests   (service: "property") -> property_requests
//   service_requests   (service: "vehicle")  -> vehicle_requests
//   request_responses  (by their request)    -> property_request_responses / vehicle_request_responses
// Ids are kept, so links in notifications and emails still work.
// Safe to run again (documents are upserted by id).
//
//   npm run migrate:requests               copy
//   npm run migrate:requests -- --drop-old copy, then drop the two old collections

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend/ directory before importing the database config.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const TARGETS = {
    property: { requests: "property_requests", responses: "property_request_responses" },
    vehicle: { requests: "vehicle_requests", responses: "vehicle_request_responses" },
};

async function copy(source, target, filter, transform = (doc) => doc) {
    let copied = 0;
    const cursor = source.find(filter);
    for await (const doc of cursor) {
        await target.replaceOne({ _id: doc._id }, transform(doc), { upsert: true });
        copied += 1;
    }
    return copied;
}

async function migrateRequests() {
    const dropOld = process.argv.includes("--drop-old");
    try {
        const { default: connectDB } = await import("../../../config/db.js");
        const { default: mongoose } = await import("mongoose");
        await connectDB();

        const db = mongoose.connection.db;
        const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((collection) => collection.name));
        if (!existing.has("service_requests")) {
            console.log("Nothing to migrate: no service_requests collection.");
            return;
        }

        const oldRequests = db.collection("service_requests");
        const oldResponses = db.collection("request_responses");

        for (const [service, names] of Object.entries(TARGETS)) {
            const ids = await oldRequests.distinct("_id", { service });
            const requests = await copy(oldRequests, db.collection(names.requests), { service }, ({ service: _service, ...doc }) => doc);
            const responses = existing.has("request_responses")
                ? await copy(oldResponses, db.collection(names.responses), { requestId: { $in: ids } })
                : 0;
            console.log(`${service}: ${requests} request(s), ${responses} reply(ies) -> ${names.requests}, ${names.responses}`);
        }

        // One reply per professional and request (same index as the models).
        await db.collection(TARGETS.property.responses).createIndex({ requestId: 1, responderId: 1 }, { unique: true });
        await db.collection(TARGETS.vehicle.responses).createIndex({ requestId: 1, responderId: 1 }, { unique: true });

        if (dropOld) {
            await oldRequests.drop();
            if (existing.has("request_responses")) await oldResponses.drop();
            console.log("Old collections dropped: service_requests, request_responses.");
        } else {
            console.log("Old collections kept. Run again with --drop-old once everything works.");
        }
    } catch (error) {
        console.error("Requests migration failed:", error);
        process.exitCode = 1;
    } finally {
        process.exit();
    }
}

migrateRequests();
