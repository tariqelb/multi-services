// src/Apps/DailyWorker/Components/WorkerAvatar.jsx
//
// Round picture of a worker: his account photo, or the default picture for his
// gender (man / woman), or a helmet icon when the gender is unknown.

import { Avatar } from "@mui/material";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";

import getImageUrl from "../../../utils/getImageUrl";
import { defaultFace } from "../workerPictures";

export default function WorkerAvatar({ src, gender = "", name = "", size = 56, sx }) {
    const url = getImageUrl(src) || defaultFace(gender);
    return (
        <Avatar
            src={url || undefined}
            alt={name}
            sx={{
                width: size,
                height: size,
                bgcolor: url ? "grey.200" : "#DBEAFE",
                color: "#1D4ED8",
                border: "3px solid #fff",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.16)",
                ...sx,
            }}
        >
            <EngineeringRoundedIcon sx={{ fontSize: size * 0.55 }} />
        </Avatar>
    );
}
