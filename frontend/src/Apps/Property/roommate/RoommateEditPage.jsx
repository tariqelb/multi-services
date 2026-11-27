// src/Apps/Property/roommate/RoommateEditPage.jsx
// /roommates/:id/edit — the roommate form in edit mode (owner or admin).

import { useParams } from "react-router-dom";
import { Box } from "@mui/material";

import { pagePaddingSx } from "../../../Components/ui/PageContainer";
import RoommateInsertForm from "./RoommateInsertForm";
import { useGoBack, useReturnAfterSave } from "../../../Components/navigation/navHistory";

export default function RoommateEditPage() {
    const { id } = useParams();
    const goBack = useGoBack(`/roommates/profile/${id}`);
    const returnAfterSave = useReturnAfterSave();

    return (
        <Box sx={pagePaddingSx}>
            {/* key: a fresh form for each announcement */}
            <RoommateInsertForm
                key={id}
                listingId={id}
                onSaved={() =>
                    // Leave time for the success message. Back from the details page
                    // then returns to where "Edit" was clicked, not to this form.
                    setTimeout(() => returnAfterSave([`/roommates/profile/${id}`, `/roommates/${id}`]), 900)
                }
                onCancel={() => goBack()}
            />
        </Box>
    );
}
