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
            className="flex min-h-screen flex-row bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${loginBackground})` }}
        >
            <div className="m-61 ml-25 flex items-start justify-start rounded-2xl border-2 bg-white/70 p-8 shadow-lg  overflow-hidden">
                <p className="m-0 flex flex-col items-start p-0 text-left text-2xl font-medium text-black">
                    <span className="p-5 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
                        Welcome to your application where you can do multiple
                        tasks in one place
                    </span>

                    <span className="p-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]">Find a house ...</span>
                    <span className="p-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_1.4s_forwards]">Book a transport ...</span>
                    <span className="p-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_2.0s_forwards]">Get a worker for a specific job ...</span>
                    <span className="p-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_2.6s_forwards]">And more ...</span>
                    <span className="p-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_3.2s_forwards]">
                        All in one place, here where magic happen
                    </span>
                </p>
            </div>

            <div className="mt-30 mb-30 flex min-w-sm rounded-2xl border-2 bg-white/80 p-0">
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