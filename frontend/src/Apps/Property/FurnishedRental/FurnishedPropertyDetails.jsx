// Furnished rentals share the exact same details design as properties.
// Similar furnished listings are rendered by FurnishedPropertyDetailsPage.
import PropertyDetails from "../properties/PropertyDetails";

export default function FurnishedPropertyDetails(props) {
    return <PropertyDetails {...props} similarProperties={[]} />;
}
