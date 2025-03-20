const mongoose = require('mongoose')

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  briefDescription: { type: String },
  ingredients: [{ type: String }],
  nutritionalValue: { type: String },
  calories: { type: Number },
  preparationDuration: { type: Number }, // in minutes
  stars: { type: Number, min: 0, max: 5, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  description: { type: String },
  price: { type: Number, required: true },
  servingSize: { type: String },
  labels: [{ type: String, enum: ["vegetarian", "vegan", "gluten-free", "non-veg"] }],
  taste: [{ type: String, enum: ["Spicy", "Sour", "Sweet", "Salty", "Bitter"] }],
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
});

module.exports = mongoose.model('Menu', MenuItemSchema);
