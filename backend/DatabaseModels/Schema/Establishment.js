
import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
    {
        filename: {
            type: String,
            required: true,
            trim: true,
        },
        path: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

// Room type schema
const roomSchema = new mongoose.Schema(
    {
        roomType: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        bedConfiguration: {
            type: [
                {
                    type: String,
                    trim: true,
                },
            ],
            default: [],
        },

        maxGuests: {
            type: Number,
            required: true,
            min: 1,
        },

        privateBathroom: {
            type: Boolean,
            default: false,
        },

        airConditioning: {
            type: Boolean,
            default: false,
        },

        balconyOrTerrace: {
            type: Boolean,
            default: false,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        photos: {
            type: [imageSchema],
            default: [],
        },

        pricePerNight: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: true }
);

// Establishment schema
const establishmentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // 1. Establishment information
        name: {
            type: String,
            required: true,
            trim: true,
        },

        accommodationType: {
            type: String,
            required: true,
            enum: [
                "Hotel",
                "Riad",
                "Guesthouse",
                "Hostel",
                "Aparthotel",
                "Other",
            ],
        },

        shortDescription: {
            type: String,
            trim: true,
            default: "",
        },

        fullDescription: {
            type: String,
            trim: true,
            default: "",
        },

        yearEstablished: {
            type: Number,
            min: 1000,
            default: null,
        },

        numberOfRooms: {
            type: Number,
            min: 0,
            default: 0,
        },

        numberOfFloors: {
            type: Number,
            min: 0,
            default: 0,
        },

        officialClassification: {
            type: String,
            trim: true,
            default: "",
        },

        // 2. Location
        location: {
            city: {
                type: String,
                required: true,
                trim: true,
            },

            neighborhood: {
                type: String,
                trim: true,
                default: "",
            },

            fullAddress: {
                type: String,
                required: true,
                trim: true,
            },

            googleMapsLink: {
                type: String,
                trim: true,
                default: "",
            },

            lat: {
                type: Number,
                default: null,
                min: -90,
                max: 90,
            },

            lng: {
                type: Number,
                default: null,
                min: -180,
                max: 180,
            },
        },

        // 3. Rooms and accommodation
        rooms: {
            type: [roomSchema],
            default: [],
        },

        // 4. Services and facilities
        facilities: {
            swimmingPool: {
                type: Boolean,
                default: false,
            },

            restaurant: {
                type: Boolean,
                default: false,
            },

            breakfast: {
                type: Boolean,
                default: false,
            },

            wifi: {
                type: Boolean,
                default: false,
            },

            parking: {
                type: Boolean,
                default: false,
            },

            spaHammam: {
                type: Boolean,
                default: false,
            },

            airportTransfer: {
                type: Boolean,
                default: false,
            },

            gardenRooftop: {
                type: Boolean,
                default: false,
            },

            reception: {
                type: Boolean,
                default: false,
            },

            laundry: {
                type: Boolean,
                default: false,
            },

            roomService: {
                type: Boolean,
                default: false,
            },

            otherServices: {
                type: [
                    {
                        type: String,
                        trim: true,
                    },
                ],
                default: [],
            },
        },

        // 5. Contact and online presence
        contact: {
            phoneNumber: {
                type: String,
                trim: true,
                default: "",
            },

            whatsappNumber: {
                type: String,
                trim: true,
                default: "",
            },

            email: {
                type: String,
                trim: true,
                lowercase: true,
                default: "",
            },

            officialWebsite: {
                type: String,
                trim: true,
                default: "",
            },

            bookingWebsite: {
                type: String,
                trim: true,
                default: "",
            },

            socialMedia: {
                type: [
                    new mongoose.Schema(
                        {
                            platform: {
                                type: String,
                                trim: true,
                            },

                            url: {
                                type: String,
                                trim: true,
                            },
                        },
                        { _id: false }
                    ),
                ],
                default: [],
            },
        },

        // 6. Photos and media
        media: {
            coverPhoto: {
                type: imageSchema,
                default: null,
            },

            gallery: {
                type: [imageSchema],
                default: [],
            },

            videoUrl: {
                type: String,
                trim: true,
                default: "",
            },
        },
    },
    {
        timestamps: true,
    }
);

const Establishment =
    mongoose.models.Establishment ||
    mongoose.model("Establishment", establishmentSchema);

export default Establishment;

