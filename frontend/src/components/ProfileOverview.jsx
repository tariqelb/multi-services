import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileContent from './ProfileContent';
import ProfilePropertyList from './ProfilePropertyList';

export default function ProfileOverview() {
    const navigate = useNavigate();

    const handleSelectProperty = (property) => {
        const propertyId = property._id || property.id;
        navigate(`/profile/properties/${propertyId}`);
    };

    return (
        <>
            <ProfileContent />
            {/* <ProfilePropertyList onSelectProperty={handleSelectProperty} /> */}
        </>
    );
}