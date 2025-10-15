const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  video: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video', 
    required: true 
  },
  artist: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // Receiver
  supporter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // Giver
  supporterViewed: { 
    type: Boolean, 
    default: false 
  },
  artistViewed: { 
    type: Boolean, 
    default: false 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 // Ensure amount is non-negative 
  },
  description: { 
    type: String, 
    required: false, 
    maxlength: 500 // Optional description with length limit 
  },
  payment: {
    amount: {
      type: Number,
      required: true,
      min: 0 // Ensure payment amount is non-negative
    },
    currency: {
      type: String,
      default: 'ETB',
      enum: ['ETB', 'USD', 'EUR', 'GBP'] // Specify allowed currencies
    },
    transactionId: {
      type: String,
      unique: true // Ensure transaction IDs are unique
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now // Default creation time 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now // Default update time 
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Transaction', transactionSchema);