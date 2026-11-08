import React from "react";
import { useTranslation } from "react-i18next";

import {
    Box,
    Typography,
    Button,
    Grid,
    Stack,
    Chip,
} from "@mui/material";

export default function PropertyInsertFormImages({
    formData,
    fileInputRef,
    handleImageChange,
    handleRemoveImage,
    SectionPaper,
    SectionHeader,
}) {
    const { t } = useTranslation();

    const images = formData.images || [];

    return (
        <SectionPaper>
            <SectionHeader
                icon="📷"
                title={t("properties.insert.images.title")}
                subtitle={t("properties.insert.images.subtitle")}
                number={3}
            />

            <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: "2px dashed #BFDBFE",
                    borderRadius: "14px",
                    px: 2,
                    py: { xs: 4, sm: 5 },
                    textAlign: "center",
                    bgcolor: "#F5F9FF",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor: "#3B82F6",
                        bgcolor: "#EFF6FF",
                    },
                }}
            >
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        mx: "auto",
                        mb: 2,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: "18px",
                        bgcolor: "#DBEAFE",
                        color: "#2563EB",
                        fontSize: "26px",
                    }}
                >
                    📤
                </Box>

                <Typography
                    variant="subtitle1"
                    sx={{
                        fontWeight: 600,
                        color: "#0F172A",
                        mb: 0.7,
                    }}
                >
                    {t("properties.insert.images.uploadTitle")}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: "#5B6577", mb: 2 }}
                >
                    {t("properties.insert.images.uploadDescription")}
                </Typography>

                <Button
                    variant="outlined"
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                    sx={{
                        borderRadius: "9px",
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: "#BFDBFE",
                        color: "#2563EB",
                        px: 3,
                        py: 1,
                    }}
                >
                    {t("properties.insert.images.browseFiles")}
                </Button>

                <Typography
                    variant="caption"
                    display="block"
                    sx={{ color: "#5B6577", mt: 2 }}
                >
                    {t("properties.insert.images.fileRequirements")}
                </Typography>
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleImageChange}
            />

            {images.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                color: "#0F172A",
                            }}
                        >
                            {t("properties.insert.images.selectedImages")}
                        </Typography>

                        <Chip
                            size="small"
                            label={t("properties.insert.images.imageCount", {
                                count: images.length,
                                max: 15,
                            })}
                            sx={{
                                bgcolor: "#EFF6FF",
                                color: "#2563EB",
                            }}
                        />
                    </Stack>

                    <Grid container spacing={2}>
                        {images.map((image, index) => (
                            <Grid
                                size={{ xs: 6, sm: 4, md: 3 }}
                                key={`${image.file.name}-${index}`}
                            >
                                <Box
                                    sx={{
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: "10px",
                                        border: "1px solid #e5e7eb",
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={image.url}
                                        alt={image.file.name}
                                        sx={{
                                            display: "block",
                                            width: "100%",
                                            height: 120,
                                            objectFit: "cover",
                                        }}
                                    />

                                    <Button
                                        size="small"
                                        onClick={() =>
                                            handleRemoveImage(index)
                                        }
                                        sx={{
                                            position: "absolute",
                                            top: 5,
                                            right: 5,
                                            minWidth: 0,
                                            px: 1,
                                            bgcolor: "rgba(255,255,255,0.95)",
                                            color: "#dc2626",
                                            fontSize: "0.7rem",
                                            "&:hover": {
                                                bgcolor: "#ffffff",
                                            },
                                        }}
                                    >
                                        {t("properties.insert.images.remove")}
                                    </Button>

                                    {index === 0 && (
                                        <Chip
                                            label={t(
                                                "properties.insert.images.main"
                                            )}
                                            size="small"
                                            sx={{
                                                position: "absolute",
                                                bottom: 6,
                                                left: 6,
                                                height: 23,
                                                bgcolor: "#2563EB",
                                                color: "#ffffff",
                                                fontWeight: 700,
                                            }}
                                        />
                                    )}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </SectionPaper>
    );
}