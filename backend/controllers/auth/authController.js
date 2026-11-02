import bcrypt from "bcryptjs";
import User from "../../DatabaseModels/Schema/User.js";
import jwt from "jsonwebtoken";
import { generateToken } from "../../utils/generateToken.js"

import { randomInt } from "crypto";
import PendingSignup from "../../DatabaseModels/Schema/PendingSignup.js";
import { sendVerificationEmail } from "../../services/emailService.js";

const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
};

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
                message: "All fields are required.",
            });
        }

        if (firstName.trim().length < 2 ||
            lastName.trim().length < 2) {
            return res.status(400).json({
                message: "Names must contain at least 2 characters.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters.",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists.",
            });
        }

        // Generate verification code
        const code = randomInt(100000, 1000000).toString();

        // Hash password and verification code
        const hashedPassword = await bcrypt.hash(password, 12);
        const hashedCode = await bcrypt.hash(code, 10);

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Replace any previous pending registration
        await PendingSignup.findOneAndUpdate(
            { email: normalizedEmail },
            {
                $set: {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    password: hashedPassword,
                    verificationCode: hashedCode,
                    attempts: 0,
                    expiresAt,
                },
            },
            { upsert: true, new: true, runValidators: true }
        );

        // Send verification email
        await sendVerificationEmail({
            to: normalizedEmail,
            code,
        });

        return res.status(200).json({
            message: "Verification code sent to your email.",
            email: normalizedEmail,
            expiresIn: 600,
        });
    } catch (error) {
        console.error("Signup error:", error.message);

        return res.status(500).json({
            message: "Unable to start registration. Please try again.",
        });
    }
};


export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email?.trim() || !code?.trim()) {
            return res.status(400).json({
                message: "Email and verification code are required.",
            });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                message: "Invalid verification code.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const pendingSignup = await PendingSignup.findOne({
            email: normalizedEmail,
        }).select("+password +verificationCode");

        if (!pendingSignup) {
            return res.status(404).json({
                message: "Registration not found. Please signup again.",
            });
        }

        if (pendingSignup.expiresAt <= new Date()) {
            await PendingSignup.deleteOne({
                _id: pendingSignup._id,
            });

            return res.status(400).json({
                message: "Verification code expired. Please signup again.",
            });
        }

        if (pendingSignup.attempts >= 5) {
            await PendingSignup.deleteOne({
                _id: pendingSignup._id,
            });

            return res.status(429).json({
                message: "Too many attempts. Please signup again.",
            });
        }

        const isValidCode = await bcrypt.compare(
            code,
            pendingSignup.verificationCode
        );

        if (!isValidCode) {
            pendingSignup.attempts += 1;
            await pendingSignup.save();

            return res.status(400).json({
                message: "Incorrect verification code.",
                remainingAttempts: 5 - pendingSignup.attempts,
            });
        }

        // Check that the email was not registered meanwhile
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            await PendingSignup.deleteOne({
                _id: pendingSignup._id,
            });

            return res.status(409).json({
                message: "An account with this email already exists.",
            });
        }

        // Create the actual user only after verification
        const user = await User.create({
            firstName: pendingSignup.firstName,
            lastName: pendingSignup.lastName,
            email: pendingSignup.email,
            password: pendingSignup.password,
        });

        await PendingSignup.deleteOne({
            _id: pendingSignup._id,
        });

        return res.status(201).json({
            message: "Email verified. Your account was created successfully.",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Email verification error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account with this email already exists.",
            });
        }

        return res.status(500).json({
            message: "Email verification failed.",
        });
    }
};


export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({
                message: "Email is required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const pendingSignup = await PendingSignup.findOne({
            email: normalizedEmail,
        });

        if (!pendingSignup) {
            return res.status(404).json({
                message: "No pending registration found.",
            });
        }

        if (pendingSignup.expiresAt <= new Date()) {
            await PendingSignup.deleteOne({
                _id: pendingSignup._id,
            });

            return res.status(400).json({
                message: "Registration expired. Please signup again.",
            });
        }

        const code = randomInt(100000, 1000000).toString();

        pendingSignup.verificationCode = await bcrypt.hash(code, 10);
        pendingSignup.attempts = 0;
        pendingSignup.expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await pendingSignup.save();

        await sendVerificationEmail({
            to: normalizedEmail,
            code,
        });

        return res.status(200).json({
            message: "A new verification code has been sent.",
            expiresIn: 600,
        });
    } catch (error) {
        console.error("Resend verification error:", error.message);

        return res.status(500).json({
            message: "Unable to resend verification code.",
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
        // res.cookie("token", token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "lax",
        //     maxAge: 48 * 60 * 60 * 1000,
        //     path: "/",
        // });
        res.cookie("token", token, {
            ...authCookieOptions,
            maxAge: 48 * 60 * 60 * 1000,
        });

        if (user.scheduledDeletionAt) {
            user.deletionRequestedAt = null;
            user.scheduledDeletionAt = null;

            await user.save();
        }

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
            .select(
                "firstName lastName email phoneNumber emailVerified phoneVerified notificationPreferences role address bio profileImage createdAt"
            );

        if (!user) {
            return res.status(404).json({
                authenticated: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            authenticated: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,

                // WhatsApp information
                notificationPreferences: {
                    whatsapp: {
                        enabled:
                            user.notificationPreferences?.whatsapp?.enabled ?? false,
                        phoneNumber:
                            user.notificationPreferences?.whatsapp?.phoneNumber ?? "",
                        propertyAlerts:
                            user.notificationPreferences?.whatsapp?.propertyAlerts ?? false,
                        verified:
                            user.notificationPreferences?.whatsapp?.verified ?? false,
                    },
                },

                role: user.role,
                address: user.address,
                bio: user.bio,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("[Auth] Get current user error:", error);

        return res.status(500).json({
            authenticated: false,
            message: "Failed to retrieve user profile",
        });
    }
};


// export const logout = (req, res) => {
//     res.clearCookie("token", {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//         path: "/",
//     });

//     return res.status(200).json({
//         message: "Logout successful",
//     });
// };

export const logout = (req, res) => {
    res.clearCookie("token", authCookieOptions);

    return res.status(200).json({
        message: "Logout successful",
    });
};