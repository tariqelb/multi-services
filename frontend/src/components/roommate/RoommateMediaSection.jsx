
import React from "react";
import {
    Paper,
    Stack,
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
} from "@mui/material";

import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { SectionHeader } from "./RoommateFormUI";

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
    const translate = (key, fallback) =>
        t(key, { defaultValue: fallback });

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <SectionHeader
                icon={<PhotoLibraryIcon />}
                title={translate(
                    "roommates.form.photosVideo",
                    "Photos and video"
                )}
                subtitle={translate(
                    "roommates.form.mediaDescription",
                    "Add photos and optionally a YouTube video."
                )}
            />

            <Stack spacing={2.5}>
                <Box>
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                    >
                        {translate(
                            "roommates.form.uploadPhotos",
                            "Upload photos"
                        )}

                        <input
                            hidden
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={onImagesChange}
                        />
                    </Button>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                    >
                        {translate(
                            "roommates.form.imageRequirements",
                            "Maximum 15 images. JPG, PNG or WEBP. Maximum 5 MB per image."
                        )}
                    </Typography>
                </Box>

                {previews?.length > 0 && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, 1fr)",
                                sm: "repeat(3, 1fr)",
                                md: "repeat(4, 1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        {previews.map((preview, index) => (
                            <Box
                                key={`${preview}-${index}`}
                                sx={{
                                    position: "relative",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    aspectRatio: "1 / 1",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={preview}
                                    alt={`Roommate accommodation ${index + 1}`}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />

                                <IconButton
                                    size="small"
                                    onClick={() => onRemoveImage(index)}
                                    aria-label={translate(
                                        "common.remove",
                                        "Remove image"
                                    )}
                                    sx={{
                                        position: "absolute",
                                        top: 6,
                                        right: 6,
                                        bgcolor: "background.paper",
                                        "&:hover": {
                                            bgcolor: "error.light",
                                            color: "white",
                                        },
                                    }}
                                >
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}

                <TextField
                    fullWidth
                    label={translate(
                        "roommates.form.youtubeLink",
                        "YouTube video link"
                    )}
                    name="youtubeLink"
                    value={formData.youtubeLink}
                    onChange={onChange}
                    error={Boolean(errors.youtubeLink)}
                    helperText={errors.youtubeLink}
                    placeholder="https://www.youtube.com/watch?v=..."
                />
            </Stack>
        </Paper>
    );
}
