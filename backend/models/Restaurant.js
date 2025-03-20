const mongoose = require('mongoose');

// Restaurant Schema
const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    foodLabelling: [{ type: String, enum: ["Veg", "Non-Veg", "Vegan", "Gluten-Free"] }],
    cuisines: [{ type: String }],
    starRatings: { type: Number, min: 0, max: 5, default: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  });
  
module.exports = mongoose.model('Restaurant', RestaurantSchema);
