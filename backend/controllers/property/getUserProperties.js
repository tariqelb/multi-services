import Property from "../../DatabaseModels/Schema/Property.js";

// @desc    Get properties published by the logged-in user
// @route   GET /api/property/user-listings (or your chosen route path)
// @access  Protected (Requires auth middleware)
export  const getUserProperties = async (req, res) => {
    try {
        // Assuming your authentication middleware attaches the user object (e.g., req.user._id)
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({ message: "Not authorized, user ID missing" });
        }

        // Find properties belonging to this user and sort by newest first
        const properties = await Property.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json(properties);
    } catch (error) {
        console.error("Error fetching user properties:", error);
        res.status(500).json({ 
            message: "Server error while fetching user properties", 
            error: error.message 
        });
    }
};