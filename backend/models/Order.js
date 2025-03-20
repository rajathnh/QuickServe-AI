const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
      customization: { type: String },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  totalPrice: { type: Number, required: true },
  totalDuration: { type: Number },
  type: { type: String, enum: ["Takeaway", "Delivery"], required: true },
  status: { type: String, enum: ["Pending", "Preparing", "Completed", "Cancelled"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);
