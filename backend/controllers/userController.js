const User = require('../models/User');

// 1. Get User Profile (with order history and appointment details)
const getUserProfile = async (req, res) => {
  try {
    // Assuming authentication middleware sets req.user.id
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate('orderHistory')         // Populating order history
      .populate('previousAppointments'); // Populating appointment details

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

// 2. Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    // Assuming authentication middleware sets req.user.id
    const userId = req.user.id;
    const updates = req.body;

    // Options: { new: true } returns the updated document
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};
