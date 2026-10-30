import { useDispatch, useSelector } from "react-redux";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import { activeFormAction } from "../redux/actions/activeFormAction";
import loginBackground from "../assets/Login_backgound.jpeg";

function Login() {
    const dispatch = useDispatch();

    const activeForm = useSelector(
        (state) => state.activeForm.activeForm
    );

    return (
        <div
            className="flex min-h-screen w-full flex-col items-center gap-6 bg-cover bg-center bg-no-repeat px-4 py-6 sm:px-6 md:flex-row md:items-start md:justify-center md:gap-8 md:px-8 md:py-12 lg:justify-around lg:px-12 lg:py-16"
            style={{ backgroundImage: `url(${loginBackground})` }}
        >
            {/* Welcome section */}
            <div className="flex w-full min-w-0 max-w-xl items-start justify-start overflow-hidden rounded-2xl bg-white/50 p-3 shadow-lg sm:p-5 md:mt-8 md:w-1/2 md:p-4 lg:mt-12 lg:p-6">
                <p className="m-0 flex w-full min-w-0 flex-col items-start p-0 text-left text-lg font-bold text-black sm:text-xl lg:text-2xl">
                    <span className="m-1 rounded-2xl border bg-white/70 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards] sm:m-2 sm:p-5">
                        Welcome to your application where you can do multiple
                        tasks in one place
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards] sm:m-2 sm:p-4">
                        Find a house ...
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards] sm:m-2 sm:p-4">
                        Book a transport ...
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_2.0s_forwards] sm:m-2 sm:p-4">
                        Get a worker for a specific job ...
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/60 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_2.6s_forwards] sm:m-2 sm:p-4">
                        And more ...
                    </span>

                    <span className="m-1 rounded-2xl border bg-white/50 p-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_3.2s_forwards] sm:m-2 sm:p-4">
                        All in one place, here where magic happen
                    </span>
                </p>
            </div>

            {/* Login / Signup form */}
            <div className="flex w-full min-w-0 max-w-md items-start justify-center overflow-hidden rounded-2xl border-2 border-white/50 bg-white/80 p-0 shadow-lg md:mt-8 md:w-1/2 lg:mt-12">
                {activeForm === "login" ? (
                    <LoginForm />
                ) : (
                    <SignUpForm />
                )}
            </div>
        </div>
    );
}

export default Login;