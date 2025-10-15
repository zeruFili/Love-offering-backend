const express = require('express');
const { 
  createTransaction, 
  getAllTransactions,
  getTransactionById,
  getTransactionsByArtist,
  getTransactionsBySupporter,
  getTransactionsForVideo,
  getArtistTotalTips,
  updateArtistViewedStatus,
  updateSupporterViewedStatus,
  markAllArtistTransactionsAsViewed,
  verifyPayment
} = require('../controllers/transaction.controller');
const { protect, adminValidator } = require('../middleware/authMiddleware');

const router = express.Router();

// Payment and transaction creation routes
router.post('/', protect, createTransaction);
router.get('/verify/:tx_ref', verifyPayment);

// Transaction query routes
router.get('/', protect, adminValidator, getAllTransactions);
router.get('/:id', protect, getTransactionById);
router.get('/artist/my-transactions', protect, getTransactionsByArtist);
router.get('/supporter/my-transactions', protect, getTransactionsBySupporter);
router.get('/video/:videoId', protect, getTransactionsForVideo);
router.get('/artist/total-tips', protect, getArtistTotalTips);

// View status update routes
router.patch('/artist-viewed', protect, updateArtistViewedStatus);
router.patch('/supporter-viewed', protect, updateSupporterViewedStatus);
router.patch('/artist/mark-all-viewed', protect, markAllArtistTransactionsAsViewed);

module.exports = router;