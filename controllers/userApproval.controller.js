const UserApproval = require('../models/userApproval.model');
const catchAsync = require('../utils/catchAsync');

// Create an approval request
const createApproval = catchAsync(async (req, res) => {
  const { description } = req.body;
  const userId = req.user._id; // Assuming user ID is in req.user

  const approvalRequest = await UserApproval.create({ userId, description });

  res.status(201).json({
    success: true,
    message: 'Approval request created successfully',
    data: approvalRequest,
  });
});

// Get all approval requests (for admin or specific use)
const getAllApprovals = catchAsync(async (req, res) => {
  const approvals = await UserApproval.find();

  res.status(200).json({
    success: true,
    data: approvals,
  });
});

// Get all approval requests for the authenticated user
const getMyApprovals = catchAsync(async (req, res) => {
  const approvals = await UserApproval.find({ userId: req.user._id });

  res.status(200).json({
    success: true,
    data: approvals,
  });
});

// Update an approval request
const updateApproval = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  // Check if the approval request exists
  const approvalRequest = await UserApproval.findById(id);

  // If request does not exist, return 404
  if (!approvalRequest) {
    return res.status(404).json({ success: false, message: 'Approval request not found' });
  }

  // Check if the user is the owner of the approval request
  if (approvalRequest.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You are not authorized to update this request' });
  }

  // Proceed with the update
  approvalRequest.description = description;
  await approvalRequest.save();

  res.status(200).json({
    success: true,
    message: 'Approval request updated successfully',
    data: approvalRequest,
  });
});

// Delete an approval request
const deleteApproval = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if the approval request exists
  const approvalRequest = await UserApproval.findById(id);

  // If request does not exist, return 404
  if (!approvalRequest) {
    return res.status(404).json({ success: false, message: 'Approval request not found' });
  }

  // Check if the user is the owner of the approval request
  if (approvalRequest.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You are not authorized to delete this request' });
  }

  // Proceed with the deletion
  await UserApproval.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Approval request deleted successfully',
  });
});

module.exports = {
  createApproval,
  getAllApprovals,
  getMyApprovals,
  updateApproval,
  deleteApproval,
};