// src/Apps/vehicles/VehicleForm/VehicleFormSections.jsx
//
// Sections of the vehicle form, built like the property form
// (SectionPaper + SectionHeader, toggle buttons, Grid, sub-titles).
// Each section gets { values, set, errors }.

import { useTranslation } from "react-i18next";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Stack,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import {
    ChoiceChips,
    ImagePreviewGrid,
    SectionHeader,
    SectionPaper,
    UploadDropzone,
} from "../../../Components/ui/FormKit";
import moroccanCities from "../../../data/moroccanCities";

import {
    BODY_TYPES,
    BUSINESS_TYPES,
    COLORS,
    CUSTOM_LABEL_MAX,
    CUSTOM_VALUE_MAX,
    DESCRIPTION_MAX,
    FUELS,
    MOTO_FUELS,
    MOTO_TYPES,
    NON_MOTORIZED_FUELS,
    MAX_CUSTOM_FIELDS,
    MAX_IMAGES,
    MILEAGE_POLICIES,
    ORIGINS,
    OTHER_MAKE,
    RENT_INSURANCES,
    TRANSMISSIONS,
    equipmentFor,
    isMotorized,
    makesFor,
    modelsForMake,
    newCustomRow,
} from "../vehicleOptions";
import { optionList } from "../vehicleFormat";

// -----------------------------------------------------------------------------
// Shared pieces (same look as the property form)
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
        "&.Mui-selected": {
            color: "#2563EB",
            bgcolor: "#EFF6FF",
            borderColor: "#93C5FD",
        },
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

function Toggles({ value, options, onChange, label, sx }) {
    return (
        <ToggleButtonGroup
            value={value}
            exclusive
            fullWidth
            aria-label={label}
            onChange={(_, next) => next !== null && onChange(next)}
            sx={{ ...toggleGroupSx, ...sx }}
        >
            {options.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

/** Sub-title inside a section, like "📍 Property Location". */
function SubSection({ emoji, title, subtitle, first }) {
    return (
        <Box sx={{ mt: first ? 0 : 4, mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ color: "#2563EB", fontWeight: 700 }} aria-hidden>
                    {emoji}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0F172A" }}>
                    {title}
                </Typography>
            </Stack>
            {subtitle && (
                <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
}

function Field({ name, label, values, set, errors, type = "text", unit, helper, ...rest }) {
    return (
        <TextField
            fullWidth
            size="medium"
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
                inputLabel: type === "date" ? { shrink: true } : undefined,
            }}
            {...rest}
        />
    );
}

function SelectField({ name, label, options, values, set, errors, required, emptyLabel }) {
    return (
        <TextField
            select
            fullWidth
            size="medium"
            name={name}
            label={label}
            required={required}
            value={values[name] ?? ""}
            onChange={(event) => set(name, event.target.value)}
            error={Boolean(errors[name])}
            helperText={errors[name] || ""}
        >
            {!required && <MenuItem value="">{emptyLabel || "—"}</MenuItem>}
            {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    );
}

function Toggle({ name, label, values, set }) {
    return (
        <FormControlLabel
            control={<Switch checked={Boolean(values[name])} onChange={(event) => set(name, event.target.checked)} color="primary" />}
            label={
                <Typography variant="body2" sx={{ color: "#475569" }}>
                    {label}
                </Typography>
            }
        />
    );
}

// -----------------------------------------------------------------------------
// 1. Publisher information
// -----------------------------------------------------------------------------

export function PublisherSection({ values, set, errors, profile, dealerLoaded }) {
    const { t } = useTranslation();
    const props = { values, set, errors };
    const isBusiness = BUSINESS_TYPES.includes(values.publisherType);
    const contactNumber = profile?.whatsappNumber || profile?.notificationPreferences?.whatsapp?.phoneNumber || profile?.phoneNumber || "";

    return (
        <SectionPaper>
            <SectionHeader
                icon={<PersonOutlineRoundedIcon />}
                title={t("vehiclesApp.form.publisher.title", "Publisher Information")}
                subtitle={t("vehiclesApp.form.publisher.subtitle", "Who is publishing this vehicle?")}
                number={1}
            />

            <FieldLabel required>{t("vehiclesApp.form.publisher.type", "You are")}</FieldLabel>
            <Toggles
                value={values.publisherType}
                onChange={(value) => set("publisherType", value)}
                label={t("vehiclesApp.form.publisher.type", "You are")}
                options={optionList(t, "publisherType", ["owner", "agency", "showroom"])}
                sx={{ mb: 3 }}
            />

            {isBusiness && (
                <>
                    {dealerLoaded && (
                        <Alert severity="info" sx={{ mb: 2.5 }}>
                            {t("vehiclesApp.form.publisher.profileLoaded", "Filled in from your business profile. Changes here update it for your next vehicles.")}
                        </Alert>
                    )}
                    <Grid container spacing={2} sx={{ mb: 2.5 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Field name="businessName" label={t("vehiclesApp.form.publisher.businessName", "Business name")} required {...props} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Field name="businessAddress" label={t("vehiclesApp.form.publisher.businessAddress", "Business address")} {...props} />
                        </Grid>
                        <Grid size={12}>
                            <Field
                                name="mapLink"
                                label={t("vehiclesApp.form.publisher.mapLink", "Google Maps link of the business")}
                                required
                                placeholder="https://maps.app.goo.gl/..."
                                helper={t("vehiclesApp.form.publisher.mapLinkHelp", "In Google Maps: Share → Copy link. We read the location from it.")}
                                {...props}
                            />
                        </Grid>
                    </Grid>
                </>
            )}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        label={t("vehiclesApp.form.publisher.firstName", "First Name")}
                        value={profile?.firstName || ""}
                        slotProps={{ input: { readOnly: true } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        label={t("vehiclesApp.form.publisher.lastName", "Last Name")}
                        value={profile?.lastName || ""}
                        slotProps={{ input: { readOnly: true } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        type="email"
                        label={t("vehiclesApp.form.publisher.email", "Email Address")}
                        value={profile?.email || ""}
                        slotProps={{ input: { readOnly: true } }}
                    />
                    <Box sx={{ mt: 1 }}>
                        <Toggle name="showEmail" label={t("vehiclesApp.form.publisher.showEmail", "Display my email publicly")} {...props} />
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        label={t("vehiclesApp.form.publisher.contactNumber", "Phone / WhatsApp")}
                        value={contactNumber}
                        placeholder={t("vehiclesApp.form.publisher.noNumber", "No number on your account")}
                        slotProps={{ input: { readOnly: true }, htmlInput: { dir: "ltr" } }}
                    />
                    <Typography variant="caption" sx={{ display: "block", mt: 0.8, color: contactNumber ? "#16a34a" : "#dc2626" }}>
                        {contactNumber
                            ? t("vehiclesApp.form.publisher.numberUsed", "Your current number from your account is shown on the listing.")
                            : t("vehiclesApp.form.publisher.numberMissing", "Add a phone or WhatsApp number in your profile so people can call you.")}
                    </Typography>
                </Grid>
            </Grid>
        </SectionPaper>
    );
}

// -----------------------------------------------------------------------------
// 2. Vehicle details: offer, vehicle, location, price
// -----------------------------------------------------------------------------

function MakeFields({ values, set, errors, modelRequired }) {
    const { t } = useTranslation();
    const makes = makesFor(values.category);
    const choice = values.makeOther ? OTHER_MAKE : makes.includes(values.make) ? values.make : "";

    const chooseMake = (value) => {
        if (value === OTHER_MAKE) {
            set("makeOther", true);
            set("make", "");
        } else {
            set("makeOther", false);
            set("make", value);
        }
        set("model", "");
    };

    return (
        <>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                    select
                    fullWidth
                    required
                    label={t("vehiclesApp.form.vehicle.make", "Make")}
                    value={choice}
                    onChange={(event) => chooseMake(event.target.value)}
                    error={Boolean(errors.make) && !values.makeOther}
                    helperText={!values.makeOther ? errors.make || "" : ""}
                    slotProps={{ select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 360 } } } } } }}
                >
                    {makes.map((make) => (
                        <MenuItem key={make} value={make}>
                            {make}
                        </MenuItem>
                    ))}
                    <MenuItem value={OTHER_MAKE} sx={{ fontWeight: 600, borderTop: "1px solid", borderColor: "divider" }}>
                        {t("vehiclesApp.form.vehicle.otherMake", "Other")}
                    </MenuItem>
                </TextField>
            </Grid>

            {values.makeOther && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Field
                        name="make"
                        label={t("vehiclesApp.form.vehicle.makeName", "Type the make")}
                        required
                        autoFocus
                        slotProps={{ htmlInput: { maxLength: 40 } }}
                        values={values}
                        set={set}
                        errors={errors}
                    />
                </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Autocomplete
                    freeSolo
                    options={modelsForMake(values.make, values.category)}
                    inputValue={values.model}
                    onInputChange={(_, value) => set("model", value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            required={modelRequired}
                            label={t("vehiclesApp.form.vehicle.model", "Model")}
                            error={Boolean(errors.model)}
                            helperText={errors.model || ""}
                        />
                    )}
                />
            </Grid>
        </>
    );
}

function CarFields({ values, set, errors }) {
    const { t } = useTranslation();
    const props = { values, set, errors };

    return (
        <>
            <SubSection
                emoji="🚗"
                title={t("vehiclesApp.form.vehicle.title", "Vehicle")}
                subtitle={t("vehiclesApp.form.vehicle.subtitle", "Make, model and main characteristics.")}
            />
            <Grid container spacing={2.5}>
                <MakeFields modelRequired {...props} />
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Field name="version" label={t("vehiclesApp.form.vehicle.version", "Version / Trim")} placeholder="1.5 dCi Stepway" {...props} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Field name="year" type="number" label={t("vehiclesApp.form.vehicle.year", "Year")} required {...props} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Field
                        name="mileage"
                        type="number"
                        label={t("vehiclesApp.form.vehicle.mileage", "Mileage")}
                        unit="km"
                        required={values.condition === "used"}
                        {...props}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <SelectField name="fuel" label={t("vehiclesApp.form.vehicle.fuel", "Fuel")} options={optionList(t, "fuel", FUELS)} required {...props} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <SelectField
                        name="transmission"
                        label={t("vehiclesApp.form.vehicle.transmission", "Gearbox")}
                        options={optionList(t, "transmission", TRANSMISSIONS)}
                        required
                        {...props}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <SelectField name="bodyType" label={t("vehiclesApp.form.vehicle.bodyType", "Body Type")} options={optionList(t, "bodyType", BODY_TYPES)} {...props} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                    <Field name="seats" type="number" label={t("vehiclesApp.form.vehicle.seats", "Seats")} required {...props} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                    <Field name="doors" type="number" label={t("vehiclesApp.form.vehicle.doors", "Doors")} {...props} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                    <Field name="fiscalPower" type="number" label={t("vehiclesApp.form.vehicle.fiscalPower", "Tax Horsepower")} unit="CV" {...props} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                    <Field name="engineSize" type="number" label={t("vehiclesApp.form.vehicle.engineSize", "Engine Size")} unit="L" {...props} />
                </Grid>
                {values.fuel === "electric" && (
                    <Grid size={{ xs: 6, md: 4 }}>
                        <Field name="rangeKm" type="number" label={t("vehiclesApp.form.vehicle.rangeKm", "Range")} unit="km" {...props} />
                    </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <SelectField name="exteriorColor" label={t("vehiclesApp.form.vehicle.exteriorColor", "Colour")} options={optionList(t, "color", COLORS)} {...props} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                        name="interiorColor"
                        label={t("vehiclesApp.form.vehicle.interiorColor", "Interior")}
                        placeholder={t("vehiclesApp.form.vehicle.interiorPlaceholder", "Black leather")}
                        {...props}
                    />
                </Grid>
            </Grid>
        </>
    );
}

/** Motorcycle, scooter, bicycle, kick scooter or tricycle. */
function MotoFields({ values, set, errors }) {
    const { t } = useTranslation();
    const props = { values, set, errors };
    const motorized = isMotorized("moto", values.motoType);
    const fuels = motorized ? MOTO_FUELS : NON_MOTORIZED_FUELS;

    const chooseType = (motoType) => {
        set("motoType", motoType);
        const nextMotorized = isMotorized("moto", motoType);
        const allowed = nextMotorized ? MOTO_FUELS : NON_MOTORIZED_FUELS;
        if (!allowed.includes(values.fuel)) set("fuel", nextMotorized ? "petrol" : "none");
    };

    return (
        <>
            <SubSection
                emoji="🏍️"
                title={t("vehiclesApp.form.moto.title", "Moto")}
                subtitle={t("vehiclesApp.form.moto.subtitle", "Type, make, model and main characteristics.")}
            />
            <FieldLabel required>{t("vehiclesApp.form.moto.type", "Type")}</FieldLabel>
            <Toggles
                value={values.motoType || null}
                onChange={chooseType}
                options={optionList(t, "motoType", MOTO_TYPES)}
                label={t("vehiclesApp.form.moto.type", "Type")}
                sx={{ flexWrap: "wrap", mb: errors.motoType ? 0.5 : 3, "& .MuiToggleButton-root": { ...toggleGroupSx["& .MuiToggleButton-root"], flex: "1 1 120px" } }}
            />
            {errors.motoType && (
                <Typography variant="caption" sx={{ display: "block", color: "error.main", mb: 3 }}>
                    {errors.motoType}
                </Typography>
            )}

            <Grid container spacing={2.5}>
                <MakeFields modelRequired={motorized} {...props} />
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Field name="year" type="number" label={t("vehiclesApp.form.vehicle.year", "Year")} required={motorized} {...props} />
                </Grid>
                {motorized && (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Field
                            name="mileage"
                            type="number"
                            label={t("vehiclesApp.form.vehicle.mileage", "Mileage")}
                            unit="km"
                            required={values.condition === "used"}
                            {...props}
                        />
                    </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <SelectField
                        name="fuel"
                        label={t("vehiclesApp.form.moto.power", "Power")}
                        options={optionList(t, "fuel", fuels)}
                        required
                        {...props}
                    />
                </Grid>
                {motorized && values.fuel === "petrol" && (
                    <Grid size={{ xs: 6, md: 4 }}>
                        <Field name="engineCc" type="number" label={t("vehiclesApp.form.moto.engineCc", "Engine")} unit="cc" {...props} />
                    </Grid>
                )}
                {values.fuel === "electric" && (
                    <Grid size={{ xs: 6, md: 4 }}>
                        <Field name="rangeKm" type="number" label={t("vehiclesApp.form.vehicle.rangeKm", "Range")} unit="km" {...props} />
                    </Grid>
                )}
                {motorized && (
                    <>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <SelectField
                                name="transmission"
                                label={t("vehiclesApp.form.vehicle.transmission", "Gearbox")}
                                options={optionList(t, "transmission", TRANSMISSIONS)}
                                {...props}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, md: 4 }}>
                            <Field name="seats" type="number" label={t("vehiclesApp.form.moto.seats", "Places")} {...props} />
                        </Grid>
                        <Grid size={{ xs: 6, md: 4 }}>
                            <Field name="fiscalPower" type="number" label={t("vehiclesApp.form.vehicle.fiscalPower", "Tax Horsepower")} unit="CV" {...props} />
                        </Grid>
                    </>
                )}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <SelectField name="exteriorColor" label={t("vehiclesApp.form.vehicle.exteriorColor", "Colour")} options={optionList(t, "color", COLORS)} {...props} />
                </Grid>
            </Grid>
        </>
    );
}

export function VehicleDetailsSection({ values, set, errors, language }) {
    const { t } = useTranslation();
    const props = { values, set, errors };
    const isMoto = values.category === "moto";
    const isRent = values.listingType === "rent";
    const isBusiness = BUSINESS_TYPES.includes(values.publisherType);
    const mad = t("vehiclesApp.price.currency", "MAD");
    const autoTitle = [values.make, values.model, values.version, values.year].filter(Boolean).join(" ");
    const isArabic = String(language).startsWith("ar");
    const cityOption = moroccanCities.find((city) => city.en === values.city) || (values.city ? { en: values.city, ar: values.city } : null);

    return (
        <SectionPaper>
            <SectionHeader
                icon={isMoto ? <TwoWheelerOutlinedIcon /> : <DirectionsCarOutlinedIcon />}
                title={t("vehiclesApp.form.details.title", "Vehicle Details")}
                subtitle={t("vehiclesApp.form.details.subtitle", "The offer, the vehicle, where it is and its price.")}
                number={2}
            />

            <Grid container spacing={2.5}>
                <Grid size={12}>
                    <Field
                        name="title"
                        label={t("vehiclesApp.form.details.titleField", "Listing Title")}
                        placeholder={autoTitle}
                        helper={t("vehiclesApp.form.details.titleHelp", "Leave empty to use: {{title}}", { title: autoTitle || "…" })}
                        slotProps={{ htmlInput: { maxLength: 120 } }}
                        {...props}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <FieldLabel required>{t("vehiclesApp.form.details.listingType", "Transaction Type")}</FieldLabel>
                    <Toggles
                        value={values.listingType}
                        onChange={(value) => set("listingType", value)}
                        options={optionList(t, "listingType", ["sale", "rent"])}
                        label={t("vehiclesApp.form.details.listingType", "Transaction Type")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FieldLabel>{t("vehiclesApp.form.details.condition", "Condition")}</FieldLabel>
                    <Toggles
                        value={values.condition}
                        onChange={(value) => set("condition", value)}
                        options={optionList(t, "condition", ["used", "new"])}
                        label={t("vehiclesApp.form.details.condition", "Condition")}
                    />
                </Grid>
            </Grid>

            {/* Vehicle */}
            {isMoto ? <MotoFields {...props} /> : <CarFields {...props} />}

            {/* Location */}
            <SubSection
                emoji="📍"
                title={t("vehiclesApp.form.location.title", "Vehicle Location")}
                subtitle={t("vehiclesApp.form.location.subtitle", "Help people find the vehicle more easily.")}
            />
            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                        options={moroccanCities}
                        value={cityOption}
                        onChange={(_, option) => set("city", option?.en || "")}
                        getOptionLabel={(option) => (isArabic ? option.ar || option.en : option.en)}
                        isOptionEqualToValue={(option, value) => option.en === value.en}
                        renderInput={(params) => (
                            <TextField {...params} required label={t("vehiclesApp.form.location.city", "City")} error={Boolean(errors.city)} helperText={errors.city || ""} />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Field name="neighborhood" label={t("vehiclesApp.form.location.neighborhood", "Neighborhood / Area")} {...props} />
                </Grid>
                {!isBusiness && (
                    <Grid size={12}>
                        <Field
                            name="mapLink"
                            label={t("vehiclesApp.form.location.mapLink", "Google Maps Location Link")}
                            placeholder="https://maps.app.goo.gl/..."
                            {...props}
                        />
                    </Grid>
                )}
                <Grid size={12}>
                    <Field
                        name="youtubeVideoUrl"
                        type="url"
                        label={t("vehiclesApp.form.location.youtube", "YouTube video link (optional)")}
                        placeholder="https://youtu.be/..."
                        helper={t("vehiclesApp.form.location.youtubeHelp", "Add a YouTube video to showcase the vehicle. Only YouTube links are accepted.")}
                        {...props}
                    />
                </Grid>
            </Grid>

            {/* Price */}
            <SubSection
                emoji="💳"
                title={isRent ? t("vehiclesApp.form.rent.title", "Rental Price and Conditions") : t("vehiclesApp.form.sale.title", "Price and Conditions")}
                subtitle={
                    isRent
                        ? t("vehiclesApp.form.rent.subtitle", "Prices, insurance and what the renter needs.")
                        : t("vehiclesApp.form.sale.subtitle", "Selling price and conditions.")
                }
            />

            {isRent ? (
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Field name="pricePerDay" type="number" label={t("vehiclesApp.form.rent.pricePerDay", "Price per Day")} unit={mad} required {...props} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Field name="pricePerWeek" type="number" label={t("vehiclesApp.form.rent.pricePerWeek", "Price per Week")} unit={mad} {...props} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Field name="pricePerMonth" type="number" label={t("vehiclesApp.form.rent.pricePerMonth", "Price per Month")} unit={mad} {...props} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Field name="deposit" type="number" label={t("vehiclesApp.form.rent.deposit", "Deposit")} unit={mad} {...props} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <SelectField
                            name="insurance"
                            label={t("vehiclesApp.form.rent.insurance", "Insurance Included")}
                            options={optionList(t, "insurance", RENT_INSURANCES)}
                            required
                            {...props}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Field name="insuranceExcess" type="number" label={t("vehiclesApp.form.rent.insuranceExcess", "Insurance Excess")} unit={mad} {...props} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Field name="minDays" type="number" label={t("vehiclesApp.form.rent.minDays", "Minimum Days")} {...props} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <SelectField
                            name="mileagePolicy"
                            label={t("vehiclesApp.form.rent.mileagePolicy", "Mileage")}
                            options={optionList(t, "mileagePolicy", MILEAGE_POLICIES)}
                            required
                            {...props}
                        />
                    </Grid>
                    {values.mileagePolicy === "limited" && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Field name="kmPerDay" type="number" label={t("vehiclesApp.form.rent.kmPerDay", "Km per Day")} unit="km" required {...props} />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Field name="minDriverAge" type="number" label={t("vehiclesApp.form.rent.minDriverAge", "Driver Minimum Age")} {...props} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Field name="minLicenseYears" type="number" label={t("vehiclesApp.form.rent.minLicenseYears", "Years with a Licence")} {...props} />
                    </Grid>

                    <Grid size={12}>
                        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", columnGap: 3 }}>
                            <Toggle name="withDriver" label={t("vehiclesApp.form.rent.withDriver", "With driver available")} {...props} />
                            <Toggle name="delivery" label={t("vehiclesApp.form.rent.delivery", "Delivery (airport, hotel)")} {...props} />
                        </Stack>
                    </Grid>
                </Grid>
            ) : (
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field name="price" type="number" label={t("vehiclesApp.form.sale.price", "Price")} unit={mad} required {...props} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field name="insuranceValidUntil" type="date" label={t("vehiclesApp.form.sale.insuranceValidUntil", "Insurance Valid Until")} {...props} />
                    </Grid>
                    <Grid size={12}>
                        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", columnGap: 3 }}>
                            <Toggle name="negotiable" label={t("vehiclesApp.form.sale.negotiable", "Negotiable")} {...props} />
                            <Toggle name="creditAvailable" label={t("vehiclesApp.form.sale.creditAvailable", "Bank credit possible")} {...props} />
                            <Toggle name="tradeInAccepted" label={t("vehiclesApp.form.sale.tradeInAccepted", "Trade-in accepted")} {...props} />
                        </Stack>
                    </Grid>
                </Grid>
            )}
        </SectionPaper>
    );
}

// -----------------------------------------------------------------------------
// 3. History, papers and equipment
// -----------------------------------------------------------------------------

export function HistorySection({ values, set, errors }) {
    const { t } = useTranslation();
    const props = { values, set, errors };
    const used = values.condition === "used";

    return (
        <SectionPaper>
            <SectionHeader
                icon={<FactCheckOutlinedIcon />}
                title={t("vehiclesApp.form.history.title", "History, Papers and Equipment")}
                subtitle={t("vehiclesApp.form.history.subtitle", "What buyers and renters check first.")}
                number={3}
            />

            <SubSection first emoji="📄" title={t("vehiclesApp.form.history.papers", "History and Papers")} />
            <Grid container spacing={2.5}>
                {used && (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Field name="previousOwners" type="number" label={t("vehiclesApp.form.history.previousOwners", "Previous Owners")} {...props} />
                    </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <SelectField name="origin" label={t("vehiclesApp.form.history.origin", "Origin")} options={optionList(t, "origin", ORIGINS)} {...props} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Field
                        name="technicalInspectionUntil"
                        type="date"
                        label={t("vehiclesApp.form.history.technicalInspection", "Technical Inspection Valid Until")}
                        {...props}
                    />
                </Grid>
                <Grid size={12}>
                    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", columnGap: 3 }}>
                        {used && <Toggle name="firstHand" label={t("vehiclesApp.form.history.firstHand", "First hand")} {...props} />}
                        <Toggle name="accidentFree" label={t("vehiclesApp.form.history.accidentFree", "No accident")} {...props} />
                        <Toggle name="serviceHistory" label={t("vehiclesApp.form.history.serviceHistory", "Service history")} {...props} />
                        <Toggle name="vignettePaid" label={t("vehiclesApp.form.history.vignettePaid", "Vignette paid")} {...props} />
                    </Stack>
                </Grid>
            </Grid>

            <SubSection
                emoji="⚙️"
                title={t("vehiclesApp.form.history.equipment", "Equipment")}
                subtitle={t("vehiclesApp.form.history.equipmentSubtitle", "Select everything the vehicle has.")}
            />
            <ChoiceChips
                multiple
                options={optionList(t, "equipment", equipmentFor(values.category))}
                value={values.equipment}
                onChange={(value) => set("equipment", value)}
            />
        </SectionPaper>
    );
}

// -----------------------------------------------------------------------------
// 4. Additional details: title + value written by the publisher
// -----------------------------------------------------------------------------

export function CustomFieldsSection({ values, set, errors }) {
    const { t } = useTranslation();
    const rows = values.customFields;

    const update = (id, key, value) => set("customFields", rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
    const remove = (id) => set("customFields", rows.filter((row) => row.id !== id));
    const add = () => rows.length < MAX_CUSTOM_FIELDS && set("customFields", [...rows, newCustomRow()]);

    return (
        <SectionPaper>
            <SectionHeader
                icon={<PlaylistAddRoundedIcon />}
                title={t("vehiclesApp.form.custom.title", "Additional Details")}
                subtitle={t("vehiclesApp.form.custom.subtitle", "Add anything else worth knowing, as a title and a value. For example: Tyres → New, Keys → 2.")}
                number={4}
            />

            <Stack spacing={2}>
                {rows.map((row, index) => {
                    const half = (row.label.trim() === "") !== (row.value.trim() === "");
                    return (
                        <Stack key={row.id} direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
                            <TextField
                                fullWidth
                                label={t("vehiclesApp.form.custom.label", "Title")}
                                placeholder={index === 0 ? t("vehiclesApp.form.custom.labelExample", "Tyres") : ""}
                                value={row.label}
                                onChange={(event) => update(row.id, "label", event.target.value)}
                                error={half && !row.label.trim()}
                                slotProps={{ htmlInput: { maxLength: CUSTOM_LABEL_MAX } }}
                                sx={{ flex: { sm: "0 0 38%" } }}
                            />
                            <TextField
                                fullWidth
                                label={t("vehiclesApp.form.custom.value", "Value")}
                                placeholder={index === 0 ? t("vehiclesApp.form.custom.valueExample", "New, Michelin") : ""}
                                value={row.value}
                                onChange={(event) => update(row.id, "value", event.target.value)}
                                error={half && !row.value.trim()}
                                slotProps={{ htmlInput: { maxLength: CUSTOM_VALUE_MAX } }}
                            />
                            <Tooltip title={t("vehiclesApp.form.custom.remove", "Remove")}>
                                <IconButton onClick={() => remove(row.id)} sx={{ alignSelf: { xs: "flex-end", sm: "center" } }} aria-label={t("vehiclesApp.form.custom.remove", "Remove")}>
                                    <DeleteOutlineRoundedIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    );
                })}

                {errors.customFields && <Alert severity="error">{errors.customFields}</Alert>}

                <Box>
                    <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={add} disabled={rows.length >= MAX_CUSTOM_FIELDS}>
                        {t("vehiclesApp.form.custom.add", "Add a detail")}
                    </Button>
                    <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 1 }}>
                        {t("vehiclesApp.form.custom.limit", "{{count}} / {{max}} details", { count: rows.length, max: MAX_CUSTOM_FIELDS })}
                    </Typography>
                </Box>
            </Stack>
        </SectionPaper>
    );
}

// -----------------------------------------------------------------------------
// 5. Description
// -----------------------------------------------------------------------------

export function DescriptionSection({ values, set, errors }) {
    const { t } = useTranslation();
    const length = (values.description || "").length;

    return (
        <SectionPaper>
            <SectionHeader
                icon={<DescriptionOutlinedIcon />}
                title={t("vehiclesApp.form.description.title", "Vehicle Description")}
                subtitle={t("vehiclesApp.form.description.subtitle", "Describe the vehicle and highlight its main features.")}
                number={5}
            />
            <TextField
                fullWidth
                multiline
                minRows={5}
                maxRows={10}
                label={t("vehiclesApp.form.description.label", "Description (optional)")}
                placeholder={t("vehiclesApp.form.description.placeholder", "Condition, maintenance, options, reason for selling…")}
                value={values.description}
                onChange={(event) => set("description", event.target.value)}
                error={Boolean(errors.description)}
                slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX } }}
                helperText={
                    <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <span>{errors.description || t("vehiclesApp.form.description.helper", "Provide useful details to help buyers and renters.")}</span>
                        <span>
                            {length}/{DESCRIPTION_MAX}
                        </span>
                    </Box>
                }
            />
        </SectionPaper>
    );
}

// -----------------------------------------------------------------------------
// 6. Images
// -----------------------------------------------------------------------------

export function ImagesSection({ images, errors, fileInputRef, onAddFiles, onRemoveImage }) {
    const { t } = useTranslation();

    return (
        <SectionPaper>
            <SectionHeader
                icon={<ImageOutlinedIcon />}
                title={t("vehiclesApp.form.images.title", "Vehicle Images")}
                subtitle={t("vehiclesApp.form.images.subtitle", "The first photo is the cover. Show the outside, the inside and the dashboard.")}
                number={6}
            />

            <UploadDropzone
                icon={<CloudUploadOutlinedIcon />}
                title={t("vehiclesApp.form.images.uploadTitle", "Click to upload your vehicle images")}
                hint={t("vehiclesApp.form.images.uploadDescription", "Select up to {{max}} images to showcase your vehicle.", { max: MAX_IMAGES })}
                buttonLabel={t("vehiclesApp.form.images.browse", "Browse Files")}
                onClick={() => fileInputRef.current?.click()}
            >
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 1.5 }}>
                    {t("vehiclesApp.form.images.requirements", "JPG, JPEG, PNG or WEBP · Maximum 5 MB per image")}
                </Typography>
            </UploadDropzone>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onAddFiles} />

            {errors.images && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.images}
                </Alert>
            )}

            <ImagePreviewGrid
                title={t("vehiclesApp.form.images.selected", "Selected Images")}
                countLabel={t("vehiclesApp.form.images.count", "{{count}} / {{max}}", { count: images.length, max: MAX_IMAGES })}
                items={images.map((image) => ({ key: image.key, src: image.src, alt: image.name || "" }))}
                onRemove={onRemoveImage}
                mainLabel={t("vehiclesApp.form.images.cover", "Main")}
                removeLabel={t("vehiclesApp.form.images.remove", "Remove")}
            />
        </SectionPaper>
    );
}
