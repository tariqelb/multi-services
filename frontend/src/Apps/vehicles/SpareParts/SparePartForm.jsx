// src/Apps/vehicles/SpareParts/SparePartForm.jsx
//
// Publish a spare part, or edit one when partId is given (/vehicles/parts/publish,
// /vehicles/parts/:id/edit). Same layout as the vehicle form: header, numbered
// sections, sticky submit bar. The contact shown to buyers is the seller's
// account phone / WhatsApp (as for vehicles).

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Autocomplete,
    Box,
    CircularProgress,
    FormControlLabel,
    Grid,
    InputAdornment,
    Snackbar,
    Stack,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import moroccanCities from "../../../data/moroccanCities";
import { ChoiceChips, FormPage, FormPageHeader, FormSubmitBar, ImagePreviewGrid, SectionHeader, SectionPaper, UploadDropzone } from "../../../Components/ui/FormKit";

import { makesFor, modelsForMake } from "../vehicleOptions";
import { optionLabel, optionList } from "../vehicleFormat";
import {
    EMPTY_PART_FORM,
    MAX_PART_IMAGES,
    PART_BUSINESS_TYPES,
    PART_CATEGORIES,
    PART_CATEGORY_STYLES,
    PART_CONDITIONS,
    PART_DESCRIPTION_MAX,
    PART_SELLER_TYPES,
    partToForm,
} from "./sparePartOptions";

// -----------------------------------------------------------------------------
// Small pieces (same look as the vehicle form)
// -----------------------------------------------------------------------------

const toggleGroupSx = {
    display: "flex",
    gap: 1.5,
    border: 0,
    "& .MuiToggleButton-root": {
        flex: 1,
        minWidth: 0,
        py: 1.3,
        px: 1,
        textTransform: "none",
        fontWeight: 600,
        fontSize: { xs: "0.72rem", sm: "0.88rem" },
        color: "#64748B",
        border: "1px solid #E2E8F0",
        borderRadius: "10px !important",
        "&.Mui-selected": { color: "#2563EB", bgcolor: "#EFF6FF", borderColor: "#93C5FD" },
    },
};

function FieldLabel({ children, required }) {
    return (
        <Typography variant="body2" sx={{ fontWeight: 650, color: "#334155", mb: 1.5 }}>
            {children}
            {required && " *"}
        </Typography>
    );
}

function Toggles({ value, options, onChange, label }) {
    return (
        <ToggleButtonGroup value={value} exclusive fullWidth aria-label={label} onChange={(_, next) => next !== null && onChange(next)} sx={toggleGroupSx}>
            {options.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

function Field({ name, label, values, set, errors, type = "text", unit, helper, ...rest }) {
    return (
        <TextField
            fullWidth
            name={name}
            label={label}
            type={type}
            value={values[name] ?? ""}
            onChange={(event) => set(name, event.target.value)}
            error={Boolean(errors[name])}
            helperText={errors[name] || helper || ""}
            slotProps={{
                htmlInput: type === "number" ? { min: 0, inputMode: "decimal" } : undefined,
                input: unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : undefined,
            }}
            {...rest}
        />
    );
}

function Switcher({ name, label, values, set }) {
    return (
        <FormControlLabel
            control={<Switch checked={Boolean(values[name])} onChange={(event) => set(name, event.target.checked)} />}
            label={
                <Typography variant="body2" sx={{ color: "#475569" }}>
                    {label}
                </Typography>
            }
        />
    );
}

// -----------------------------------------------------------------------------
// Form
// -----------------------------------------------------------------------------

function validate(values, imageCount, t) {
    const errors = {};
    const required = t("vehiclesApp.form.errors.required", "Required.");
    const blank = (field) => String(values[field] ?? "").trim() === "";

    if (!values.partCategory) errors.partCategory = required;
    if (values.title.trim().length < 3) errors.title = t("vehiclesApp.parts.form.titleError", "Enter the part name (3 characters at least).");
    if (!values.universal && blank("compatibleMake")) errors.compatibleMake = t("vehiclesApp.parts.form.makeError", "Choose the make, or mark the part as universal.");
    if (values.yearFrom && values.yearTo && Number(values.yearFrom) > Number(values.yearTo)) {
        errors.yearTo = t("vehiclesApp.parts.form.yearsError", "The last year must be after the first year.");
    }
    if (blank("price")) errors.price = required;
    if (blank("city")) errors.city = required;
    if (PART_BUSINESS_TYPES.includes(values.sellerType) && blank("businessName")) errors.businessName = required;
    if (!imageCount) errors.images = t("vehiclesApp.parts.form.imagesError", "Add at least one photo of the part.");
    return errors;
}

function toFormData(values, newFiles, removedImages) {
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => body.append(key, typeof value === "boolean" ? String(value) : value ?? ""));
    newFiles.forEach((file) => body.append("images", file));
    if (removedImages.length) body.append("removeImages", JSON.stringify(removedImages));
    return body;
}

export function EditSparePartPage() {
    const { id } = useParams();
    return <SparePartForm key={id} partId={id} />;
}

export default function SparePartForm({ partId = null }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const isEdit = Boolean(partId);
    const isArabic = String(i18n.language).startsWith("ar");

    const [values, setValues] = useState(EMPTY_PART_FORM);
    const [errors, setErrors] = useState({});
    const [images, setImages] = useState([]); // { key, src, name, file? , filename? }
    const [removedImages, setRemovedImages] = useState([]);
    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const set = (field, value) => {
        setValues((current) => ({ ...current, [field]: value, ...(field === "compatibleMake" ? { compatibleModel: "" } : {}) }));
        setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    };

    // Edit: load the part (owner only).
    useEffect(() => {
        if (!isEdit) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axiosInstance.get(`/vehicles/parts/${partId}`);
                if (cancelled) return;
                if (!data.part?.isOwner) {
                    setLoadError(t("vehiclesApp.parts.form.notOwner", "You can only edit your own spare parts."));
                    return;
                }
                setValues(partToForm(data.part));
                setImages((data.part.images || []).map((image) => ({ key: image.filename, src: getImageUrl(image), filename: image.filename })));
            } catch (error) {
                if (!cancelled) setLoadError(error.response?.data?.message || t("vehiclesApp.parts.form.loadError", "Unable to load this spare part."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [partId, isEdit, t]);

    // Object URLs of new photos are released when the form closes.
    const imagesRef = useRef(images);
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);
    useEffect(() => () => imagesRef.current.forEach((image) => image.file && URL.revokeObjectURL(image.src)), []);

    const addFiles = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        const room = MAX_PART_IMAGES - images.length;
        if (files.length > room) {
            setToast({ severity: "warning", message: t("vehiclesApp.parts.form.tooManyImages", "A spare part can have at most {{max}} photos.", { max: MAX_PART_IMAGES }) });
        }
        const added = files.slice(0, Math.max(0, room)).map((file, index) => ({ key: `new-${Date.now()}-${index}-${file.name}`, src: URL.createObjectURL(file), name: file.name, file }));
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
            const { data } = isEdit ? await axiosInstance.put(`/vehicles/parts/${partId}`, body) : await axiosInstance.post("/vehicles/parts", body);
            navigate(`/vehicles/parts/${data.part._id}`, { state: { published: !isEdit, updated: isEdit } });
        } catch (error) {
            const response = error.response?.data;
            if (response?.errors) setErrors(response.errors);
            else if (response?.field) setErrors({ [response.field]: response.message });
            setToast({ severity: "error", message: response?.message || t("vehiclesApp.parts.form.submitError", "Unable to save this spare part. Please try again.") });
        } finally {
            setSubmitting(false);
        }
    };

    const sectionProps = { values, set, errors };
    const isBusiness = PART_BUSINESS_TYPES.includes(values.sellerType);
    const makeCategory = values.vehicleType === "moto" ? "moto" : "car";
    const cityOption = moroccanCities.find((city) => city.en === values.city) || null;
    const descriptionLength = values.description.length;

    return (
        <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: "background.default", minHeight: "calc(100vh - 64px)" }}>
            <FormPage>
                <FormPageHeader
                    icon={isEdit ? <EditNoteRoundedIcon /> : <BuildCircleOutlinedIcon />}
                    badge={isEdit ? t("vehiclesApp.form.editBadge", "Edit") : t("vehiclesApp.parts.form.badge", "Spare parts")}
                    title={isEdit ? t("vehiclesApp.parts.form.editTitle", "Edit your spare part") : t("vehiclesApp.parts.form.title", "Publish a Spare Part")}
                    subtitle={
                        isEdit
                            ? t("vehiclesApp.parts.form.editSubtitle", "Update the details and photos of your part.")
                            : t("vehiclesApp.parts.form.subtitle", "Car or moto part: say what it is, which vehicles it fits, its price and add clear photos.")
                    }
                    requiredNote={t("vehiclesApp.form.requiredFields", "Fields marked with * are required")}
                />

                {loading && (
                    <Stack spacing={1.5} sx={{ alignItems: "center", py: 8 }}>
                        <CircularProgress />
                    </Stack>
                )}
                {!loading && loadError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {loadError}
                    </Alert>
                )}

                {!loading && !loadError && (
                    <Box component="form" noValidate onSubmit={submit}>
                        {/* 1. Seller */}
                        <SectionPaper>
                            <SectionHeader
                                icon={<PersonOutlineRoundedIcon />}
                                title={t("vehiclesApp.parts.form.sellerTitle", "Seller")}
                                subtitle={t("vehiclesApp.parts.form.sellerSubtitle", "Buyers call you on the phone / WhatsApp of your account.")}
                                number={1}
                            />
                            <FieldLabel required>{t("vehiclesApp.parts.form.sellerType", "You are")}</FieldLabel>
                            <Toggles value={values.sellerType} onChange={(value) => set("sellerType", value)} options={optionList(t, "sellerType", PART_SELLER_TYPES)} />
                            {isBusiness && (
                                <Grid container spacing={2.5} sx={{ mt: 1 }}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Field {...sectionProps} name="businessName" required label={t("vehiclesApp.parts.form.businessName", "Shop / scrapyard name")} />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Field {...sectionProps} name="businessAddress" label={t("vehiclesApp.form.publisher.businessAddress", "Business address")} />
                                    </Grid>
                                </Grid>
                            )}
                        </SectionPaper>

                        {/* 2. The part */}
                        <SectionPaper>
                            <SectionHeader
                                icon={<Inventory2OutlinedIcon />}
                                title={t("vehiclesApp.parts.form.partTitle", "The Part")}
                                subtitle={t("vehiclesApp.parts.form.partSubtitle", "What it is, its condition and its reference.")}
                                number={2}
                            />
                            <FieldLabel required>{t("vehiclesApp.parts.form.forVehicle", "Part for")}</FieldLabel>
                            <Toggles value={values.vehicleType} onChange={(value) => set("vehicleType", value)} options={optionList(t, "partVehicleType", ["car", "moto"])} />

                            <Box sx={{ mt: 3 }}>
                                <FieldLabel required>{t("vehiclesApp.parts.form.category", "Category")}</FieldLabel>
                                <ChoiceChips
                                    options={PART_CATEGORIES.map((value) => {
                                        const Icon = PART_CATEGORY_STYLES[value].icon;
                                        return { value, label: optionLabel(t, "partCategory", value), icon: <Icon fontSize="small" /> };
                                    })}
                                    value={values.partCategory}
                                    onChange={(value) => set("partCategory", value)}
                                />
                                {errors.partCategory && (
                                    <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                                        {errors.partCategory}
                                    </Typography>
                                )}
                            </Box>

                            <Grid container spacing={2.5} sx={{ mt: 1.5 }}>
                                <Grid size={12}>
                                    <Field
                                        {...sectionProps}
                                        name="title"
                                        required
                                        label={t("vehiclesApp.parts.form.name", "Part name")}
                                        placeholder={t("vehiclesApp.parts.form.namePlaceholder", "e.g. Front brake pads, headlight, alternator…")}
                                        slotProps={{ htmlInput: { maxLength: 120 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Field {...sectionProps} name="brand" label={t("vehiclesApp.parts.form.brand", "Part brand")} helper={t("vehiclesApp.parts.form.brandHelp", "Bosch, Valeo, original part…")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Field {...sectionProps} name="partNumber" label={t("vehiclesApp.parts.form.partNumber", "Reference (OEM number)")} />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3 }}>
                                <FieldLabel required>{t("vehiclesApp.filters.condition", "Condition")}</FieldLabel>
                                <Toggles value={values.condition} onChange={(value) => set("condition", value)} options={optionList(t, "partCondition", PART_CONDITIONS)} />
                            </Box>

                            <Grid container spacing={2.5} sx={{ mt: 1.5 }}>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <Field {...sectionProps} name="quantity" type="number" label={t("vehiclesApp.parts.form.quantity", "Quantity")} />
                                </Grid>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <Field {...sectionProps} name="warrantyMonths" type="number" label={t("vehiclesApp.parts.form.warranty", "Warranty")} unit={t("vehiclesApp.parts.form.months", "months")} />
                                </Grid>
                            </Grid>
                        </SectionPaper>

                        {/* 3. Compatibility */}
                        <SectionPaper>
                            <SectionHeader
                                icon={<DirectionsCarOutlinedIcon />}
                                title={t("vehiclesApp.parts.form.compatibilityTitle", "Compatible Vehicles")}
                                subtitle={t("vehiclesApp.parts.form.compatibilitySubtitle", "Buyers search by make, model and year: say which vehicles the part fits.")}
                                number={3}
                            />
                            <Switcher {...sectionProps} name="universal" label={t("vehiclesApp.parts.form.universal", "Universal part (fits every vehicle)")} />
                            {!values.universal && (
                                <Grid container spacing={2.5} sx={{ mt: 1 }}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Autocomplete
                                            freeSolo
                                            options={makesFor(makeCategory)}
                                            value={values.compatibleMake}
                                            onInputChange={(_, value) => value !== values.compatibleMake && set("compatibleMake", value)}
                                            renderInput={(props) => (
                                                <TextField {...props} required label={t("vehiclesApp.form.vehicle.make", "Make")} error={Boolean(errors.compatibleMake)} helperText={errors.compatibleMake || ""} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Autocomplete
                                            freeSolo
                                            options={modelsForMake(values.compatibleMake, makeCategory)}
                                            value={values.compatibleModel}
                                            onInputChange={(_, value) => value !== values.compatibleModel && set("compatibleModel", value)}
                                            renderInput={(props) => (
                                                <TextField {...props} label={t("vehiclesApp.form.vehicle.model", "Model")} helperText={t("vehiclesApp.parts.form.modelHelp", "Empty: every model of the make.")} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 3 }}>
                                        <Field {...sectionProps} name="yearFrom" type="number" label={t("vehiclesApp.parts.form.yearFrom", "From year")} />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 3 }}>
                                        <Field {...sectionProps} name="yearTo" type="number" label={t("vehiclesApp.parts.form.yearTo", "To year")} />
                                    </Grid>
                                </Grid>
                            )}
                            <Field
                                {...sectionProps}
                                name="compatibilityNotes"
                                label={t("vehiclesApp.parts.form.notes", "Other compatible vehicles (optional)")}
                                placeholder={t("vehiclesApp.parts.form.notesPlaceholder", "e.g. Also fits Renault Clio 3 and Sandero 1")}
                                sx={{ mt: 2.5 }}
                                slotProps={{ htmlInput: { maxLength: 300 } }}
                            />
                        </SectionPaper>

                        {/* 4. Price and place */}
                        <SectionPaper>
                            <SectionHeader
                                icon={<SellOutlinedIcon />}
                                title={t("vehiclesApp.parts.form.priceTitle", "Price and Location")}
                                subtitle={t("vehiclesApp.parts.form.priceSubtitle", "Price per unit, delivery and where the part is.")}
                                number={4}
                            />
                            <Grid container spacing={2.5}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Field {...sectionProps} name="price" type="number" required label={t("vehiclesApp.parts.form.price", "Price per unit")} unit={t("vehiclesApp.price.currency", "MAD")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Stack>
                                        <Switcher {...sectionProps} name="negotiable" label={t("vehiclesApp.form.sale.negotiable", "Negotiable")} />
                                        <Switcher {...sectionProps} name="delivery" label={t("vehiclesApp.parts.form.delivery", "Delivery possible")} />
                                        <Switcher {...sectionProps} name="installation" label={t("vehiclesApp.parts.form.installation", "Fitting offered")} />
                                    </Stack>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Autocomplete
                                        options={moroccanCities}
                                        value={cityOption}
                                        onChange={(_, option) => set("city", option?.en || "")}
                                        getOptionLabel={(option) => (isArabic ? option.ar || option.en : option.en)}
                                        isOptionEqualToValue={(option, value) => option.en === value.en}
                                        renderInput={(props) => (
                                            <TextField {...props} required label={t("vehiclesApp.filters.city", "City")} error={Boolean(errors.city)} helperText={errors.city || ""} />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Field {...sectionProps} name="neighborhood" label={t("vehiclesApp.form.location.neighborhood", "Neighborhood")} />
                                </Grid>
                                <Grid size={12}>
                                    <Field
                                        {...sectionProps}
                                        name="mapLink"
                                        label={t("vehiclesApp.parts.form.mapLink", "Google Maps link (optional)")}
                                        helper={t("vehiclesApp.parts.form.mapLinkHelp", "Where buyers can come and see the part.")}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Switcher {...sectionProps} name="showEmail" label={t("vehiclesApp.parts.form.showEmail", "Show my email on the listing")} />
                                </Grid>
                            </Grid>
                        </SectionPaper>

                        {/* 5. Description */}
                        <SectionPaper>
                            <SectionHeader
                                icon={<DescriptionOutlinedIcon />}
                                title={t("vehiclesApp.parts.form.descriptionTitle", "Description")}
                                subtitle={t("vehiclesApp.parts.form.descriptionSubtitle", "Condition, wear, what is included, why you sell it.")}
                                number={5}
                            />
                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                maxRows={10}
                                label={t("vehiclesApp.form.description.label", "Description (optional)")}
                                value={values.description}
                                onChange={(event) => set("description", event.target.value)}
                                slotProps={{ htmlInput: { maxLength: PART_DESCRIPTION_MAX } }}
                                helperText={`${descriptionLength}/${PART_DESCRIPTION_MAX}`}
                            />
                        </SectionPaper>

                        {/* 6. Photos */}
                        <SectionPaper>
                            <SectionHeader
                                icon={<ImageOutlinedIcon />}
                                title={t("vehiclesApp.parts.form.imagesTitle", "Part Photos")}
                                subtitle={t("vehiclesApp.parts.form.imagesSubtitle", "The first photo is the cover. Show the reference label if there is one.")}
                                number={6}
                            />
                            <UploadDropzone
                                icon={<CloudUploadOutlinedIcon />}
                                title={t("vehiclesApp.parts.form.uploadTitle", "Click to upload photos of the part")}
                                hint={t("vehiclesApp.parts.form.uploadHint", "Up to {{max}} photos.", { max: MAX_PART_IMAGES })}
                                buttonLabel={t("vehiclesApp.form.images.browse", "Browse Files")}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 1.5 }}>
                                    {t("vehiclesApp.form.images.requirements", "JPG, JPEG, PNG or WEBP · Maximum 5 MB per image")}
                                </Typography>
                            </UploadDropzone>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={addFiles} />
                            {errors.images && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {errors.images}
                                </Alert>
                            )}
                            <ImagePreviewGrid
                                title={t("vehiclesApp.form.images.selected", "Selected Images")}
                                countLabel={t("vehiclesApp.form.images.count", "{{count}} / {{max}}", { count: images.length, max: MAX_PART_IMAGES })}
                                items={images.map((image) => ({ key: image.key, src: image.src, alt: image.name || "" }))}
                                onRemove={removeImage}
                                mainLabel={t("vehiclesApp.form.images.cover", "Main")}
                                removeLabel={t("vehiclesApp.form.images.remove", "Remove")}
                            />
                        </SectionPaper>

                        <FormSubmitBar
                            loading={submitting}
                            title={isEdit ? t("vehiclesApp.form.saveTitle", "Save your changes") : t("vehiclesApp.form.publishTitle", "Ready to publish?")}
                            subtitle={isEdit ? t("vehiclesApp.form.saveSubtitle", "Visitors see the new details right away.") : t("vehiclesApp.form.publishSubtitle", "Review your details before submitting your listing.")}
                            submitLabel={isEdit ? t("vehiclesApp.form.save", "Save changes") : t("vehiclesApp.parts.form.publish", "Publish Spare Part")}
                            loadingLabel={t("vehiclesApp.form.saving", "Saving...")}
                            submitIcon={<CheckCircleRoundedIcon />}
                        />
                    </Box>
                )}
            </FormPage>

            <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert severity={toast?.severity || "info"} variant="filled" onClose={() => setToast(null)} sx={{ width: "100%" }}>
                    {toast?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
