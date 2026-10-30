
import User from "../../DatabaseModels/Schema/User.js";
import { sendPropertyAlertEmail } from "../../services/emailService.js";

export const testPropertyAlertEmail = async (req, res) => {
    try {
        // Send the test email to the authenticated user's email.
        const user = await User.findById(req.user.userId)
            .select("email");

        if (!user?.email) {
            return res.status(400).json({
                message: "Your account has no email address.",
            });
        }

        await sendPropertyAlertEmail({
            to: user.email,
            property: {
                _id: "test-property",
                title: "Email delivery test",
                city: "Marrakech",
                propertyType: "Apartment",
                listingType: "For Sale",
                price: 500000,
            },
        });

        return res.status(200).json({
            message: `Test email sent to ${user.email}.`,
        });
    } catch (error) {
        console.error("[Email Test]", error);

        return res.status(500).json({
            message: "Email test failed.",
            error: error.message,
        });
    }
};
