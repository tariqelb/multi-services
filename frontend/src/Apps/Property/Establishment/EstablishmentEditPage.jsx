// src/Apps/Property/Establishment/EstablishmentEditPage.jsx
// /establishments/:id/edit — the establishment form in edit mode (owner or admin).

import { useNavigate, useParams } from "react-router-dom";

import EstablishmentInsertForm from "./EstablishmentInsertForm";

export default function EstablishmentEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        // key: a fresh form for each establishment
        <EstablishmentInsertForm
            key={id}
            establishmentId={id}
            onSaved={() =>
                // Leave time for the success message.
                setTimeout(() => navigate(`/establishments/${id}`), 900)
            }
        />
    );
}
