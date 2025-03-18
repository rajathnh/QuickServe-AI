const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  dietary: [{ type: String }] // e.g., 'vegetarian', 'gluten-free'
});

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  menu_items: [MenuItemSchema]
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
