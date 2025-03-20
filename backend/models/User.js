const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
    address: { type: String },
    foodLabelling: [{ type: String, enum: ["vegetarian", "non-veg", "vegan", "gluten-free"] }],
    choicesAndLiking: [{ type: String, enum: ["Spicy", "Sour", "Sweet", "Salty", "Bitter"] }], 
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  presentIssue: { type: String },
  previousReports: [{ type: String }], // URLs or file paths
  presentReports: [{ type: String }], // URLs or file paths
  previousAppointments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }],
  medications: [{ type: String }],
});

module.exports = mongoose.model('User', UserSchema);
