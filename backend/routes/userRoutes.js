const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserById } = require('../controllers/userController');
const {authenticateUser,
    authorizePermissions,} = require('../middleware/authMiddleware'); // Ensure you have this middleware

// Get the current user's profile (requires authentication)
router.get('/me', authenticateUser, getProfile);

// Update the current user's profile (requires authentication)
router.put('/me', authenticateUser, updateProfile);

// Optionally, get a user by ID (admin access recommended)
router.get('/:id', authenticateUser, getUserById);

module.exports = router;
