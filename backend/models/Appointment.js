const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'Booked' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
