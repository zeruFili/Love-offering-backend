// routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { protect } = require('../middleware/authMiddleware');

// Route to create a new video
router.post('/', protect, videoController.createVideo);

// Route to get all videos with user details
router.get('/all', videoController.getAllVideos);
router.get('/my', protect, videoController.getUserVideos);

// Route to get a specific video by ID with user details
router.get('/:id', videoController.getVideoById);

// Route to get available videos
router.get('/', videoController.getAvailableVideos);

// Route to update a video by ID (with role check)
router.patch('/:id', protect, videoController.updateVideoWithRoleCheck);

// Route to delete a video by ID
router.delete('/:id', protect, videoController.deleteVideo);

module.exports = router;