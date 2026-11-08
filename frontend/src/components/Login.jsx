
import loginBackground from "../assets/Login_backgound.jpeg";
import AuthForm from "./AuthForm";
import LoginLanguageSwitcher from "./LoginLanguageSwitcher";

import { useTranslation } from "react-i18next";

function Login() {
    const { t } = useTranslation();

    return (
        <div
            className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-cover bg-center bg-no-repeat px-4 py-6 pt-20 sm:px-6 md:flex-row md:items-start md:justify-center md:gap-8 md:px-8 md:py-12 md:pt-20 lg:justify-around lg:px-12 lg:py-16 lg:pt-20"
            style={{ backgroundImage: `url(${loginBackground})` }}
        >
            {/* Language Switcher */}
            <div className="absolute right-4 top-4 z-20 sm:right-6 md:right-8">
                <LoginLanguageSwitcher />
            </div>

            {/* Welcome section */}
            <div className="flex w-full min-w-0 max-w-xl items-start justify-start overflow-hidden rounded-2xl bg-white/50 p-3 shadow-lg sm:p-5 md:mt-8 md:w-1/2 md:p-4 lg:mt-12 lg:p-6">
                <p className="m-0 flex w-full min-w-0 flex-col items-start p-0 text-left text-lg font-bold text-black sm:text-xl lg:text-2xl">

                    <span className="m-1 rounded-2xl border bg-white/70 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards] sm:m-2 sm:p-5">
                        {t("login.welcome")}
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards] sm:m-2 sm:p-4">
                        {t("login.findHouse")}
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards] sm:m-2 sm:p-4">
                        {t("login.bookTransport")}
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_2.0s_forwards] sm:m-2 sm:p-4">
                        {t("login.getWorker")}
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_2.6s_forwards] sm:m-2 sm:p-4">
                        {t("login.andMore")}
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/50 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_3.2s_forwards] sm:m-2 sm:p-4">
                        {t("login.magic")}
                    </span>

                </p>
            </div>

            {/* Login / Signup / Email Verification */}
            <div className="flex w-full min-w-0 max-w-md items-start justify-center overflow-hidden rounded-2xl border-2 border-white/50 bg-white/80 p-0 shadow-lg md:mt-8 md:w-1/2 lg:mt-12">
                <AuthForm />
            </div>
        </div>
    );
}

export default Login;
