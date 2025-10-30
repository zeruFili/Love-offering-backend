const TransactionService = require("../services/transaction.service");
const catchAsync = require("../utils/catchAsync");

// Create a transaction (tip)
exports.createTransaction = catchAsync(async (req, res) => {
  const { videoId, amount, description } = req.body;
  console.log("Create Transaction Request Body:", req.body);
  const supporterId = req.user._id;

  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  const transaction = await TransactionService.createTransaction(
    videoId, 
    amount, 
    description, 
    supporterId
  );
  
  res.status(200).json({
    msg: "Transaction created successfully. Perform payment.",
    paymentUrl: transaction.paymentUrl,
  });
});

// Get all transactions
exports.getAllTransactions = catchAsync(async (req, res) => {
  const transactions = await TransactionService.getAllTransactions();
  res.status(200).json(transactions);
});



// Get a transaction by ID
exports.getTransactionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const transaction = await TransactionService.getTransactionById(id);

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found.' });
  }
  res.status(200).json(transaction);
});

// Get transactions by artist (video owner)
exports.getTransactionsByArtist = catchAsync(async (req, res) => {
  const artistId = req.user._id;
  const transactions = await TransactionService.getTransactionsByArtist(artistId);

  if (!transactions.length) {
    return res.status(404).json({ message: 'No transactions found for your videos.' });
  }

  const transactionDetails = transactions.map(transaction => ({
    video: {
      videoName: transaction.video.videoName,
      youtubeURL: transaction.video.youtubeURL,
      message: transaction.video.message,
    },
    supporter: {
      name: `${transaction.supporter.first_name} ${transaction.supporter.last_name}`,
      email: transaction.supporter.email,
    },
    transaction: {
      _id: transaction._id,
      amount: transaction.amount,
      description: transaction.description,
      artistViewed: transaction.artistViewed,
      supporterViewed: transaction.supporterViewed,
      createdAt: transaction.createdAt,
      payment: transaction.payment,
    },
  }));

  res.status(200).json(transactionDetails);
});

// Get transactions by supporter (tipper)
exports.getTransactionsBySupporter = catchAsync(async (req, res) => {
  const supporterId = req.user._id;
  const transactions = await TransactionService.getTransactionsBySupporter(supporterId);

  if (!transactions.length) {
    return res.status(404).json({ message: 'No transactions found for your account.' });
  }

  const transactionDetails = transactions.map(transaction => ({
    video: {
      videoName: transaction.video.videoName,
      youtubeURL: transaction.video.youtubeURL,
      message: transaction.video.message,
    },
    artist: {
      name: `${transaction.artist.first_name} ${transaction.artist.last_name}`,
      email: transaction.artist.email,
    },
    transaction: {
      _id: transaction._id,
      amount: transaction.amount,
      description: transaction.description,
      artistViewed: transaction.artistViewed,
      supporterViewed: transaction.supporterViewed,
      createdAt: transaction.createdAt,
      payment: transaction.payment,
    },
  }));

  res.status(200).json(transactionDetails);
});

// Get transactions for a specific video
exports.getTransactionsForVideo = catchAsync(async (req, res) => {
  const { videoId } = req.params;
  const { transactions, totalSum } = await TransactionService.getTransactionsForVideo(videoId);

  res.status(200).json({
    message: transactions.length ? "Transactions found." : "No transactions for this video.",
    transactions,
    totalSum
  });
});


// Get total tips received by artist
exports.getArtistTotalTips = catchAsync(async (req, res) => {
  const artistId = req.user._id;
  const totalTips = await TransactionService.getArtistTotalTips(artistId);

  res.status(200).json({
    artistId,
    totalTips,
    currency: 'ETB'
  });
});

// Update artist viewed status
exports.updateArtistViewedStatus = catchAsync(async (req, res) => {
  const { transactionId } = req.body;
  const userId = req.user._id;

  if (!transactionId) {
    return res.status(400).json({ error: "Transaction ID is required" });
  }

  const transaction = await TransactionService.updateArtistViewedStatus(transactionId, userId);

  res.status(200).json({
    message: 'Artist viewed status updated successfully.',
    transaction,
  });
});

// Update supporter viewed status
exports.updateSupporterViewedStatus = catchAsync(async (req, res) => {
  const { transactionId } = req.body;
  const userId = req.user._id;

  if (!transactionId) {
    return res.status(400).json({ error: "Transaction ID is required" });
  }

  const transaction = await TransactionService.updateSupporterViewedStatus(transactionId, userId);

  res.status(200).json({
    message: 'Supporter viewed status updated successfully.',
    transaction,
  });
});

// Mark all artist transactions as viewed
exports.markAllArtistTransactionsAsViewed = catchAsync(async (req, res) => {
  const artistId = req.user._id;
  
  const result = await TransactionService.markAllArtistTransactionsAsViewed(artistId);

  res.status(200).json({
    message: `Marked ${result.modifiedCount} transactions as viewed.`,
  });
});

// Mark all supporter transactions as viewed
exports.markAllSupporterTransactionsAsViewed = catchAsync(async (req, res) => {
  const supporterId = req.user._id;
  
  const result = await TransactionService.markAllSupporterTransactionsAsViewed(supporterId);

  res.status(200).json({
    message: `Marked ${result.modifiedCount} transactions as viewed.`,
  });
});

// Verify payment
exports.verifyPayment = catchAsync(async (req, res) => {
  const { tx_ref } = req.params;
  console.log("Verifying payment for tx_ref:", tx_ref);

  const result = await TransactionService.verifyPayment(tx_ref);

  return res.status(200).json({ 
    message: 'Payment verified and transaction completed', 
    transaction: result 
  });
});



// Get unviewed transactions with count for artist
exports.getArtistUnviewedData = catchAsync(async (req, res) => {
  const artistId = req.user._id;
  const { count, transactions } = await TransactionService.getArtistUnviewedData(artistId);

  res.status(200).json({
    success: true,
    count,
    transactions,
    message: count > 0 ? `Found ${count} unviewed transactions` : 'No unviewed transactions'
  });
});

// Get unviewed transactions with count for supporter
exports.getSupporterUnviewedData = catchAsync(async (req, res) => {
  const supporterId = req.user._id;
  const { count, transactions } = await TransactionService.getSupporterUnviewedData(supporterId);

  res.status(200).json({
    success: true,
    count,
    transactions,
    message: count > 0 ? `Found ${count} unviewed transactions` : 'No unviewed transactions'
  });
});