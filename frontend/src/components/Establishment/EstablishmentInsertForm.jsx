
import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
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

export default function EstablishmentInsertForm({ onAddEstablishment }) {
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

            if (current.coverFile?.preview) {
                URL.revokeObjectURL(current.coverFile.preview);
            }

            current.galleryFiles.forEach((image) => {
                URL.revokeObjectURL(image.preview);
            });

            current.rooms.forEach((room) => {
                room.photos.forEach((photo) => {
                    if (photo.preview) URL.revokeObjectURL(photo.preview);
                });
            });
        };
    }, []);

    const notify = (message, severity = "success") => {
        setNotification({ open: true, message, severity });
    };

    const closeNotification = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    const resetForm = () => {
        if (coverFile?.preview) URL.revokeObjectURL(coverFile.preview);

        galleryFiles.forEach((image) => {
            URL.revokeObjectURL(image.preview);
        });

        formData.rooms.forEach((room) => {
            room.photos.forEach((photo) => {
                if (photo.preview) URL.revokeObjectURL(photo.preview);
            });
        });

        setFormData(initialForm);
        setCoverFile(null);
        setGalleryFiles([]);
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

        formData.rooms[index].photos.forEach((photo) => {
            if (photo.preview) URL.revokeObjectURL(photo.preview);
        });

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

        if (removed?.preview) URL.revokeObjectURL(removed.preview);

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

        if (coverFile?.preview) URL.revokeObjectURL(coverFile.preview);

        setCoverFile(createPreview(file));
        event.target.value = "";
    };

    const removeCover = () => {
        if (coverFile?.preview) URL.revokeObjectURL(coverFile.preview);
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

        if (image?.preview) URL.revokeObjectURL(image.preview);

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

                rooms: formData.rooms.map((room) => ({
                    ...room,
                    quantity: Number(room.quantity),
                    maxGuests: Number(room.maxGuests),
                    pricePerNight: Number(room.pricePerNight),
                    photos: [],
                })),

                media: {
                    ...formData.media,
                    coverPhoto: null,
                    gallery: [],
                },
            };

            const body = new FormData();

            body.append("data", JSON.stringify(payload));

            if (coverFile?.file) {
                body.append("coverPhoto", coverFile.file);
            }

            galleryFiles.forEach((image) => {
                body.append("gallery", image.file);
            });

            formData.rooms.forEach((room, roomIndex) => {
                room.photos.forEach((photo) => {
                    if (photo.file) {
                        body.append(`roomPhotos_${roomIndex}`, photo.file);
                    }
                });
            });

            const response = await axiosInstance.post(
                "/establishments",
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

    return (
        <EstablishmentForm
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
