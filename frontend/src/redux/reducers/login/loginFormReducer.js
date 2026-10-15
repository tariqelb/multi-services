// src/redux/reducers/loginReducer.js

import {
    SET_LOGIN_EMAIL,
    SET_LOGIN_PASSWORD,
} from "./../../types/loginTypes";

const initialState = {
    email: "",
    password: "",
};

const loginFormReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_LOGIN_EMAIL:
            return {
                ...state,
                email: action.payload,
            };

        case SET_LOGIN_PASSWORD:
            return {
                ...state,
                password: action.payload,
            };

        default:
            return state;
    }
};

export default loginFormReducer;