const mongoose = require('mongoose');

const userApprovalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the updatedAt field
userApprovalSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const UserApproval = mongoose.model('UserApproval', userApprovalSchema);

module.exports = UserApproval;