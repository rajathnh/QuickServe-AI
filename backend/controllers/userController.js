const User = require('../models/User');
const bcrypt = require('bcrypt');

// Get the current user's profile, including their orders and appointments
const getProfile = async (req, res) => {
  try {
    // Assume req.user is set by your authentication middleware
    const user = await User.findById(req.user.id)
      .populate('orders')
      .populate('appointments');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
};

// Update the current user's profile
const updateProfile = async (req, res) => {
  try {
    // Extract fields that can be updated from the request body
    const { username, email, preferences, password } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (preferences) user.preferences = preferences;
    if (password) {
      // Hash the new password before saving
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

// Optional: Get a user by their ID (useful for admin purposes)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('orders')
      .populate('appointments');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

module.exports = {
    getProfile,
  updateProfile,
  getUserById

}