// src/Apps/Property/Establishment/EstablishmentEditPage.jsx
// /establishments/:id/edit — the establishment form in edit mode (owner or admin).

import { useParams } from "react-router-dom";

import EstablishmentInsertForm from "./EstablishmentInsertForm";
import { useGoBack, useReturnAfterSave } from "../../../Components/navigation/navHistory";

export default function EstablishmentEditPage() {
    const { id } = useParams();
    const goBack = useGoBack(`/establishments/${id}`);
    const returnAfterSave = useReturnAfterSave();

    return (
        // key: a fresh form for each establishment
        <EstablishmentInsertForm
            key={id}
            establishmentId={id}
            onSaved={() =>
                // Leave time for the success message. Back from the details page
                // then returns to where "Edit" was clicked, not to this form.
                setTimeout(() => returnAfterSave(`/establishments/${id}`), 900)
            }
            onCancel={() => goBack()}
        />
    );
}
