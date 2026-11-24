// src/Components/ui/SaveToggleButton.jsx
// The "Save" / "Saved" button of every details page (property, roommate,
// hotel / riad, vehicle, moto). Same place on all of them: in the contact
// card, right under the WhatsApp button. Full width, large like the
// contact buttons; outlined to save, filled once saved.

import { Button, CircularProgress } from "@mui/material";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkAddedRoundedIcon from "@mui/icons-material/BookmarkAddedRounded";

export default function SaveToggleButton({ saved, saving = false, disabled = false, onClick, saveLabel, savedLabel, sx }) {
    return (
        <Button
            fullWidth
            size="large"
            variant={saved ? "contained" : "outlined"}
            color="primary"
            aria-pressed={Boolean(saved)}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : saved ? <BookmarkAddedRoundedIcon /> : <BookmarkBorderRoundedIcon />}
            disabled={saving || disabled}
            onClick={onClick}
            sx={{ fontWeight: 700, ...sx }}
        >
            {saved ? savedLabel : saveLabel}
        </Button>
    );
}
