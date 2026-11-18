
export const initialFormData = {
    title: "",
    description: "",
    purpose: "Share My Property",

    propertyType: "Apartment",

    city: "",
    neighborhood: "",
    fullAddress: "",
    mapLink: "",

    totalRent: "",
    rentalPeriod: "Monthly",
    furnishingStatus: "Furnished",
    individualRoomPrice: "",
    rentSplitType: "Equal",

    deposit: "",
    syndicateFees: "",
    otherExpenses: "",

    surface: "",
    rooms: "",
    salons: "",
    bathrooms: "",
    floor: "",
    propertyCondition: "Good",

    hasBalcony: false,
    hasKitchen: false,
    hasParking: false,

    totalPeople: 2,
    currentPeople: 1,
    availableFrom: "",

    preferences: {
        gender: "Any",
        smokingAllowed: false,
        petsAllowed: false,
    },

    youtubeVideoUrl: "",
    images: [],
};

export const roommatePurposes = [
    "Share My Property",
    "Find a Room",
    "Rent Together",
];

export const roommatePropertyTypes = [
    "Apartment",
    "House",
    "Villa",
    "Studio",
    "Room",
    "Other",
];

export const roommateImageRules = {
    maxImages: 15,
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
    ],
};
