// src/redux/actions/signupAction.js

import {
    SET_SIGNUP_EMAIL,
    SET_SIGNUP_PASSWORD,
    SET_SIGNUP_CONFIRM_PASSWORD,
} from "../types/signupTypes";

export const setSignupEmail = (email) => ({
    type: SET_SIGNUP_EMAIL,
    payload: email,
});

export const setSignupPassword = (password) => ({
    type: SET_SIGNUP_PASSWORD,
    payload: password,
});

export const setSignupConfirmPassword = (password) => ({
    type: SET_SIGNUP_CONFIRM_PASSWORD,
    payload: password,
});

export const setSignupFirstName = (firstName) => ({
    type: "SET_SIGNUP_FIRST_NAME",
    payload: firstName,
});

export const setSignupLastName = (lastName) => ({
    type: "SET_SIGNUP_LAST_NAME",
    payload: lastName,
});

export const resetSignupForm = () => ({
    type: "RESET_SIGNUP_FORM",
});