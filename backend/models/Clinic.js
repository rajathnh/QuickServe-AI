const mongoose = require('mongoose');


const ClinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  services: [{ type: String, required: true }],
  doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
  timings: { type: String, required: true }, // Example: "9 AM - 8 PM"
  workingDays: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }],
});

module.exports = mongoose.model('Clinic', ClinicSchema);