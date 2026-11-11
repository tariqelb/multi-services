
import React from "react";
import { useTranslation } from "react-i18next";

import {
    Autocomplete,
    Box,
    Typography,
    TextField,
    Grid,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton,
    Stack,
    FormControlLabel,
    Checkbox,
} from "@mui/material";

import cities from "../data/moroccanCities";

const moroccanCities = cities;

// Keep English names as the values saved in the database.
const propertyTypeKeys = {
    apartment: "apartment",
    house: "house",
    villa: "villa",
    studio: "studio",
    room: "room",
    store: "store",
    office: "office",
    land: "land",
    warehouse: "warehouse",
    commercialspace: "commercialSpace",
    commercialstore: "commercialStore",
    garage: "garage",
    other: "other",
};

const getPropertyTypeLabel = (type, t) => {
    const normalized = String(type)
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    const key = propertyTypeKeys[normalized];

    return key ? t(`properties.categories.${key}`) : type;
};

export default function PropertyInsertFormDetails({
    formData,
    handleChange,
    handleListingTypeChange,
    propertyTypes,
    fieldSx,
    SectionPaper,
    SectionHeader,
    errors = {},
}) {
    const { t } = useTranslation();

    const renderField = (name, label, options = {}) => (
        <TextField
            fullWidth
            size="medium"
            sx={fieldSx}
            name={name}
            label={label}
            value={formData[name] ?? ""}
            onChange={handleChange}
            error={Boolean(errors[name])}
            helperText={errors[name] || ""}
            {...options}
        />
    );

    const isForRent = formData.listingType === "For Rent";

    const selectedCity =
        moroccanCities.find(
            (city) =>
                city.en.toLowerCase() ===
                String(formData.city ?? "").trim().toLowerCase()
        ) || null;

    const handleCityChange = (_event, newCity) => {
        handleChange({
            target: {
                name: "city",
                value: newCity?.en ?? "",
            },
        });
    };

    return (
        <SectionPaper>
            <SectionHeader
                icon="🏠"
                title={t("properties.insert.details.title")}
                subtitle={t("properties.insert.details.subtitle")}
                number={2}
            />

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                    {renderField(
                        "title",
                        t("properties.insert.details.listingTitle"),
                        {
                            placeholder: t(
                                "properties.insert.details.listingTitlePlaceholder"
                            ),
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 1.2,
                            fontWeight: 650,
                            color: "#344054",
                        }}
                    >
                        {t("properties.insert.details.transactionType")}
                    </Typography>

                    <ToggleButtonGroup
                        value={formData.listingType}
                        exclusive
                        onChange={handleListingTypeChange}
                        aria-label={t(
                            "properties.insert.details.transactionType"
                        )}
                        sx={{
                            display: "flex",
                            width: "100%",
                            gap: 1.5,
                            border: 0,
                            "& .MuiToggleButton-root": {
                                flex: 1,
                                minWidth: 0,
                                py: 1.4,
                                px: 2,
                                border: "1px solid #D5DCE8",
                                borderRadius: "10px !important",
                                textTransform: "none",
                                fontWeight: 650,
                                color: "#667085",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    bgcolor: "#EFF6FF",
                                    borderColor: "#BFDBFE",
                                },
                                "&.Mui-selected": {
                                    bgcolor: "#EFF6FF",
                                    color: "#2563EB",
                                    borderColor: "#93C5FD",
                                },
                                "&.Mui-selected:hover": {
                                    bgcolor: "#EFF6FF",
                                },
                            },
                        }}
                    >
                        <ToggleButton value="For Sale">
                            {t("properties.card.forSale")}
                        </ToggleButton>

                        <ToggleButton value="For Rent">
                            {t("properties.card.forRent")}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField(
                        "propertyType",
                        t("properties.insert.details.propertyType"),
                        {
                            select: true,
                            children: propertyTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {getPropertyTypeLabel(type, t)}
                                </MenuItem>
                            )),
                        }
                    )}
                </Grid>
            </Grid>

            {/* Property location */}
            <Box sx={{ mt: 4, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ color: "#2563EB", fontWeight: 700 }}>
                        📍
                    </Typography>

                    <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: "#0F172A" }}
                    >
                        {t("properties.insert.details.location.title")}
                    </Typography>
                </Stack>

                <Typography
                    variant="body2"
                    sx={{ color: "#5B6577", mt: 0.5 }}
                >
                    {t("properties.insert.details.location.subtitle")}
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                        fullWidth
                        options={moroccanCities}
                        value={selectedCity}
                        onChange={handleCityChange}
                        isOptionEqualToValue={(option, value) =>
                            option.en === value.en
                        }
                        getOptionLabel={(option) => option.en}
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                {...props}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 2,
                                }}
                            >
                                <Typography variant="body2">
                                    {option.en}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    dir="rtl"
                                    sx={{ color: "text.secondary" }}
                                >
                                    {option.ar}
                                </Typography>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t(
                                    "properties.insert.details.location.city"
                                )}
                                placeholder={t(
                                    "properties.insert.details.location.cityPlaceholder"
                                )}
                                size="medium"
                                sx={fieldSx}
                                error={Boolean(errors.city)}
                                helperText={errors.city || ""}
                            />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField(
                        "neighborhood",
                        t("properties.insert.details.location.neighborhood"),
                        {
                            placeholder: t(
                                "properties.insert.details.location.neighborhoodPlaceholder"
                            ),
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField(
                        "fullAddress",
                        t("properties.insert.details.location.fullAddress"),
                        {
                            placeholder: t(
                                "properties.insert.details.location.fullAddressPlaceholder"
                            ),
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderField(
                        "mapLink",
                        t("properties.insert.details.location.mapLink"),
                        {
                            placeholder: "https://maps.google.com/...",
                            type: "url",
                        }
                    )}
                </Grid>

                {/* Optional YouTube video link */}
                <Grid size={{ xs: 12 }}>
                    {renderField(
                        "youtubeVideoUrl",
                        t("properties.insert.details.youtubeVideo.label"),
                        {
                            placeholder: t(
                                "properties.insert.details.youtubeVideo.placeholder"
                            ),
                            type: "url",
                            helperText:
                                errors.youtubeVideoUrl ||
                                t(
                                    "properties.insert.details.youtubeVideo.helper"
                                ),
                            error: Boolean(errors.youtubeVideoUrl),
                        }
                    )}
                </Grid>
            </Grid>

            {/* Price and specifications */}
            <Box sx={{ mt: 4, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ color: "#2563EB", fontWeight: 700 }}>
                        💳
                    </Typography>

                    <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: "#0F172A" }}
                    >
                        {t("properties.insert.details.specifications.title")}
                    </Typography>
                </Stack>

                <Typography
                    variant="body2"
                    sx={{ color: "#5B6577", mt: 0.5 }}
                >
                    {t("properties.insert.details.specifications.subtitle")}
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField(
                        "price",
                        t("properties.insert.details.specifications.price"),
                        {
                            type: "number",
                            slotProps: {
                                htmlInput: { min: 0 },
                            },
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField(
                        "surface",
                        t("properties.insert.details.specifications.surface"),
                        {
                            type: "number",
                            slotProps: {
                                htmlInput: { min: 1 },
                            },
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField(
                        "rooms",
                        t("properties.insert.details.specifications.rooms"),
                        {
                            type: "number",
                            slotProps: {
                                htmlInput: { min: 0 },
                            },
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {renderField(
                        "salons",
                        t("properties.insert.details.specifications.salons"),
                        {
                            type: "number",
                            slotProps: {
                                htmlInput: { min: 0 },
                            },
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {renderField(
                        "bathrooms",
                        t("properties.insert.details.specifications.bathrooms"),
                        {
                            type: "number",
                            slotProps: {
                                htmlInput: { min: 0 },
                            },
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {renderField(
                        "floor",
                        t("properties.insert.details.specifications.floor"),
                        {
                            type: "number",
                            slotProps: {
                                htmlInput: { min: 0 },
                            },
                        }
                    )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {renderField(
                        "syndicateFees",
                        t("properties.insert.details.specifications.syndicateFees"),
                        {
                            type: "number",
                            slotProps: {
                                htmlInput: { min: 0 },
                            },
                        }
                    )}
                </Grid>
            </Grid>

            {/* Rental terms */}
            {isForRent && (
                <>
                    <Box sx={{ mt: 4, mb: 2 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                        >
                            <Typography
                                sx={{ color: "#2563EB", fontWeight: 700 }}
                            >
                                📝
                            </Typography>

                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, color: "#0F172A" }}
                            >
                                {t("properties.insert.details.rental.title")}
                            </Typography>
                        </Stack>

                        <Typography
                            variant="body2"
                            sx={{ color: "#5B6577", mt: 0.5 }}
                        >
                            {t("properties.insert.details.rental.subtitle")}
                        </Typography>
                    </Box>

                    <Grid container spacing={2.5}>
                        {/* Rental period */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderField(
                                "rentalPeriod",
                                t("properties.insert.details.rental.period"),
                                {
                                    select: true,
                                    required: true,
                                    children: [
                                        <MenuItem key="Daily" value="Daily">
                                            {t(
                                                "properties.insert.details.rental.daily"
                                            )}
                                        </MenuItem>,
                                        <MenuItem key="Monthly" value="Monthly">
                                            {t(
                                                "properties.insert.details.rental.monthly"
                                            )}
                                        </MenuItem>,
                                    ],
                                }
                            )}
                        </Grid>

                        {/* Furnishing status */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderField(
                                "furnishingStatus",
                                t(
                                    "properties.insert.details.rental.furnishing"
                                ),
                                {
                                    select: true,
                                    required: true,
                                    children: [
                                        <MenuItem
                                            key="Furnished"
                                            value="Furnished"
                                        >
                                            {t(
                                                "properties.insert.details.rental.furnished"
                                            )}
                                        </MenuItem>,
                                        <MenuItem
                                            key="Unfurnished"
                                            value="Unfurnished"
                                        >
                                            {t(
                                                "properties.insert.details.rental.unfurnished"
                                            )}
                                        </MenuItem>,
                                    ],
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Box
                                sx={{
                                    minHeight: 56,
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid #D5DCE8",
                                    borderRadius: 2,
                                    px: 1.5,
                                }}
                            >
                                <FormControlLabel
                                    sx={{ m: 0 }}
                                    control={
                                        <Checkbox
                                            name="rentWithContract"
                                            checked={
                                                formData.rentWithContract === true ||
                                                formData.rentWithContract === "true"
                                            }
                                            onChange={handleChange}
                                        />
                                    }
                                    label={t(
                                        "properties.insert.details.rental.contract"
                                    )}
                                />
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Box
                                sx={{
                                    minHeight: 56,
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid #D5DCE8",
                                    borderRadius: 2,
                                    px: 1.5,
                                }}
                            >
                                <FormControlLabel
                                    sx={{ m: 0 }}
                                    control={
                                        <Checkbox
                                            name="mortgageAgreement"
                                            checked={
                                                formData.mortgageAgreement === true ||
                                                formData.mortgageAgreement === "true"
                                            }
                                            onChange={handleChange}
                                        />
                                    }
                                    label={t(
                                        "properties.insert.details.rental.mortgage"
                                    )}
                                />
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderField(
                                "deposit",
                                t("properties.insert.details.rental.deposit"),
                                {
                                    type: "number",
                                    slotProps: {
                                        htmlInput: { min: 0 },
                                    },
                                }
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderField(
                                "mediatorFee",
                                t("properties.insert.details.rental.mediatorFee"),
                                {
                                    type: "number",
                                    slotProps: {
                                        htmlInput: { min: 0 },
                                    },
                                }
                            )}
                        </Grid>
                    </Grid>
                </>
            )}
        </SectionPaper>
    );
}
