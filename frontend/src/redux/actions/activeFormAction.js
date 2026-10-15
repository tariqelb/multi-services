import { SET_ACTIVE_FORM } from "../types/activeFormTypes";

export const activeFormAction = (form) => {
    return {
        type: SET_ACTIVE_FORM,
        payload: form
    };
};