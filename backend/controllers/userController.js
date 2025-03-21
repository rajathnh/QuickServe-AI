const User = require('../models/User');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');

// 1. Get User Profile (with order history and appointment details)
const getUserProfile = async (req, res) => {
  try {
    // Assuming authentication middleware sets req.user.id
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate('orderHistory')         // Populating order history (if they are references)
      .populate('previousAppointments'); // Populating appointment details (if they are references)

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

// 3. Fetch Order History
const fetchOrderHistory = async (req, res) => {
  try {
    // Assuming authentication middleware sets req.user with the current user's ID
    const userId = req.user.id;
    
    // Retrieve the user document with the orderHistory field populated (or fetch orders separately)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Retrieve orders using the orderHistory array from the user document.
    // Populate items.menuItem with selected fields (e.g., name and price)
    const orders = await Order.find({ _id: { $in: user.orderHistory } })
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 }); // Optionally sort orders by most recent first
    
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Error fetching order history", error: error.message });
  }
};

const getOrderHistoryForUser = async (userId) => {
    // Retrieve the user document
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    // Retrieve orders using the orderHistory array from the user document,
    // populating the items with dish names and prices.
    const orders = await Order.find({ _id: { $in: user.orderHistory } })
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    return orders;
  };
  const fetchAppointmentHistory = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const appointments = await Appointment.find({ patient: userId })
        .populate('doctor', 'name specialization')
        .populate('clinic', 'name');
  
      if (!appointments || appointments.length === 0) {
        return res.status(404).json({ message: "No appointment history found." });
      }
  
      const formattedAppointments = appointments.map(appt => ({
        appointmentId: appt._id,
        doctorName: appt.doctor ? appt.doctor.name : "Unknown Doctor",
        specialization: appt.doctor ? appt.doctor.specialization : "N/A",
        clinicName: appt.clinic ? appt.clinic.name : "Unknown Clinic",
        appointmentTime: appt.appointmentTime,
        status: appt.status,
        charges: appt.charges,
      }));
  
      res.status(200).json({ appointments: formattedAppointments });
    } catch (error) {
      console.error("Error fetching appointment history:", error);
      res.status(500).json({ message: "Error fetching appointment history", error: error.message });
    }
  };
  const getAppointmentHistoryForUser = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`🔹 Fetching appointments for user: ${userId}`);

        const appointments = await Appointment.find({ patient: userId })
            .populate('doctor', 'name specialization')
            .populate('clinic', 'name');

        console.log(`🔹 Retrieved appointments:`, appointments); // ✅ Log fetched data

        if (!appointments || appointments.length === 0) {
            console.log("❌ No appointment history found.");
            return res.status(404).json({ message: "No appointment history found." });
        }

        const formattedAppointments = appointments.map(appt => ({
            appointmentId: appt._id,
            doctorName: appt.doctor ? appt.doctor.name : "Unknown Doctor",
            specialization: appt.doctor ? appt.doctor.specialization : "N/A",
            clinicName: appt.clinic ? appt.clinic.name : "Unknown Clinic",
            appointmentTime: appt.appointmentTime,
            status: appt.status,
            charges: appt.charges,
        }));

        console.log("✅ Returning formatted appointments:", formattedAppointments);
        res.status(200).json({ appointments: formattedAppointments });
    } catch (error) {
        console.error("❌ Error fetching appointment history:", error);
        res.status(500).json({ message: "Error fetching appointment history", error: error.message });
    }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  fetchOrderHistory,
  getOrderHistoryForUser,
  getAppointmentHistoryForUser,
  fetchAppointmentHistory,
};
