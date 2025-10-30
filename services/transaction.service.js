const mongoose = require('mongoose');
const request = require("request");
const Transaction = require("../models/transaction.model.js");
const Video = require("../models/video.model.js");
const User = require("../models/user.model.js");

exports.createTransaction = async (videoId, amount, description, supporterId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  if (video.status !== 'available') {
    throw new Error("Video is not available for tipping");
  }

  const supporter = await User.findById(supporterId);
  if (!supporter) {
    throw new Error("Supporter not found");
  }

  const artist = await User.findById(video.userId._id);
  if (!artist) {
    throw new Error("Artist not found");
  }

  const tx_ref = `tip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  console.log("Generated tx_ref:", tx_ref);

  const options = {
    method: 'POST',
    url: 'https://api.chapa.co/v1/transaction/initialize',
    headers: {
      'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'ETB',
      email: supporter.email,
      first_name: supporter.first_name,
      last_name: supporter.last_name,
      phone_number: supporter.phone_number,
      tx_ref: tx_ref,
      callback_url: `http://localhost:3000/api/transaction/verify/${tx_ref}`,
      meta: {
        videoId: videoId,
        amount: amount,
        description: description,
        supporterId: supporterId,
        artistId: artist._id,
      },
    }),
  };

  return new Promise((resolve, reject) => {
    request(options, async function (error, response) {
      if (error) {
        console.error("Chapa API error:", error);
        return reject(new Error('Payment processing error'));
      }

      const body = JSON.parse(response.body);
      console.log("Response from Chapa:", body);
      
      if (response.statusCode === 200 && body.status === 'success') {
        resolve({
          paymentUrl: body.data.checkout_url,
          tx_ref: tx_ref
        });
      } else {
        reject(new Error(body.message || "Something went wrong with payment initialization"));
      }
    });
  });
};

exports.getAllTransactions = async () => {
  return await Transaction.find()
    .populate('video')
    .populate('artist', 'first_name last_name email')
    .populate('supporter', 'first_name last_name email')
    .sort({ createdAt: -1 });
};

exports.getTransactionById = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId)
    .populate('video')
    .populate('artist', 'first_name last_name email')
    .populate('supporter', 'first_name last_name email');
    
  if (!transaction) {
    throw new Error('Transaction not found.');
  }
  return transaction;
};

exports.getTransactionsByArtist = async (artistId) => {
  return await Transaction.find({ artist: artistId })
    .populate('video')
    .populate('supporter', 'first_name last_name email')
    .sort({ createdAt: -1 });
};

exports.getTransactionsBySupporter = async (supporterId) => {
  return await Transaction.find({ supporter: supporterId })
    .populate('video')
    .populate('artist', 'first_name last_name email')
    .sort({ createdAt: -1 });
};

exports.getTransactionsForVideo = async (videoId) => {
  const transactions = await Transaction.find({ video: videoId })
    .populate('supporter', 'first_name last_name email')
    .select('amount description createdAt payment  artistViewed') // Add the viewed fields here
    .sort({ createdAt: -1 });

  const totalSum = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    transactions,
    totalSum
  };
};

exports.getArtistTotalTips = async (artistId) => {
  const result = await Transaction.aggregate([
    {
      $match: { 
        artist: new mongoose.Types.ObjectId(artistId),
        'payment.amount': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        totalTips: { $sum: '$payment.amount' }
      }
    }
  ]);

  return result.length > 0 ? result[0].totalTips : 0;
};

exports.updateArtistViewedStatus = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found.');
  }

  if (!transaction.artist.equals(userId)) {
    throw new Error('You are not authorized to update artist viewed status for this transaction.');
  }

  transaction.artistViewed = true;
  await transaction.save();
  return transaction;
};

exports.updateSupporterViewedStatus = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found.');
  }

  if (!transaction.supporter.equals(userId)) {
    throw new Error('You are not authorized to update supporter viewed status for this transaction.');
  }

  transaction.supporterViewed = true;
  await transaction.save();
  return transaction;
};

exports.markAllArtistTransactionsAsViewed = async (artistId) => {
  return await Transaction.updateMany(
    { 
      artist: artistId,
      artistViewed: false 
    },
    { 
      artistViewed: true 
    }
  );
};

// Mark all supporter transactions as viewed
exports.markAllSupporterTransactionsAsViewed = async (supporterId) => {
  return await Transaction.updateMany(
    { 
      supporter: supporterId,
      supporterViewed: false 
    },
    { 
      supporterViewed: true 
    }
  );
};

exports.verifyPayment = async (tx_ref) => {
  const options = {
    method: 'GET',
    url: `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
    headers: {
      'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    },
  };

  return new Promise((resolve, reject) => {
    request(options, async (error, response) => {
      if (error) {
        console.error("Error during Chapa API request:", error);
        return reject(new Error('Verification error'));
      }

      const body = JSON.parse(response.body);
      console.log("Response from Chapa in verify payment:", body);
      
      if (response.statusCode === 200 && body.data.status === 'success') {
        const { videoId, amount, description, supporterId, artistId } = body.data.meta;

        const video = await Video.findById(videoId);
        if (!video) {
          return reject(new Error("Video not found"));
        }

        // Check if transaction already exists (prevent duplicates)
        const existingTransaction = await Transaction.findOne({ 
          'payment.transactionId': tx_ref 
        });
        
        if (existingTransaction) {
          return resolve(existingTransaction);
        }

        const transaction = new Transaction({
          video: videoId,
          artist: artistId,
          supporter: supporterId,
          amount: amount,
          description: description,
          artistViewed: false,
          supporterViewed: false,
          payment: {
            amount: amount,
            currency: 'ETB',
            transactionId: tx_ref,
          },
        });

        await transaction.save();
        
        // Update artist's balance (if you have a balance field in User model)
        await User.findByIdAndUpdate(artistId, { 
          $inc: { balance: amount } 
        });

        console.log("Transaction completed successfully:", transaction._id);
        resolve(transaction);
      } else {
        console.log("Payment verification failed:", body);
        return reject(new Error(body.message || 'Payment not successful'));
      }
    });
  });
};

// Get unviewed transactions with count for artist
exports.getArtistUnviewedData = async (artistId) => {
  const transactions = await Transaction.find({ 
    artist: artistId,
    artistViewed: false 
  })
    .populate('video', 'videoName youtubeURL message')
    .populate('supporter', 'first_name last_name email')
    .select('amount description createdAt payment')
    .sort({ createdAt: -1 });

  const count = transactions.length;

  return { 
    count,
    transactions: transactions.map(transaction => ({
      _id: transaction._id,
      amount: transaction.amount,
      description: transaction.description,
      createdAt: transaction.createdAt,
      payment: transaction.payment,
      video: transaction.video,
      supporter: transaction.supporter
    }))
  };
};

// Get unviewed transactions with count for supporter
exports.getSupporterUnviewedData = async (supporterId) => {
  const transactions = await Transaction.find({ 
    supporter: supporterId,
    supporterViewed: false 
  })
    .populate('video', 'videoName youtubeURL message')
    .populate('artist', 'first_name last_name email')
    .select('amount description createdAt payment')
    .sort({ createdAt: -1 });

  const count = transactions.length;

  return {
    count,
    transactions: transactions.map(transaction => ({
      _id: transaction._id,
      amount: transaction.amount,
      description: transaction.description,
      createdAt: transaction.createdAt,
      payment: transaction.payment,
      video: transaction.video,
      artist: transaction.artist
    }))
  };
};