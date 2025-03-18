const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  item: { type: String, required: true }, // Alternatively, you could reference a MenuItem ID if needed
  quantity: { type: Number, required: true },
  specialInstructions: { type: String }
});

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [OrderItemSchema],
 
  status: { type: String, default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
