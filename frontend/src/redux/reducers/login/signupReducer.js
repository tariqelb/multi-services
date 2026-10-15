// src/redux/reducers/signupReducer.js

import {
    SET_SIGNUP_EMAIL,
    SET_SIGNUP_PASSWORD,
    SET_SIGNUP_CONFIRM_PASSWORD,
} from "./../../types/signupTypes";

const initialState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
};

const signupReducer = (state = initialState, action) => {
    switch (action.type) {
        case "RESET_SIGNUP_FORM":
            return {
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                confirmPassword: "",
            };
        case "SET_SIGNUP_FIRST_NAME":
            return {
                    ...state,
                    firstName: action.payload
            };
        case "SET_SIGNUP_LAST_NAME":
            return {
                    ...state,
                    lastName: action.payload
            };
        case SET_SIGNUP_EMAIL:
            return {
                ...state,
                email: action.payload,
            };

        case SET_SIGNUP_PASSWORD:
            return {
                ...state,
                password: action.payload,
            };

        case SET_SIGNUP_CONFIRM_PASSWORD:
            return {
                ...state,
                confirmPassword: action.payload,
            };

        default:
            return state;
    }
};

export default signupReducer;