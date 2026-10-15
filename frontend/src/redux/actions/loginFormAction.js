// src/redux/actions/loginFormAction.js

import {
    SET_LOGIN_EMAIL,
    SET_LOGIN_PASSWORD,
} from "../types/loginTypes";

export const setLoginEmail = (email) => ({
    type: SET_LOGIN_EMAIL,
    payload: email,
});

export const setLoginPassword = (password) => ({
    type: SET_LOGIN_PASSWORD,
    payload: password,
});

export const loginRequest = () => ({
    type: "LOGIN_REQUEST",
});

export const loginSuccess = ({ user }) => ({
    type: "LOGIN_SUCCESS",
    payload: { user },
});

export const loginFailure = (message) => ({
    type: "LOGIN_FAILURE",
    payload: message,
});

export const clearLoginStatus = () => ({
    type: "CLEAR_LOGIN_STATUS",
});