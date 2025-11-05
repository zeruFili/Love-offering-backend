const express = require("express");
const {
   signup,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  deleteUser,
  updateUserProfile,
  getMyProfile,
  getAllUsers,
  verifyUser
} = require("../controllers/auth.controller"); // Import all required controller functions
const { uploadFileMiddleware } = require("../middleware/uploadMiddleware");

const {
  signupSchema,
  loginSchema,
  updateUserProfileSchema,
  deleteUserSchema,
  forgotPasswordSchema,
	resetPasswordSchema,
	verifyEmailSchema
} = require("../validations/auth.validation");
const { protect, adminValidator } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

// User registration
router.post("/signup", uploadFileMiddleware, validate(signupSchema), signup);

// User login
router.post("/login", validate(loginSchema), login);

// Get user profile
router.get("/profile", protect, getMyProfile);

// Update user profile
router.put("/profile", protect, validate(updateUserProfileSchema), updateUserProfile);

// Delete user (admin only)
router.delete("/:id", protect, adminValidator, validate(deleteUserSchema), deleteUser);

// Get all users
router.get("/", protect, adminValidator, getAllUsers);

router.post("/logout", logout);
router.post("/verify-email", validate(verifyEmailSchema) , verifyEmail);
router.post("/forgot-password",validate(forgotPasswordSchema) , forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema) , resetPassword);
router.post('/verify', protect, verifyUser);

module.exports = router;