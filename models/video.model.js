// models/Video.js
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    youtubeURL: {
        type: String,
        required: true,
        validate: {
            validator: function(url) {
                return url.startsWith('https://www.youtube.com/') || url.startsWith('https://youtube.com/') || url.startsWith('https://youtu.be/');
            },
            message: 'Invalid YouTube URL format'
        }
    },
    videoName: {
        type: String,
        required: true,
        maxlength: 100, // Optional: limit the length of the video name
    },
    message: {
        type: String,
        maxlength: 500,
    },
    createdat: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['available', 'pending', 'rejected'], // Define allowed values
        default: 'available', // Default status
    },
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;