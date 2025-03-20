const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: { type: String },
  experience: { type: Number, required: true }, // Years of experience
  specialization: { type: String, required: true },
  dailyPatientLimit: { type: Number, required: true },
  workingHours: { type: String, required: true }, // Example: "10 AM - 5 PM"
  workingDays: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }],
  consultationFee: { type: Number, required: true },
  allottedSlots: [{ type: String }], // Example: ["10:00 AM", "10:30 AM"]
  freeSlots: [{ type: String }], // Available slots
  appointmentStatus: [{ type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }],
  payment: { type: Number, default: 0 }, // Total earnings
});
module.exports = mongoose.model('Doctor', DoctorSchema);
