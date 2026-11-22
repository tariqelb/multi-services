// src/Apps/Property/propertyInsertForm/PropertyInsertFormPublish.jsx
// Uses the shared submit bar so every form ends the same way.

import React from "react";
import { useTranslation } from "react-i18next";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { FormSubmitBar } from "../../../Components/ui/FormKit";

export default function PropertyInsertFormPublish({ loading = false, isEdit = false }) {
    const { t } = useTranslation();

    return (
        <FormSubmitBar
            loading={loading}
            title={isEdit ? t("properties.edit.saveTitle", "Save your changes") : t("properties.insert.publish.title")}
            subtitle={
                isEdit
                    ? t("properties.edit.saveSubtitle", "Visitors see the new details right away.")
                    : t("properties.insert.publish.subtitle")
            }
            submitLabel={isEdit ? t("properties.edit.saveButton", "Save changes") : t("properties.insert.publish.button")}
            loadingLabel={isEdit ? t("properties.edit.saving", "Saving...") : t("properties.insert.publish.loading")}
            submitIcon={<CheckCircleRoundedIcon />}
        />
    );
}
