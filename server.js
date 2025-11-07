const express = require('express');
const cors = require('cors'); // Import the cors package
const app = express();
const authRouter = require('./routes/auth.route');
const videoRouter = require('./routes/video.route');
const paymentRouter = require('./routes/payment.route');
const transactionRouter = require('./routes/transaction.route');
const { errorHandler, errorConverter } = require('./middleware/error'); // Adjust the path as necessary
const ApiError = require('./utils/ApiError'); // Adjust the path as necessary
const httpStatus = require('http-status');
const { successHandler, errorHandlers } = require('./config/morgan');  
const cookieParser = require("cookie-parser");

// Use CORS middleware
app.use(cors()); // Enable CORS for all routes

app.use(successHandler);
app.use(errorHandlers);

// Middleware to parse JSON
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    next(); // Pass control to the next middleware or route handler
});

// Define API routes
app.use('/api/user', authRouter);
app.use('/api/videos', videoRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/transaction' , transactionRouter);

// Handle unknown routes
app.use((req, res, next) => {
    next(new ApiError(httpStatus.default.NOT_FOUND, 'Not found'));
});

// Error handling middleware
app.use(errorConverter);
app.use(errorHandler);

module.exports = app; // Export the app for use in other files