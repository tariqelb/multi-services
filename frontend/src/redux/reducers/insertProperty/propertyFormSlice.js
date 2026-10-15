
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  formData: {
    role: 'Owner', firstName: '', lastName: '', email: '', phone: '',
    title: '', listingType: 'For Sale', propertyType: '', city: '',
    neighborhood: '', fullAddress: '', mapLink: '', price: '', surface: '',
    rooms: '', salons: '', bathrooms: '', floor: '', syndicateFees: '', images: [],
  },
  errors: {},
};

const propertyFormSlice = createSlice({
  name: 'propertyForm',
  initialState,
  reducers: {
    updateField: (state, action) => {
      const { name, value } = action.payload;
      state.formData[name] = value;
    },
    setImages: (state, action) => {
      state.formData.images = action.payload;
    },
    setErrors: (state, action) => {
      state.errors = action.payload;
    },
    resetPropertyForm: () => initialState,
  },
});

export const { updateField, setImages, setErrors, resetPropertyForm } = propertyFormSlice.actions;
export default propertyFormSlice.reducer;