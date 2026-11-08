
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import EmailVerification from "./EmailVerification";

function AuthForm() {
    const { t } = useTranslation();

    const activeForm = useSelector(
        (state) => state.activeForm.activeForm
    );

    return (
        <div className="w-full">
            {activeForm === "login" && <LoginForm />}

            {activeForm === "signup" && <SignUpForm />}

            {activeForm === "verify" && <EmailVerification />}

            {!["login", "signup", "verify"].includes(activeForm) && (
                <p className="break-words p-5 text-red-600">
                    {t("auth.invalidState", {
                        state: String(activeForm),
                    })}
                </p>
            )}
        </div>
    );
}

export default AuthForm;
