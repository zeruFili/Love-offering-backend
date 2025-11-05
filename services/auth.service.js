const bcrypt = require("bcryptjs");
const User = require("../models/user.model.js");
const {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} = require("../mailtrap/emails.js");
const generateTokens = require("../utils/generateTokens.js"); // Token generation logic
const jwt = require("jsonwebtoken");

const createUser = async (email, password, first_name, last_name, phone_number, idImages = []) => {
  const userAlreadyExists = await User.findOne({ email });
  if (userAlreadyExists) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

  const user = new User({
    email,
    password: hashedPassword,
    first_name,
    last_name,
    phone_number,
    verificationToken,
    verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
    idImages: idImages // Store the array of processed file names
  });

  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  console.log(user.verificationToken)

  await sendVerificationEmail(user.email, user.verificationToken);

  return { user, accessToken, refreshToken };
};

const verifyUserEmail = async (code) => {
  const user = await User.findOne({
    verificationToken: code,
    verificationTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Invalid or expired verification code");
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  user.refreshToken = refreshToken;
  
  await user.save();

  return { user, accessToken, refreshToken };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  
  try {
    await user.save();
  } catch (error) {
    console.error("Error saving user with refresh token:", error);
    throw new Error("Could not save user with refresh token");
  }

  return { user, accessToken, refreshToken };
};

const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (user) {
      user.refreshToken = null; // Clear refresh token
      await user.save();
    }
  }
};

const resetUserPassword = async (token, password) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiresAt: { $gt: Date.now() }, // Ensure token is still valid
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined; // Clear reset token
  user.resetPasswordExpiresAt = undefined; // Clear token expiry
  await user.save();

  return user;
};

const sendResetEmail = async (email, resetToken) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour expiry
  console.log("this is the reset token " , resetToken);
  await user.save();

  await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  await User.findByIdAndDelete(userId);
};

const updateUserProfile = async (userId, updates, idImages) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Users can only update certain profile fields
  const allowedFields = ['first_name', 'last_name', 'phone_number'];
  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  // Set idImages to the new ones, replacing any existing images
  filteredUpdates.idImages = idImages; // This is correct

  Object.assign(user, filteredUpdates);
  await user.save();
  return user;
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const getAllUsers = async () => {
  return await User.find({}, '-password');
};
const verifyUser = async (adminId, userId) => {
  const user = await User.findById(userId);
  const admin = await User.findById(adminId);
  
  // Check if the admin has the correct role
  if (admin.role !== 'admin') { // Fixed the role check logic
    throw new Error("Only admins can verify users.");
  }
  
  if (!user) {
    throw new Error("User not found");
  }

  user.isVerified = true;
  await user.save();
  
  return user;
};
module.exports = {
  createUser,
  verifyUserEmail,
  loginUser,
  logoutUser,
  resetUserPassword,
  sendResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetSuccessEmail,
  deleteUser,
  verifyUser,
  updateUserProfile,
  getUserById,
  getAllUsers,
};