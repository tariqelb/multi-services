
import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import axiosInstance from "../../../api/axiosInstance";
import getImageUrl from "../../../utils/getImageUrl";
import EstablishmentForm from "./EstablishmentForm";

const initialRoom = () => ({
    roomType: "",
    quantity: 1,
    bedConfiguration: [],
    maxGuests: 1,
    privateBathroom: false,
    airConditioning: false,
    balconyOrTerrace: false,
    description: "",
    photos: [],
    pricePerNight: "",
});

const initialForm = {
    name: "",
    accommodationType: "",
    shortDescription: "",
    fullDescription: "",
    yearEstablished: "",
    numberOfRooms: "",
    numberOfFloors: "",
    officialClassification: "",
    location: {
        city: "",
        neighborhood: "",
        fullAddress: "",
        googleMapsLink: "",
    },
    rooms: [initialRoom()],
    facilities: {
        swimmingPool: false,
        restaurant: false,
        breakfast: false,
        wifi: false,
        parking: false,
        spaHammam: false,
        airportTransfer: false,
        gardenRooftop: false,
        reception: false,
        laundry: false,
        roomService: false,
        otherServices: [],
    },
    contact: {
        phoneNumber: "",
        whatsappNumber: "",
        email: "",
        officialWebsite: "",
        bookingWebsite: "",
        socialMedia: [],
    },
    media: {
        coverPhoto: "",
        gallery: [],
        videoUrl: "",
    },
};

const validImage = (file) =>
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
    file.size <= 5 * 1024 * 1024;

const createPreview = (file) => ({
    file,
    preview: URL.createObjectURL(file),
});

// A saved photo shown in the form (edit mode).
const savedPreview = (value) => {
    const image = typeof value === "string" ? { filename: value, path: value } : value;

    return image?.path ? { existing: true, image, preview: getImageUrl(image) } : null;
};

const revoke = (item) => {
    if (item?.file && item?.preview) URL.revokeObjectURL(item.preview);
};

const asText = (value) => (value === null || value === undefined ? "" : value);

// Saved establishment -> form values + photo previews.
function establishmentToForm(establishment) {
    const form = {
        ...initialForm,
        name: asText(establishment.name),
        accommodationType: asText(establishment.accommodationType),
        shortDescription: asText(establishment.shortDescription),
        fullDescription: asText(establishment.fullDescription),
        yearEstablished: asText(establishment.yearEstablished),
        numberOfRooms: asText(establishment.numberOfRooms),
        numberOfFloors: asText(establishment.numberOfFloors),
        officialClassification: asText(establishment.officialClassification),
        location: {
            ...initialForm.location,
            city: asText(establishment.location?.city),
            neighborhood: asText(establishment.location?.neighborhood),
            fullAddress: asText(establishment.location?.fullAddress),
            googleMapsLink: asText(establishment.location?.googleMapsLink),
        },
        facilities: {
            ...initialForm.facilities,
            ...(establishment.facilities || {}),
            otherServices: [...(establishment.facilities?.otherServices || [])],
        },
        contact: {
            ...initialForm.contact,
            ...Object.fromEntries(
                Object.entries(establishment.contact || {}).map(([key, value]) => [key, value ?? ""])
            ),
            socialMedia: (establishment.contact?.socialMedia || []).map(({ platform, url }) => ({ platform, url })),
        },
        media: {
            ...initialForm.media,
            videoUrl: asText(establishment.media?.videoUrl),
        },
        rooms: (establishment.rooms?.length ? establishment.rooms : [initialRoom()]).map((room) => ({
            ...initialRoom(),
            ...room,
            bedConfiguration: [...(room.bedConfiguration || [])],
            description: asText(room.description),
            pricePerNight: asText(room.pricePerNight),
            photos: (room.photos || []).map(savedPreview).filter(Boolean),
        })),
    };

    return {
        form,
        cover: savedPreview(establishment.media?.coverPhoto),
        gallery: (establishment.media?.gallery || []).map(savedPreview).filter(Boolean),
    };
}

// establishmentId: edit an existing establishment (PUT) instead of creating one.
export default function EstablishmentInsertForm({ onAddEstablishment, establishmentId = null, onSaved, onCancel }) {
    const isEdit = Boolean(establishmentId);
    const [pageLoading, setPageLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState("");
    const originalRef = useRef(null);
    const [formData, setFormData] = useState(initialForm);
    const [coverFile, setCoverFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [otherService, setOtherService] = useState("");
    const [socialPlatform, setSocialPlatform] = useState("Facebook");
    const [socialUrl, setSocialUrl] = useState("");
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const latestFilesRef = useRef({
        coverFile,
        galleryFiles,
        rooms: formData.rooms,
    });

    useEffect(() => {
        latestFilesRef.current = {
            coverFile,
            galleryFiles,
            rooms: formData.rooms,
        };
    }, [coverFile, galleryFiles, formData.rooms]);

    useEffect(() => {
        return () => {
            const current = latestFilesRef.current;

            revoke(current.coverFile);
            current.galleryFiles.forEach(revoke);
            current.rooms.forEach((room) => room.photos.forEach(revoke));
        };
    }, []);

    // Edit mode: load the establishment.
    useEffect(() => {
        if (!establishmentId) return undefined;

        let cancelled = false;

        (async () => {
            try {
                setPageLoading(true);
                setLoadError("");

                const response = await axiosInstance.get(`/property/establishments/${establishmentId}`);
                const establishment = response.data?.establishment;

                if (!establishment?._id) throw new Error("Establishment not found");

                if (!cancelled) {
                    const loaded = establishmentToForm(establishment);
                    originalRef.current = loaded;
                    setFormData(loaded.form);
                    setCoverFile(loaded.cover);
                    setGalleryFiles(loaded.gallery);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(error.response?.data?.message || "Unable to load this establishment.");
                }
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [establishmentId]);

    const notify = (message, severity = "success") => {
        setNotification({ open: true, message, severity });
    };

    const closeNotification = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    const resetForm = () => {
        revoke(coverFile);
        galleryFiles.forEach(revoke);
        formData.rooms.forEach((room) => room.photos.forEach(revoke));

        // Edit mode: back to the saved establishment.
        const original = isEdit ? originalRef.current : null;

        setFormData(original ? original.form : initialForm);
        setCoverFile(original ? original.cover : null);
        setGalleryFiles(original ? [...original.gallery] : []);
        setErrors({});
        setOtherService("");
        setSocialUrl("");
        setSocialPlatform("Facebook");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const updateNestedField = (section, name, value) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value,
            },
        }));
    };

    const updateRoom = (index, name, value) => {
        setFormData((prev) => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === index ? { ...room, [name]: value } : room
            ),
        }));
    };

    const addRoom = () => {
        setFormData((prev) => ({
            ...prev,
            rooms: [...prev.rooms, initialRoom()],
        }));
    };

    const removeRoom = (index) => {
        if (formData.rooms.length === 1) {
            notify("At least one room type is required.", "warning");
            return;
        }

        formData.rooms[index].photos.forEach(revoke);

        setFormData((prev) => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index),
        }));
    };

    const toggleBed = (index, bed) => {
        const room = formData.rooms[index];

        const selected = room.bedConfiguration.includes(bed)
            ? room.bedConfiguration.filter((item) => item !== bed)
            : [...room.bedConfiguration, bed];

        updateRoom(index, "bedConfiguration", selected);
    };

    const handleRoomPhotos = (index, files) => {
        const selected = Array.from(files || []);
        const valid = selected.filter(validImage);

        if (valid.length !== selected.length) {
            notify(
                "Only JPG, PNG and WEBP images up to 5MB are allowed.",
                "warning"
            );
        }

        const current = formData.rooms[index].photos;
        const remaining = Math.max(0, 15 - current.length);

        if (valid.length > remaining) {
            notify("Maximum 15 photos per room type.", "warning");
        }

        const newPhotos = valid
            .slice(0, remaining)
            .map(createPreview);

        updateRoom(index, "photos", [...current, ...newPhotos]);
    };

    const removeRoomPhoto = (roomIndex, photoIndex) => {
        const photos = [...formData.rooms[roomIndex].photos];
        const removed = photos[photoIndex];

        revoke(removed);

        photos.splice(photoIndex, 1);
        updateRoom(roomIndex, "photos", photos);
    };

    const handleCoverChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!validImage(file)) {
            notify("Invalid image. Use JPG, PNG or WEBP up to 5MB.", "warning");
            event.target.value = "";
            return;
        }

        revoke(coverFile);

        setCoverFile(createPreview(file));
        event.target.value = "";
    };

    const removeCover = () => {
        revoke(coverFile);
        setCoverFile(null);
    };

    const handleGalleryChange = (event) => {
        const selected = Array.from(event.target.files || []);
        const valid = selected.filter(validImage);

        if (valid.length !== selected.length) {
            notify(
                "Some images were rejected. Use JPG, PNG or WEBP up to 5MB.",
                "warning"
            );
        }

        const remaining = Math.max(0, 30 - galleryFiles.length);

        if (valid.length > remaining) {
            notify("Maximum 30 gallery images allowed.", "warning");
        }

        setGalleryFiles((prev) => [
            ...prev,
            ...valid.slice(0, remaining).map(createPreview),
        ]);

        event.target.value = "";
    };

    const removeGalleryImage = (index) => {
        const image = galleryFiles[index];

        revoke(image);

        setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const addOtherService = () => {
        const value = otherService.trim();

        if (!value || formData.facilities.otherServices.includes(value)) return;

        updateNestedField("facilities", "otherServices", [
            ...formData.facilities.otherServices,
            value,
        ]);

        setOtherService("");
    };

    const removeOtherService = (service) => {
        updateNestedField(
            "facilities",
            "otherServices",
            formData.facilities.otherServices.filter(
                (item) => item !== service
            )
        );
    };

    const addSocialLink = () => {
        const url = socialUrl.trim();
        if (!url) return;

        try {
            const parsed = new URL(url);

            if (!["http:", "https:"].includes(parsed.protocol)) {
                throw new Error("Invalid URL");
            }
        } catch {
            notify("Please enter a valid social media URL.", "warning");
            return;
        }

        const links = formData.contact.socialMedia.filter(
            (item) => item.platform !== socialPlatform
        );

        updateNestedField("contact", "socialMedia", [
            ...links,
            { platform: socialPlatform, url },
        ]);

        setSocialUrl("");
    };

    const removeSocialLink = (platform) => {
        updateNestedField(
            "contact",
            "socialMedia",
            formData.contact.socialMedia.filter(
                (item) => item.platform !== platform
            )
        );
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Establishment name is required.";
        }

        if (!formData.accommodationType) {
            newErrors.accommodationType = "Select an accommodation type.";
        }

        if (!formData.location.city) {
            newErrors.city = "City is required.";
        }

        if (!formData.location.fullAddress.trim()) {
            newErrors.fullAddress = "Full address is required.";
        }

        formData.rooms.forEach((room, index) => {
            if (!room.roomType) {
                newErrors[`roomType-${index}`] = "Select a room type.";
            }

            if (
                room.pricePerNight === "" ||
                Number(room.pricePerNight) < 0
            ) {
                newErrors[`roomPrice-${index}`] = "Enter a valid nightly price.";
            }

            if (!room.quantity || Number(room.quantity) < 1) {
                newErrors[`roomQuantity-${index}`] =
                    "Quantity must be at least 1.";
            }

            if (!room.maxGuests || Number(room.maxGuests) < 1) {
                newErrors[`roomGuests-${index}`] =
                    "Maximum guests must be at least 1.";
            }
        });

        if (
            formData.contact.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)
        ) {
            newErrors.email = "Enter a valid email address.";
        }

        if (formData.yearEstablished) {
            const year = Number(formData.yearEstablished);

            if (
                !Number.isInteger(year) ||
                year < 1000 ||
                year > new Date().getFullYear()
            ) {
                newErrors.yearEstablished = "Enter a valid establishment year.";
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length) {
            notify("Please check the required fields.", "error");
            return false;
        }

        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading || !validateForm()) return;

        try {
            setLoading(true);

            const payload = {
                ...formData,
                yearEstablished: formData.yearEstablished
                    ? Number(formData.yearEstablished)
                    : undefined,
                numberOfRooms: Number(formData.numberOfRooms || 0),
                numberOfFloors: Number(formData.numberOfFloors || 0),

                // Saved photos to keep are sent back (edit mode); new
                // files are uploaded below.
                rooms: formData.rooms.map((room) => ({
                    ...room,
                    quantity: Number(room.quantity),
                    maxGuests: Number(room.maxGuests),
                    pricePerNight: Number(room.pricePerNight),
                    photos: room.photos.filter((photo) => photo.existing).map((photo) => photo.image),
                })),

                media: {
                    ...formData.media,
                    coverPhoto: coverFile?.existing ? coverFile.image : null,
                    gallery: galleryFiles.filter((image) => image.existing).map((image) => image.image),
                },
            };

            const body = new FormData();

            body.append("data", JSON.stringify(payload));

            if (coverFile?.file) {
                body.append("coverPhoto", coverFile.file);
            }

            galleryFiles.forEach((image) => {
                if (image.file) body.append("gallery", image.file);
            });

            formData.rooms.forEach((room, roomIndex) => {
                room.photos.forEach((photo) => {
                    if (photo.file) {
                        body.append(`roomPhotos_${roomIndex}`, photo.file);
                    }
                });
            });

            if (isEdit) {
                const response = await axiosInstance.put(`/property/establishments/${establishmentId}`, body);

                notify(response.data?.message || "Establishment updated successfully.");
                onSaved?.(response.data?.establishment);
                return;
            }

            const response = await axiosInstance.post(
                "/property/establishments",
                body
            );

            notify(
                response.data?.message ||
                    "Establishment created successfully."
            );

            if (typeof onAddEstablishment === "function") {
                onAddEstablishment(response.data?.establishment);
            }

            resetForm();
        } catch (error) {
            console.error(
                "Create establishment error:",
                error.response?.data || error.message
            );

            notify(
                error.response?.data?.message ||
                    "Failed to create establishment.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    if (isEdit && pageLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isEdit && loadError) {
        return <Alert severity="error" sx={{ m: 2 }}>{loadError}</Alert>;
    }

    return (
        <EstablishmentForm
            isEdit={isEdit}
            onCancel={isEdit ? onCancel : undefined}
            formData={formData}
            errors={errors}
            loading={loading}
            coverFile={coverFile}
            galleryFiles={galleryFiles}
            notification={notification}
            otherService={otherService}
            socialPlatform={socialPlatform}
            socialUrl={socialUrl}
            setOtherService={setOtherService}
            setSocialPlatform={setSocialPlatform}
            setSocialUrl={setSocialUrl}
            handleChange={handleChange}
            updateNestedField={updateNestedField}
            updateRoom={updateRoom}
            addRoom={addRoom}
            removeRoom={removeRoom}
            toggleBed={toggleBed}
            handleRoomPhotos={handleRoomPhotos}
            removeRoomPhoto={removeRoomPhoto}
            handleCoverChange={handleCoverChange}
            removeCover={removeCover}
            handleGalleryChange={handleGalleryChange}
            removeGalleryImage={removeGalleryImage}
            addOtherService={addOtherService}
            removeOtherService={removeOtherService}
            addSocialLink={addSocialLink}
            removeSocialLink={removeSocialLink}
            handleSubmit={handleSubmit}
            resetForm={resetForm}
            closeNotification={closeNotification}
        />
    );
}
