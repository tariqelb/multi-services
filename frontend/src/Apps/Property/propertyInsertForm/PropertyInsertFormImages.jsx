// src/Apps/Property/propertyInsertForm/PropertyInsertFormImages.jsx

import React from "react";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";

import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import {
    ImagePreviewGrid,
    UploadDropzone,
} from "../../../Components/ui/FormKit";

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
                icon={<PhotoLibraryOutlinedIcon />}
                title={t("properties.insert.images.title")}
                subtitle={t("properties.insert.images.subtitle")}
                number={4}
            />

            <UploadDropzone
                icon={<CloudUploadOutlinedIcon />}
                title={t("properties.insert.images.uploadTitle")}
                hint={t("properties.insert.images.uploadDescription")}
                buttonLabel={t("properties.insert.images.browseFiles")}
                onClick={() => fileInputRef.current?.click()}
            >
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 1.5 }}>
                    {t("properties.insert.images.fileRequirements")}
                </Typography>
            </UploadDropzone>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleImageChange}
            />

            <ImagePreviewGrid
                title={t("properties.insert.images.selectedImages")}
                countLabel={t("properties.insert.images.imageCount", {
                    count: images.length,
                    max: 15,
                })}
                items={images.map((image, index) => ({
                    key: `${image.file?.name || image.filename || "image"}-${index}`,
                    src: image.url,
                    alt: image.file?.name || image.filename,
                }))}
                onRemove={handleRemoveImage}
                mainLabel={t("properties.insert.images.main")}
                removeLabel={t("properties.insert.images.remove")}
            />
        </SectionPaper>
    );
}
