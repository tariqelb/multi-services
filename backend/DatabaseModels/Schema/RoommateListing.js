
import mongoose from "mongoose";

const roommateListingSchema = new mongoose.Schema(
    {
        // Listing owner
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Basic information
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 3000,
        },
        purpose: {
            type: String,
            enum: [
                "Share My Property",
                "Find a Room",
                "Rent Together",
            ],
            required: true,
        },
        propertyType: {
            type: String,
            enum: [
                "Apartment",
                "House",
                "Villa",
                "Studio",
                "Room",
                "Other",
                null,
            ],
            default: null,
        },

        // Location
        city: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        neighborhood: {
            type: String,
            trim: true,
            default: "",
        },
        fullAddress: {
            type: String,
            trim: true,
            default: "",
        },
        mapLink: {
            type: String,
            trim: true,
            default: "",
        },

        // Rental information
        totalRent: {
            type: Number,
            min: 0,
            default: null,
        },
        rentalPeriod: {
            type: String,
            enum: ["Daily", "Monthly", null],
            default: null,
        },
        furnishingStatus: {
            type: String,
            enum: ["Furnished", "Unfurnished", null],
            default: null,
        },
        individualRoomPrice: {
            type: Number,
            min: 0,
            default: null,
        },
        rentSplitType: {
            type: String,
            enum: ["Equal", "Custom"],
            default: "Equal",
        },
        deposit: {
            type: Number,
            min: 0,
            default: 0,
        },
        syndicateFees: {
            type: Number,
            min: 0,
            default: 0,
        },
        otherExpenses: {
            type: Number,
            min: 0,
            default: 0,
        },

        // Accommodation details
        surface: {
            type: Number,
            min: 0,
            default: null,
        },
        rooms: {
            type: Number,
            min: 0,
            default: 0,
        },
        salons: {
            type: Number,
            min: 0,
            default: 0,
        },
        bathrooms: {
            type: Number,
            min: 0,
            default: 0,
        },
        floor: {
            type: Number,
            min: 0,
            default: null,
        },
        propertyCondition: {
            type: String,
            enum: [
                "New",
                "Good",
                "Needs Renovation",
                null,
            ],
            default: null,
        },
        hasBalcony: {
            type: Boolean,
            default: null,
        },
        hasKitchen: {
            type: Boolean,
            default: null,
        },
        hasParking: {
            type: Boolean,
            default: null,
        },

        // Roommate capacity
        totalPeople: {
            type: Number,
            required: true,
            min: 1,
        },
        currentPeople: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        availableFrom: {
            type: Date,
            default: null,
        },

        // Roommate preferences
        preferences: {
            gender: {
                type: String,
                enum: ["Any", "Male", "Female"],
                default: "Any",
            },
            smokingAllowed: {
                type: Boolean,
                default: false,
            },
            petsAllowed: {
                type: Boolean,
                default: false,
            },
        },

        // Images
        images: [
            {
                filename: {
                    type: String,
                    required: true,
                },
                path: {
                    type: String,
                    required: true,
                },
            },
        ],

        // Optional YouTube video URL
        youtubeVideoUrl: {
            type: String,
            trim: true,
            default: "",
        },

        // Listing status
        // Listing status
        status: {
            type: String,
            enum: [
                "Open",
                "Full",
                "Inactive",
                "Completed",
            ],
            default: "Open",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Validate capacity
roommateListingSchema.pre("validate", function () {
    if (this.currentPeople > this.totalPeople) {
        this.invalidate(
            "currentPeople",
            "Current people cannot exceed total capacity."
        );
    }
});

// Search indexes
roommateListingSchema.index({
    purpose: 1,
    city: 1,
    status: 1,
});

roommateListingSchema.index({
    propertyType: 1,
    rentalPeriod: 1,
    furnishingStatus: 1,
});

const RoommateListing =
    mongoose.models.RoommateListing ||
    mongoose.model("RoommateListing", roommateListingSchema);

export default RoommateListing;
