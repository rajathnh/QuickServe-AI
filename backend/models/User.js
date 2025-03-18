const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // References to orders and appointments
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
