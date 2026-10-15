import { SET_ACTIVE_FORM } from "./../../types/activeFormTypes";

const initialState = {
    activeForm: "login"
};

const ActiveFormReducer = (state = initialState, action) => 
{
    switch (action.type) 
    {
        case SET_ACTIVE_FORM:
        {
            return {
                ...state,
                activeForm: action.payload
            };
        }

        default:
            return state;
    }
};

export default ActiveFormReducer;