// src/Store/Store.js
import { configureStore } from "@reduxjs/toolkit";
import loginReducer from "../reducers/login/loginReducer";
import ActiveFormReducer from "../reducers/activeLoginForm/activeFormReducer";
import signupReducer from "./../reducers/login/signupReducer";
import loginFormReducer from "./../reducers/login/loginFormReducer";
import authReducer from "./../reducers/login/authReducer"
import profileReducer from "./../reducers/profile/profileReducer";
import propertyFormReducer from './../reducers/insertProperty/propertyFormSlice';

export const store = configureStore({
    reducer: {
        login: loginReducer,
        activeForm: ActiveFormReducer,
        signup: signupReducer,
        loginForm: loginFormReducer,
        auth: authReducer,
        profile: profileReducer,
        propertyForm: propertyFormReducer,

    },
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values (like File objects) in the propertyForm slice
        ignoredActions: ['propertyForm/setImages', 'propertyForm/updateField'],
        ignoredPaths: ['propertyForm.formData.images'],
      },
    }),
});