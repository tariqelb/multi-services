import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import axiosInstance from "../../../api/axiosInstance";

const VISITOR_ID_KEY = "marketplace_visitor_id";
const HEARTBEAT_INTERVAL = 30_000;

function getVisitorId() {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return visitorId;
}

export default function VisitTracker() {
    const location = useLocation();

    useEffect(() => {
        const visitorId = getVisitorId();

        let cancelled = false;
        let lastHeartbeat = 0;

        const sendHeartbeat = async () => {
            if (
                cancelled ||
                document.visibilityState !== "visible"
            ) {
                return;
            }

            const now = Date.now();

            // Prevent duplicate requests when several events fire together.
            if (now - lastHeartbeat < 1000) {
                return;
            }

            lastHeartbeat = now;

            try {
                await axiosInstance.post(
                    "/dashboard/visits/heartbeat",
                    {
                        visitorId,
                        page:
                            window.location.pathname +
                            window.location.search,
                    }
                );
            } catch (error) {
                // Tracking should never interrupt normal navigation.
                console.error("Visit tracking failed:", error);
            }
        };

        sendHeartbeat();

        const interval = window.setInterval(
            sendHeartbeat,
            HEARTBEAT_INTERVAL
        );

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                sendHeartbeat();
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        return () => {
            cancelled = true;
            window.clearInterval(interval);

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [location.pathname, location.search]);

    return null;
}