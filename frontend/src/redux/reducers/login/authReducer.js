
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
};

function authReducer(state = initialState, action) {
    switch (action.type) {
        case "LOGIN_SUCCESS":
            return {
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
            };

        case "AUTH_SUCCESS":
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
            };

        case "AUTH_FAILURE":
        case "LOGOUT":
            return initialState;

        default:
            return state;
    }
}

export default authReducer;