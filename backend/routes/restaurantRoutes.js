// routes/restaurantRoutes.js
const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

// Get list of restaurants
router.get('/restaurants', restaurantController.getRestaurants);

// Get menu for a specific restaurant by its ID
router.get('/restaurants/:id/menu', restaurantController.getRestaurantMenu);

// Place a new order
router.post('/order', restaurantController.placeOrder);

// Get order details by order ID


// Get all orders for a user (using query parameter: userId)
router.get('/orders', restaurantController.getOrdersForUser);

// Update an existing order
router.get('/order/:orderId', restaurantController.getOrder);
router.put('/order/:orderId', restaurantController.updateOrder);

router.post('/restaurants', restaurantController.addRestaurant);

module.exports = router;
