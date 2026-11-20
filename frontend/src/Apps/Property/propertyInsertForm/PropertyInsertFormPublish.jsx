// src/Apps/Property/propertyInsertForm/PropertyInsertFormPublish.jsx
// Uses the shared submit bar so every form ends the same way.

import React from "react";
import { useTranslation } from "react-i18next";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { FormSubmitBar } from "../../../Components/ui/FormKit";

export default function PropertyInsertFormPublish({ loading = false }) {
    const { t } = useTranslation();

    return (
        <FormSubmitBar
            loading={loading}
            title={t("properties.insert.publish.title")}
            subtitle={t("properties.insert.publish.subtitle")}
            submitLabel={t("properties.insert.publish.button")}
            loadingLabel={t("properties.insert.publish.loading")}
            submitIcon={<CheckCircleRoundedIcon />}
        />
    );
}
