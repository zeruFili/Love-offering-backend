const httpStatus = require('http-status');
const request = require('request');
const User = require('../models/user.model'); 
const catchAsync = require('../utils/catchAsync'); // Adjust the path as necessary  
const chapa = require('../lib/chapa.js');

const createCheckoutSession = catchAsync(async (req, res) => {
    const { videoId, amount, description} = req.body; // Now expecting an amount
    console.log("Request Body:", req.body);
    const userId = req.user._id;

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
        return res.status(httpStatus.default.default.NOT_FOUND).json({ message: "User not found" });
    }

    // Generate transaction reference
    const tx_ref = await chapa.genTxRef(); // Ensure chapa is defined

    // Initialize transaction with Chapa
    const options = {
        method: 'POST',
        url: 'https://api.chapa.co/v1/transaction/initialize',
        headers: {
            'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: amount.toString(), // Amount should be passed as a string
            currency: 'ETB',
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number,
            tx_ref: tx_ref,
            callback_url: `http://localhost:3002/api/payment/checkout-success`,
            meta: {
                hide_receipt: true,
            },
        }),
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response) => {
            if (error) {
                return reject(new Error("Payment processing error"));
            }

            const body = JSON.parse(response.body);
            if (response.statusCode === 200 && body.status === 'success') {
                res.status(httpStatus.default.OK).json({
                    msg: "Your generous offering has been successfully submitted!",
                    paymentUrl: body.data.checkout_url,
                    totalAmount: amount, // Return the amount
                });
            } else {
                reject(new Error(body.message || "Something went wrong"));
            }
        });
    });
});

module.exports = {
    createCheckoutSession,
};