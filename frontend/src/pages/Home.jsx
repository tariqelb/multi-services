import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold">
                Welcome to Multi-Services
            </h1>

            <p>Find a house, book transport, or get a service.</p>

            <Link
                to="/login"
                className="rounded-lg bg-blue-600 px-6 py-3 text-white"
            >
                Login / Sign up
            </Link>
        </div>
    );
}

export default Home;