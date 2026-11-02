
import { useSelector } from "react-redux";

import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import EmailVerification from "./EmailVerification";

function AuthForm() {
    const activeForm = useSelector(
        (state) => state.activeForm.activeForm
    );

    console.log("Current activeForm:", activeForm);

    return (
        <div className="w-full">
            {activeForm === "login" && <LoginForm />}

            {activeForm === "signup" && <SignUpForm />}

            {activeForm === "verify" && <EmailVerification />}

            {!["login", "signup", "verify"].includes(activeForm) && (
                <p className="p-5 text-red-600">
                    Invalid authentication state: {String(activeForm)}
                </p>
            )}
        </div>
    );
}

export default AuthForm;
