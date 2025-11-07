const User = require("../models/user.model.js");
const authService = require("../services/auth.service.js");
const setCookies = require("../utils/setCookies.js"); // Cookie setting logic
const catchAsync = require("../utils/catchAsync.js");
const crypto = require("crypto");
const httpStatus = require("http-status"); // Assuming you're using a package for HTTP status codes
const jwt = require("jsonwebtoken"); // Make sure to import jwt
const generateTokens = require("../utils/generateTokens.js"); // Token generation logic

const refreshAccessToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    // Check if user exists and refreshToken is in the array
    if (!user || !user.refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const { accessToken } = generateTokens(user._id);
    
    // Send the new access token in response
    res.json({ accessToken });
});

const signup = catchAsync(async (req, res) => {
  const { email, password, first_name, last_name, phone_number } = req.body;

  // Use processed files from middleware or empty array if none
  const idImages = req.processedFiles || [];

  const { user, accessToken, refreshToken } = await authService.createUser(
    email, 
    password, 
    first_name, 
    last_name, 
    phone_number,
    idImages // Pass the array of processed file names
  );

  res.status(httpStatus.default.CREATED).json({
    success: true,
    message: "User created successfully",
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      idImages: user.idImages, // Use the stored ID images from the user object
    },
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { code } = req.body;

  const { user, accessToken, refreshToken } = await authService.verifyUserEmail(code);
  await authService.sendWelcomeEmail(user.email, user.first_name);

  res.status(httpStatus.default.OK).json({
    success: true,
    message: "Email verified successfully",
    accessToken,  
    refreshToken,
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    },
  });
});

const login = catchAsync(async (req, res) => {
   console.log("Incoming request body:", req.body); 
  const { email, password } = req.body;

  // Attempt to log in the user and get user info and tokens
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
  const userrefresh = user.refreshToken ; 

  console.log("acess token " , accessToken,refreshToken);

  // Set cookies with tokens
  setCookies(res, accessToken, refreshToken);

  // Respond with user info and tokens
  res.status(httpStatus.default.OK).json({
    success: true,
    message: "Logged in successfully",
    accessToken,  
    refreshToken,
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    },
  });
});

const logout = catchAsync(async (req, res) => {
    // Get the refresh token from the request body (assuming it's sent with the logout request)
    const {refreshToken} = req.body;

    // Call the service to handle logout
    await authService.logoutUser(refreshToken);
    
    res.status(httpStatus.default.OK).json({ success: true, message: "Logged out successfully" });
});
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const resetToken = crypto.randomBytes(3).toString("hex").slice(0, 6);

  await authService.sendResetEmail(email, resetToken);
  res.status(httpStatus.default.OK).json({ success: true, message: "Password reset link sent to your email" });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await authService.resetUserPassword(token, password);
  await authService.sendResetSuccessEmail(user.email);
  res.status(httpStatus.default.OK).json({ success: true, message: "Password reset successful" });
});
const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    return res.status(httpStatus.default.BAD_REQUEST).json({ success: false, message: "User not found" });
  }

  res.status(httpStatus.default.OK).json({ success: true, user });
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.user._id;

  await authService.deleteUser(userId);
  res.status(httpStatus.default.OK).json({ success: true, message: "User deleted" });
});

const updateUserProfile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  console.log("Incoming request body:", req.body); 
  // Extract specific fields from req.body
  const { first_name, last_name, phone_number } = req.body;
 

  // Prepare idImages directly from processed files or an empty array
  const idImages = req.processedFiles && req.processedFiles.length > 0 
    ? req.processedFiles 
    : [];

  // Create an object with only the fields that need to be updated
  const updates = {};
  if (first_name) updates.first_name = first_name;
  if (last_name) updates.last_name = last_name;
  if (phone_number) updates.phone_number = phone_number;

  const user = await authService.updateUserProfile(userId, updates, idImages);

  res.status(httpStatus.default.OK).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      isVerified: user.isVerified,
      idImages: user.idImages,
    }
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const user = await authService.getUserById(req.user._id);
  res.status(httpStatus.default.OK).json({ success: true, user });
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await authService.getAllUsers();
  res.status(httpStatus.default.OK).json({ success: true, users });
});

// Check Authentication
const checkAuth = catchAsync(async (req, res) => {
  const user = req.user; // Use req.user from token verification
  if (!user) {
    return res.status(httpStatus.default.BAD_REQUEST).json({ success: false, message: "User not found" });
  }

  res.status(httpStatus.default.OK).json({ success: true, user });
});

const verifyUser = catchAsync(async (req, res) => {
  const adminId = req.user._id; 
  const userId = req.body.userId; // Extract userId correctly

  const user = await authService.verifyUser(adminId, userId);

  res.status(httpStatus.default.OK).json({
    success: true,
    message: "User verified successfully",
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});


module.exports = {
  signup,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  deleteUser,
  updateUserProfile,
  getMyProfile,
  getAllUsers,
  checkAuth, 
  verifyUser,
  refreshAccessToken
};