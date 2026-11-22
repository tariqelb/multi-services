// src/Apps/Property/roommate/RoommateEditPage.jsx
// /roommates/:id/edit — the roommate form in edit mode (owner or admin).

import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";

import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import RoommateInsertForm from "./RoommateInsertForm";

export default function RoommateEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <Box sx={pagePaddingSx}>
            {/* key: a fresh form for each announcement */}
            <RoommateInsertForm
                key={id}
                listingId={id}
                onSaved={() =>
                    // Leave time for the success message.
                    setTimeout(() => navigate(`/roommates/profile/${id}`), 900)
                }
            />
        </Box>
    );
}
