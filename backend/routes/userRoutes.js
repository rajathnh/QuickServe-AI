const express = require('express');
const router = express.Router();
const { getUserProfile,  updateUserProfile } = require('../controllers/userController');
const {authenticateUser,
    authorizePermissions,} = require('../middleware/authMiddleware'); // Ensure you have this middleware

// Get the current user's profile (requires authentication)
router.get('/me', authenticateUser, getUserProfile);

// Update the current user's profile (requires authentication)
router.patch('/me', authenticateUser,  updateUserProfile);

module.exports = router;
