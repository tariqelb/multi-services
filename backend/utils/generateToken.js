import jwt from 'jsonwebtoken';

const generateToken = (user) => {
    const payload = {
        userId: user._id,
        firstName: user.firstName,
	    lastName: user.lastName,
	    email: user.email,
    };

    const options = {
        expiresIn: '48h',
        algorithm: "HS256",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, options);
    return token;
};

export { generateToken };