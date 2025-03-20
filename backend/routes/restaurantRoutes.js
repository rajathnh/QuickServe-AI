const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
// assuming you split addMenuItem into its own controller file

// Check menu for a specific restaurant
router.get('/menu/:restaurantId', restaurantController.checkMenu);

// Find food by specific food labelling
router.get('/labelling/:labelling', restaurantController.findFoodByFoodLabelling);

// Get details of a particular dish
router.get('/dish/:dishId', restaurantController.getDishDetails);

// Place an order
router.post('/order', restaurantController.placeOrder);

// Get estimated time for an order
router.get('/order/time/:orderId', restaurantController.getOrderEstimatedTime);

// Add a review for a restaurant
router.post('/review', restaurantController.addReview);

// Get complete restaurant details (including reviews and menu items)
router.get('/details/:restaurantId', restaurantController.getRestaurantDetails);

// Add a new menu item
router.post('/menu', restaurantController.addMenuItem);

module.exports = router;
