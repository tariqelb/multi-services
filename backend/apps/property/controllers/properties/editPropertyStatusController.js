import { getAllowedPropertyStatuses, isPropertyStatusAllowed } from "../../utils/listingStatus.js";
import { confirmedNow } from "../../services/listingExpiry.js";
import Property from "../../models/Property.js";

export const editPropertyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // 1. Validate status input against allowed enum values
        const allowedStatuses = ["Available", "Rented", "Sold", "Inactive"];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status value. Must be one of: ${allowedStatuses.join(", ")}`,
            });
        }

        // 2. Find property and verify ownership (ensuring req.user.userId matches property.userId)
        const property = await Property.findById(id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        if (property.userId.toString() !== req.user.id && property.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized to update this property status" });
        }

        // 3. Sold only for sale, Rented only for rent.
        if (!isPropertyStatusAllowed(property.listingType, status)) {
            return res.status(400).json({
                code: "STATUS_NOT_ALLOWED",
                message:
                    property.listingType === "For Sale"
                        ? "A property for sale can be Available, Sold or Inactive."
                        : "A property for rent can be Available, Rented or Inactive.",
                allowedStatuses: getAllowedPropertyStatuses(property.listingType),
            });
        }

        // 4. Update status and save
        property.status = status;
        // Changing the status confirms the listing (60-day expiry).
        Object.assign(property, confirmedNow());
        await property.save();

        return res.status(200).json({
            message: "Property status updated successfully",
            property,
        });
    } catch (error) {
        console.error("Error updating property status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};