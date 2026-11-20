import React, { useRef } from "react";
import { Stack, TextField, InputAdornment } from "@mui/material";

import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";

import {
    SectionHeader,
    SectionPaper,
} from "./RoommateFormUI";
import {
    UploadDropzone,
    ImagePreviewGrid,
} from "../../../Components/ui/FormKit";

export default function RoommateMediaSection({
    images,
    previews,
    onImagesChange,
    onRemoveImage,
    formData,
    onChange,
    errors,
    t,
}) {
    const inputRef = useRef(null);
    const translate = (key, fallback, options = {}) =>
        t(key, { defaultValue: fallback, ...options });

    const count = previews?.length || 0;

    return (
        <SectionPaper>
            <SectionHeader
                number={5}
                icon={<PhotoLibraryOutlinedIcon />}
                title={translate("roommates.form.photosVideo", "Photos and video")}
                subtitle={translate(
                    "roommates.form.mediaDescription",
                    "Add photos and optionally a YouTube video."
                )}
            />

            <Stack spacing={2.5}>
                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                        onImagesChange(event);
                        event.target.value = "";
                    }}
                />

                <UploadDropzone
                    icon={<CloudUploadOutlinedIcon />}
                    title={translate("roommates.form.uploadPhotos", "Upload photos")}
                    hint={translate(
                        "roommates.form.imageRequirements",
                        "Maximum 15 images. JPG, PNG or WEBP. Maximum 5 MB per image."
                    )}
                    buttonLabel={translate("ui.form.chooseFiles", "Choose files")}
                    onClick={() => inputRef.current?.click()}
                    disabled={count >= 15}
                />

                {count > 0 && (
                    <ImagePreviewGrid
                        items={previews.map((src, index) => ({
                            key: `${src}-${index}`,
                            src,
                            alt: translate("roommates.form.photoAlt", "Photo {{n}}", { n: index + 1 }),
                        }))}
                        onRemove={onRemoveImage}
                        countLabel={translate("ui.form.photosCount", "{{count}} / 15 photos", { count })}
                    />
                )}

                <TextField
                    fullWidth
                    label={translate("roommates.form.youtubeLink", "YouTube video link")}
                    name="youtubeLink"
                    value={formData.youtubeLink}
                    onChange={onChange}
                    error={Boolean(errors.youtubeLink)}
                    helperText={errors.youtubeLink}
                    placeholder="https://www.youtube.com/watch?v=..."
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <YouTubeIcon sx={{ color: "#FF0000" }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Stack>
        </SectionPaper>
    );
}
