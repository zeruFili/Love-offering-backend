const express = require('express');
const {
  createApproval,
  getAllApprovals,
  getMyApprovals,
  updateApproval,
  deleteApproval,
} = require('../controllers/userApproval.controller');
const { protect ,adminValidator } = require('../middleware/authMiddleware');

const router = express.Router();

// Create an approval request
router.post('/', protect, createApproval);

// Get all approval requests (for admin or other purposes)
router.get('/all', protect, adminValidator, getAllApprovals); // Admin route for all requests

// Get all approval requests for the authenticated user
router.get('/', protect, getMyApprovals); // User-specific route

// Update an approval request
router.put('/:id', protect, updateApproval);

// Delete an approval request
router.delete('/:id', protect, deleteApproval);

module.exports = router;