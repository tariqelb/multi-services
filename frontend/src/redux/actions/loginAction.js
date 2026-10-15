import { LOGIN } from "../types/loginTypes";

export const loginAction = (email, password) => {
    return {
        type: LOGIN,
        payload: {
            email: email,
            password: password
        }
    };
};