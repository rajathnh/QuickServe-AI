const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: String,
  available_slots: [{
    date: String, // Format: 'YYYY-MM-DD'
    times: [String] // e.g., ['10:00 AM', '2:00 PM']
  }],
  fee: Number
});

module.exports = mongoose.model('Doctor', DoctorSchema);
