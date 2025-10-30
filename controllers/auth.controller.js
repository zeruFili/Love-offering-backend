const User = require("../models/user.model.js");
const authService = require("../services/auth.service.js");
const setCookies = require("../utils/setCookies.js"); // Cookie setting logic
const catchAsync = require("../utils/catchAsync.js");
const crypto = require("crypto");
const httpStatus = require("http-status"); // Assuming you're using a package for HTTP status codes

const signup = catchAsync(async (req, res) => {
  const { email, password, first_name, last_name, phone_number } = req.body;

  const { user, accessToken, refreshToken } = await authService.createUser(email, password, first_name, last_name, phone_number);
 

  res.status(httpStatus.default.CREATED).json({
    success: true,
    message: "User created successfully",
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    },
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { code } = req.body;

  const { user, accessToken, refreshToken } = await authService.verifyUserEmail(code);
   setCookies(res, accessToken, refreshToken);
  await authService.sendWelcomeEmail(user.email, user.first_name);

  res.status(httpStatus.default.OK).json({
    success: true,
    message: "Email verified successfully",
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      accessToken,
    },
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Attempt to log in the user and get user info and tokens
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

  console.log("Login successful for  accesss token user:", accessToken);
  // Set cookies with tokens
  setCookies(res, accessToken, refreshToken);

  // Respond with user info and tokens
  res.status(httpStatus.default.OK).json({
    success: true,
    message: "Logged in successfully",
    accessToken,  // Optionally include the refresh token if needed
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
  await authService.logoutUser(req.cookies.refreshToken);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(httpStatus.default.OK).json({ success: true, message: "Logged out successfully" });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const resetToken = crypto.randomBytes(20).toString("hex");

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
  const updates = req.body;

  const user = await authService.updateUser(userId, updates);
  res.status(httpStatus.default.OK).json({ success: true, user });
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
};