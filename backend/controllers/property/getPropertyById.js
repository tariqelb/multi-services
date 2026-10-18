import Property from "../../DatabaseModels/Schema/Property.js";

export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        res.status(200).json(property);
    } catch (error) {
        res.status(500).json({ message: error.message || "Server error" });
    }
};