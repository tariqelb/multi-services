import bcrypt from "bcryptjs";
import User from "../../DatabaseModels/Schema/User.js";
import jwt from "jsonwebtoken";
import { generateToken } from "../../utils/generateToken.js"

export const signup = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
        } = req.body;

        if (
            !firstName?.trim() ||
            !lastName?.trim() ||
            !email?.trim() ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        return res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account with this email already exists",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid user data",
            });
        }

        console.error("Signup error:", error.message);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password)
        if (!email?.trim() || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        console.log("1", email, password, "[", email.trim().toLowerCase(), "]")
        console.log("2", email, password)
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select("+password");

        console.log("3", email, password)
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        console.log("4",email, password)

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );
        console.log(email, password, user.password, "is pass valid : [" , isPasswordValid, "]")
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        console.log(email, password)

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }
        console.log(email, password)

        // Generate token using the full user object.
        const token = generateToken(user);

        // Store the token in an HTTP-only cookie.
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 48 * 60 * 60 * 1000,
            path: "/",
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                createdAt: user.createdAt,
            },
            token: token,
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        return res.status(200).json({
            authenticated: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return res.status(200).json({
        message: "Logout successful",
    });
};