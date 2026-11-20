// Owner view of a roommate announcement: same design, no contact buttons.
import RoommateDetails from "./RoommateDetails";

export default function RoommateProfileDetails({ listing }) {
    return <RoommateDetails listing={listing} showContact={false} />;
}
