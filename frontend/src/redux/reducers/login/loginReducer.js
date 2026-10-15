
const initialState = {
    email: "",
    password: "",
    loading: false,
    error: "",
};

function loginFormReducer(state = initialState, action) {
    switch (action.type) {
        case "SET_LOGIN_EMAIL":
            return {
                ...state,
                email: action.payload,
            };

        case "SET_LOGIN_PASSWORD":
            return {
                ...state,
                password: action.payload,
            };

        case "LOGIN_REQUEST":
            return {
                ...state,
                loading: true,
                error: "",
            };

        case "LOGIN_SUCCESS":
            return {
                ...state,
                loading: false,
                error: "",
                password: "",
            };

        case "LOGIN_FAILURE":
            return {
                ...state,
                loading: false,
                error: action.payload,
                password: "",
            };

        case "CLEAR_LOGIN_STATUS":
            return {
                ...state,
                loading: false,
                error: "",
            };

        case "LOGOUT":
            return initialState;

        default:
            return state;
    }
}

export default loginFormReducer;