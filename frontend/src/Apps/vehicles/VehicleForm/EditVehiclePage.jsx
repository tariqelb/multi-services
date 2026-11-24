// src/Apps/vehicles/VehicleForm/EditVehiclePage.jsx
import { useParams } from "react-router-dom";
import VehicleInsertForm from "./VehicleInsertForm";

export default function EditVehiclePage() {
    const { id } = useParams();
    // key: a new form when moving from one vehicle to another.
    return <VehicleInsertForm key={id} vehicleId={id} />;
}
