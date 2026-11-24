// src/Apps/vehicles/VehicleForm/VehicleInsertForm.jsx
//
// Publish a vehicle, or edit one when vehicleId is given. One listing = one vehicle.
// Same layout as the property form: header, numbered sections, sticky submit bar.
// Agencies and showrooms: business name and Google Maps link are filled in
// from their business profile (saved with their first vehicle).

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, CircularProgress, Snackbar, Stack, Typography } from "@mui/material";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import { FormPage, FormPageHeader, FormSubmitBar } from "../../../Components/ui/FormKit";

import TwoWheelerRoundedIcon from "@mui/icons-material/TwoWheelerRounded";
import { BUSINESS_TYPES, EMPTY_VEHICLE_FORM, MAX_IMAGES, isMotorized, vehicleToForm } from "../vehicleOptions";
import {
    CustomFieldsSection,
    DescriptionSection,
    HistorySection,
    ImagesSection,
    PublisherSection,
    VehicleDetailsSection,
} from "./VehicleFormSections";

/** Same required fields as the backend, so errors show before sending. */
function validate(values, imageCount, t) {
    const errors = {};
    const required = t("vehiclesApp.form.errors.required", "Required.");
    const need = (field) => {
        const value = values[field];
        if (value === undefined || value === null || String(value).trim() === "") errors[field] = required;
    };

    const isMoto = values.category === "moto";
    const motorized = isMotorized(values.category, values.motoType);

    ["make", "fuel", "city"].forEach(need);
    if (isMoto) need("motoType");
    else ["transmission", "seats"].forEach(need);
    if (motorized) {
        need("model");
        need("year");
        if (values.condition === "used") need("mileage");
    }

    if (BUSINESS_TYPES.includes(values.publisherType)) {
        need("businessName");
        need("mapLink");
    }

    if (values.listingType === "rent") {
        need("pricePerDay");
        need("insurance");
        if (values.mileagePolicy === "limited") need("kmPerDay");
    } else {
        need("price");
    }

    const year = Number(values.year);
    if (values.year && (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1)) {
        errors.year = t("vehiclesApp.form.errors.year", "Enter a year between 1950 and next year.");
    }

    const halfFilled = values.customFields.some((row) => (row.label.trim() === "") !== (row.value.trim() === ""));
    if (halfFilled) errors.customFields = t("vehiclesApp.form.errors.customFields", "Each additional detail needs a title and a value.");

    if (!imageCount) errors.images = t("vehiclesApp.form.errors.images", "Add at least one photo of the vehicle.");

    return errors;
}

// UI-only values that are not sent.
const NOT_SENT = new Set(["makeOther"]);

function toFormData(values, newFiles, removedImages) {
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (NOT_SENT.has(key)) return;
        if (key === "equipment") body.append(key, JSON.stringify(value || []));
        else if (key === "customFields") {
            const rows = value.map(({ label, value: text }) => ({ label: label.trim(), value: text.trim() })).filter((row) => row.label || row.value);
            body.append(key, JSON.stringify(rows));
        } else body.append(key, typeof value === "boolean" ? String(value) : value ?? "");
    });
    newFiles.forEach((file) => body.append("images", file));
    if (removedImages.length) body.append("removeImages", JSON.stringify(removedImages));
    return body;
}

/** category: "car" or "moto" for a new listing; an edited listing keeps its own. */
export default function VehicleInsertForm({ vehicleId = null, category = "car" }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const isEdit = Boolean(vehicleId);
    const [values, setValues] = useState(() =>
        category === "moto" ? { ...EMPTY_VEHICLE_FORM, category: "moto", motoType: "motorcycle", fuel: "petrol", transmission: "", seats: "2" } : EMPTY_VEHICLE_FORM,
    );
    const isMoto = values.category === "moto";
    const [errors, setErrors] = useState({});
    // { key, src, name, file? (new), filename? (saved) }
    const [images, setImages] = useState([]);
    const [removedImages, setRemovedImages] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState("");
    const [dealerLoaded, setDealerLoaded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const set = (field, value) => {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    };

    // Publisher's account (name, email, current number), shown read-only like the property form.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get("/auth/me");
                if (!cancelled && data?.user) setProfile(data.user);
            } catch {
                // The form still works without it: the backend uses the account anyway.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Edit: load the vehicle. New: load the business profile (agency / showroom).
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                if (isEdit) {
                    const { data } = await axiosInstance.get(`/vehicles/${vehicleId}`);
                    if (cancelled) return;
                    if (!data.vehicle?.isOwner) {
                        setLoadError(t("vehiclesApp.form.errors.notOwner", "You can only edit your own vehicles."));
                        return;
                    }
                    setValues(vehicleToForm(data.vehicle));
                    setImages(
                        (data.vehicle.images || []).map((image) => ({
                            key: image.filename,
                            src: getImageUrl(image),
                            filename: image.filename,
                        }))
                    );
                } else {
                    const { data } = await axiosInstance.get("/vehicles/dealers/me");
                    if (cancelled || !data.dealer) return;
                    setValues((current) => ({
                        ...current,
                        publisherType: data.dealer.type,
                        businessName: data.dealer.name || "",
                        businessAddress: data.dealer.address || "",
                        mapLink: data.dealer.mapLink || "",
                        city: current.city || data.dealer.city || "",
                    }));
                    setDealerLoaded(true);
                }
            } catch (error) {
                if (!cancelled && isEdit) {
                    setLoadError(error.response?.data?.message || t("vehiclesApp.form.errors.load", "Unable to load this vehicle."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [vehicleId, isEdit, t]);

    // Object URLs of new photos are released when the form closes.
    const imagesRef = useRef(images);
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);
    useEffect(() => () => imagesRef.current.forEach((image) => image.file && URL.revokeObjectURL(image.src)), []);

    const addFiles = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        const room = MAX_IMAGES - images.length;
        if (files.length > room) {
            setToast({ severity: "warning", message: t("vehiclesApp.form.errors.tooManyImages", "A vehicle can have at most {{max}} photos.", { max: MAX_IMAGES }) });
        }
        const added = files.slice(0, Math.max(0, room)).map((file, index) => ({
            key: `new-${Date.now()}-${index}-${file.name}`,
            src: URL.createObjectURL(file),
            name: file.name,
            file,
        }));
        if (added.length) {
            setImages((current) => [...current, ...added]);
            setErrors((current) => ({ ...current, images: undefined }));
        }
    };

    const removeImage = (index) => {
        const image = images[index];
        if (!image) return;
        if (image.file) URL.revokeObjectURL(image.src);
        if (image.filename) setRemovedImages((current) => [...current, image.filename]);
        setImages((current) => current.filter((_, position) => position !== index));
    };

    const submit = async (event) => {
        event?.preventDefault();
        if (submitting) return;

        const found = validate(values, images.length, t);
        if (Object.keys(found).length) {
            setErrors(found);
            setToast({ severity: "error", message: t("vehiclesApp.form.errors.check", "Please check the highlighted fields.") });
            return;
        }

        setSubmitting(true);
        try {
            const body = toFormData(values, images.filter((image) => image.file).map((image) => image.file), removedImages);
            const { data } = isEdit ? await axiosInstance.put(`/vehicles/${vehicleId}`, body) : await axiosInstance.post("/vehicles", body);
            navigate(`/vehicles/${data.vehicle._id}`, { state: { published: !isEdit, updated: isEdit } });
        } catch (error) {
            const response = error.response?.data;
            if (response?.errors) setErrors(response.errors);
            else if (response?.field) setErrors({ [response.field]: response.message });
            setToast({ severity: "error", message: response?.message || t("vehiclesApp.form.errors.submit", "Unable to save this vehicle. Please try again.") });
        } finally {
            setSubmitting(false);
        }
    };

    const sectionProps = { values, set, errors };

    return (
        <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: "background.default", minHeight: "calc(100vh - 64px)" }}>
            <FormPage>
                <FormPageHeader
                    icon={isEdit ? <EditNoteRoundedIcon /> : isMoto ? <TwoWheelerRoundedIcon /> : <DirectionsCarFilledRoundedIcon />}
                    badge={isEdit ? t("vehiclesApp.form.editBadge", "Edit") : isMoto ? t("vehiclesApp.form.motoBadge", "Moto marketplace") : t("vehiclesApp.form.badge", "Vehicle marketplace")}
                    title={
                        isEdit
                            ? isMoto
                                ? t("vehiclesApp.form.editMotoTitle", "Edit your moto")
                                : t("vehiclesApp.form.editTitle", "Edit your vehicle")
                            : isMoto
                              ? t("vehiclesApp.form.motoTitle", "Publish a Moto")
                              : t("vehiclesApp.form.title", "Publish a Vehicle")
                    }
                    subtitle={
                        isEdit
                            ? t("vehiclesApp.form.editSubtitle", "Update the details and photos of your vehicle.")
                            : isMoto
                              ? t("vehiclesApp.form.motoSubtitle", "Motorcycle, scooter, bicycle, kick scooter or tricycle: add its details, price and clear photos.")
                              : t("vehiclesApp.form.subtitle", "Add your vehicle details, its price and clear photos to reach buyers and renters.")
                    }
                    requiredNote={t("vehiclesApp.form.requiredFields", "Fields marked with * are required")}
                />

                {loading && (
                    <Stack spacing={1.5} sx={{ alignItems: "center", py: 8 }}>
                        <CircularProgress />
                        <Typography sx={{ color: "text.secondary" }}>{t("vehiclesApp.form.loading", "Loading your vehicle...")}</Typography>
                    </Stack>
                )}

                {!loading && loadError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {loadError}
                    </Alert>
                )}

                {!loading && !loadError && (
                    <Box component="form" noValidate onSubmit={submit}>
                        <PublisherSection {...sectionProps} profile={profile} dealerLoaded={dealerLoaded} />
                        <VehicleDetailsSection {...sectionProps} language={i18n.language} />
                        <HistorySection {...sectionProps} />
                        <CustomFieldsSection {...sectionProps} />
                        <DescriptionSection {...sectionProps} />
                        <ImagesSection images={images} errors={errors} fileInputRef={fileInputRef} onAddFiles={addFiles} onRemoveImage={removeImage} />

                        <FormSubmitBar
                            loading={submitting}
                            title={isEdit ? t("vehiclesApp.form.saveTitle", "Save your changes") : t("vehiclesApp.form.publishTitle", "Ready to publish?")}
                            subtitle={
                                isEdit
                                    ? t("vehiclesApp.form.saveSubtitle", "Visitors see the new details right away.")
                                    : t("vehiclesApp.form.publishSubtitle", "Review your details before submitting your listing.")
                            }
                            submitLabel={
                                isEdit
                                    ? t("vehiclesApp.form.save", "Save changes")
                                    : isMoto
                                      ? t("vehiclesApp.form.publishMoto", "Publish Moto Listing")
                                      : t("vehiclesApp.form.publish", "Publish Vehicle Listing")
                            }
                            loadingLabel={t("vehiclesApp.form.saving", "Saving...")}
                            submitIcon={<CheckCircleRoundedIcon />}
                        />
                    </Box>
                )}
            </FormPage>

            <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                {toast ? (
                    <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)} sx={{ width: "100%" }}>
                        {toast.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Box>
    );
}
