import Property from "../../DatabaseModels/Schema/Property.js";
// @desc    Get all property listings
// @route   GET /api/property
// @access  Public
export const getProperties = async (req, res) => {
    try {
        // Fetch all properties, sorted by newest first
        const properties = await Property.find().sort({ createdAt: -1 });

        res.status(200).json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ 
            message: 'Server error while fetching properties', 
            error: error.message 
        });
    }
};