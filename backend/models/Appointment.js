const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic",default:"60d21b4667d0d8992e610c85" },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientName: { type: String, required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  doctorName: { type: String, required: true },
  appointmentTime: { type: Date, required: true },
  status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
  charges: { type: Number, required: true },
});



module.exports = mongoose.model('Appointment', AppointmentSchema);
