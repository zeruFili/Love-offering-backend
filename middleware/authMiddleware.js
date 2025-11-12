const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

const protect = async (req, res, next) => {
    try {
        // Get the access token from the Authorization header
        const authHeader = req.headers['authorization'];
        const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - No access token provided" });
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            console.log("User information:", {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone_number: user.phone_number,
            });

            // Attach user information to req.user
            req.user = {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role, // Include the role here
            };

            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized - Access token expired" });
            }
            throw error;
        }
    } catch (error) {
        console.log("Error in protect middleware", error.message);
        return res.status(401).json({ message: "Unauthorized - Invalid access token" });
    }
};

const adminValidator = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select("role"); // Fetch user role from the database

        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied - Admin only" });
        }

        next();
    } catch (error) {
        console.log("Error in adminValidator middleware", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};
const tokenVerificationMiddleware = async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided." });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            // If there is an error (expired or invalid), remove the token from the user's refreshTokens
            const user = await User.findOne({ refreshTokens: refreshToken });

            if (user) {
                user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
                await user.save();
            }
            
            return res.status(401).json({ message: "Refresh token has expired. Please log in again." });
        }
        
        // Attach the user ID to the request object
        req.userId = decoded.userId;
        next();
    });
};
module.exports = {
	protect,
	adminValidator,
    tokenVerificationMiddleware
};