const express = require('express');
const router = express.Router();
const { getUserProfile,  updateUserProfile,fetchOrderHistory,getAppointmentHistoryForUser ,recommendMealCombo} = require('../controllers/userController');
const {authenticateUser,
    authorizePermissions,} = require('../middleware/authMiddleware'); // Ensure you have this middleware

// Get the current user's profile (requires authentication)
router.get('/me', authenticateUser, getUserProfile);

// Update the current user's profile (requires authentication)
router.patch('/me', authenticateUser,  updateUserProfile);
router.get('/orders', authenticateUser,  fetchOrderHistory);
router.get('/appointments', authenticateUser, getAppointmentHistoryForUser);
router.get('/recommend-meal',authenticateUser,recommendMealCombo)
module.exports = router;
